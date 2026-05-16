import { NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { getCurrentProfile } from '@/lib/supabase/actions'
import { createClient } from '@/lib/supabase/server'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://genba.works'

export async function POST() {
  const profile = await getCurrentProfile()
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (profile.role !== 'admin') return NextResponse.json({ error: '管理者のみ操作できます' }, { status: 403 })

  const supabase = await createClient()

  const [{ data: org }, { data: { user } }, { count: staffCount }] = await Promise.all([
    supabase.from('organizations').select('*').eq('id', profile.organization_id).single(),
    supabase.auth.getUser(),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('organization_id', profile.organization_id),
  ])

  if (!org || !user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const quantity = Math.max(staffCount ?? 1, 1)

  try {
    // Stripe カスタマーを取得 or 作成
    let customerId = org.stripe_customer_id as string | null
    if (!customerId) {
      const customer = await getStripe().customers.create({
        email: user.email,
        name: org.name,
        metadata: { organization_id: org.id },
      })
      customerId = customer.id
      await supabase.from('organizations').update({ stripe_customer_id: customerId }).eq('id', org.id)
    }

    const session = await getStripe().checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: process.env.STRIPE_PRICE_ID!, quantity }],
      success_url: `${APP_URL}/dashboard?upgraded=1`,
      cancel_url: `${APP_URL}/dashboard`,
      metadata: { organization_id: org.id },
      subscription_data: { metadata: { organization_id: org.id } },
      locale: 'ja',
    })

    return NextResponse.json({ url: session.url })
  } catch (e: any) {
    console.error('Stripe checkout error:', e)
    return NextResponse.json(
      { error: e?.message ?? '決済セッションの作成に失敗しました' },
      { status: 500 }
    )
  }
}
