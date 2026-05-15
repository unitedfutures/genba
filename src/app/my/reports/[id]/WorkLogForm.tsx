'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Camera, Send, MessageSquare, Clock, MapPin } from 'lucide-react'
import StatusBadge from '@/components/ui/StatusBadge'
import Link from 'next/link'
import UpgradeButton from '@/components/ui/UpgradeButton'
import type { Profile } from '@/types'
import { useRouter } from 'next/navigation'

interface Props {
  log: any
  profile: Profile
  sites: { id: string; name: string }[]
  plan: string
}

export default function WorkLogForm({ log, profile, sites, plan }: Props) {
  const router = useRouter()
  const [description, setDescription] = useState(log.work_description ?? '')
  const [workerComment, setWorkerComment] = useState(log.worker_comment ?? '')
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [photos, setPhotos] = useState<any[]>(log.photos ?? [])
  const [uploadError, setUploadError] = useState('')
  const [commentError, setCommentError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [comments, setComments] = useState<any[]>(log.comments ?? [])
  const [newComment, setNewComment] = useState('')
  const [postingComment, setPostingComment] = useState(false)
  const beforeInputRef = useRef<HTMLInputElement>(null)
  const afterInputRef = useRef<HTMLInputElement>(null)

  async function handleSave(status?: 'draft' | 'submitted') {
    const isSub = status === 'submitted'
    isSub ? setSubmitting(true) : setSaving(true)
    setSaveError('')

    const supabase = createClient()
    const { error } = await supabase.from('work_logs').update({
      work_description: description || null,
      worker_comment: workerComment || null,
      status: status ?? log.status,
    }).eq('id', log.id)

    if (error) {
      setSaveError(isSub ? '提出に失敗しました。もう一度お試しください。' : '保存に失敗しました。もう一度お試しください。')
    } else if (isSub) {
      router.push('/my/reports')
    }
    isSub ? setSubmitting(false) : setSaving(false)
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>, photoType: 'before' | 'after') {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const ext = file.name.split('.').pop()
    const path = `${profile.organization_id}/${log.id}/${photoType}-${Date.now()}.${ext}`

    setUploadError('')
    const { error: upErr } = await supabase.storage.from('work-photos').upload(path, file)
    if (upErr) {
      setUploadError('写真のアップロードに失敗しました。ファイルサイズや形式を確認してください。')
      setUploading(false)
      return
    }

    const { data: photoData } = await supabase.from('photos').insert({
      work_log_id: log.id,
      organization_id: profile.organization_id,
      uploaded_by: user.id,
      storage_path: path,
      photo_type: photoType,
    }).select('*').single()

    if (photoData) {
      const { data: urlData } = await supabase.storage.from('work-photos').createSignedUrl(path, 3600)
      setPhotos(prev => [...prev, { ...photoData, url: urlData?.signedUrl }])
    }
    setUploading(false)
    e.target.value = ''
  }

  async function handleDeletePhoto(photoId: string, storagePath: string) {
    if (!confirm('この写真を削除しますか？')) return
    const supabase = createClient()
    await Promise.all([
      supabase.from('photos').delete().eq('id', photoId),
      supabase.storage.from('work-photos').remove([storagePath]),
    ])
    setPhotos(prev => prev.filter(p => p.id !== photoId))
  }

  async function postComment(e: React.FormEvent) {
    e.preventDefault()
    if (!newComment.trim()) return
    setPostingComment(true)
    const supabase = createClient()
    setCommentError('')
    const { data, error: cErr } = await supabase.from('comments').insert({
      work_log_id: log.id,
      author_id: profile.id,
      content: newComment.trim(),
    }).select('*, author:profiles(full_name, role)').single()
    if (data) {
      setComments(prev => [...prev, data])
      setNewComment('')
    } else if (cErr) {
      setCommentError('コメントの送信に失敗しました。')
    }
    setPostingComment(false)
  }

  const formatTime = (ts: string | null) =>
    ts ? new Date(ts).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }) : '--:--'

  const beforePhotos = photos.filter(p => p.photo_type === 'before')
  const afterPhotos = photos.filter(p => p.photo_type === 'after')

  return (
    <div className="max-w-lg space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/my/reports" className="p-2 rounded-xl hover:bg-gray-200 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <h1 className="text-lg font-black text-gray-900">
            {new Date(log.work_date + 'T00:00:00').toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', weekday: 'short' })}
          </h1>
          <p className="text-sm text-gray-500">{log.site?.name ?? ''}</p>
        </div>
        <StatusBadge type="worklog" status={log.status} />
      </div>

      {/* Clock info */}
      <div className="card">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-green-50 rounded-xl p-3">
            <p className="text-xs text-green-600 font-medium mb-1">開始</p>
            <p className="text-xl font-black text-green-700">{formatTime(log.clock_in_at)}</p>
            {log.clock_in_address && (
              <p className="text-xs text-green-600 mt-1 flex items-center gap-1 truncate">
                <MapPin size={10} />{log.clock_in_address}
              </p>
            )}
          </div>
          <div className="bg-red-50 rounded-xl p-3">
            <p className="text-xs text-red-600 font-medium mb-1">終了</p>
            <p className="text-xl font-black text-red-700">{formatTime(log.clock_out_at)}</p>
            {log.clock_out_address && (
              <p className="text-xs text-red-600 mt-1 flex items-center gap-1 truncate">
                <MapPin size={10} />{log.clock_out_address}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Work description */}
      <div className="card space-y-3">
        <h2 className="font-bold text-gray-900">作業内容</h2>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          className="input-field resize-none"
          rows={4}
          placeholder="本日の作業内容を入力してください..."
        />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">コメント・メモ</label>
          <textarea
            value={workerComment}
            onChange={e => setWorkerComment(e.target.value)}
            className="input-field resize-none"
            rows={2}
            placeholder="気になった点、管理者へのメモなど..."
          />
        </div>
        <button
          onClick={() => handleSave()}
          disabled={saving}
          className="btn-secondary w-full py-2.5 text-sm"
        >
          {saving ? '保存中...' : '下書き保存'}
        </button>
        {saveError && <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-3">{saveError}</p>}
      </div>

      {/* Before photos */}
      <div className="card">
        <h2 className="font-bold text-gray-900 mb-3">作業前写真</h2>
        {uploadError && <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-3">{uploadError}</p>}
        {beforePhotos.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mb-3">
            {beforePhotos.map(photo => (
              <div key={photo.id} className="relative aspect-square">
                <img src={photo.url} alt="作業前" className="w-full h-full object-cover rounded-xl" />
                <button
                  onClick={() => handleDeletePhoto(photo.id, photo.storage_path)}
                  className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center"
                >×</button>
              </div>
            ))}
          </div>
        )}
        {plan === 'free' ? (
          <UpgradeButton
            label="写真添付はTEAMプランで利用できます"
            className="w-full border-2 border-dashed border-gray-200 rounded-xl py-4 flex items-center justify-center gap-2 bg-gray-50 text-gray-400 text-sm disabled:opacity-60"
          />
        ) : (
          <>
            <input
              ref={beforeInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={e => handlePhotoUpload(e, 'before')}
            />
            <button
              onClick={() => beforeInputRef.current?.click()}
              disabled={uploading}
              className="w-full border-2 border-dashed border-gray-300 rounded-xl py-4 text-gray-500 hover:border-orange-400 hover:text-orange-500 transition-colors flex items-center justify-center gap-2"
            >
              <Camera size={20} />
              {uploading ? 'アップロード中...' : '写真を追加'}
            </button>
          </>
        )}
      </div>

      {/* After photos */}
      <div className="card">
        <h2 className="font-bold text-gray-900 mb-3">作業後写真</h2>
        {afterPhotos.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mb-3">
            {afterPhotos.map(photo => (
              <div key={photo.id} className="relative aspect-square">
                <img src={photo.url} alt="作業後" className="w-full h-full object-cover rounded-xl" />
                <button
                  onClick={() => handleDeletePhoto(photo.id, photo.storage_path)}
                  className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center"
                >×</button>
              </div>
            ))}
          </div>
        )}
        {plan === 'free' ? (
          <UpgradeButton
            label="写真添付はTEAMプランで利用できます"
            className="w-full border-2 border-dashed border-gray-200 rounded-xl py-4 flex items-center justify-center gap-2 bg-gray-50 text-gray-400 text-sm disabled:opacity-60"
          />
        ) : (
          <>
            <input
              ref={afterInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={e => handlePhotoUpload(e, 'after')}
            />
            <button
              onClick={() => afterInputRef.current?.click()}
              disabled={uploading}
              className="w-full border-2 border-dashed border-gray-300 rounded-xl py-4 text-gray-500 hover:border-orange-400 hover:text-orange-500 transition-colors flex items-center justify-center gap-2"
            >
              <Camera size={20} />
              {uploading ? 'アップロード中...' : '写真を追加'}
            </button>
          </>
        )}
      </div>

      {/* Comments */}
      <div className="card">
        <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
          <MessageSquare size={16} className="text-orange-500" />
          コメント
        </h2>
        <div className="space-y-3 mb-4">
          {comments.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-2">コメントがありません</p>
          ) : (
            comments.map((c: any) => (
              <div key={c.id} className={`flex gap-2 ${c.author_id === profile.id ? 'flex-row-reverse' : ''}`}>
                <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 text-xs font-bold text-gray-600">
                  {c.author?.full_name?.[0]}
                </div>
                <div className={`max-w-xs flex flex-col ${c.author_id === profile.id ? 'items-end' : 'items-start'}`}>
                  <span className="text-xs text-gray-500 mb-0.5">{c.author?.full_name}</span>
                  <div className={`px-3 py-2 rounded-2xl text-sm ${
                    c.author_id === profile.id
                      ? 'bg-orange-500 text-white rounded-tr-sm'
                      : 'bg-gray-100 text-gray-800 rounded-tl-sm'
                  }`}>{c.content}</div>
                </div>
              </div>
            ))
          )}
        </div>
        {commentError && <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-2">{commentError}</p>}
        <form onSubmit={postComment} className="flex gap-2">
          <input
            type="text"
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            placeholder="コメントを入力..."
          />
          <button type="submit" disabled={postingComment || !newComment.trim()} className="bg-orange-500 text-white px-4 py-2.5 rounded-xl disabled:opacity-40">
            <Send size={18} />
          </button>
        </form>
      </div>

      {/* Submit */}
      {log.status !== 'submitted' && (
        <button
          onClick={() => handleSave('submitted')}
          disabled={submitting}
          className="btn-primary w-full py-4 text-lg flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Send size={20} />
          {submitting ? '提出中...' : '日報を提出する'}
        </button>
      )}
    </div>
  )
}
