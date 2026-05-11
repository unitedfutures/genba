import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/supabase/actions'
import { redirect } from 'next/navigation'
import AppLayout from '@/components/layout/AppLayout'
import ReportDetail from './ReportDetail'

export default async function ReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const profile = await getCurrentProfile()
  if (!profile) redirect('/auth/login')

  const supabase = await createClient()

  const { data: log } = await supabase
    .from('work_logs')
    .select('*, worker:profiles(full_name, avatar_url), site:sites(name), task:tasks(title)')
    .eq('id', id)
    .single()

  if (!log || log.organization_id !== profile.organization_id) redirect('/reports')

  const [{ data: photos }, { data: comments }] = await Promise.all([
    supabase.from('photos').select('*').eq('work_log_id', id).order('created_at'),
    supabase.from('comments').select('*, author:profiles(full_name, role)').eq('work_log_id', id).order('created_at'),
  ])

  // Get signed URLs for photos
  const photosWithUrls = await Promise.all(
    (photos ?? []).map(async photo => {
      const { data } = await supabase.storage
        .from('work-photos')
        .createSignedUrl(photo.storage_path, 3600)
      return { ...photo, url: data?.signedUrl }
    })
  )

  return (
    <AppLayout>
      <ReportDetail
        log={{ ...log, photos: photosWithUrls, comments: comments ?? [] }}
        currentProfile={profile}
      />
    </AppLayout>
  )
}
