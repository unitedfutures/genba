import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { companyName, fullName, email, password } = await request.json()

  if (!companyName || !fullName || !email || !password) {
    return NextResponse.json({ error: '全ての項目を入力してください' }, { status: 400 })
  }

  const admin = createAdminClient()

  // 会社名からslugを生成
  const slug = companyName
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 50) + '-' + Date.now().toString(36)

  // 組織を作成
  const { data: org, error: orgError } = await admin
    .from('organizations')
    .insert({ name: companyName, slug, plan: 'free' })
    .select('id')
    .single()

  if (orgError) {
    return NextResponse.json({ error: '組織の作成に失敗しました: ' + orgError.message }, { status: 500 })
  }

  // 管理者ユーザーを作成
  const { data: userData, error: userError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      organization_id: org.id,
      role: 'admin',
    },
  })

  if (userError) {
    // ユーザー作成失敗時は組織を削除してロールバック
    await admin.from('organizations').delete().eq('id', org.id)
    return NextResponse.json({ error: userError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, userId: userData.user.id })
}
