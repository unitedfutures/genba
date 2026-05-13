'use client'

import { useState, useMemo } from 'react'
import { FileText, ChevronRight, Download, X, Printer } from 'lucide-react'
import UpgradeButton from '@/components/ui/UpgradeButton'
import StatusBadge from '@/components/ui/StatusBadge'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface Log {
  id: string
  work_date: string
  worker_id: string
  status: string
  clock_in_at: string | null
  clock_out_at: string | null
  worker: { full_name: string } | null
  site: { name: string } | null
}

interface Worker {
  id: string
  full_name: string
}

interface Props {
  logs: Log[]
  workers: Worker[]
  isAdmin: boolean
  orgId: string
  currentUserId: string
  plan: string
}

// Generate last N months as YYYY-MM strings (descending)
function recentMonths(n = 12): string[] {
  const now = new Date()
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    return d.toISOString().slice(0, 7)
  })
}

function formatMonthLabel(ym: string) {
  const [y, m] = ym.split('-')
  return `${y}年${parseInt(m!)}月`
}

function escapeCell(val: string) {
  if (val.includes(',') || val.includes('"') || val.includes('\n') || val.includes('\r')) {
    return '"' + val.replace(/"/g, '""') + '"'
  }
  return val
}

export default function ReportsClient({ logs, workers, isAdmin, orgId, currentUserId, plan }: Props) {
  const currentMonth = new Date().toISOString().slice(0, 7)

  // ---- List filters ----
  const [selectedWorker, setSelectedWorker] = useState<string>('all')
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonth)

  // ---- Export modal ----
  const [showExport, setShowExport] = useState(false)
  const [exportTab, setExportTab] = useState<'pdf' | 'csv'>('pdf')

  // PDF selectors (single staff, single month)
  const [pdfStaff, setPdfStaff] = useState<string>(isAdmin ? (workers[0]?.id ?? '') : currentUserId)
  const [pdfMonth, setPdfMonth] = useState<string>(currentMonth)

  // CSV selectors (multi)
  const allMonths = useMemo(() => recentMonths(12), [])
  const [csvStaffs, setCsvStaffs] = useState<string[]>(isAdmin ? [] : [currentUserId])
  const [csvMonths, setCsvMonths] = useState<string[]>([currentMonth])
  const [csvLoading, setCsvLoading] = useState(false)

  // ---- Derived list ----
  const months = useMemo(() => {
    const set = new Set(logs.map(l => l.work_date.slice(0, 7)))
    if (!set.has(currentMonth)) set.add(currentMonth)
    return [...set].sort((a, b) => b.localeCompare(a))
  }, [logs])

  const filtered = logs
    .filter(l => selectedMonth === 'all' || l.work_date.startsWith(selectedMonth))
    .filter(l => selectedWorker === 'all' || l.worker_id === selectedWorker)

  const grouped: Record<string, Log[]> = {}
  filtered.forEach(log => {
    if (!grouped[log.work_date]) grouped[log.work_date] = []
    grouped[log.work_date]!.push(log)
  })

  // ---- CSV toggle helpers ----
  function toggleCsvStaff(id: string) {
    setCsvStaffs(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }
  function toggleCsvMonth(m: string) {
    setCsvMonths(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m])
  }

  // ---- CSV download ----
  async function handleCsvDownload() {
    if (!csvMonths.length) return
    if (isAdmin && !csvStaffs.length) return
    setCsvLoading(true)
    try {
      const sortedMonths = [...csvMonths].sort()
      const minMonth = sortedMonths[0]!
      const maxMonth = sortedMonths[sortedMonths.length - 1]!
      const [my, mm] = maxMonth.split('-').map(Number)
      const startDate = `${minMonth}-01`
      const endDate = new Date(my!, mm!, 0).toISOString().split('T')[0]

      const supabase = createClient()
      let query = supabase
        .from('work_logs')
        .select('*, worker:profiles(full_name), site:sites(name)')
        .eq('organization_id', orgId)
        .gte('work_date', startDate)
        .lte('work_date', endDate)
        .order('work_date', { ascending: true })
        .order('created_at', { ascending: true })

      if (isAdmin) {
        query = query.in('worker_id', csvStaffs)
      } else {
        query = query.eq('worker_id', currentUserId)
      }

      const { data } = await query
      const rows = (data ?? []).filter(l => csvMonths.includes(l.work_date.slice(0, 7)))

      const formatTime = (iso: string | null) => {
        if (!iso) return ''
        return new Date(iso).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
      }
      const calcMins = (inAt: string | null, outAt: string | null) => {
        if (!inAt || !outAt) return ''
        return String(Math.round((new Date(outAt).getTime() - new Date(inAt).getTime()) / 60000))
      }

      const header = ['日付', 'スタッフ名', '現場名', '開始時刻', '終了時刻', '作業時間（分）', '作業内容', 'スタッフコメント', 'ステータス']
      const csvRows = rows.map(l => [
        l.work_date,
        (l.worker as any)?.full_name ?? '',
        (l.site as any)?.name ?? '',
        formatTime(l.clock_in_at),
        formatTime(l.clock_out_at),
        calcMins(l.clock_in_at, l.clock_out_at),
        l.work_description ?? '',
        l.worker_comment ?? '',
        l.status === 'submitted' ? '提出済' : '下書き',
      ])

      const csvContent = [header, ...csvRows]
        .map(row => row.map(cell => escapeCell(String(cell))).join(','))
        .join('\r\n')

      const blob = new Blob(['﻿' + csvContent], { type: 'text/csv;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `日報_${sortedMonths.join('-')}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setCsvLoading(false)
    }
  }

  // ---- PDF open ----
  function handlePdfOpen() {
    const url = `/print?staff_id=${pdfStaff}&month=${pdfMonth}`
    window.open(url, '_blank')
  }

  const selectClass = 'text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-orange-400'
  const checkClass = 'w-4 h-4 rounded accent-orange-500 cursor-pointer'

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <h1 className="text-2xl font-black text-gray-900">
          {isAdmin ? '日報管理' : '日報一覧'}
        </h1>
        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
          <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className={selectClass}>
            {months.map(m => (
              <option key={m} value={m}>{formatMonthLabel(m)}</option>
            ))}
          </select>
          {isAdmin && workers.length > 0 && (
            <select value={selectedWorker} onChange={e => setSelectedWorker(e.target.value)} className={selectClass}>
              <option value="all">全スタッフ</option>
              {workers.map(w => (
                <option key={w.id} value={w.id}>{w.full_name}</option>
              ))}
            </select>
          )}
          {/* Export button */}
          {plan === 'free' ? (
            <UpgradeButton
              label="出力"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-orange-200 bg-orange-50 text-sm font-medium text-orange-500 hover:bg-orange-100 transition-colors disabled:opacity-60"
            />
          ) : (
            <button
              onClick={() => setShowExport(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Download size={15} />
              出力
            </button>
          )}
        </div>
      </div>

      {/* Log list */}
      {!filtered.length ? (
        <div className="card text-center py-12">
          <FileText size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">日報がありません</p>
        </div>
      ) : (
        Object.entries(grouped).sort(([a], [b]) => b.localeCompare(a)).map(([date, dayLogs]) => (
          <div key={date} className="card">
            <h2 className="font-bold text-gray-700 mb-3 text-sm">
              {new Date(date + 'T00:00:00').toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })}
            </h2>
            <div className="divide-y divide-gray-100">
              {dayLogs.map(log => (
                <Link key={log.id} href={`/reports/${log.id}`} className="flex items-center gap-3 py-3 hover:bg-gray-50 -mx-4 px-4 transition-colors">
                  <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-gray-600">
                      {log.worker?.full_name?.[0] ?? '?'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm">{log.worker?.full_name}</p>
                    <p className="text-xs text-gray-500 truncate">{log.site?.name}</p>
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

      {/* Export modal */}
      {showExport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowExport(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            {/* Modal header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <Download size={18} className="text-orange-500" />
                日報出力
              </h2>
              <button onClick={() => setShowExport(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="p-5 space-y-6">
              {/* Tabs */}
              <div className="flex rounded-xl overflow-hidden border border-gray-200">
                {(['pdf', 'csv'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setExportTab(tab)}
                    className={`flex-1 py-2 text-sm font-bold transition-colors ${
                      exportTab === tab
                        ? 'bg-orange-500 text-white'
                        : 'bg-white text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {tab === 'pdf' ? '📄 PDF' : '📊 CSV'}
                  </button>
                ))}
              </div>

              {/* PDF tab */}
              {exportTab === 'pdf' && (
                <div className="space-y-4">
                  <p className="text-xs text-gray-400">1スタッフ・1ヶ月分を印刷用ページで開きます</p>
                  {isAdmin && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">スタッフ</label>
                      <select value={pdfStaff} onChange={e => setPdfStaff(e.target.value)} className={`${selectClass} w-full`}>
                        {workers.map(w => (
                          <option key={w.id} value={w.id}>{w.full_name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">年月</label>
                    <select value={pdfMonth} onChange={e => setPdfMonth(e.target.value)} className={`${selectClass} w-full`}>
                      {allMonths.map(m => (
                        <option key={m} value={m}>{formatMonthLabel(m)}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={handlePdfOpen}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-orange-500 text-white font-bold hover:bg-orange-600 transition-colors"
                  >
                    <Printer size={16} />
                    印刷・PDF保存
                  </button>
                </div>
              )}

              {/* CSV tab */}
              {exportTab === 'csv' && (
                <div className="space-y-4">
                  <p className="text-xs text-gray-400">複数のスタッフ・年月を選んで一括ダウンロード</p>

                  {isAdmin && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">スタッフ</label>
                      <div className="space-y-1.5 max-h-36 overflow-y-auto">
                        {workers.map(w => (
                          <label key={w.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 rounded-lg px-2 py-1">
                            <input
                              type="checkbox"
                              checked={csvStaffs.includes(w.id)}
                              onChange={() => toggleCsvStaff(w.id)}
                              className={checkClass}
                            />
                            <span className="text-sm text-gray-700">{w.full_name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">年月</label>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {allMonths.map(m => (
                        <label key={m} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 rounded-lg px-2 py-1">
                          <input
                            type="checkbox"
                            checked={csvMonths.includes(m)}
                            onChange={() => toggleCsvMonth(m)}
                            className={checkClass}
                          />
                          <span className="text-sm text-gray-700">{formatMonthLabel(m)}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleCsvDownload}
                    disabled={csvLoading || !csvMonths.length || (isAdmin && !csvStaffs.length)}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-orange-500 text-white font-bold hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Download size={16} />
                    {csvLoading ? 'ダウンロード中...' : 'CSVダウンロード'}
                  </button>

                  {isAdmin && !csvStaffs.length && (
                    <p className="text-xs text-red-500 text-center">スタッフを1人以上選択してください</p>
                  )}
                  {!csvMonths.length && (
                    <p className="text-xs text-red-500 text-center">年月を1つ以上選択してください</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
