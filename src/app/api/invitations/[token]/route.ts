import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const admin = createAdminClient()

  const { data: invitation, error } = await admin
    .from('invitations')
    .select('id, email, role, organization_id, expires_at')
    .eq('token', token)
    .is('accepted_at', null)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (error || !invitation) {
    return NextResponse.json({ error: '招待リンクが無効または期限切れです' }, { status: 404 })
  }

  const { data: org } = await admin
    .from('organizations')
    .select('name')
    .eq('id', invitation.organization_id)
    .single()

  return NextResponse.json({ ...invitation, organization: org ?? null })
}
