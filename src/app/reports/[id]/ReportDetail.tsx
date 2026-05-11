'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Clock, MapPin, MessageSquare, Send, ArrowLeft } from 'lucide-react'
import StatusBadge from '@/components/ui/StatusBadge'
import Link from 'next/link'
import type { Profile } from '@/types'
import { useRouter } from 'next/navigation'

interface Props {
  log: any
  currentProfile: Profile
}

export default function ReportDetail({ log, currentProfile }: Props) {
  const router = useRouter()
  const [newComment, setNewComment] = useState('')
  const [posting, setPosting] = useState(false)
  const [comments, setComments] = useState<any[]>(log.comments ?? [])

  const beforePhotos = (log.photos ?? []).filter((p: any) => p.photo_type === 'before')
  const afterPhotos = (log.photos ?? []).filter((p: any) => p.photo_type === 'after')

  async function postComment(e: React.FormEvent) {
    e.preventDefault()
    if (!newComment.trim()) return
    setPosting(true)

    const supabase = createClient()
    const { data } = await supabase.from('comments').insert({
      work_log_id: log.id,
      author_id: currentProfile.id,
      content: newComment.trim(),
    }).select('*, author:profiles(full_name, role)').single()

    if (data) {
      setComments(prev => [...prev, data])
      setNewComment('')
    }
    setPosting(false)
  }

  const formatTime = (ts: string | null) =>
    ts ? new Date(ts).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }) : '--:--'

  const workDuration = () => {
    if (!log.clock_in_at || !log.clock_out_at) return null
    const diff = new Date(log.clock_out_at).getTime() - new Date(log.clock_in_at).getTime()
    const h = Math.floor(diff / 3600000)
    const m = Math.floor((diff % 3600000) / 60000)
    return `${h}時間${m}分`
  }

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/reports" className="p-2 rounded-xl hover:bg-gray-200 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-xl font-black text-gray-900">
            {new Date(log.work_date + 'T00:00:00').toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', weekday: 'short' })}の日報
          </h1>
          <p className="text-sm text-gray-500">{log.worker?.full_name} · {log.site?.name}</p>
        </div>
        <div className="ml-auto">
          <StatusBadge type="worklog" status={log.status} />
        </div>
      </div>

      {/* Clock info */}
      <div className="card">
        <h2 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
          <Clock size={16} className="text-orange-500" />
          打刻情報
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-green-50 rounded-xl p-3">
            <p className="text-xs text-green-600 font-medium mb-1">作業開始</p>
            <p className="text-2xl font-black text-green-700">{formatTime(log.clock_in_at)}</p>
            {log.clock_in_address && (
              <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                <MapPin size={10} />{log.clock_in_address}
              </p>
            )}
          </div>
          <div className="bg-red-50 rounded-xl p-3">
            <p className="text-xs text-red-600 font-medium mb-1">作業終了</p>
            <p className="text-2xl font-black text-red-700">{formatTime(log.clock_out_at)}</p>
            {log.clock_out_address && (
              <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                <MapPin size={10} />{log.clock_out_address}
              </p>
            )}
          </div>
        </div>
        {workDuration() && (
          <p className="text-center text-sm text-gray-500 mt-3">作業時間: <span className="font-bold text-gray-800">{workDuration()}</span></p>
        )}
      </div>

      {/* Work description */}
      {(log.work_description || log.worker_comment) && (
        <div className="card">
          <h2 className="font-bold text-gray-700 mb-3">作業内容</h2>
          {log.work_description && (
            <p className="text-gray-800 whitespace-pre-wrap">{log.work_description}</p>
          )}
          {log.worker_comment && (
            <div className="mt-3 bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-500 mb-1">コメント</p>
              <p className="text-gray-700 whitespace-pre-wrap">{log.worker_comment}</p>
            </div>
          )}
        </div>
      )}

      {/* Photos before */}
      {beforePhotos.length > 0 && (
        <div className="card">
          <h2 className="font-bold text-gray-700 mb-3">作業前写真</h2>
          <div className="grid grid-cols-2 gap-2">
            {beforePhotos.map((photo: any) => (
              <a key={photo.id} href={photo.url} target="_blank" rel="noopener noreferrer">
                <img src={photo.url} alt="作業前" className="w-full aspect-square object-cover rounded-xl" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Photos after */}
      {afterPhotos.length > 0 && (
        <div className="card">
          <h2 className="font-bold text-gray-700 mb-3">作業後写真</h2>
          <div className="grid grid-cols-2 gap-2">
            {afterPhotos.map((photo: any) => (
              <a key={photo.id} href={photo.url} target="_blank" rel="noopener noreferrer">
                <img src={photo.url} alt="作業後" className="w-full aspect-square object-cover rounded-xl" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Comments */}
      <div className="card">
        <h2 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
          <MessageSquare size={16} className="text-orange-500" />
          コメント（{comments.length}件）
        </h2>
        <div className="space-y-3 mb-4">
          {comments.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-3">コメントがありません</p>
          ) : (
            comments.map((c: any) => (
              <div key={c.id} className={`flex gap-2 ${c.author_id === currentProfile.id ? 'flex-row-reverse' : ''}`}>
                <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 text-xs font-bold text-gray-600">
                  {c.author?.full_name?.[0]}
                </div>
                <div className={`max-w-xs ${c.author_id === currentProfile.id ? 'items-end' : 'items-start'} flex flex-col`}>
                  <span className="text-xs text-gray-500 mb-1">{c.author?.full_name}</span>
                  <div className={`px-3 py-2 rounded-2xl text-sm ${
                    c.author_id === currentProfile.id
                      ? 'bg-orange-500 text-white rounded-tr-sm'
                      : 'bg-gray-100 text-gray-800 rounded-tl-sm'
                  }`}>
                    {c.content}
                  </div>
                  <span className="text-xs text-gray-400 mt-1">
                    {new Date(c.created_at).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
        <form onSubmit={postComment} className="flex gap-2">
          <input
            type="text"
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            placeholder="コメントを入力..."
          />
          <button
            type="submit"
            disabled={posting || !newComment.trim()}
            className="bg-orange-500 text-white px-4 py-2.5 rounded-xl disabled:opacity-40 hover:bg-orange-600 transition-colors"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  )
}
