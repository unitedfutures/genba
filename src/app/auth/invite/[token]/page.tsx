'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import { HardHat, Eye, EyeOff } from 'lucide-react'
import type { Invitation } from '@/types'

export default function InvitePage() {
  const { token } = useParams<{ token: string }>()
  const router = useRouter()
  const [invitation, setInvitation] = useState<Invitation | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [form, setForm] = useState({ fullName: '', password: '', passwordConfirm: '' })

  useEffect(() => {
    async function fetchInvitation() {
      const supabase = createClient()
      const { data } = await supabase
        .from('invitations')
        .select('*, organization:organizations(*)')
        .eq('token', token)
        .is('accepted_at', null)
        .gt('expires_at', new Date().toISOString())
        .single()

      if (!data) {
        setError('招待リンクが無効または期限切れです')
      } else {
        setInvitation(data)
      }
      setLoading(false)
    }
    fetchInvitation()
  }, [token])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!invitation) return
    if (form.password !== form.passwordConfirm) {
      setError('パスワードが一致しません')
      return
    }
    if (form.password.length < 8) {
      setError('パスワードは8文字以上で入力してください')
      return
    }

    setSubmitting(true)
    setError('')

    const supabase = createClient()

    // Sign up
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: invitation.email,
      password: form.password,
      options: {
        data: {
          full_name: form.fullName,
          organization_id: invitation.organization_id,
          role: invitation.role,
          invitation_token: token,
        },
      },
    })

    if (signUpError || !signUpData.user) {
      setError(signUpError?.message ?? 'アカウント作成に失敗しました')
      setSubmitting(false)
      return
    }

    router.push('/dashboard')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">読み込み中...</div>
      </div>
    )
  }

  if (!invitation && error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center">
          <p className="text-red-600 font-medium">{error}</p>
          <a href="/auth/login" className="mt-4 inline-block text-orange-500 underline">
            ログインページへ
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-500 rounded-2xl mb-4">
            <HardHat className="text-white" size={32} />
          </div>
          <h1 className="text-4xl font-black tracking-widest text-orange-500">GENBA</h1>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-xl">
          <h2 className="text-lg font-bold text-gray-800 mb-1">アカウント作成</h2>
          <p className="text-sm text-gray-500 mb-6">
            {invitation?.organization?.name} への招待
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">メールアドレス</label>
              <input
                type="email"
                value={invitation?.email ?? ''}
                disabled
                className="input-field bg-gray-100 text-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">氏名 <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={form.fullName}
                onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
                className="input-field"
                placeholder="田中 太郎"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">パスワード <span className="text-red-500">*</span></label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className="input-field pr-12"
                  placeholder="8文字以上"
                  required
                />
                <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPw ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">パスワード（確認）<span className="text-red-500">*</span></label>
              <input
                type={showPw ? 'text' : 'password'}
                value={form.passwordConfirm}
                onChange={e => setForm(f => ({ ...f, passwordConfirm: e.target.value }))}
                className="input-field"
                placeholder="もう一度入力"
                required
              />
            </div>

            {error && <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>}

            <button type="submit" disabled={submitting} className="btn-primary w-full disabled:opacity-50">
              {submitting ? '作成中...' : 'アカウントを作成'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
