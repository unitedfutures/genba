'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, X, ClipboardList } from 'lucide-react'
import StatusBadge from '@/components/ui/StatusBadge'
import type { Task, Profile, Site, TaskStatus } from '@/types'

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [sites, setSites] = useState<{ id: string; name: string }[]>([])
  const [workers, setWorkers] = useState<{ id: string; full_name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [orgId, setOrgId] = useState('')
  const [userId, setUserId] = useState('')
  const [filter, setFilter] = useState<TaskStatus | 'all'>('all')
  const [form, setForm] = useState({
    title: '', description: '', site_id: '', assigned_to: '', status: 'pending' as TaskStatus, due_date: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)

    const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
    if (!profile) return
    setOrgId(profile.organization_id)

    const [{ data: taskData }, { data: siteData }, { data: workerData }] = await Promise.all([
      supabase.from('tasks')
        .select('*, site:sites(name), assignee:profiles(full_name)')
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

    if (!orgId || !userId) {
      setFormError('読み込み中です。しばらく待ってから再試行してください。')
      return
    }
    if (!form.site_id) {
      setFormError('現場を選択してください。')
      return
    }

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
      setForm({ title: '', description: '', site_id: '', assigned_to: '', status: 'pending', due_date: '' })
      load()
    }
    setSubmitting(false)
  }

  async function handleStatusChange(taskId: string, status: TaskStatus) {
    const supabase = createClient()
    await supabase.from('tasks').update({ status }).eq('id', taskId)
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t))
  }

  const filtered = filter === 'all' ? tasks : tasks.filter(t => t.status === filter)

  const statusFilters: { label: string; value: TaskStatus | 'all' }[] = [
    { label: 'すべて', value: 'all' },
    { label: '未着手', value: 'pending' },
    { label: '作業中', value: 'in_progress' },
    { label: '完了', value: 'completed' },
  ]

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-gray-900">タスク管理</h1>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2 py-2">
          <Plus size={18} />
          <span className="hidden sm:inline">タスク追加</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {statusFilters.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filter === f.value
                ? 'bg-orange-500 text-white'
                : 'bg-white text-gray-600 border border-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-gray-400 text-center py-8">読み込み中...</p>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-12">
          <ClipboardList size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">タスクがありません</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(task => (
            <div key={task.id} className="card">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <StatusBadge type="task" status={task.status} />
                    {task.due_date && (
                      <span className="text-xs text-gray-400">{task.due_date}</span>
                    )}
                  </div>
                  <p className="font-bold text-gray-900">{task.title}</p>
                  {task.description && <p className="text-sm text-gray-600 mt-1">{task.description}</p>}
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                    {(task.site as any)?.name && <span>📍 {(task.site as any).name}</span>}
                    {(task.assignee as any)?.full_name && <span>👤 {(task.assignee as any).full_name}</span>}
                  </div>
                </div>
                <select
                  value={task.status}
                  onChange={e => handleStatusChange(task.id, e.target.value as TaskStatus)}
                  className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-orange-400 flex-shrink-0"
                >
                  <option value="pending">未着手</option>
                  <option value="in_progress">作業中</option>
                  <option value="completed">完了</option>
                  <option value="cancelled">キャンセル</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">タスクを追加</h3>
              <button onClick={() => { setShowModal(false); setFormError('') }} className="p-1 text-gray-400"><X size={20} /></button>
            </div>
            {formError && (
              <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2 mb-3">{formError}</p>
            )}
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">タスク名 <span className="text-red-500">*</span></label>
                <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="input-field" placeholder="内装工事" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">詳細</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="input-field resize-none" rows={2} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">現場 <span className="text-red-500">*</span></label>
                <select value={form.site_id} onChange={e => setForm(f => ({ ...f, site_id: e.target.value }))} className="input-field" required>
                  <option value="">選択してください</option>
                  {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">担当者</label>
                <select value={form.assigned_to} onChange={e => setForm(f => ({ ...f, assigned_to: e.target.value }))} className="input-field">
                  <option value="">未アサイン</option>
                  {workers.map(w => <option key={w.id} value={w.id}>{w.full_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">期日</label>
                <input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} className="input-field" />
              </div>
              <button type="submit" disabled={submitting} className="btn-primary w-full disabled:opacity-50">
                {submitting ? '追加中...' : '追加する'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
