import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/supabase/actions'
import { redirect } from 'next/navigation'
import { MapPin, ClipboardList, Plus, ArrowLeft } from 'lucide-react'
import StatusBadge from '@/components/ui/StatusBadge'
import Link from 'next/link'
import SiteMap from './SiteMap'
import SiteStatusEditor from './SiteStatusEditor'

export default async function SiteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const profile = await getCurrentProfile()
  if (!profile) redirect('/auth/login')

  const supabase = await createClient()

  const [{ data: site }, { data: tasks }] = await Promise.all([
    supabase.from('sites').select('*').eq('id', id).single(),
    supabase.from('tasks')
      .select('*, assignee:profiles(full_name)')
      .eq('site_id', id)
      .order('created_at', { ascending: false }),
  ])

  if (!site || site.organization_id !== profile.organization_id) redirect('/sites')

  const grouped = {
    in_progress: tasks?.filter(t => t.status === 'in_progress') ?? [],
    pending:     tasks?.filter(t => t.status === 'pending') ?? [],
    completed:   tasks?.filter(t => t.status === 'completed') ?? [],
  }

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/sites" className="p-2 rounded-xl hover:bg-gray-200 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-black text-gray-900">{site.name}</h1>
            <StatusBadge type="site" status={site.status} />
          </div>
          {site.address && (
            <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1">
              <MapPin size={12} />
              {site.address}
            </p>
          )}
        </div>
        {profile.role === 'admin' && (
          <SiteStatusEditor siteId={site.id} currentStatus={site.status} />
        )}
      </div>

      {/* Map */}
      {site.address ? (
        <SiteMap address={site.address} />
      ) : (
        <div className="card text-center py-6 text-gray-400 text-sm">
          住所を登録すると地図が表示されます
        </div>
      )}

      {/* Tasks */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-900 flex items-center gap-2">
            <ClipboardList size={18} className="text-orange-500" />
            タスク（{tasks?.length ?? 0}件）
          </h2>
          {profile.role === 'admin' && (
            <Link href="/tasks" className="btn-primary py-1.5 px-3 text-sm flex items-center gap-1">
              <Plus size={16} />
              タスク追加
            </Link>
          )}
        </div>

        {!tasks?.length ? (
          <p className="text-gray-400 text-sm text-center py-6">タスクがありません</p>
        ) : (
          <div className="space-y-4">
            {grouped.in_progress.length > 0 && (
              <div>
                <p className="text-xs font-bold text-blue-500 mb-2">作業中 ({grouped.in_progress.length})</p>
                {grouped.in_progress.map(t => <TaskRow key={t.id} task={t} />)}
              </div>
            )}
            {grouped.pending.length > 0 && (
              <div>
                <p className="text-xs font-bold text-gray-400 mb-2">未着手 ({grouped.pending.length})</p>
                {grouped.pending.map(t => <TaskRow key={t.id} task={t} />)}
              </div>
            )}
            {grouped.completed.length > 0 && (
              <div>
                <p className="text-xs font-bold text-green-500 mb-2">完了 ({grouped.completed.length})</p>
                {grouped.completed.map(t => <TaskRow key={t.id} task={t} />)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function TaskRow({ task }: { task: any }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-gray-100 last:border-0">
      <StatusBadge type="task" status={task.status} />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 text-sm">{task.title}</p>
        {task.assignee && <p className="text-xs text-gray-500">{task.assignee.full_name}</p>}
      </div>
      {task.due_date && <p className="text-xs text-gray-400 flex-shrink-0">{task.due_date}</p>}
    </div>
  )
}
