'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MapPin, Plus, X, ChevronRight, Pencil, Trash2 } from 'lucide-react'
import StatusBadge from '@/components/ui/StatusBadge'
import Link from 'next/link'
import type { Site } from '@/types'

export default function SitesPage() {
  const [sites, setSites] = useState<Site[]>([])
  const [loading, setLoading] = useState(true)
  const [orgId, setOrgId] = useState('')
  const [userId, setUserId] = useState('')

  // 新規追加モーダル
  const [showAddModal, setShowAddModal] = useState(false)
  const [addForm, setAddForm] = useState({ name: '', address: '' })
  const [addSubmitting, setAddSubmitting] = useState(false)

  // 編集モーダル
  const [editSite, setEditSite] = useState<Site | null>(null)
  const [editForm, setEditForm] = useState({ name: '', address: '' })
  const [editSubmitting, setEditSubmitting] = useState(false)

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)

    const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
    if (!profile) return
    setOrgId(profile.organization_id)

    const { data } = await supabase
      .from('sites')
      .select('*')
      .eq('organization_id', profile.organization_id)
      .order('created_at', { ascending: false })

    setSites(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setAddSubmitting(true)
    const supabase = createClient()
    const { error } = await supabase.from('sites').insert({
      organization_id: orgId,
      name: addForm.name,
      address: addForm.address || null,
      status: 'active',
      created_by: userId,
    })
    if (!error) {
      setShowAddModal(false)
      setAddForm({ name: '', address: '' })
      load()
    }
    setAddSubmitting(false)
  }

  function openEdit(site: Site) {
    setEditSite(site)
    setEditForm({ name: site.name, address: site.address ?? '' })
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editSite) return
    setEditSubmitting(true)
    const supabase = createClient()
    await supabase.from('sites').update({
      name: editForm.name,
      address: editForm.address || null,
    }).eq('id', editSite.id)
    setEditSite(null)
    load()
    setEditSubmitting(false)
  }

  async function handleDelete(site: Site) {
    if (!confirm(`「${site.name}」を削除しますか？\n関連するタスクも削除されます。`)) return
    const supabase = createClient()
    await supabase.from('sites').delete().eq('id', site.id)
    load()
  }

  const grouped = {
    active:    sites.filter(s => s.status === 'active'),
    paused:    sites.filter(s => s.status === 'paused'),
    completed: sites.filter(s => s.status === 'completed'),
  }

  const SiteRow = ({ site }: { site: Site }) => (
    <div className="flex items-center gap-2 py-3">
      <Link
        href={`/sites/${site.id}`}
        className="flex items-center gap-3 flex-1 min-w-0 hover:bg-gray-50 rounded-xl px-2 -mx-2 py-1 transition-colors"
      >
        <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <MapPin size={18} className="text-orange-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900">{site.name}</p>
          {site.address && <p className="text-xs text-gray-500 truncate">{site.address}</p>}
        </div>
        <StatusBadge type="site" status={site.status} />
        <ChevronRight size={16} className="text-gray-400 flex-shrink-0" />
      </Link>

      {/* 編集・削除ボタン */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={() => openEdit(site)}
          className="p-2 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
          title="編集"
        >
          <Pencil size={16} />
        </button>
        <button
          onClick={() => handleDelete(site)}
          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          title="削除"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  )

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-gray-900">現場管理</h1>
        <button onClick={() => setShowAddModal(true)} className="btn-primary flex items-center gap-2 py-2">
          <Plus size={18} />
          <span className="hidden sm:inline">現場を追加</span>
        </button>
      </div>

      {loading ? (
        <p className="text-gray-400 text-center py-8">読み込み中...</p>
      ) : sites.length === 0 ? (
        <div className="card text-center py-12">
          <MapPin size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">現場がまだ登録されていません</p>
          <button onClick={() => setShowAddModal(true)} className="mt-4 btn-primary py-2 px-4">最初の現場を追加</button>
        </div>
      ) : (
        <>
          {grouped.active.length > 0 && (
            <div className="card">
              <h2 className="font-bold text-gray-700 mb-2">稼働中（{grouped.active.length}件）</h2>
              <div className="divide-y divide-gray-100">
                {grouped.active.map(s => <SiteRow key={s.id} site={s} />)}
              </div>
            </div>
          )}
          {grouped.paused.length > 0 && (
            <div className="card">
              <h2 className="font-bold text-gray-700 mb-2">中断中（{grouped.paused.length}件）</h2>
              <div className="divide-y divide-gray-100">
                {grouped.paused.map(s => <SiteRow key={s.id} site={s} />)}
              </div>
            </div>
          )}
          {grouped.completed.length > 0 && (
            <div className="card">
              <h2 className="font-bold text-gray-700 mb-2">完了（{grouped.completed.length}件）</h2>
              <div className="divide-y divide-gray-100">
                {grouped.completed.map(s => <SiteRow key={s.id} site={s} />)}
              </div>
            </div>
          )}
        </>
      )}

      {/* 新規追加モーダル */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">現場を追加</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 text-gray-400"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">現場名 <span className="text-red-500">*</span></label>
                <input type="text" value={addForm.name} onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))} className="input-field" placeholder="〇〇邸新築工事" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">住所</label>
                <input type="text" value={addForm.address} onChange={e => setAddForm(f => ({ ...f, address: e.target.value }))} className="input-field" placeholder="長野県原村..." />
              </div>
              <button type="submit" disabled={addSubmitting} className="btn-primary w-full disabled:opacity-50">
                {addSubmitting ? '追加中...' : '追加する'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 編集モーダル */}
      {editSite && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">現場を編集</h3>
              <button onClick={() => setEditSite(null)} className="p-1 text-gray-400"><X size={20} /></button>
            </div>
            <form onSubmit={handleEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">現場名 <span className="text-red-500">*</span></label>
                <input type="text" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} className="input-field" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">住所</label>
                <input type="text" value={editForm.address} onChange={e => setEditForm(f => ({ ...f, address: e.target.value }))} className="input-field" placeholder="長野県原村..." />
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setEditSite(null)} className="btn-secondary flex-1">
                  キャンセル
                </button>
                <button type="submit" disabled={editSubmitting} className="btn-primary flex-1 disabled:opacity-50">
                  {editSubmitting ? '保存中...' : '保存する'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
