import type { TaskStatus, WorkLogStatus, SiteStatus } from '@/types'

const taskColors: Record<TaskStatus, string> = {
  pending: 'bg-gray-100 text-gray-600',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-600',
}
const taskLabels: Record<TaskStatus, string> = {
  pending: '未着手',
  in_progress: '作業中',
  completed: '完了',
  cancelled: 'キャンセル',
}
const workLogColors: Record<WorkLogStatus, string> = {
  draft: 'bg-yellow-100 text-yellow-700',
  submitted: 'bg-green-100 text-green-700',
}
const workLogLabels: Record<WorkLogStatus, string> = {
  draft: '下書き',
  submitted: '提出済み',
}
const siteColors: Record<SiteStatus, string> = {
  active: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  paused: 'bg-gray-100 text-gray-600',
}
const siteLabels: Record<SiteStatus, string> = {
  active: '稼働中',
  completed: '完了',
  paused: '中断',
}

interface Props {
  type: 'task' | 'worklog' | 'site'
  status: string
}

export default function StatusBadge({ type, status }: Props) {
  let colorClass = ''
  let label = ''

  if (type === 'task') {
    colorClass = taskColors[status as TaskStatus] ?? 'bg-gray-100 text-gray-600'
    label = taskLabels[status as TaskStatus] ?? status
  } else if (type === 'worklog') {
    colorClass = workLogColors[status as WorkLogStatus] ?? 'bg-gray-100 text-gray-600'
    label = workLogLabels[status as WorkLogStatus] ?? status
  } else {
    colorClass = siteColors[status as SiteStatus] ?? 'bg-gray-100 text-gray-600'
    label = siteLabels[status as SiteStatus] ?? status
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${colorClass}`}>
      {label}
    </span>
  )
}
