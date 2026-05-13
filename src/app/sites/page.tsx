'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MapPin, Plus, X, ChevronRight, Pencil, Trash2, ArrowUpDown, ArrowUp, ArrowDown, Lock } from 'lucide-react'
import StatusBadge from '@/components/ui/StatusBadge'
import Link from 'next/link'
import type { Site } from '@/types'

const FREE_SITE_LIMIT = 2

export default function SitesPage() {
  const [sites, setSites] = useState<Site[]>([])
  const [loading, setLoading] = useState(true)
  const [orgId, setOrgId] = useState('')
  const [userId, setUserId] = useState('')
  const [plan, setPlan] = useState<string>('free')

  // 新規追加モーダル
  const [showAddModal, setShowAddModal] = useState(false)
  const [addForm, setAddForm] = useState({ name: '', address: '' })
  const [addSubmitting, setAddSubmitting] = useState(false)

  // 編集モーダル
  const [editSite, setEditSite] = useState<Site | null>(null)
  const [editForm, setEditForm] = useState({ name: '', address: '' })
  const [editSubmitting, setEditSubmitting] = useState(false)

  // 並び替え
  type SortKey = 'created_at' | 'name' | 'status'
  type SortDir = 'asc' | 'desc'
  const [sortKey, setSortKey] = useState<SortKey>('created_at')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id, organization:organizations(plan)')
      .eq('id', user.id)
      .single()
    if (!profile) return
    setOrgId(profile.organization_id)
    setPlan((profile.organization as any)?.plan ?? 'free')

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

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const statusOrder: Record<string, number> = { active: 0, paused: 1, completed: 2 }

  const sorted = [...sites].sort((a, b) => {
    let cmp = 0
    if (sortKey === 'name') {
      cmp = a.name.localeCompare(b.name, 'ja')
    } else if (sortKey === 'status') {
      cmp = (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9)
    } else {
      cmp = a.created_at.localeCompare(b.created_at)
    }
    return sortDir === 'asc' ? cmp : -cmp
  })

  const grouped = {
    active:    sorted.filter(s => s.status === 'active'),
    paused:    sorted.filter(s => s.status === 'paused'),
    completed: sorted.filter(s => s.status === 'completed'),
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

  const atSiteLimit = plan === 'free' && sites.length >= FREE_SITE_LIMIT

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-gray-900">現場管理</h1>
        {atSiteLimit ? (
          <Link href="/#pricing" className="flex items-center gap-2 py-2 px-4 bg-orange-50 border border-orange-300 text-orange-600 font-bold rounded-xl text-sm hover:bg-orange-100 transition-colors">
            <Lock size={15} />
            アップグレード
          </Link>
        ) : (
          <button onClick={() => setShowAddModal(true)} className="btn-primary flex items-center gap-2 py-2">
            <Plus size={18} />
            <span className="hidden sm:inline">現場を追加</span>
          </button>
        )}
      </div>

      {atSiteLimit && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 flex items-center gap-3">
          <Lock size={18} className="text-orange-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-bold text-orange-800 text-sm">現場数の上限に達しています</p>
            <p className="text-orange-700 text-xs mt-0.5">無料プランでは現場を{FREE_SITE_LIMIT}件まで登録できます。3件目以降はTEAMプランへのアップグレードが必要です。</p>
          </div>
          <Link href="/#pricing" className="flex-shrink-0 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-colors">
            プランを見る
          </Link>
        </div>
      )}

      {/* 並び替えバー */}
      {sites.length > 1 && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-400 text-xs font-medium flex items-center gap-1">
            <ArrowUpDown size={13} />並び替え
          </span>
          {([ ['created_at', '登録日'], ['name', '現場名'], ['status', 'ステータス'] ] as [SortKey, string][]).map(([key, label]) => {
            const active = sortKey === key
            return (
              <button
                key={key}
                onClick={() => toggleSort(key)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full border transition-colors ${
                  active
                    ? 'bg-orange-500 text-white border-orange-500'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                }`}
              >
                {label}
                {active && (sortDir === 'asc'
                  ? <ArrowUp size={12} />
                  : <ArrowDown size={12} />
                )}
              </button>
            )
          })}
        </div>
      )}

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
