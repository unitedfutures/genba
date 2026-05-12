import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/supabase/actions'
import { redirect } from 'next/navigation'
import WorkLogForm from './WorkLogForm'

export default async function MyReportEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const profile = await getCurrentProfile()
  if (!profile) redirect('/auth/login')

  const supabase = await createClient()

  const { data: log } = await supabase
    .from('work_logs')
    .select('*, site:sites(name), task:tasks(title)')
    .eq('id', id)
    .eq('worker_id', profile.id)
    .single()

  if (!log) redirect('/my/reports')

  const [{ data: photos }, { data: comments }, { data: sites }] = await Promise.all([
    supabase.from('photos').select('*').eq('work_log_id', id).order('created_at'),
    supabase.from('comments').select('*, author:profiles(full_name, role)').eq('work_log_id', id).order('created_at'),
    supabase.from('sites').select('id, name').eq('organization_id', profile.organization_id).eq('status', 'active'),
  ])

  const photosWithUrls = await Promise.all(
    (photos ?? []).map(async photo => {
      const { data } = await supabase.storage.from('work-photos').createSignedUrl(photo.storage_path, 3600)
      return { ...photo, url: data?.signedUrl }
    })
  )

  return (
    <WorkLogForm
      log={{ ...log, photos: photosWithUrls, comments: comments ?? [] }}
      profile={profile}
      sites={sites ?? []}
    />
  )
}
