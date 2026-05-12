'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { UserCircle, Save, LogOut, KeyRound, Eye, EyeOff } from 'lucide-react'
import { signOut } from '@/lib/supabase/actions'

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null)
  const [form, setForm] = useState({ full_name: '', phone: '' })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [pwForm, setPwForm] = useState({ password: '', confirm: '' })
  const [showPw, setShowPw] = useState(false)
  const [pwSaving, setPwSaving] = useState(false)
  const [pwError, setPwError] = useState('')
  const [pwSaved, setPwSaved] = useState(false)

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

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault()
    setPwError('')
    if (pwForm.password !== pwForm.confirm) {
      setPwError('パスワードが一致しません')
      return
    }
    if (pwForm.password.length < 8) {
      setPwError('パスワードは8文字以上で入力してください')
      return
    }
    setPwSaving(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: pwForm.password })
    if (error) {
      setPwError('変更に失敗しました: ' + error.message)
    } else {
      setPwSaved(true)
      setPwForm({ password: '', confirm: '' })
      setTimeout(() => setPwSaved(false), 2000)
    }
    setPwSaving(false)
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

      {/* Password change */}
      <div className="card">
        <h2 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
          <KeyRound size={18} className="text-gray-500" />
          パスワード変更
        </h2>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">新しいパスワード <span className="text-red-500">*</span></label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={pwForm.password}
                onChange={e => setPwForm(f => ({ ...f, password: e.target.value }))}
                className="input-field pr-12"
                placeholder="8文字以上"
                required
              />
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showPw ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">確認 <span className="text-red-500">*</span></label>
            <input
              type={showPw ? 'text' : 'password'}
              value={pwForm.confirm}
              onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))}
              className="input-field"
              placeholder="もう一度入力"
              required
            />
          </div>
          {pwError && <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{pwError}</p>}
          <button
            type="submit"
            disabled={pwSaving}
            className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors ${
              pwSaved ? 'bg-green-500 text-white' : 'btn-primary'
            } disabled:opacity-50`}
          >
            <KeyRound size={18} />
            {pwSaved ? '変更しました！' : pwSaving ? '変更中...' : 'パスワードを変更する'}
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
