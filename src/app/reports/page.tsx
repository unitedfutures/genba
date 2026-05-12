import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/supabase/actions'
import { redirect } from 'next/navigation'
import ReportsClient from './ReportsClient'

export default async function ReportsPage() {
  const profile = await getCurrentProfile()
  if (!profile) redirect('/auth/login')

  const supabase = await createClient()

  const query = supabase
    .from('work_logs')
    .select('*, worker:profiles(full_name), site:sites(name)')
    .eq('organization_id', profile.organization_id)
    .order('work_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(50)

  if (profile.role === 'worker') {
    query.eq('worker_id', profile.id)
  }

  const [{ data: logs }, { data: workers }] = await Promise.all([
    query,
    profile.role === 'admin'
      ? supabase.from('profiles').select('id, full_name').eq('organization_id', profile.organization_id).order('full_name')
      : Promise.resolve({ data: [] }),
  ])

  return (
    <ReportsClient
      logs={(logs ?? []) as any}
      workers={workers ?? []}
      isAdmin={profile.role === 'admin'}
    />
  )
}
