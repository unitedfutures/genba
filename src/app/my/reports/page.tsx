import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/supabase/actions'
import { redirect } from 'next/navigation'
import { FileText, ChevronRight, Plus } from 'lucide-react'
import StatusBadge from '@/components/ui/StatusBadge'
import Link from 'next/link'

export default async function MyReportsPage() {
  const profile = await getCurrentProfile()
  if (!profile) redirect('/auth/login')

  const supabase = await createClient()

  const { data: logs } = await supabase
    .from('work_logs')
    .select('*, site:sites(name)')
    .eq('worker_id', profile.id)
    .order('work_date', { ascending: false })
    .limit(30)

  return (
    <div className="max-w-lg space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-gray-900">日報</h1>
        <Link href="/my/clock" className="btn-primary py-2 flex items-center gap-1">
          <Plus size={16} />
          打刻
        </Link>
      </div>

      {!logs?.length ? (
        <div className="card text-center py-12">
          <FileText size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">日報がありません</p>
          <Link href="/my/clock" className="mt-4 inline-block btn-primary py-2 px-4">打刻して始める</Link>
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map(log => (
            <Link key={log.id} href={`/my/reports/${log.id}`} className="card flex items-center gap-3 hover:shadow-md transition-shadow">
              <div className="flex-1">
                <p className="font-bold text-gray-900">
                  {new Date(log.work_date + 'T00:00:00').toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', weekday: 'short' })}
                </p>
                <p className="text-sm text-gray-500">{(log.site as any)?.name}</p>
                {log.clock_in_at && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(log.clock_in_at).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                    {log.clock_out_at && ` 〜 ${new Date(log.clock_out_at).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}`}
                  </p>
                )}
              </div>
              <StatusBadge type="worklog" status={log.status} />
              <ChevronRight size={16} className="text-gray-400" />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
