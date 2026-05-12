'use client'

import { useState } from 'react'
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
  const [selectedWorker, setSelectedWorker] = useState<string>('all')

  const filtered = selectedWorker === 'all'
    ? logs
    : logs.filter(l => l.worker_id === selectedWorker)

  const grouped: Record<string, Log[]> = {}
  filtered.forEach(log => {
    if (!grouped[log.work_date]) grouped[log.work_date] = []
    grouped[log.work_date]!.push(log)
  })

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-black text-gray-900">
          {isAdmin ? '日報管理' : '日報一覧'}
        </h1>
        {isAdmin && workers.length > 0 && (
          <select
            value={selectedWorker}
            onChange={e => setSelectedWorker(e.target.value)}
            className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-orange-400 flex-shrink-0"
          >
            <option value="all">全て表示</option>
            {workers.map(w => (
              <option key={w.id} value={w.id}>{w.full_name}</option>
            ))}
          </select>
        )}
      </div>

      {!filtered.length ? (
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
