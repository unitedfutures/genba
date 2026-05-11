import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/supabase/actions'
import { redirect } from 'next/navigation'
import { Users, MapPin, ClipboardList, FileText, Clock } from 'lucide-react'
import StatusBadge from '@/components/ui/StatusBadge'
import Link from 'next/link'

export default async function DashboardPage() {
  const profile = await getCurrentProfile()
  if (!profile) redirect('/auth/login')

  // Workers are redirected to their own dashboard
  if (profile.role === 'worker') redirect('/my')

  const supabase = await createClient()
  const orgId = profile.organization_id
  const today = new Date().toISOString().split('T')[0]

  const [
    { count: staffCount },
    { count: siteCount },
    { count: taskCount },
    { data: todayLogs },
    { data: recentTasks },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('organization_id', orgId),
    supabase.from('sites').select('*', { count: 'exact', head: true }).eq('organization_id', orgId).eq('status', 'active'),
    supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('organization_id', orgId).eq('status', 'in_progress'),
    supabase.from('work_logs')
      .select('*, worker:profiles(full_name), site:sites(name)')
      .eq('organization_id', orgId)
      .eq('work_date', today)
      .order('clock_in_at', { ascending: false })
      .limit(10),
    supabase.from('tasks')
      .select('*, assignee:profiles(full_name), site:sites(name)')
      .eq('organization_id', orgId)
      .neq('status', 'completed')
      .neq('status', 'cancelled')
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const stats = [
    { label: 'スタッフ', value: staffCount ?? 0, icon: Users, href: '/staff', color: 'bg-blue-500' },
    { label: '稼働現場', value: siteCount ?? 0, icon: MapPin, href: '/sites', color: 'bg-green-500' },
    { label: '作業中タスク', value: taskCount ?? 0, icon: ClipboardList, href: '/tasks', color: 'bg-orange-500' },
    { label: '本日の日報', value: todayLogs?.length ?? 0, icon: FileText, href: '/reports', color: 'bg-purple-500' },
  ]

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-black text-gray-900">ダッシュボード</h1>
        <p className="text-gray-500 text-sm mt-1">{new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map(({ label, value, icon: Icon, href, color }) => (
          <Link key={href} href={href} className="card flex flex-col gap-2 hover:shadow-md transition-shadow">
            <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center`}>
              <Icon className="text-white" size={20} />
            </div>
            <div className="text-2xl font-black text-gray-900">{value}</div>
            <div className="text-xs text-gray-500 font-medium">{label}</div>
          </Link>
        ))}
      </div>

      {/* Today's work logs */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-900 flex items-center gap-2">
            <Clock size={18} className="text-orange-500" />
            本日の打刻・日報
          </h2>
          <Link href="/reports" className="text-sm text-orange-500 font-medium">すべて見る</Link>
        </div>
        {!todayLogs?.length ? (
          <p className="text-gray-400 text-sm py-4 text-center">本日の日報はまだありません</p>
        ) : (
          <div className="space-y-2">
            {todayLogs.map(log => (
              <Link key={log.id} href={`/reports/${log.id}`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-gray-600">
                    {(log.worker as any)?.full_name?.[0] ?? '?'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">{(log.worker as any)?.full_name}</p>
                  <p className="text-xs text-gray-500 truncate">{(log.site as any)?.name}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <StatusBadge type="worklog" status={log.status} />
                  {log.clock_in_at && (
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(log.clock_in_at).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}〜
                      {log.clock_out_at ? new Date(log.clock_out_at).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }) : ''}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Recent tasks */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-900 flex items-center gap-2">
            <ClipboardList size={18} className="text-orange-500" />
            進行中のタスク
          </h2>
          <Link href="/tasks" className="text-sm text-orange-500 font-medium">すべて見る</Link>
        </div>
        {!recentTasks?.length ? (
          <p className="text-gray-400 text-sm py-4 text-center">進行中のタスクはありません</p>
        ) : (
          <div className="space-y-2">
            {recentTasks.map(task => (
              <Link key={task.id} href={`/tasks`} className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                <StatusBadge type="task" status={task.status} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm">{task.title}</p>
                  <p className="text-xs text-gray-500">{(task.site as any)?.name} · {(task.assignee as any)?.full_name ?? '未アサイン'}</p>
                </div>
                {task.due_date && (
                  <p className="text-xs text-gray-400 flex-shrink-0">{task.due_date}</p>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
