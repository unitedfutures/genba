'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MapPin, Clock, CheckCircle, AlertCircle, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'

type ClockState = 'not_started' | 'working' | 'finished'

export default function ClockPage() {
  const router = useRouter()
  const [state, setState] = useState<ClockState>('not_started')
  const [todayLog, setTodayLog] = useState<any>(null)      // 現在進行中 or 最後に完了したログ
  const [todayLogs, setTodayLogs] = useState<any[]>([])    // 今日の全ログ（履歴表示用）
  const [sites, setSites] = useState<{ id: string; name: string }[]>([])
  const [selectedSite, setSelectedSite] = useState('')
  const [loading, setLoading] = useState(true)
  const [tapping, setTapping] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [locationStatus, setLocationStatus] = useState<'idle' | 'getting' | 'got' | 'error'>('idle')
  const [location, setLocation] = useState<{ lat: number; lng: number; address: string } | null>(null)
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // JST（ローカル時刻）で日付を取得。toISOString() は UTC になるため使わない
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: p } = await supabase.from('profiles').select('*, organization:organizations(name)').eq('id', user.id).single()
    setProfile(p)

    const [{ data: logs }, { data: siteList }] = await Promise.all([
      supabase.from('work_logs')
        .select('*, site:sites(name)')
        .eq('worker_id', user.id)
        .eq('work_date', today)
        .order('created_at', { ascending: false }),
      supabase.from('sites')
        .select('id, name')
        .eq('organization_id', p.organization_id)
        .eq('status', 'active'),
    ])

    setSites(siteList ?? [])
    setTodayLogs(logs ?? [])

    const latest = logs?.[0] ?? null
    if (latest) {
      setTodayLog(latest)
      setState(latest.clock_out_at ? 'finished' : 'working')
      if (latest.site_id) setSelectedSite(latest.site_id)
    } else {
      setState('not_started')
    }
    setLoading(false)
  }, [today])

  useEffect(() => { load() }, [load])

  async function getLocation(): Promise<{ lat: number; lng: number; address: string } | null> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) { resolve(null); return }
      setLocationStatus('getting')
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude: lat, longitude: lng } = pos.coords
          let address = `${lat.toFixed(5)}, ${lng.toFixed(5)}`
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=ja`)
            const data = await res.json()
            address = data.display_name?.split(',').slice(0, 3).join(' ') ?? address
          } catch {}
          const loc = { lat, lng, address }
          setLocation(loc)
          setLocationStatus('got')
          resolve(loc)
        },
        () => { setLocationStatus('error'); resolve(null) },
        { timeout: 10000, maximumAge: 60000 }
      )
    })
  }

  async function handleClockIn() {
    if (!selectedSite) return
    setTapping(true)
    setLocationStatus('idle')
    setLocation(null)

    const loc = await getLocation()
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase.from('work_logs').insert({
      organization_id: profile.organization_id,
      worker_id: user.id,
      site_id: selectedSite,
      work_date: today,
      clock_in_at: new Date().toISOString(),
      clock_in_lat: loc?.lat ?? null,
      clock_in_lng: loc?.lng ?? null,
      clock_in_address: loc?.address ?? null,
      status: 'draft',
    }).select('*, site:sites(name)').single()

    if (data) {
      setTodayLog(data)
      setTodayLogs(prev => [data, ...prev])
      setState('working')
    }
    setTapping(false)
  }

  async function handleClockOut() {
    if (!todayLog) return
    setTapping(true)

    const loc = await getLocation()
    const supabase = createClient()

    const { data: updated } = await supabase.from('work_logs').update({
      clock_out_at: new Date().toISOString(),
      clock_out_lat: loc?.lat ?? null,
      clock_out_lng: loc?.lng ?? null,
      clock_out_address: loc?.address ?? null,
    }).eq('id', todayLog.id).select('*, site:sites(name)').single()

    if (updated) {
      setTodayLog(updated)
      setTodayLogs(prev => prev.map(l => l.id === updated.id ? updated : l))
    }
    setState('finished')
    setTapping(false)
    router.push(`/my/reports/${todayLog.id}`)
  }

  // 次のシフトを開始する（DBは触らず画面をリセット）
  function handleNewShift() {
    setState('not_started')
    setTodayLog(null)
    setSelectedSite('')
    setLocationStatus('idle')
    setLocation(null)
  }

  const formatTime = (ts: string | null) =>
    ts ? new Date(ts).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }) : '--:--'

  const nowTime = now.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
  const nowDate = now.toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', weekday: 'long' })

  // 今日の完了済みシフト（履歴表示用）
  const completedLogs = todayLogs.filter(l => l.clock_out_at)

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-gray-400">読み込み中...</div>
  }

  return (
    <div className="max-w-sm mx-auto space-y-6">
      <h1 className="text-2xl font-black text-gray-900">打刻</h1>

      {/* 現在時刻 */}
      <div className="card text-center py-6">
        <div className="flex items-center justify-center gap-2 text-gray-500 mb-1">
          <Clock size={16} />
          <span className="text-sm">{nowDate}</span>
        </div>
        <p className="text-5xl font-black text-gray-900">{nowTime}</p>
      </div>

      {/* 今日の完了済みシフト履歴（1件以上あれば常に表示） */}
      {completedLogs.length > 0 && state !== 'working' && (
        <div className="card space-y-2">
          <p className="text-sm font-bold text-gray-500">今日の記録</p>
          {completedLogs.map((log: any) => (
            <div key={log.id} className="flex items-center justify-between text-sm">
              <span className="text-gray-700 font-medium">{log.site?.name}</span>
              <span className="text-gray-500">
                {formatTime(log.clock_in_at)} 〜 {formatTime(log.clock_out_at)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* 未開始 / 次のシフト開始 */}
      {state === 'not_started' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">現場を選択</label>
            <select
              value={selectedSite}
              onChange={e => setSelectedSite(e.target.value)}
              className="input-field"
            >
              <option value="">-- 現場を選択 --</option>
              {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          {locationStatus === 'getting' && (
            <p className="text-sm text-blue-600 flex items-center gap-1">
              <MapPin size={14} className="animate-pulse" />位置情報を取得中...
            </p>
          )}
          {locationStatus === 'got' && location && (
            <p className="text-sm text-green-600 flex items-center gap-1">
              <MapPin size={14} />位置情報を取得しました
            </p>
          )}
          {locationStatus === 'error' && (
            <p className="text-sm text-orange-500 flex items-center gap-1">
              <AlertCircle size={14} />位置情報が取得できませんでした（打刻は可能です）
            </p>
          )}

          <button
            onClick={handleClockIn}
            disabled={tapping || !selectedSite}
            className="w-full py-6 bg-green-500 hover:bg-green-600 active:bg-green-700 text-white font-black text-2xl rounded-2xl shadow-lg disabled:opacity-50 transition-colors"
          >
            {tapping ? '記録中...' : '▶ 作業開始'}
          </button>
        </div>
      )}

      {/* 作業中 */}
      {state === 'working' && todayLog && (
        <div className="space-y-4">
          <div className="card bg-blue-50 border-blue-100">
            <p className="text-blue-700 font-bold mb-1">作業中</p>
            <p className="text-2xl font-black text-blue-800">{formatTime(todayLog.clock_in_at)} 〜</p>
            <p className="text-sm text-blue-600 mt-1">{todayLog.site?.name}</p>
            {todayLog.clock_in_address && (
              <p className="text-xs text-blue-500 mt-1 flex items-center gap-1">
                <MapPin size={10} />{todayLog.clock_in_address}
              </p>
            )}
          </div>

          <button
            onClick={handleClockOut}
            disabled={tapping}
            className="w-full py-6 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white font-black text-2xl rounded-2xl shadow-lg disabled:opacity-50 transition-colors"
          >
            {tapping ? '記録中...' : '■ 作業終了'}
          </button>
        </div>
      )}

      {/* 完了後：日報リンク + 次のシフトボタン */}
      {state === 'finished' && todayLog && (
        <div className="space-y-3">
          <div className="card text-center py-6">
            <CheckCircle size={48} className="text-green-500 mx-auto mb-3" />
            <p className="font-black text-xl text-gray-900">お疲れ様でした！</p>
            <p className="text-gray-500 mt-1">
              {formatTime(todayLog.clock_in_at)} 〜 {formatTime(todayLog.clock_out_at)}
            </p>
            <p className="text-sm text-gray-400 mt-0.5">{todayLog.site?.name}</p>
          </div>
          <a
            href={`/my/reports/${todayLog.id}`}
            className="btn-primary w-full block text-center"
          >
            日報を入力する →
          </a>
          <button
            onClick={handleNewShift}
            className="w-full py-3 border-2 border-gray-300 hover:border-green-400 hover:text-green-600 text-gray-600 font-bold rounded-2xl transition-colors flex items-center justify-center gap-2"
          >
            <Plus size={18} />
            別の現場で作業開始
          </button>
        </div>
      )}
    </div>
  )
}
