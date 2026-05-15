import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'

export async function POST(request: Request) {
  const { token, fullName, email, password } = await request.json()

  if (!token || !fullName || !email || !password) {
    return NextResponse.json({ error: '必要な情報が不足しています' }, { status: 400 })
  }

  const admin = createAdminClient()

  // 招待を再確認（改ざん防止）- organization_id と role は招待データから取得
  const { data: invitation } = await admin
    .from('invitations')
    .select('id, organization_id, role, email')
    .eq('token', token)
    .is('accepted_at', null)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (!invitation) {
    return NextResponse.json({ error: '招待リンクが無効または期限切れです' }, { status: 404 })
  }

  // 招待メールアドレスと一致するか確認
  if (invitation.email.toLowerCase() !== email.toLowerCase()) {
    return NextResponse.json({ error: '招待されたメールアドレスと一致しません' }, { status: 403 })
  }

  // organization_id と role は招待データを信頼（クライアント送信値は使わない）
  const organizationId = invitation.organization_id
  const role = invitation.role

  // ユーザーを作成（メール確認不要）
  const { data: userData, error: userError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      organization_id: organizationId,
      role,
      invitation_token: token,
    },
  })

  if (userError) {
    return NextResponse.json({ error: userError.message }, { status: 500 })
  }

  // 招待を承認済みにマーク
  await admin
    .from('invitations')
    .update({ accepted_at: new Date().toISOString() })
    .eq('token', token)

  // Stripe サブスクリプションの人数を更新（有料プランの場合）
  try {
    const { data: org } = await admin
      .from('organizations')
      .select('plan, stripe_subscription_id')
      .eq('id', organizationId)
      .single()

    if (org?.plan === 'paid' && org.stripe_subscription_id) {
      const { count } = await admin
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId)

      const sub = await getStripe().subscriptions.retrieve(org.stripe_subscription_id as string)
      const itemId = sub.items.data[0]?.id
      if (itemId && count) {
        await getStripe().subscriptionItems.update(itemId, { quantity: count })
      }
    }
  } catch {
    // quantity 更新失敗はログのみ（ユーザー登録自体は成功）
    console.error('Stripe quantity sync failed')
  }

  return NextResponse.json({ success: true, userId: userData.user.id })
}
