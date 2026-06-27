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

  // 削除前に人数と Stripe 情報を取得（削除後のカウントは cascade タイミングにより不正確なため）
  const [{ count: currentCount }, { data: org }] = await Promise.all([
    admin
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', profile.organization_id),
    admin
      .from('organizations')
      .select('plan, stripe_subscription_id')
      .eq('id', profile.organization_id)
      .single(),
  ])

  // Supabase Auth からユーザー削除（profiles は cascade で削除される）
  const { error: deleteError } = await admin.auth.admin.deleteUser(id)
  if (deleteError) {
    console.error('deleteUser error:', deleteError)
    return NextResponse.json({ error: `ユーザーの削除に失敗しました: ${deleteError.message}` }, { status: 500 })
  }

  // Stripe サブスクリプションの quantity を更新（有料プランのみ）
  if (org?.plan === 'paid' && org.stripe_subscription_id) {
    try {
      const quantity = Math.max((currentCount ?? 2) - 1, 1)
      const subscription = await getStripe().subscriptions.retrieve(org.stripe_subscription_id)
      const item = subscription.items.data[0]
      if (item) {
        await getStripe().subscriptionItems.update(item.id, { quantity })
      }
    } catch (e) {
      // Stripe 更新失敗はログのみ（ユーザー削除は成功しているため）
      console.error('Stripe quantity update failed:', e)
    }
  }

  return NextResponse.json({ ok: true })
}
