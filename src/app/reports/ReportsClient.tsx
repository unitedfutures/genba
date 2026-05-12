'use client'

import { useState, useMemo } from 'react'
import { FileText, ChevronRight } from 'lucide-react'
import StatusBadge from '@/components/ui/StatusBadge'
import Link from 'next/link'

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
}

export default function ReportsClient({ logs, workers, isAdmin }: Props) {
  const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM

  const [selectedWorker, setSelectedWorker] = useState<string>('all')
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonth)

  // ログに含まれる月の一覧（降順）
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

  const selectClass = "text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"

  const formatMonth = (ym: string) => {
    const [y, m] = ym.split('-')
    return `${y}年${parseInt(m)}月`
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-start justify-between gap-3">
        <h1 className="text-2xl font-black text-gray-900">
          {isAdmin ? '日報管理' : '日報一覧'}
        </h1>
        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
          {/* 年月フィルター */}
          <select
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            className={selectClass}
          >
            {months.map(m => (
              <option key={m} value={m}>{formatMonth(m)}</option>
            ))}
          </select>

          {/* スタッフフィルター（管理者のみ） */}
          {isAdmin && workers.length > 0 && (
            <select
              value={selectedWorker}
              onChange={e => setSelectedWorker(e.target.value)}
              className={selectClass}
            >
              <option value="all">全スタッフ</option>
              {workers.map(w => (
                <option key={w.id} value={w.id}>{w.full_name}</option>
              ))}
            </select>
          )}
        </div>
      </div>

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
    </div>
  )
}
