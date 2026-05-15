import { NextRequest, NextResponse } from 'next/server'
import { getCurrentProfile } from '@/lib/supabase/actions'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStripe } from '@/lib/stripe'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const profile = await getCurrentProfile()
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (profile.role !== 'admin') return NextResponse.json({ error: '管理者のみ操作できます' }, { status: 403 })
  if (profile.id === id) return NextResponse.json({ error: '自分自身は削除できません' }, { status: 400 })

  const admin = createAdminClient()

  // 削除対象が同じ組織か確認
  const { data: target } = await admin
    .from('profiles')
    .select('id, organization_id')
    .eq('id', id)
    .single()

  if (!target || target.organization_id !== profile.organization_id) {
    return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 })
  }

  // Supabase Auth からユーザー削除（profiles は cascade で削除される）
  const { error: deleteError } = await admin.auth.admin.deleteUser(id)
  if (deleteError) {
    return NextResponse.json({ error: 'ユーザーの削除に失敗しました' }, { status: 500 })
  }

  // 削除後の人数を取得
  const { count: newCount } = await admin
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', profile.organization_id)

  // Stripe サブスクリプションの quantity を更新（有料プランのみ）
  const { data: org } = await admin
    .from('organizations')
    .select('plan, stripe_subscription_id')
    .eq('id', profile.organization_id)
    .single()

  if (org?.plan === 'paid' && org.stripe_subscription_id) {
    try {
      const subscription = await getStripe().subscriptions.retrieve(org.stripe_subscription_id)
      const item = subscription.items.data[0]
      if (item) {
        const quantity = Math.max(newCount ?? 1, 1)
        await getStripe().subscriptionItems.update(item.id, { quantity })
      }
    } catch (e) {
      // Stripe 更新失敗はログのみ（ユーザー削除は成功しているため）
      console.error('Stripe quantity update failed:', e)
    }
  }

  return NextResponse.json({ ok: true })
}
