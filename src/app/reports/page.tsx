import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/supabase/actions'
import { redirect } from 'next/navigation'
import { FileText, ChevronRight } from 'lucide-react'
import StatusBadge from '@/components/ui/StatusBadge'
import Link from 'next/link'

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

  const { data: logs } = await query

  const grouped: Record<string, typeof logs> = {}
  logs?.forEach(log => {
    const date = log.work_date
    if (!grouped[date]) grouped[date] = []
    grouped[date]!.push(log)
  })

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-black text-gray-900">
        {profile.role === 'admin' ? '日報管理' : '日報一覧'}
      </h1>

      {!logs?.length ? (
        <div className="card text-center py-12">
          <FileText size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">日報がありません</p>
        </div>
      ) : (
        Object.entries(grouped).map(([date, dayLogs]) => (
          <div key={date} className="card">
            <h2 className="font-bold text-gray-700 mb-3 text-sm">
              {new Date(date + 'T00:00:00').toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })}
            </h2>
            <div className="divide-y divide-gray-100">
              {dayLogs?.map(log => (
                <Link key={log.id} href={`/reports/${log.id}`} className="flex items-center gap-3 py-3 hover:bg-gray-50 -mx-4 px-4 transition-colors">
                  <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-gray-600">
                      {(log.worker as any)?.full_name?.[0] ?? '?'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm">{(log.worker as any)?.full_name}</p>
                    <p className="text-xs text-gray-500 truncate">{(log.site as any)?.name}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <StatusBadge type="worklog" status={log.status} />
                    {log.clock_in_at && (
                      <span className="text-xs text-gray-400">
                        {new Date(log.clock_in_at).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                        {log.clock_out_at && `〜${new Date(log.clock_out_at).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}`}
                      </span>
                    )}
                    <ChevronRight size={14} className="text-gray-300" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
