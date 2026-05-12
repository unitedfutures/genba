import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { token, fullName, email, password, organizationId, role } = await request.json()

  if (!token || !fullName || !email || !password || !organizationId) {
    return NextResponse.json({ error: '必要な情報が不足しています' }, { status: 400 })
  }

  const admin = createAdminClient()

  // 招待を再確認（改ざん防止）
  const { data: invitation } = await admin
    .from('invitations')
    .select('id')
    .eq('token', token)
    .is('accepted_at', null)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (!invitation) {
    return NextResponse.json({ error: '招待リンクが無効または期限切れです' }, { status: 404 })
  }

  // ユーザーを作成（メール確認不要）
  const { data: userData, error: userError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      organization_id: organizationId,
      role: role ?? 'worker',
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

  return NextResponse.json({ success: true, userId: userData.user.id })
}
