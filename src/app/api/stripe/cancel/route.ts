import { NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { getCurrentProfile } from '@/lib/supabase/actions'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  const profile = await getCurrentProfile()
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (profile.role !== 'admin') return NextResponse.json({ error: '管理者のみ操作できます' }, { status: 403 })

  const supabase = await createClient()

  // 管理者以外のスタッフが残っていないか確認
  const { count: staffCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', profile.organization_id)
    .neq('id', profile.id)

  if ((staffCount ?? 0) > 0) {
    return NextResponse.json({ error: '解約するには先にスタッフを全員削除してください' }, { status: 400 })
  }

  const { data: org } = await supabase
    .from('organizations')
    .select('stripe_subscription_id')
    .eq('id', profile.organization_id)
    .single()

  if (!org?.stripe_subscription_id) {
    return NextResponse.json({ error: 'アクティブなサブスクリプションが見つかりません' }, { status: 404 })
  }

  // 期間終了時に解約（即時停止ではなく、支払済み期間はそのまま利用可能）
  const subscription = await getStripe().subscriptions.update(org.stripe_subscription_id, {
    cancel_at_period_end: true,
  }) as unknown as { current_period_end: number }

  const periodEnd = new Date(subscription.current_period_end * 1000).toLocaleDateString('ja-JP', {
    year: 'numeric', month: 'long', day: 'numeric',
  })

  return NextResponse.json({ ok: true, periodEnd })
}
