'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        redirectTo: `${window.location.origin}/auth/reset-password/confirm`,
      }),
    })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error || '送信に失敗しました')
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Image src="/logo/GENBA_logo_horizontal_white.png" alt="GENBA" width={200} height={72} className="mx-auto object-contain" />
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-xl">
          <h2 className="text-lg font-bold text-gray-800 mb-2">パスワードをリセット</h2>

          {sent ? (
            <div className="space-y-4">
              <div className="bg-green-50 rounded-xl p-4 text-center">
                <p className="text-green-700 font-medium text-sm">メールを送信しました</p>
                <p className="text-green-600 text-xs mt-1">
                  {email} にパスワードリセット用のリンクを送信しました。メールをご確認ください。
                </p>
              </div>
              <Link href="/auth/login" className="block text-center text-sm text-orange-500 font-medium">
                ログイン画面に戻る
              </Link>
            </div>
          ) : (
            <>
              <p className="text-gray-500 text-sm mb-5">
                登録済みのメールアドレスを入力してください。パスワードリセット用のリンクをお送りします。
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">メールアドレス</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="input-field"
                    placeholder="example@email.com"
                    required
                    autoComplete="email"
                  />
                </div>
                {error && (
                  <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>
                )}
                <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
                  {loading ? '送信中...' : 'リセットメールを送信'}
                </button>
              </form>
              <div className="mt-4 text-center">
                <Link href="/auth/login" className="text-sm text-gray-500 hover:text-gray-700">
                  ← ログインに戻る
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
