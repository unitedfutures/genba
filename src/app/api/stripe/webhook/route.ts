import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import type Stripe from 'stripe'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) return NextResponse.json({ error: 'No signature' }, { status: 400 })

  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 })
  }

  const admin = createAdminClient()

  switch (event.type) {
    // 決済完了 → プランを有料に更新
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const orgId = session.metadata?.organization_id
      if (!orgId) break
      await admin.from('organizations').update({
        plan: 'paid',
        stripe_subscription_id: session.subscription as string,
      }).eq('id', orgId)
      break
    }

    // サブスクリプション更新（人数変更・プラン変更）
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const orgId = sub.metadata?.organization_id
      if (!orgId) break
      const status = sub.status
      // active / trialing → paid、それ以外 → free
      const plan = (status === 'active' || status === 'trialing') ? 'paid' : 'free'
      await admin.from('organizations').update({ plan }).eq('id', orgId)
      break
    }

    // 解約・支払い失敗 → 無料プランに戻す
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      const orgId = sub.metadata?.organization_id
      if (!orgId) break
      await admin.from('organizations').update({
        plan: 'free',
        stripe_subscription_id: null,
      }).eq('id', orgId)
      break
    }
  }

  return NextResponse.json({ received: true })
}
