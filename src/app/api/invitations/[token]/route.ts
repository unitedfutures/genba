import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('invitations')
    .select('id, email, role, organization_id, expires_at, organization:organizations(name)')
    .eq('token', token)
    .is('accepted_at', null)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (error || !data) {
    return NextResponse.json({ error: '招待リンクが無効または期限切れです' }, { status: 404 })
  }

  return NextResponse.json(data)
}
