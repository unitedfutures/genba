import { NextRequest, NextResponse } from 'next/server'
import { getCurrentProfile } from '@/lib/supabase/actions'
import { createAdminClient } from '@/lib/supabase/admin'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const profile = await getCurrentProfile()
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (profile.role !== 'admin') return NextResponse.json({ error: '管理者のみ操作できます' }, { status: 403 })
  if (profile.id === id) return NextResponse.json({ error: '自分自身の権限は変更できません' }, { status: 400 })

  const { role } = await request.json()
  if (role !== 'admin' && role !== 'worker') {
    return NextResponse.json({ error: '権限は admin または worker のみ指定できます' }, { status: 400 })
  }

  const admin = createAdminClient()

  // 対象が同じ組織か確認
  const { data: target } = await admin
    .from('profiles')
    .select('id, organization_id')
    .eq('id', id)
    .single()

  if (!target || target.organization_id !== profile.organization_id) {
    return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 })
  }

  const { error } = await admin
    .from('profiles')
    .update({ role })
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: 'ロールの更新に失敗しました' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, role })
}
