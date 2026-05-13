'use client'

import { useState } from 'react'
import { Lock, Loader2 } from 'lucide-react'

interface Props {
  className?: string
  label?: string
}

export default function UpgradeButton({ className, label = 'アップグレード' }: Props) {
  const [loading, setLoading] = useState(false)

  async function handleUpgrade() {
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/checkout', { method: 'POST' })
      const { url, error } = await res.json()
      if (url) {
        window.location.href = url
      } else {
        alert(error || '決済ページへの遷移に失敗しました')
        setLoading(false)
      }
    } catch {
      alert('エラーが発生しました。しばらくしてから再試行してください。')
      setLoading(false)
    }
  }

  return (
    <button onClick={handleUpgrade} disabled={loading} className={className}>
      {loading
        ? <Loader2 size={15} className="animate-spin" />
        : <Lock size={15} />
      }
      {loading ? '処理中...' : label}
    </button>
  )
}
