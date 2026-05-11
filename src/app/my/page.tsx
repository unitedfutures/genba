import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/supabase/actions'
import { redirect } from 'next/navigation'
import { Clock, ClipboardList, FileText, ChevronRight } from 'lucide-react'
import StatusBadge from '@/components/ui/StatusBadge'
import Link from 'next/link'

export default async function MyPage() {
  const profile = await getCurrentProfile()
  if (!profile) redirect('/auth/login')

  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  const [{ data: todayLog }, { data: myTasks }, { data: recentLogs }] = await Promise.all([
    supabase.from('work_logs')
      .select('*, site:sites(name)')
      .eq('worker_id', profile.id)
      .eq('work_date', today)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from('tasks')
      .select('*, site:sites(name)')
      .eq('assigned_to', profile.id)
      .neq('status', 'completed')
      .neq('status', 'cancelled')
      .order('due_date', { ascending: true })
      .limit(5),
    supabase.from('work_logs')
      .select('*, site:sites(name)')
      .eq('worker_id', profile.id)
      .order('work_date', { ascending: false })
      .limit(5),
  ])

  const isWorking = todayLog && todayLog.clock_in_at && !todayLog.clock_out_at
  const formatTime = (ts: string | null) =>
    ts ? new Date(ts).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }) : null

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h1 className="text-2xl font-black text-gray-900">おはようございます</h1>
        <p className="text-gray-500 text-sm mt-1">{profile.full_name}さん · {new Date().toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', weekday: 'long' })}</p>
      </div>

      {/* Clock status card */}
      <div className={`rounded-2xl p-5 text-white shadow-lg ${isWorking ? 'bg-gradient-to-br from-blue-500 to-blue-700' : todayLog?.clock_out_at ? 'bg-gradient-to-br from-gray-600 to-gray-800' : 'bg-gradient-to-br from-orange-500 to-orange-700'}`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-white/70 text-sm">本日のステータス</p>
            <p className="text-xl font-black mt-1">
              {isWorking ? '作業中' : todayLog?.clock_out_at ? '作業終了' : '未開始'}
            </p>
            {isWorking && todayLog.clock_in_at && (
              <p className="text-white/80 text-sm">{formatTime(todayLog.clock_in_at)} 開始</p>
            )}
            {todayLog?.clock_out_at && (
              <p className="text-white/80 text-sm">
                {formatTime(todayLog.clock_in_at)} 〜 {formatTime(todayLog.clock_out_at)}
              </p>
            )}
          </div>
          <Clock size={40} className="text-white/40" />
        </div>
        <Link
          href="/my/clock"
          className="block w-full text-center bg-white/20 hover:bg-white/30 active:bg-white/40 backdrop-blur-sm text-white font-bold py-3 rounded-xl transition-colors"
        >
          {isWorking ? '終了打刻 →' : todayLog?.clock_out_at ? '日報を確認 →' : '開始打刻 →'}
        </Link>
      </div>

      {/* My tasks */}
      {myTasks && myTasks.length > 0 && (
        <div className="card">
          <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <ClipboardList size={16} className="text-orange-500" />
            アサインされたタスク
          </h2>
          <div className="space-y-2">
            {myTasks.map(task => (
              <div key={task.id} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
                <StatusBadge type="task" status={task.status} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm">{task.title}</p>
                  <p className="text-xs text-gray-500">{(task.site as any)?.name}</p>
                </div>
                {task.due_date && (
                  <span className="text-xs text-gray-400">{task.due_date}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent reports */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-gray-900 flex items-center gap-2">
            <FileText size={16} className="text-orange-500" />
            最近の日報
          </h2>
          <Link href="/my/reports" className="text-sm text-orange-500 font-medium">すべて</Link>
        </div>
        {!recentLogs?.length ? (
          <p className="text-gray-400 text-sm text-center py-4">日報がありません</p>
        ) : (
          <div className="space-y-1">
            {recentLogs.map(log => (
              <Link key={log.id} href={`/my/reports/${log.id}`} className="flex items-center gap-3 py-2.5 hover:bg-gray-50 -mx-4 px-4 rounded-xl transition-colors">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{new Date(log.work_date + 'T00:00:00').toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric', weekday: 'short' })}</p>
                  <p className="text-xs text-gray-500">{(log.site as any)?.name}</p>
                </div>
                <StatusBadge type="worklog" status={log.status} />
                <ChevronRight size={14} className="text-gray-300" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
