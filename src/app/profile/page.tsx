'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { UserCircle, Save, LogOut } from 'lucide-react'
import { signOut } from '@/lib/supabase/actions'

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null)
  const [form, setForm] = useState({ full_name: '', phone: '' })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('profiles')
        .select('*, organization:organizations(name)')
        .eq('id', user.id)
        .single()
      if (data) {
        setProfile(data)
        setForm({ full_name: data.full_name ?? '', phone: data.phone ?? '' })
      }
    }
    load()
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('profiles').update({
      full_name: form.full_name,
      phone: form.phone || null,
    }).eq('id', user.id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const roleLabel = profile?.role === 'admin' ? '管理者' : '作業者'

  return (
    <div className="max-w-sm space-y-6">
      <h1 className="text-2xl font-black text-gray-900">プロフィール</h1>

      {/* Avatar */}
      <div className="card text-center py-8">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="w-20 h-20 rounded-full object-cover" />
          ) : (
            <UserCircle size={48} className="text-gray-400" />
          )}
        </div>
        <p className="font-bold text-gray-900 text-lg">{profile?.full_name}</p>
        <p className="text-sm text-gray-500">{roleLabel}</p>
        <p className="text-xs text-gray-400 mt-1">{profile?.organization?.name}</p>
      </div>

      {/* Edit form */}
      <div className="card">
        <h2 className="font-bold text-gray-700 mb-4">プロフィール編集</h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">氏名</label>
            <input
              type="text"
              value={form.full_name}
              onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
              className="input-field"
              placeholder="田中 太郎"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">電話番号</label>
            <input
              type="tel"
              value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              className="input-field"
              placeholder="090-0000-0000"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors ${
              saved
                ? 'bg-green-500 text-white'
                : 'btn-primary'
            }`}
          >
            <Save size={18} />
            {saved ? '保存しました！' : saving ? '保存中...' : '保存する'}
          </button>
        </form>
      </div>

      {/* Sign out */}
      <form action={signOut}>
        <button
          type="submit"
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-gray-200 text-gray-600 hover:bg-gray-50 font-medium transition-colors"
        >
          <LogOut size={18} />
          ログアウト
        </button>
      </form>
    </div>
  )
}
