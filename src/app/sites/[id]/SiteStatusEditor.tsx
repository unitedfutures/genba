'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { SiteStatus } from '@/types'

const options: { value: SiteStatus; label: string }[] = [
  { value: 'active',    label: '稼働中' },
  { value: 'paused',    label: '中断' },
  { value: 'completed', label: '完了' },
]

export default function SiteStatusEditor({
  siteId,
  currentStatus,
}: {
  siteId: string
  currentStatus: SiteStatus
}) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setSaving(true)
    const supabase = createClient()
    await supabase.from('sites').update({ status: e.target.value }).eq('id', siteId)
    setSaving(false)
    router.refresh()
  }

  return (
    <select
      defaultValue={currentStatus}
      onChange={handleChange}
      disabled={saving}
      className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-orange-400 flex-shrink-0"
    >
      {options.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  )
}
