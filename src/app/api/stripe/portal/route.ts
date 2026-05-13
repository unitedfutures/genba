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
  const { data: org } = await supabase
    .from('organizations')
    .select('stripe_customer_id')
    .eq('id', profile.organization_id)
    .single()

  if (!org?.stripe_customer_id) {
    return NextResponse.json({ error: 'サブスクリプションが存在しません' }, { status: 404 })
  }

  const session = await getStripe().billingPortal.sessions.create({
    customer: org.stripe_customer_id as string,
    return_url: `${APP_URL}/dashboard`,
  })

  return NextResponse.json({ url: session.url })
}
