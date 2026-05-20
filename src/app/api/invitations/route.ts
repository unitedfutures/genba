import { NextResponse } from 'next/server'
import { getCurrentProfile } from '@/lib/supabase/actions'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://genba.works'

export async function POST(request: Request) {
  const profile = await getCurrentProfile()
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (profile.role !== 'admin') return NextResponse.json({ error: '管理者のみ操作できます' }, { status: 403 })

  const { email, role } = await request.json()
  if (!email || !role) return NextResponse.json({ error: '必要な情報が不足しています' }, { status: 400 })

  const supabase = await createClient()

  // 組織情報を取得
  const { data: org } = await supabase
    .from('organizations')
    .select('name, plan')
    .eq('id', profile.organization_id)
    .single()

  if (!org) return NextResponse.json({ error: '組織情報が見つかりません' }, { status: 404 })
  if (org.plan !== 'paid') return NextResponse.json({ error: 'TEAMプランが必要です' }, { status: 403 })

  const token = crypto.randomUUID()
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

  const admin = createAdminClient()
  const { error: insertError } = await admin.from('invitations').insert({
    organization_id: profile.organization_id,
    email,
    role,
    token,
    invited_by: profile.id,
    expires_at: expires,
  })

  if (insertError) {
    return NextResponse.json({ error: '招待の作成に失敗しました' }, { status: 500 })
  }

  const inviteUrl = `${APP_URL}/auth/invite/${token}`
  const roleLabel = role === 'admin' ? '管理者' : '作業者'

  // メール送信
  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': process.env.BREVO_API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: 'GENBA', email: 'noreply@genba.works' },
        to: [{ email }],
        subject: `【GENBA】${org.name}から招待が届いています`,
        htmlContent: `
<!DOCTYPE html>
<html lang="ja">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

    <!-- Header -->
    <div style="background:#111827;padding:28px 32px;">
      <p style="margin:0;color:#fff;font-size:22px;font-weight:900;letter-spacing:0.05em;">GENBA</p>
      <p style="margin:4px 0 0;color:#9ca3af;font-size:12px;">現場タスク・進捗管理</p>
    </div>

    <!-- Body -->
    <div style="padding:32px;">
      <p style="margin:0 0 8px;font-size:18px;font-weight:700;color:#111827;">チームへの招待が届いています</p>
      <p style="margin:0 0 24px;font-size:14px;color:#6b7280;">
        <strong style="color:#111827;">${org.name}</strong> があなたをGENBAチームに招待しました。
      </p>

      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:16px 20px;margin:0 0 24px;">
        <p style="margin:0 0 4px;font-size:12px;color:#9ca3af;font-weight:500;">招待先</p>
        <p style="margin:0;font-size:15px;font-weight:700;color:#111827;">${org.name}</p>
        <p style="margin:4px 0 0;font-size:13px;color:#6b7280;">権限：${roleLabel}</p>
      </div>

      <p style="margin:0 0 20px;font-size:14px;color:#6b7280;">
        下のボタンからアカウントを作成して、チームに参加しましょう。リンクの有効期限は<strong style="color:#111827;">7日間</strong>です。
      </p>

      <div style="text-align:center;margin:0 0 28px;">
        <a href="${inviteUrl}" style="display:inline-block;background:#f97316;color:#fff;font-weight:700;font-size:15px;padding:14px 36px;border-radius:12px;text-decoration:none;">
          招待を承認してアカウント作成
        </a>
      </div>

      <p style="margin:0;font-size:12px;color:#9ca3af;">
        ボタンが押せない場合は以下のURLをブラウザに貼り付けてください：<br>
        <a href="${inviteUrl}" style="color:#f97316;word-break:break-all;">${inviteUrl}</a>
      </p>
    </div>

    <!-- Footer -->
    <div style="padding:20px 32px;background:#f9fafb;border-top:1px solid #e5e7eb;">
      <p style="margin:0;font-size:12px;color:#9ca3af;">
        このメールに心当たりがない場合は、無視していただいて構いません。<br>
        © 2026 GENBA. All rights reserved.
      </p>
    </div>

  </div>
</body>
</html>
      `,
      }),
    })
    if (!res.ok) {
      const errText = await res.text()
      console.error('Brevo error:', res.status, errText)
      return NextResponse.json({ token, inviteUrl, emailSent: false })
    }
  } catch (e) {
    console.error('Brevo error:', e)
    // メール送信失敗しても招待URL自体は返す
    return NextResponse.json({ token, inviteUrl, emailSent: false })
  }

  return NextResponse.json({ token, inviteUrl, emailSent: true })
}
