'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { HardHat, CheckCircle } from 'lucide-react'

const TYPES = ['プラン・料金について', '機能・操作について', '不具合報告', '開発要望', '業務提携', 'メディア掲載', 'その他']

export default function ContactPage() {
  const [form, setForm] = useState({
    company: '', name: '', email: '', phone: '', type: '', message: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || '送信に失敗しました。もう一度お試しください。')
      } else {
        setDone(true)
      }
    } catch {
      setError('通信エラーが発生しました。もう一度お試しください。')
    }
    setSubmitting(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gray-900 border-b border-white/10">
        <div className="max-w-4xl mx-auto px-5 h-14 flex items-center">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo/GENBA_logo_horizontal_large_dark.png" alt="GENBA" width={100} height={36} className="object-contain" />
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-5 py-12">
        <h1 className="text-2xl font-black text-gray-900 mb-2">お問い合わせ</h1>
        <p className="text-sm text-gray-500 mb-8">
          通常2〜3営業日以内にご返信いたします。
        </p>

        {done ? (
          /* 送信完了 */
          <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
            <CheckCircle size={52} className="text-green-500 mx-auto mb-4" />
            <p className="text-xl font-black text-gray-900 mb-2">送信が完了しました</p>
            <p className="text-sm text-gray-500 mb-6">
              お問い合わせありがとうございます。<br />
              内容を確認のうえ、ご返信いたします。
            </p>
            <Link href="/" className="inline-block px-6 py-2.5 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition-colors text-sm">
              トップページへ戻る
            </Link>
          </div>
        ) : (
          /* フォーム */
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 space-y-5">
            {/* 会社名 */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                会社名・屋号 <span className="text-gray-400 font-normal text-xs">任意</span>
              </label>
              <input
                type="text"
                value={form.company}
                onChange={set('company')}
                placeholder="株式会社〇〇"
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>

            {/* お名前 */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                お名前 <span className="text-red-500 text-xs">必須</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={set('name')}
                placeholder="山田 太郎"
                required
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>

            {/* メールアドレス */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                メールアドレス <span className="text-red-500 text-xs">必須</span>
              </label>
              <input
                type="email"
                value={form.email}
                onChange={set('email')}
                placeholder="example@company.com"
                required
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>

            {/* 電話番号 */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                電話番号 <span className="text-gray-400 font-normal text-xs">任意</span>
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={set('phone')}
                placeholder="03-0000-0000"
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>

            {/* お問い合わせ種別 */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                お問い合わせ種別 <span className="text-red-500 text-xs">必須</span>
              </label>
              <select
                value={form.type}
                onChange={set('type')}
                required
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
              >
                <option value="">選択してください</option>
                {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            {/* お問い合わせ内容 */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                お問い合わせ内容 <span className="text-red-500 text-xs">必須</span>
              </label>
              <textarea
                value={form.message}
                onChange={set('message')}
                required
                rows={6}
                placeholder="お問い合わせ内容をご記入ください"
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>
            )}

            <p className="text-xs text-gray-400">
              送信いただいた情報は、お問い合わせへの返答にのみ使用いたします。
            </p>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-black rounded-xl transition-colors disabled:opacity-50 text-sm"
            >
              {submitting ? '送信中...' : '送信する'}
            </button>
          </form>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 mt-16 py-6 px-5">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-5 h-5 bg-orange-500 rounded-md flex items-center justify-center">
              <HardHat size={10} className="text-white" />
            </div>
            <span className="font-black text-white tracking-widest text-sm">GENBA</span>
          </Link>
          <div className="flex items-center gap-5 text-xs text-gray-500">
            <Link href="/privacy" className="hover:text-gray-300 transition-colors">プライバシーポリシー</Link>
            <Link href="/tokusho" className="hover:text-gray-300 transition-colors">特定商取引法に基づく表記</Link>
            <Link href="/" className="hover:text-gray-300 transition-colors">← トップページへ戻る</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
