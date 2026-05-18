import { NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { getCurrentProfile } from '@/lib/supabase/actions'
import { createAdminClient } from '@/lib/supabase/admin'

// 決済完了後にStripeのサブスクリプション状態をDBに同期する
export async function POST() {
  const profile = await getCurrentProfile()
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()

  const { data: org } = await admin
    .from('organizations')
    .select('id, plan, stripe_customer_id, stripe_subscription_id')
    .eq('id', profile.organization_id)
    .single()

  if (!org) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  try {
    // stripe_customer_id がある場合、最新のサブスクリプションを取得
    if (org.stripe_customer_id) {
      const subscriptions = await getStripe().subscriptions.list({
        customer: org.stripe_customer_id,
        status: 'active',
        limit: 1,
      })

      if (subscriptions.data.length > 0) {
        const sub = subscriptions.data[0]
        await admin.from('organizations').update({
          plan: 'paid',
          stripe_subscription_id: sub.id,
        }).eq('id', org.id)
        return NextResponse.json({ plan: 'paid', synced: true })
      }
    }

    // アクティブなサブスクリプションがない場合はfreeのまま
    return NextResponse.json({ plan: org.plan, synced: false })
  } catch (e: any) {
    console.error('Stripe sync error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
