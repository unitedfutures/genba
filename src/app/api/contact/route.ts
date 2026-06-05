import { NextResponse } from 'next/server'

const SUPPORT_EMAIL = 'support@united-futures.com'
const FROM_EMAIL    = 'noreply@genba.works'
const FROM_NAME     = 'GENBA お問い合わせフォーム'

export async function POST(request: Request) {
  const { company, name, email, phone, type, message } = await request.json()

  if (!name || !email || !type || !message) {
    return NextResponse.json({ error: '必須項目が不足しています' }, { status: 400 })
  }

  const body = `
【お問い合わせ種別】${type}

【会社名・屋号】${company || '（未記入）'}
【お名前】${name}
【メールアドレス】${email}
【電話番号】${phone || '（未記入）'}

【お問い合わせ内容】
${message}
  `.trim()

  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': process.env.BREVO_API_KEY!,
      },
      body: JSON.stringify({
        sender:  { name: FROM_NAME, email: FROM_EMAIL },
        to:      [{ email: SUPPORT_EMAIL }],
        replyTo: { email, name },
        subject: `【GENBAお問い合わせ】${type}：${name} 様`,
        textContent: body,
      }),
    })

    if (!res.ok) {
      console.error('Brevo error:', res.status, await res.text())
      return NextResponse.json({ error: 'メール送信に失敗しました' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('Contact API error:', e)
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}
