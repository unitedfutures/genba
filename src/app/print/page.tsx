import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/supabase/actions'
import { redirect } from 'next/navigation'
import PrintButtons from './PrintButtons'

export default async function PrintPage({
  searchParams,
}: {
  searchParams: Promise<{ staff_id?: string; month?: string }>
}) {
  const params = await searchParams
  const profile = await getCurrentProfile()
  if (!profile) redirect('/auth/login')

  const supabase = await createClient()
  const targetStaffId = params.staff_id || profile.id
  const targetMonth = params.month || new Date().toISOString().slice(0, 7)

  // Workers can only view their own data
  if (profile.role !== 'admin' && targetStaffId !== profile.id) redirect('/reports')

  const [y, m] = targetMonth.split('-').map(Number)
  const startDate = `${targetMonth}-01`
  const endDate = new Date(y!, m!, 0).toISOString().split('T')[0]

  const { data: worker } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', targetStaffId)
    .eq('organization_id', profile.organization_id)
    .single()

  if (!worker) redirect('/reports')

  const { data: logs } = await supabase
    .from('work_logs')
    .select('*, site:sites(name)')
    .eq('organization_id', profile.organization_id)
    .eq('worker_id', targetStaffId)
    .gte('work_date', startDate)
    .lte('work_date', endDate)
    .order('work_date', { ascending: true })

  // Calculate totals
  let totalMinutes = 0
  const workDates = new Set<string>()
  ;(logs ?? []).forEach(log => {
    workDates.add(log.work_date)
    if (log.clock_in_at && log.clock_out_at) {
      totalMinutes += Math.round(
        (new Date(log.clock_out_at).getTime() - new Date(log.clock_in_at).getTime()) / 60000
      )
    }
  })

  const totalHours = Math.floor(totalMinutes / 60)
  const totalMinsRem = totalMinutes % 60
  const monthLabel = `${y}年${m}月`

  const formatTime = (iso: string | null) => {
    if (!iso) return '—'
    return new Date(iso).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
  }

  const formatDate = (dateStr: string) =>
    new Date(dateStr + 'T00:00:00').toLocaleDateString('ja-JP', {
      month: 'numeric', day: 'numeric', weekday: 'short',
    })

  const calcDuration = (inAt: string | null, outAt: string | null) => {
    if (!inAt || !outAt) return '—'
    const mins = Math.round(
      (new Date(outAt).getTime() - new Date(inAt).getTime()) / 60000
    )
    return `${Math.floor(mins / 60)}h${String(mins % 60).padStart(2, '0')}m`
  }

  const statusLabel = (s: string) => s === 'submitted' ? '提出済' : '下書き'

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page { margin: 1.5cm; size: A4; }
          body { background: white !important; }
        }
        .print-table th, .print-table td {
          border: 1px solid #e5e7eb;
          padding: 5px 8px;
          font-size: 9pt;
          vertical-align: top;
        }
        .print-table th { background: #f9fafb; font-weight: 700; }
        .print-table tr:nth-child(even) td { background: #fafafa; }
        .desc-cell { max-width: 200px; word-break: break-all; white-space: pre-wrap; }
      `}} />

      <div className="max-w-[21cm] mx-auto bg-white p-8 print:p-0 min-h-screen">
        {/* Header */}
        <div className="mb-6">
          <div className="text-2xl font-black text-orange-500 tracking-widest">GENBA</div>
          <div className="text-xs text-gray-400 mt-0.5">日報レポート</div>
          <div className="text-lg font-bold mt-2">{worker.full_name} ／ {monthLabel}</div>
        </div>

        <PrintButtons />

        <hr className="border-gray-200 mb-5 print:hidden" />

        {!logs?.length ? (
          <p className="text-center text-gray-400 py-16">この期間の日報はありません</p>
        ) : (
          <>
            <table className="w-full border-collapse print-table">
              <thead>
                <tr>
                  <th style={{ width: '13%' }}>日付</th>
                  <th style={{ width: '16%' }}>現場</th>
                  <th style={{ width: '8%' }}>開始</th>
                  <th style={{ width: '8%' }}>終了</th>
                  <th style={{ width: '8%' }}>時間</th>
                  <th>作業内容</th>
                  <th style={{ width: '8%' }}>状態</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id}>
                    <td>{formatDate(log.work_date)}</td>
                    <td>{(log.site as any)?.name ?? '—'}</td>
                    <td>{formatTime(log.clock_in_at)}</td>
                    <td>{formatTime(log.clock_out_at)}</td>
                    <td>{calcDuration(log.clock_in_at, log.clock_out_at)}</td>
                    <td className="desc-cell">{log.work_description || '—'}</td>
                    <td>{statusLabel(log.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-5 text-sm text-gray-600 border-t border-gray-100 pt-4">
              稼働日数: <strong>{workDates.size}日</strong>
              合計作業時間:{' '}
              <strong>
                {totalHours > 0 || totalMinsRem > 0
                  ? `${totalHours}時間${String(totalMinsRem).padStart(2, '0')}分`
                  : '—'}
              </strong>
            </div>
          </>
        )}
      </div>
    </>
  )
}
