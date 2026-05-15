'use client'

import { useState } from 'react'
import { Lock, Loader2, AlertCircle } from 'lucide-react'

interface Props {
  className?: string
  label?: string
}

export default function UpgradeButton({ className, label = 'アップグレード' }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleUpgrade() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/stripe/checkout', { method: 'POST' })
      const { url, error: apiError } = await res.json()
      if (url) {
        window.location.href = url
      } else {
        setError(apiError || '決済ページへの遷移に失敗しました')
        setLoading(false)
      }
    } catch {
      setError('通信エラーが発生しました。しばらくしてから再試行してください。')
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <button onClick={handleUpgrade} disabled={loading} className={className}>
        {loading ? <Loader2 size={15} className="animate-spin" /> : <Lock size={15} />}
        {loading ? '処理中...' : label}
      </button>
      {error && (
        <p className="flex items-center gap-1.5 text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">
          <AlertCircle size={13} className="shrink-0" />{error}
        </p>
      )}
    </div>
  )
}
