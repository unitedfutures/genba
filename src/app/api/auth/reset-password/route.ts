import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { email, redirectTo } = await request.json()
  if (!email) return NextResponse.json({ error: 'メールアドレスを入力してください' }, { status: 400 })

  const admin = createAdminClient()
  const { data } = await admin.auth.admin.listUsers({ perPage: 1000 })
  const exists = data?.users?.some(u => u.email?.toLowerCase() === email.toLowerCase())

  if (!exists) {
    return NextResponse.json({ error: 'このメールアドレスは登録されていません' }, { status: 404 })
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
  if (error) return NextResponse.json({ error: '送信に失敗しました' }, { status: 500 })

  return NextResponse.json({ success: true })
}
