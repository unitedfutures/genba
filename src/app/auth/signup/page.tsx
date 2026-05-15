'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Building2, User, Mail, Lock } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

export default function SignupPage() {
  const router = useRouter()
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    companyName: '',
    fullName: '',
    email: '',
    password: '',
    passwordConfirm: '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (form.password !== form.passwordConfirm) {
      setError('パスワードが一致しません')
      return
    }
    if (form.password.length < 8) {
      setError('パスワードは8文字以上で入力してください')
      return
    }

    setLoading(true)

    // アカウント作成API呼び出し
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companyName: form.companyName,
        fullName: form.fullName,
        email: form.email,
        password: form.password,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'アカウント作成に失敗しました')
      setLoading(false)
      return
    }

    // 作成したアカウントでログイン
    const supabase = createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    })

    if (signInError) {
      setError('アカウントは作成しましたがログインに失敗しました。ログインページからお試しください。')
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  const field = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(f => ({ ...f, [key]: e.target.value })),
  })

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <Image src="/logo/GENBA_logo_horizontal_large_dark.png" alt="GENBA" width={200} height={72} className="mx-auto object-contain" />
          <p className="text-gray-400 mt-2 text-sm">現場タスク・進捗管理</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-xl">
          <h2 className="text-lg font-bold text-gray-800 mb-1">新規アカウント作成</h2>
          <p className="text-sm text-gray-500 mb-6">管理者アカウントと会社を登録します</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 会社名 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                会社名 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Building2 size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  {...field('companyName')}
                  className="input-field pl-10"
                  placeholder="株式会社〇〇建設"
                  required
                />
              </div>
            </div>

            {/* 氏名 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                氏名 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  {...field('fullName')}
                  className="input-field pl-10"
                  placeholder="田中 太郎"
                  required
                />
              </div>
            </div>

            {/* メールアドレス */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                メールアドレス <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  {...field('email')}
                  className="input-field pl-10"
                  placeholder="example@company.com"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {/* パスワード */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                パスワード <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPw ? 'text' : 'password'}
                  {...field('password')}
                  className="input-field pl-10 pr-12"
                  placeholder="8文字以上"
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* パスワード確認 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                パスワード（確認） <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPw ? 'text' : 'password'}
                  {...field('passwordConfirm')}
                  className="input-field pl-10"
                  placeholder="もう一度入力"
                  required
                  autoComplete="new-password"
                />
              </div>
            </div>

            {error && (
              <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'アカウント作成中...' : 'アカウントを作成'}
            </button>
          </form>
        </div>

        <p className="text-center text-gray-400 text-sm mt-6">
          すでにアカウントをお持ちの方は
          <Link href="/auth/login" className="text-orange-400 font-medium ml-1">
            ログイン
          </Link>
        </p>
      </div>
    </div>
  )
}
