import { NextResponse } from 'next/server'
import { getCurrentProfile } from '@/lib/supabase/actions'
import { createAdminClient } from '@/lib/supabase/admin'

const FREE_SITE_LIMIT = 2

export async function POST(request: Request) {
  const profile = await getCurrentProfile()
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (profile.role !== 'admin') return NextResponse.json({ error: '管理者のみ操作できます' }, { status: 403 })

  const { name, address } = await request.json()
  if (!name) return NextResponse.json({ error: '現場名は必須です' }, { status: 400 })

  const admin = createAdminClient()

  // フリープランの場合は件数チェック
  const { data: org } = await admin
    .from('organizations')
    .select('plan')
    .eq('id', profile.organization_id)
    .single()

  if (org?.plan === 'free') {
    const { count } = await admin
      .from('sites')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', profile.organization_id)

    if ((count ?? 0) >= FREE_SITE_LIMIT) {
      return NextResponse.json(
        { error: `フリープランでは現場を${FREE_SITE_LIMIT}件までしか登録できません。TEAMプランへのアップグレードが必要です。` },
        { status: 403 }
      )
    }
  }

  const { data, error } = await admin
    .from('sites')
    .insert({
      organization_id: profile.organization_id,
      name,
      address: address || null,
      status: 'active',
      created_by: profile.id,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: '現場の追加に失敗しました' }, { status: 500 })
  }

  return NextResponse.json({ site: data })
}
