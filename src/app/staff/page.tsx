'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { UserPlus, Mail, Shield, HardHat, Trash2, X, Lock, Users } from 'lucide-react'
import Link from 'next/link'
import UpgradeButton from '@/components/ui/UpgradeButton'
import type { Profile, Invitation } from '@/types'

export default function StaffPage() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ email: '', role: 'worker' as 'admin' | 'worker' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [inviteUrl, setInviteUrl] = useState('')
  const [myOrgId, setMyOrgId] = useState('')
  const [myUserId, setMyUserId] = useState('')
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState('')
  const [emailSent, setEmailSent] = useState(false)
  const [plan, setPlan] = useState<string>('free')

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setMyUserId(user.id)

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id, organization:organizations(plan)')
      .eq('id', user.id)
      .single()

    if (!profile) return
    setMyOrgId(profile.organization_id)
    setPlan((profile.organization as any)?.plan ?? 'free')

    const [{ data: staffList }, { data: inviteList }] = await Promise.all([
      supabase.from('profiles').select('*').eq('organization_id', profile.organization_id).order('created_at'),
      supabase.from('invitations').select('*').eq('organization_id', profile.organization_id).is('accepted_at', null).gt('expires_at', new Date().toISOString()),
    ])

    setProfiles(staffList ?? [])
    setInvitations(inviteList ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    const res = await fetch('/api/invitations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: form.email, role: form.role }),
    })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? '招待の作成に失敗しました。もう一度お試しください。')
    } else {
      await navigator.clipboard.writeText(data.inviteUrl).catch(() => {})
      setInviteUrl(data.inviteUrl)
      setEmailSent(data.emailSent ?? false)
      setShowModal(false)
      setForm({ email: '', role: 'worker' })
      load()
    }
    setSubmitting(false)
  }

  async function handleDeleteInvite(id: string) {
    if (!confirm('この招待を削除しますか？')) return
    const supabase = createClient()
    await supabase.from('invitations').delete().eq('id', id)
    load()
  }

  async function handleDeleteStaff(profileId: string, name: string) {
    if (!confirm(`「${name}」を削除しますか？\nこの操作は元に戻せません。`)) return
    setDeletingId(profileId)
    setDeleteError('')
    const res = await fetch(`/api/staff/${profileId}`, { method: 'DELETE' })
    if (res.ok) {
      load()
    } else {
      const { error } = await res.json()
      setDeleteError(error || 'スタッフの削除に失敗しました。もう一度お試しください。')
    }
    setDeletingId(null)
  }

  async function handleRoleToggle(profileId: string, currentRole: string) {
    const newRole = currentRole === 'admin' ? 'worker' : 'admin'
    const label = newRole === 'admin' ? '管理者' : '作業者'
    if (!confirm(`権限を「${label}」に変更しますか？`)) return
    setTogglingId(profileId)
    const supabase = createClient()
    await supabase.from('profiles').update({ role: newRole }).eq('id', profileId)
    setProfiles(prev => prev.map(p => p.id === profileId ? { ...p, role: newRole as 'admin' | 'worker' } : p))
    setTogglingId(null)
  }

  const roleLabel = (role: string) => role === 'admin' ? '管理者' : '作業者'
  const roleIcon = (role: string) => role === 'admin'
    ? <Shield size={14} className="text-orange-500" />
    : <HardHat size={14} className="text-blue-500" />

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-gray-900">スタッフ管理</h1>
        {plan === 'free' ? (
          <UpgradeButton className="flex items-center gap-2 py-2 px-4 bg-orange-50 border border-orange-300 text-orange-600 font-bold rounded-xl text-sm hover:bg-orange-100 transition-colors disabled:opacity-60" />
        ) : (
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2 py-2">
            <UserPlus size={18} />
            <span className="hidden sm:inline">招待する</span>
          </button>
        )}
      </div>

      {deleteError && (
        <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-3">{deleteError}</p>
      )}

      {inviteUrl && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
          <p className="font-bold text-green-800 text-sm mb-1">
            {emailSent ? '招待メールを送信しました' : '招待リンクを作成しました（クリップボードにコピー済み）'}
          </p>
          {emailSent && <p className="text-green-700 text-xs mb-2">招待URLはクリップボードにもコピーされています。</p>}
          <p className="text-xs text-green-700 break-all font-mono">{inviteUrl}</p>
          <button onClick={() => setInviteUrl('')} className="mt-2 text-xs text-green-600 underline">閉じる</button>
        </div>
      )}

      {plan === 'free' && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 flex items-center gap-3">
          <Lock size={18} className="text-orange-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-bold text-orange-800 text-sm">スタッフ招待はTEAMプランで利用できます</p>
            <p className="text-orange-700 text-xs mt-0.5">¥980/名/月〜。チームで使い始めると打刻・日報・タスク管理がより効果的になります。</p>
          </div>
          <Link href="/profile" className="flex-shrink-0 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-colors">
            プランを見る
          </Link>
        </div>
      )}

      {/* Staff list */}
      <div className="card">
        <h2 className="font-bold text-gray-700 mb-4">メンバー（{profiles.length}名）</h2>
        {loading ? (
          <p className="text-gray-400 text-sm py-4 text-center">読み込み中...</p>
        ) : profiles.length === 0 ? (
          <div className="text-center py-10">
            <Users size={36} className="text-gray-300 mx-auto mb-3" />
            <p className="font-bold text-gray-700 mb-1">スタッフがまだいません</p>
            <p className="text-sm text-gray-400 mb-4">招待リンクを発行して作業者を追加しましょう</p>
            <button onClick={() => setShowModal(true)} className="btn-primary py-2 px-6 inline-flex items-center gap-2">
              <UserPlus size={16} /> スタッフを招待する
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {profiles.map(p => (
              <div key={p.id} className="flex items-center gap-3 py-3">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                  {p.avatar_url ? (
                    <img src={p.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <span className="font-bold text-gray-600">{p.full_name?.[0]}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900">{p.full_name}</p>
                  <p className="text-xs text-gray-500">{p.phone}</p>
                </div>
                {p.id === myUserId ? (
                  <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-full">
                    {roleIcon(p.role)}
                    <span className="text-xs font-medium text-gray-700">{roleLabel(p.role)}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleRoleToggle(p.id, p.role)}
                      disabled={togglingId === p.id || deletingId === p.id}
                      title="クリックして権限を変更"
                      className="flex items-center gap-1 bg-gray-100 hover:bg-orange-50 hover:border-orange-300 border border-transparent px-2 py-1 rounded-full transition-colors disabled:opacity-50"
                    >
                      {roleIcon(p.role)}
                      <span className="text-xs font-medium text-gray-700">{togglingId === p.id ? '...' : roleLabel(p.role)}</span>
                    </button>
                    <button
                      onClick={() => handleDeleteStaff(p.id, p.full_name)}
                      disabled={deletingId === p.id}
                      title="スタッフを削除"
                      className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {deletingId === p.id ? <span className="text-xs text-gray-400">削除中...</span> : <Trash2 size={15} />}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pending invitations */}
      {invitations.length > 0 && (
        <div className="card">
          <h2 className="font-bold text-gray-700 mb-4">招待中（{invitations.length}件）</h2>
          <div className="divide-y divide-gray-100">
            {invitations.map(inv => (
              <div key={inv.id} className="flex items-center gap-3 py-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Mail size={18} className="text-yellow-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm">{inv.email}</p>
                  <p className="text-xs text-gray-500">
                    {roleLabel(inv.role)} · {new Date(inv.expires_at).toLocaleDateString('ja-JP')}まで
                  </p>
                </div>
                <button onClick={() => handleDeleteInvite(inv.id)} className="p-2 text-gray-400 hover:text-red-500">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invite modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-gray-900">スタッフを招待</h3>
              <button onClick={() => setShowModal(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">メールアドレス</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="input-field"
                  placeholder="staff@example.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">権限</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['worker', 'admin'] as const).map(r => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, role: r }))}
                      className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-colors ${
                        form.role === r
                          ? 'border-orange-500 bg-orange-50 text-orange-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {r === 'admin' ? <Shield size={16} /> : <HardHat size={16} />}
                      <span className="text-sm font-medium">{roleLabel(r)}</span>
                    </button>
                  ))}
                </div>
              </div>
              {error && <p className="text-red-600 text-sm">{error}</p>}
              <button type="submit" disabled={submitting} className="btn-primary w-full disabled:opacity-50">
                {submitting ? '作成中...' : '招待リンクを作成'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
