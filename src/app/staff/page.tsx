'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { UserPlus, Mail, Shield, HardHat, Trash2, X } from 'lucide-react'
import type { Profile, Invitation } from '@/types'

export default function StaffPage() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ email: '', role: 'worker' as 'admin' | 'worker' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [myOrgId, setMyOrgId] = useState('')

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (!profile) return
    setMyOrgId(profile.organization_id)

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

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const token = crypto.randomUUID()
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

    const { error: insertError } = await supabase.from('invitations').insert({
      organization_id: myOrgId,
      email: form.email,
      role: form.role,
      token,
      invited_by: user.id,
      expires_at: expires,
    })

    if (insertError) {
      setError('招待の作成に失敗しました: ' + insertError.message)
    } else {
      const inviteUrl = `${window.location.origin}/auth/invite/${token}`
      await navigator.clipboard.writeText(inviteUrl).catch(() => {})
      alert(`招待リンクを作成しました。\n\n${inviteUrl}\n\nクリップボードにコピーしました。`)
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

  const roleLabel = (role: string) => role === 'admin' ? '管理者' : '作業者'
  const roleIcon = (role: string) => role === 'admin'
    ? <Shield size={14} className="text-orange-500" />
    : <HardHat size={14} className="text-blue-500" />

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-gray-900">スタッフ管理</h1>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2 py-2">
          <UserPlus size={18} />
          <span className="hidden sm:inline">招待する</span>
        </button>
      </div>

      {/* Staff list */}
      <div className="card">
        <h2 className="font-bold text-gray-700 mb-4">メンバー（{profiles.length}名）</h2>
        {loading ? (
          <p className="text-gray-400 text-sm py-4 text-center">読み込み中...</p>
        ) : profiles.length === 0 ? (
          <p className="text-gray-400 text-sm py-4 text-center">スタッフがいません</p>
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
                <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-full">
                  {roleIcon(p.role)}
                  <span className="text-xs font-medium text-gray-700">{roleLabel(p.role)}</span>
                </div>
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
