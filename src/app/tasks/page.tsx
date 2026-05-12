'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, X, ClipboardList, Pencil, Trash2, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import StatusBadge from '@/components/ui/StatusBadge'
import type { Task, TaskStatus } from '@/types'

type SortKey = 'created_at' | 'due_date' | 'status'
type SortDir = 'asc' | 'desc'

const statusOrder: Record<string, number> = { pending: 0, in_progress: 1, completed: 2, cancelled: 3 }

const emptyForm = { title: '', description: '', site_id: '', assigned_to: '', status: 'pending' as TaskStatus, due_date: '' }

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [sites, setSites] = useState<{ id: string; name: string }[]>([])
  const [workers, setWorkers] = useState<{ id: string; full_name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [orgId, setOrgId] = useState('')
  const [userId, setUserId] = useState('')
  const [filter, setFilter] = useState<TaskStatus | 'all'>('all')
  const [myOnly, setMyOnly] = useState(true)
  const initialized = useRef(false)

  const [sortKey, setSortKey] = useState<SortKey>('created_at')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  // 新規追加モーダル
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  // 編集モーダル
  const [editTask, setEditTask] = useState<Task | null>(null)
  const [editForm, setEditForm] = useState(emptyForm)
  const [editSubmitting, setEditSubmitting] = useState(false)
  const [editError, setEditError] = useState('')

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)

    const { data: profile } = await supabase.from('profiles').select('organization_id, role').eq('id', user.id).single()
    if (!profile) return
    setOrgId(profile.organization_id)
    if (!initialized.current) {
      setMyOnly(profile.role !== 'admin')
      initialized.current = true
    }

    const [{ data: taskData }, { data: siteData }, { data: workerData }] = await Promise.all([
      supabase.from('tasks')
        .select('*, site:sites!site_id(name), assignee:profiles!assigned_to(full_name)')
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false }),
      supabase.from('sites').select('id, name').eq('organization_id', profile.organization_id).eq('status', 'active'),
      supabase.from('profiles').select('id, full_name').eq('organization_id', profile.organization_id),
    ])

    setTasks(taskData ?? [])
    setSites(siteData ?? [])
    setWorkers(workerData ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')
    if (!orgId || !userId) { setFormError('読み込み中です。しばらく待ってから再試行してください。'); return }
    if (!form.site_id) { setFormError('現場を選択してください。'); return }
    setSubmitting(true)
    const supabase = createClient()
    const { error } = await supabase.from('tasks').insert({
      organization_id: orgId,
      site_id: form.site_id,
      title: form.title,
      description: form.description || null,
      assigned_to: form.assigned_to || null,
      status: form.status,
      due_date: form.due_date || null,
      created_by: userId,
    })
    if (error) {
      setFormError('追加に失敗しました: ' + error.message)
    } else {
      setShowModal(false)
      setForm(emptyForm)
      load()
    }
    setSubmitting(false)
  }

  function openEdit(task: Task) {
    setEditTask(task)
    setEditError('')
    setEditForm({
      title: task.title,
      description: task.description ?? '',
      site_id: task.site_id,
      assigned_to: task.assigned_to ?? '',
      status: task.status,
      due_date: task.due_date ?? '',
    })
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editTask) return
    if (!editForm.site_id) { setEditError('現場を選択してください。'); return }
    setEditSubmitting(true)
    const supabase = createClient()
    const { error } = await supabase.from('tasks').update({
      title: editForm.title,
      description: editForm.description || null,
      site_id: editForm.site_id,
      assigned_to: editForm.assigned_to || null,
      status: editForm.status,
      due_date: editForm.due_date || null,
    }).eq('id', editTask.id)
    if (error) {
      setEditError('保存に失敗しました: ' + error.message)
    } else {
      setEditTask(null)
      load()
    }
    setEditSubmitting(false)
  }

  async function handleDelete(task: Task) {
    if (!confirm(`「${task.title}」を削除しますか？`)) return
    const supabase = createClient()
    await supabase.from('tasks').delete().eq('id', task.id)
    load()
  }

  async function handleStatusChange(taskId: string, status: TaskStatus) {
    const supabase = createClient()
    await supabase.from('tasks').update({ status }).eq('id', taskId)
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t))
  }

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const base = tasks
    .filter(t => !myOnly || t.assigned_to === userId)
    .filter(t => filter === 'all' || t.status === filter)
  const sorted = [...base].sort((a, b) => {
    let cmp = 0
    if (sortKey === 'due_date') {
      cmp = (a.due_date ?? '9999').localeCompare(b.due_date ?? '9999')
    } else if (sortKey === 'status') {
      cmp = (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9)
    } else {
      cmp = a.created_at.localeCompare(b.created_at)
    }
    return sortDir === 'asc' ? cmp : -cmp
  })

  const statusFilters: { label: string; value: TaskStatus | 'all' }[] = [
    { label: 'すべて', value: 'all' },
    { label: '未着手', value: 'pending' },
    { label: '作業中', value: 'in_progress' },
    { label: '完了', value: 'completed' },
  ]

  const TaskForm = ({ values, onChange, onSubmit, onCancel, submitting: sub, error: err, isEdit }: {
    values: typeof emptyForm
    onChange: (v: typeof emptyForm) => void
    onSubmit: (e: React.FormEvent) => void
    onCancel: () => void
    submitting: boolean
    error: string
    isEdit: boolean
  }) => (
    <form onSubmit={onSubmit} className="space-y-4">
      {err && <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{err}</p>}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">タスク名 <span className="text-red-500">*</span></label>
        <input type="text" value={values.title} onChange={e => onChange({ ...values, title: e.target.value })} className="input-field" placeholder="内装工事" required />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">詳細</label>
        <textarea value={values.description} onChange={e => onChange({ ...values, description: e.target.value })} className="input-field resize-none" rows={2} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">現場 <span className="text-red-500">*</span></label>
        <select value={values.site_id} onChange={e => onChange({ ...values, site_id: e.target.value })} className="input-field" required>
          <option value="">選択してください</option>
          {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">担当者</label>
        <select value={values.assigned_to} onChange={e => onChange({ ...values, assigned_to: e.target.value })} className="input-field">
          <option value="">未アサイン</option>
          {workers.map(w => <option key={w.id} value={w.id}>{w.full_name}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">ステータス</label>
        <select value={values.status} onChange={e => onChange({ ...values, status: e.target.value as TaskStatus })} className="input-field">
          <option value="pending">未着手</option>
          <option value="in_progress">作業中</option>
          <option value="completed">完了</option>
          <option value="cancelled">キャンセル</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">期日</label>
        <input type="date" value={values.due_date} onChange={e => onChange({ ...values, due_date: e.target.value })} className="input-field" />
      </div>
      {isEdit ? (
        <div className="flex gap-2">
          <button type="button" onClick={onCancel} className="btn-secondary flex-1">キャンセル</button>
          <button type="submit" disabled={sub} className="btn-primary flex-1 disabled:opacity-50">{sub ? '保存中...' : '保存する'}</button>
        </div>
      ) : (
        <button type="submit" disabled={sub} className="btn-primary w-full disabled:opacity-50">{sub ? '追加中...' : '追加する'}</button>
      )}
    </form>
  )

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-gray-900">タスク管理</h1>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-gray-100 rounded-full p-0.5 text-sm font-medium">
            <button
              onClick={() => setMyOnly(true)}
              className={`px-3 py-1.5 rounded-full transition-colors ${myOnly ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
            >
              自分のみ
            </button>
            <button
              onClick={() => setMyOnly(false)}
              className={`px-3 py-1.5 rounded-full transition-colors ${!myOnly ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
            >
              全タスク
            </button>
          </div>
          <button onClick={() => { setShowModal(true); setFormError('') }} className="btn-primary flex items-center gap-2 py-2">
            <Plus size={18} />
            <span className="hidden sm:inline">タスク追加</span>
          </button>
        </div>
      </div>

      {/* フィルター */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {statusFilters.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filter === f.value ? 'bg-orange-500 text-white' : 'bg-white text-gray-600 border border-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* 並び替え */}
      {tasks.length > 1 && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-400 text-xs font-medium flex items-center gap-1">
            <ArrowUpDown size={13} />並び替え
          </span>
          {([['created_at', '登録日'], ['due_date', '期日'], ['status', 'ステータス']] as [SortKey, string][]).map(([key, label]) => {
            const active = sortKey === key
            return (
              <button
                key={key}
                onClick={() => toggleSort(key)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full border transition-colors ${
                  active ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                }`}
              >
                {label}
                {active && (sortDir === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
              </button>
            )
          })}
        </div>
      )}

      {loading ? (
        <p className="text-gray-400 text-center py-8">読み込み中...</p>
      ) : sorted.length === 0 ? (
        <div className="card text-center py-12">
          <ClipboardList size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">タスクがありません</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map(task => (
            <div key={task.id} className="card">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <StatusBadge type="task" status={task.status} />
                    {task.due_date && (
                      <span className="text-xs text-gray-400">期日: {task.due_date}</span>
                    )}
                  </div>
                  <p className="font-bold text-gray-900">{task.title}</p>
                  {task.description && <p className="text-sm text-gray-600 mt-1">{task.description}</p>}
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                    {(task.site as any)?.name && <span>📍 {(task.site as any).name}</span>}
                    {(task.assignee as any)?.full_name && <span>👤 {(task.assignee as any).full_name}</span>}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <select
                    value={task.status}
                    onChange={e => handleStatusChange(task.id, e.target.value as TaskStatus)}
                    className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-orange-400"
                  >
                    <option value="pending">未着手</option>
                    <option value="in_progress">作業中</option>
                    <option value="completed">完了</option>
                    <option value="cancelled">キャンセル</option>
                  </select>
                  <div className="flex gap-1">
                    <button
                      onClick={() => openEdit(task)}
                      className="p-1.5 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                      title="編集"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(task)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="削除"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 新規追加モーダル */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">タスクを追加</h3>
              <button onClick={() => { setShowModal(false); setFormError('') }} className="p-1 text-gray-400"><X size={20} /></button>
            </div>
            <TaskForm
              values={form}
              onChange={setForm}
              onSubmit={handleCreate}
              onCancel={() => { setShowModal(false); setFormError('') }}
              submitting={submitting}
              error={formError}
              isEdit={false}
            />
          </div>
        </div>
      )}

      {/* 編集モーダル */}
      {editTask && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">タスクを編集</h3>
              <button onClick={() => setEditTask(null)} className="p-1 text-gray-400"><X size={20} /></button>
            </div>
            <TaskForm
              values={editForm}
              onChange={setEditForm}
              onSubmit={handleEdit}
              onCancel={() => setEditTask(null)}
              submitting={editSubmitting}
              error={editError}
              isEdit={true}
            />
          </div>
        </div>
      )}
    </div>
  )
}
