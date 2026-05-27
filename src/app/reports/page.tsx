import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/supabase/actions'
import { redirect } from 'next/navigation'
import ReportsClient from './ReportsClient'

export default async function ReportsPage() {
  const profile = await getCurrentProfile()
  if (!profile) redirect('/auth/login')

  const supabase = await createClient()

  const { data: org } = await supabase
    .from('organizations')
    .select('plan')
    .eq('id', profile.organization_id)
    .single()

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

  // 作業後写真を一括取得して signed URL を付与
  const logIds = (logs ?? []).map(l => l.id)
  let logsWithPhotos: any[] = logs ?? []

  if (logIds.length > 0 && org?.plan !== 'free') {
    const { data: photos } = await supabase
      .from('photos')
      .select('id, work_log_id, storage_path')
      .in('work_log_id', logIds)
      .eq('photo_type', 'after')
      .order('created_at', { ascending: true })

    if (photos && photos.length > 0) {
      // まとめて signed URL 生成（Promise.all で並列）
      const withUrls = await Promise.all(
        photos.map(async p => {
          const { data } = await supabase.storage
            .from('work-photos')
            .createSignedUrl(p.storage_path, 3600)
          return { ...p, url: data?.signedUrl ?? null }
        })
      )

      // log_id ごとにグループ化（最大3枚）
      const photoMap: Record<string, { id: string; url: string | null }[]> = {}
      withUrls.forEach(p => {
        if (!photoMap[p.work_log_id]) photoMap[p.work_log_id] = []
        if (photoMap[p.work_log_id]!.length < 3) {
          photoMap[p.work_log_id]!.push({ id: p.id, url: p.url })
        }
      })

      logsWithPhotos = (logs ?? []).map(l => ({
        ...l,
        after_photos: photoMap[l.id] ?? [],
      }))
    }
  }

  return (
    <ReportsClient
      logs={logsWithPhotos as any}
      workers={workers ?? []}
      isAdmin={profile.role === 'admin'}
      orgId={profile.organization_id}
      currentUserId={profile.id}
      plan={org?.plan ?? 'free'}
    />
  )
}
