import Link from 'next/link'
import Image from 'next/image'
import { getCurrentProfile } from '@/lib/supabase/actions'
import {
  HardHat, CheckCircle2, Clock, ClipboardList, MapPin, Users,
  FileText, Download, ArrowRight, Smartphone, Shield, BarChart3,
  Camera, MessageSquare, ChevronRight, Star, X,
} from 'lucide-react'

// ─────────────────────────────────────────────────────
// App UI Mockup Components
// ─────────────────────────────────────────────────────

function BrowserFrame({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl overflow-hidden shadow-2xl border border-gray-200 bg-white ${className}`}>
      <div className="bg-gray-100 px-4 py-2.5 flex items-center gap-2 border-b border-gray-200">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-400" />
          <div className="w-3 h-3 rounded-full bg-yellow-400" />
          <div className="w-3 h-3 rounded-full bg-green-400" />
        </div>
        <div className="flex-1 mx-4 bg-white rounded-md h-5 text-[10px] text-gray-400 flex items-center px-2">
          genba.app/dashboard
        </div>
      </div>
      {children}
    </div>
  )
}

function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative mx-auto w-[240px]">
      <div className="rounded-[2.5rem] border-[6px] border-gray-800 bg-white overflow-hidden shadow-2xl">
        <div className="bg-gray-800 h-6 flex items-center justify-center">
          <div className="w-16 h-1.5 bg-gray-600 rounded-full" />
        </div>
        {children}
      </div>
    </div>
  )
}

function DashboardMockup() {
  return (
    <BrowserFrame>
      <div className="flex h-[340px] text-[11px]">
        {/* Sidebar */}
        <div className="w-[120px] bg-gray-900 flex flex-col py-3 gap-0.5 flex-shrink-0">
          <div className="px-3 mb-2">
            <Image src="/logo/GENBA_logo_horizontal_large_dark.png" alt="GENBA" width={90} height={32} className="object-contain" />
          </div>
          {[
            { icon: BarChart3, label: 'ダッシュボード', active: true },
            { icon: MapPin, label: '現場管理' },
            { icon: ClipboardList, label: 'タスク管理' },
            { icon: FileText, label: '日報管理' },
            { icon: Users, label: 'スタッフ' },
          ].map(({ icon: Icon, label, active }) => (
            <div key={label} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg mx-1.5 ${active ? 'bg-orange-500 text-white' : 'text-gray-400'}`}>
              <Icon size={11} />
              <span className="text-[9px]">{label}</span>
            </div>
          ))}
        </div>
        {/* Main */}
        <div className="flex-1 bg-gray-50 p-3 overflow-hidden">
          <div className="text-gray-500 text-[9px] mb-2">2026年5月13日（水）</div>
          <div className="font-bold text-gray-800 text-sm mb-3">ダッシュボード</div>
          {/* Stats */}
          <div className="grid grid-cols-4 gap-1.5 mb-3">
            {[
              { label: 'スタッフ', val: '8', color: 'bg-blue-500' },
              { label: '稼働現場', val: '4', color: 'bg-green-500' },
              { label: '作業中', val: '12', color: 'bg-orange-500' },
              { label: '本日の日報', val: '6', color: 'bg-purple-500' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-xl p-2 shadow-sm">
                <div className={`w-5 h-5 ${s.color} rounded-lg flex items-center justify-center mb-1`}>
                  <div className="w-2 h-2 bg-white/60 rounded-sm" />
                </div>
                <div className="font-black text-gray-800 text-sm leading-none">{s.val}</div>
                <div className="text-[8px] text-gray-400 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
          {/* Today logs */}
          <div className="bg-white rounded-xl p-2 shadow-sm">
            <div className="font-bold text-gray-700 text-[9px] mb-1.5">本日の打刻・日報</div>
            {[
              { name: '田中 太郎', site: '○○新築工事', in: true, out: true },
              { name: '佐藤 花子', site: '△△リノベ', in: true, out: false },
              { name: '山田 健一', site: '□□外構工事', in: true, out: true },
            ].map(l => (
              <div key={l.name} className="flex items-center gap-1.5 py-1 border-t border-gray-50 first:border-0">
                <div className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center">
                  <span className="text-[8px] font-bold text-gray-500">{l.name[0]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-700 text-[8px]">{l.name}</div>
                  <div className="text-[7px] text-gray-400 truncate">{l.site}</div>
                </div>
                <div className="flex gap-0.5">
                  <span className={`text-[7px] px-1 py-0.5 rounded-full font-medium ${l.in ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>開始</span>
                  <span className={`text-[7px] px-1 py-0.5 rounded-full font-medium ${l.out ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-400'}`}>終了</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </BrowserFrame>
  )
}

function TaskMockup() {
  const tasks = [
    { title: '基礎コンクリート打設', site: '○○新築工事', priority: '高', priorityCls: 'bg-red-100 text-red-700', status: '進行中', statusCls: 'bg-blue-100 text-blue-700', due: '5/15', assignee: '田中' },
    { title: '型枠解体・撤去作業', site: '○○新築工事', priority: '中', priorityCls: 'bg-yellow-100 text-yellow-700', status: '進行中', statusCls: 'bg-blue-100 text-blue-700', due: '5/20', assignee: '佐藤' },
    { title: 'サッシ取付け', site: '△△リノベ', priority: '中', priorityCls: 'bg-yellow-100 text-yellow-700', status: '未着手', statusCls: 'bg-gray-100 text-gray-500', due: '5/25', assignee: '山田' },
    { title: '外構フェンス設置', site: '□□外構工事', priority: '低', priorityCls: 'bg-gray-100 text-gray-500', status: '未着手', statusCls: 'bg-gray-100 text-gray-500', due: '6/1', assignee: '未定' },
  ]
  return (
    <BrowserFrame>
      <div className="flex h-[320px] text-[11px]">
        <div className="w-[120px] bg-gray-900 flex flex-col py-3 gap-0.5 flex-shrink-0">
          <div className="px-3 mb-2">
            <Image src="/logo/GENBA_logo_horizontal_large_dark.png" alt="GENBA" width={90} height={32} className="object-contain" />
          </div>
          {[
            { icon: BarChart3, label: 'ダッシュボード' },
            { icon: MapPin, label: '現場管理' },
            { icon: ClipboardList, label: 'タスク管理', active: true },
            { icon: FileText, label: '日報管理' },
            { icon: Users, label: 'スタッフ' },
          ].map(({ icon: Icon, label, active }) => (
            <div key={label} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg mx-1.5 ${active ? 'bg-orange-500 text-white' : 'text-gray-400'}`}>
              <Icon size={11} />
              <span className="text-[9px]">{label}</span>
            </div>
          ))}
        </div>
        <div className="flex-1 bg-gray-50 p-3 overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <div className="font-bold text-gray-800 text-sm">タスク管理</div>
            <div className="bg-orange-500 text-white text-[9px] px-2 py-1 rounded-lg font-bold">＋ タスク追加</div>
          </div>
          <div className="flex gap-1.5 mb-2">
            {['すべて', 'ステータス ▼', '優先度 ▼', '現場 ▼'].map(f => (
              <div key={f} className="text-[8px] px-1.5 py-0.5 bg-white border border-gray-200 rounded-lg text-gray-600">{f}</div>
            ))}
          </div>
          <div className="space-y-1.5">
            {tasks.map(t => (
              <div key={t.title} className="bg-white rounded-xl p-2 shadow-sm flex items-start gap-1.5">
                <div className="flex flex-col gap-0.5 flex-shrink-0 mt-0.5">
                  <span className={`text-[7px] px-1 py-0.5 rounded-md font-bold ${t.priorityCls}`}>{t.priority}</span>
                  <span className={`text-[7px] px-1 py-0.5 rounded-md font-bold ${t.statusCls}`}>{t.status}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-800 text-[9px] leading-tight">{t.title}</div>
                  <div className="text-[7px] text-gray-400 mt-0.5">{t.site} · 担当: {t.assignee}</div>
                </div>
                <div className="text-[7px] text-gray-400 flex-shrink-0">期限 {t.due}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </BrowserFrame>
  )
}

function ClockMockup() {
  return (
    <PhoneFrame>
      <div className="bg-gray-900 px-3 py-2 flex items-center justify-between">
        <Image src="/logo/GENBA_logo_horizontal_large_dark.png" alt="GENBA" width={64} height={23} className="object-contain" />
        <div className="w-5 h-5 bg-gray-600 rounded-full" />
      </div>
      <div className="bg-gray-50 p-3">
        <div className="bg-white rounded-2xl p-3 mb-2 shadow-sm text-center">
          <div className="text-[9px] text-gray-400 mb-1">現在地</div>
          <div className="text-[10px] font-medium text-gray-700 mb-2">東京都港区○○町1-2-3</div>
          <div className="bg-gray-100 rounded-xl h-16 flex items-center justify-center mb-3">
            <div className="text-[8px] text-gray-400">📍 地図</div>
          </div>
          <div className="bg-orange-500 text-white rounded-xl py-2.5 font-bold text-xs text-center shadow-lg">
            ▶ 作業開始（打刻）
          </div>
        </div>
        <div className="bg-white rounded-2xl p-3 shadow-sm">
          <div className="font-bold text-gray-700 text-[10px] mb-2">今日の状況</div>
          <div className="flex justify-between text-[9px] text-gray-600 mb-1">
            <span>現場</span><span className="font-medium">○○新築工事</span>
          </div>
          <div className="flex justify-between text-[9px] text-gray-600 mb-1">
            <span>開始打刻</span><span className="font-medium text-green-600">08:32 ✓</span>
          </div>
          <div className="flex justify-between text-[9px] text-gray-600">
            <span>終了打刻</span><span className="text-gray-400">—</span>
          </div>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-1.5">
          <div className="bg-white rounded-xl p-2 shadow-sm text-center">
            <FileText size={12} className="text-orange-400 mx-auto mb-1" />
            <div className="text-[8px] text-gray-600 font-medium">日報を書く</div>
          </div>
          <div className="bg-white rounded-xl p-2 shadow-sm text-center">
            <Camera size={12} className="text-orange-400 mx-auto mb-1" />
            <div className="text-[8px] text-gray-600 font-medium">写真を追加</div>
          </div>
        </div>
      </div>
    </PhoneFrame>
  )
}

function ReportsMockup() {
  return (
    <BrowserFrame>
      <div className="flex h-[300px] text-[11px]">
        <div className="w-[120px] bg-gray-900 flex flex-col py-3 gap-0.5 flex-shrink-0">
          <div className="px-3 mb-2">
            <Image src="/logo/GENBA_logo_horizontal_large_dark.png" alt="GENBA" width={90} height={32} className="object-contain" />
          </div>
          {[
            { icon: BarChart3, label: 'ダッシュボード' },
            { icon: MapPin, label: '現場管理' },
            { icon: ClipboardList, label: 'タスク管理' },
            { icon: FileText, label: '日報管理', active: true },
            { icon: Users, label: 'スタッフ' },
          ].map(({ icon: Icon, label, active }) => (
            <div key={label} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg mx-1.5 ${active ? 'bg-orange-500 text-white' : 'text-gray-400'}`}>
              <Icon size={11} />
              <span className="text-[9px]">{label}</span>
            </div>
          ))}
        </div>
        <div className="flex-1 bg-gray-50 p-3 overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="font-bold text-gray-800 text-sm">日報管理</div>
            <div className="flex gap-1.5">
              <div className="text-[8px] px-2 py-1 bg-white border border-gray-200 rounded-lg">2026年5月 ▼</div>
              <div className="text-[8px] px-2 py-1 bg-white border border-gray-200 rounded-lg">全スタッフ ▼</div>
              <div className="text-[8px] px-2 py-1 bg-orange-500 text-white rounded-lg font-bold flex items-center gap-0.5">
                <Download size={8} /> 出力
              </div>
            </div>
          </div>
          {/* Export modal preview */}
          <div className="bg-white rounded-xl shadow-lg p-3 mb-2 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <div className="font-bold text-gray-700 text-[9px] flex items-center gap-1"><Download size={9} className="text-orange-500" /> 日報出力</div>
            </div>
            <div className="flex rounded-lg overflow-hidden border border-gray-200 mb-2">
              <div className="flex-1 py-1 text-center text-[8px] font-bold bg-orange-500 text-white">📄 PDF</div>
              <div className="flex-1 py-1 text-center text-[8px] text-gray-500 bg-white">📊 CSV</div>
            </div>
            <div className="flex gap-1.5 mb-2">
              <div className="flex-1 bg-gray-50 rounded-lg px-2 py-1 text-[8px] text-gray-600">田中 太郎 ▼</div>
              <div className="flex-1 bg-gray-50 rounded-lg px-2 py-1 text-[8px] text-gray-600">2026年5月 ▼</div>
            </div>
            <div className="bg-orange-500 text-white rounded-lg py-1.5 text-center text-[8px] font-bold">🖨️ 印刷・PDF保存</div>
          </div>
          <div className="space-y-1">
            {[
              { date: '5月13日（火）', name: '田中 太郎', site: '○○新築工事', status: '提出済', st: '08:32', en: '17:45' },
              { date: '5月13日（火）', name: '佐藤 花子', site: '△△リノベ', status: '下書き', st: '09:00', en: '' },
            ].map(r => (
              <div key={r.name} className="bg-white rounded-xl p-2 flex items-center gap-2 shadow-sm">
                <div className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-[7px] font-bold text-gray-500">{r.name[0]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-[8px] text-gray-800">{r.name}</div>
                  <div className="text-[7px] text-gray-400 truncate">{r.site}</div>
                </div>
                <div className="text-[7px] text-right flex-shrink-0">
                  <span className={`px-1 py-0.5 rounded-full ${r.status === '提出済' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{r.status}</span>
                  <div className="text-gray-400 mt-0.5">{r.st}{r.en ? `〜${r.en}` : '〜'}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </BrowserFrame>
  )
}

function StaffMockup() {
  return (
    <BrowserFrame>
      <div className="flex h-[280px] text-[11px]">
        <div className="w-[120px] bg-gray-900 flex flex-col py-3 gap-0.5 flex-shrink-0">
          <div className="px-3 mb-2">
            <Image src="/logo/GENBA_logo_horizontal_large_dark.png" alt="GENBA" width={90} height={32} className="object-contain" />
          </div>
          {[
            { icon: BarChart3, label: 'ダッシュボード' },
            { icon: MapPin, label: '現場管理' },
            { icon: ClipboardList, label: 'タスク管理' },
            { icon: FileText, label: '日報管理' },
            { icon: Users, label: 'スタッフ', active: true },
          ].map(({ icon: Icon, label, active }) => (
            <div key={label} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg mx-1.5 ${active ? 'bg-orange-500 text-white' : 'text-gray-400'}`}>
              <Icon size={11} />
              <span className="text-[9px]">{label}</span>
            </div>
          ))}
        </div>
        <div className="flex-1 bg-gray-50 p-3 overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="font-bold text-gray-800 text-sm">スタッフ管理</div>
            <div className="bg-orange-500 text-white text-[9px] px-2 py-1 rounded-lg font-bold">✉ 招待する</div>
          </div>
          <div className="space-y-1.5">
            {[
              { name: '田中 太郎', email: 'tanaka@example.com', role: '管理者', roleCls: 'bg-orange-100 text-orange-700' },
              { name: '佐藤 花子', email: 'sato@example.com', role: '作業者', roleCls: 'bg-blue-100 text-blue-700' },
              { name: '山田 健一', email: 'yamada@example.com', role: '作業者', roleCls: 'bg-blue-100 text-blue-700' },
              { name: '鈴木 一郎', email: 'suzuki@example.com', role: '作業者', roleCls: 'bg-blue-100 text-blue-700' },
            ].map(s => (
              <div key={s.name} className="bg-white rounded-xl p-2 flex items-center gap-2 shadow-sm">
                <div className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-[10px] font-bold text-gray-500">{s.name[0]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-[9px] text-gray-800">{s.name}</div>
                  <div className="text-[7px] text-gray-400 truncate">{s.email}</div>
                </div>
                <span className={`text-[7px] px-1.5 py-0.5 rounded-full font-bold ${s.roleCls}`}>{s.role}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </BrowserFrame>
  )
}

// ─────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────

export default async function LandingPage() {
  const profile = await getCurrentProfile()
  const isLoggedIn = !!profile

  return (
    <div className="min-h-screen bg-white font-sans">

      {/* ── Navigation ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-900/95 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-6xl mx-auto px-5 h-14 flex items-center justify-between">
          <div className="flex items-center">
            <Image src="/logo/GENBA_logo_horizontal_large_dark.png" alt="GENBA" width={120} height={43} className="object-contain" />
          </div>
          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <Link href="/dashboard" className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors">
                ダッシュボードへ <ArrowRight size={14} />
              </Link>
            ) : (
              <>
                <Link href="/auth/login" className="text-gray-300 hover:text-white text-sm font-medium transition-colors">
                  ログイン
                </Link>
                <Link href="/auth/signup" className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors">
                  無料で始める
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="bg-gray-900 pt-28 pb-20 px-5 overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-orange-500/20 text-orange-400 text-xs font-bold px-3 py-1.5 rounded-full mb-5">
                <HardHat size={12} />
                あらゆる現場の、タスクと進捗を一元管理
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-white leading-tight mb-4">
                現場の「今」を、<br />
                <span className="text-orange-400">瞬時に把握。</span>
              </h1>
              <p className="text-gray-300 text-lg leading-relaxed mb-8">
                施設・店舗・支店・工事などの<br className="hidden sm:block" />
                タスク・打刻・日報・スタッフ管理を集約。<br />
                紙と電話から解放される、<strong className="text-white">現場管理の新標準</strong>。
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/auth/signup" className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-7 py-3.5 rounded-xl text-base transition-colors shadow-lg shadow-orange-500/30">
                  無料で始める <ArrowRight size={16} />
                </Link>
                <Link href="/auth/login" className="flex items-center justify-center gap-2 border border-white/20 text-white hover:bg-white/10 font-medium px-7 py-3.5 rounded-xl text-base transition-colors">
                  ログイン
                </Link>
              </div>
              <p className="text-gray-500 text-xs mt-4">クレジットカード不要・初期費用ゼロ・いつでも解約可</p>
            </div>
            <div className="relative">
              <div className="absolute -inset-4 bg-orange-500/10 rounded-3xl blur-2xl" />
              <div className="relative">
                <DashboardMockup />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pain Points ── */}
      <section className="py-16 px-5 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-black text-gray-900 text-center mb-2">
            こんなお悩みはありませんか？
          </h2>
          <p className="text-gray-500 text-center mb-10 text-sm">現場管理者・経営者が抱える、よくある課題</p>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { icon: MessageSquare, title: '報告が電話・LINEで散らかる', body: '口頭や個人チャットで届く報告は記録に残らず、後で確認できない。情報が担当者の頭の中に埋もれてしまう。' },
              { icon: Clock, title: '誰が今どこにいるかわからない', body: 'スタッフが複数現場を掛け持ちしていると、リアルタイムの所在や作業状況を把握するのが困難になる。' },
              { icon: ClipboardList, title: 'タスクの抜け・漏れが後を絶たない', body: '担当者・期限・優先度が口頭指示だけで共有されるため、「言った・言わない」や進捗確認の電話が増える。' },
              { icon: FileText, title: '月末の勤怠集計に丸1日かかる', body: '手書きの出勤簿や紙の日報を月末にまとめて転記。単純作業に時間を取られ、本業に集中できない。' },
            ].map(({ icon: Icon, title, body }) => (
              <div key={title} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center mb-3">
                  <Icon size={20} className="text-red-400" />
                </div>
                <h3 className="font-bold text-gray-900 mb-1.5">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Solution intro ── */}
      <section className="py-16 px-5 bg-white text-center">
        <div className="max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-orange-50 text-orange-500 text-xs font-bold px-3 py-1.5 rounded-full mb-5">
            <CheckCircle2 size={12} />
            GENBAが解決します
          </div>
          <h2 className="text-3xl font-black text-gray-900 mb-4">
            現場の実務に合わせた、<br />
            <span className="text-orange-500">シンプルな業務管理</span>
          </h2>
          <p className="text-gray-500 leading-relaxed">
            スタッフはスマートフォンひとつで打刻・日報・タスク確認が完結。<br />
            管理者はパソコンからリアルタイムで全体を掌握。<br />
            難しい設定や研修は不要。使い始めた翌日から現場が変わります。
          </p>
        </div>
        {/* Stats strip */}
        <div className="max-w-3xl mx-auto mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { val: '1画面', label: '全体状況を把握', icon: BarChart3 },
            { val: 'GPS記録', label: '位置情報つき打刻', icon: MapPin },
            { val: '写真添付', label: '日報に画像追加', icon: Camera },
            { val: 'PDF/CSV', label: '即時エクスポート', icon: Download },
          ].map(({ val, label, icon: Icon }) => (
            <div key={label} className="bg-gray-50 rounded-2xl p-4 text-center">
              <Icon size={22} className="text-orange-500 mx-auto mb-2" />
              <div className="text-xl font-black text-gray-900">{val}</div>
              <div className="text-xs text-gray-500 mt-1">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Feature 1: Dashboard ── */}
      <section className="py-16 px-5 bg-gray-50">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-1.5 text-orange-500 text-xs font-bold mb-3">
              <BarChart3 size={13} />
              機能 01
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-4">
              全体状況をリアルタイムで<br />一目把握
            </h2>
            <p className="text-gray-600 leading-relaxed mb-6">
              管理者ダッシュボードには、稼働中の現場数・スタッフ数・進行タスク数・本日の日報件数が並びます。
              今日の出退勤状況も一覧表示され、誰が開始済み・終了済みかが瞬時にわかります。
            </p>
            <ul className="space-y-2">
              {[
                '現場・スタッフ・タスク・日報の件数をカード表示',
                '本日の打刻状況（開始・終了）を一覧表示',
                '進行中タスクを期限順で確認',
              ].map(item => (
                <li key={item} className="flex items-start gap-2 text-sm text-gray-700">
                  <CheckCircle2 size={16} className="text-green-500 flex-shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <DashboardMockup />
        </div>
      </section>

      {/* ── Feature 2: Clock & Reports (mobile) ── */}
      <section className="py-16 px-5 bg-white">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div className="order-2 md:order-1 flex justify-center">
            <ClockMockup />
          </div>
          <div className="order-1 md:order-2">
            <div className="inline-flex items-center gap-1.5 text-orange-500 text-xs font-bold mb-3">
              <Smartphone size={13} />
              機能 02
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-4">
              スマホだけで完結する<br />打刻と日報
            </h2>
            <p className="text-gray-600 leading-relaxed mb-6">
              スタッフは専用アプリから作業開始・終了の打刻をワンタップ。
              位置情報（GPS）が自動記録されるので、現場到着の確認も不要になります。
              日報には作業内容・写真・コメントを添付して送信できます。
            </p>
            <ul className="space-y-2">
              {[
                'ワンタップで出退勤打刻・GPS位置情報を自動記録',
                '作業内容・スタッフコメントを日報に記入',
                '施工前後の写真を複数枚添付可能',
                '日報は「下書き保存」→「提出」の2段階で誤送信防止',
              ].map(item => (
                <li key={item} className="flex items-start gap-2 text-sm text-gray-700">
                  <CheckCircle2 size={16} className="text-green-500 flex-shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── Feature 3: Tasks ── */}
      <section className="py-16 px-5 bg-gray-50">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-1.5 text-orange-500 text-xs font-bold mb-3">
              <ClipboardList size={13} />
              機能 03
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-4">
              優先度・期限・担当者つきの<br />タスク管理
            </h2>
            <p className="text-gray-600 leading-relaxed mb-6">
              「高・中・低」の優先度、担当スタッフ、期限日を設定してタスクを管理。
              未着手・進行中・完了のステータスで進捗を可視化。
              自分のタスクだけを絞り込む表示切り替えも可能です。
            </p>
            <ul className="space-y-2">
              {[
                '3段階の優先度（高・中・低）でやるべき作業を明確化',
                '担当者・現場・期限を設定して責任の所在を明確に',
                'ステータス・優先度・期限でソート可能',
                'スタッフは「自分のタスク」に絞って確認',
              ].map(item => (
                <li key={item} className="flex items-start gap-2 text-sm text-gray-700">
                  <CheckCircle2 size={16} className="text-green-500 flex-shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <TaskMockup />
        </div>
      </section>

      {/* ── Feature 4: Staff ── */}
      <section className="py-16 px-5 bg-white">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div className="order-2 md:order-1">
            <StaffMockup />
          </div>
          <div className="order-1 md:order-2">
            <div className="inline-flex items-center gap-1.5 text-orange-500 text-xs font-bold mb-3">
              <Users size={13} />
              機能 04
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-4">
              スタッフ・現場を<br />一元管理
            </h2>
            <p className="text-gray-600 leading-relaxed mb-6">
              スタッフの招待はメールを送るだけ。複数の稼働現場をステータスで管理し、
              現場ごとのタスク一覧も確認できます。管理者と作業者の権限を分けることで、
              スタッフが操作できる範囲を適切にコントロールできます。
            </p>
            <ul className="space-y-2">
              {[
                'メール招待リンクでスタッフを即登録',
                '管理者・作業者の権限切り替えがワンクリック',
                '複数現場を「稼働中・完了・一時停止」で管理',
                '現場ごとのタスク・日報を一覧で確認',
              ].map(item => (
                <li key={item} className="flex items-start gap-2 text-sm text-gray-700">
                  <CheckCircle2 size={16} className="text-green-500 flex-shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── Feature 5: Export ── */}
      <section className="py-16 px-5 bg-gray-50">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-1.5 text-orange-500 text-xs font-bold mb-3">
              <Download size={13} />
              機能 05
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-4">
              PDF・CSVで<br />即時エクスポート
            </h2>
            <p className="text-gray-600 leading-relaxed mb-6">
              月次日報を1クリックでPDF化し、印刷や共有が可能。
              複数スタッフ・複数月のデータをCSVで一括ダウンロードすることもできます。
              給与計算・請求書作成・進捗報告の資料作成が劇的にラクになります。
            </p>
            <ul className="space-y-2">
              {[
                'スタッフ×月で1ページのPDFを印刷・保存',
                '複数スタッフ・複数月をまとめてCSVダウンロード',
                'CSVはExcelで正しく開けるBOM付きUTF-8形式',
                '日付・時刻・作業時間（分）・作業内容・ステータスを収録',
              ].map(item => (
                <li key={item} className="flex items-start gap-2 text-sm text-gray-700">
                  <CheckCircle2 size={16} className="text-green-500 flex-shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <ReportsMockup />
        </div>
      </section>

      {/* ── Security ── */}
      <section className="py-12 px-5 bg-white border-y border-gray-100">
        <div className="max-w-4xl mx-auto grid sm:grid-cols-3 gap-6 text-center">
          {[
            { icon: Shield, title: 'セキュアなクラウド', body: 'Supabase（PostgreSQL）で組織ごとにデータを完全分離。他社データへのアクセスは不可能。' },
            { icon: Smartphone, title: 'マルチデバイス対応', body: 'スマートフォン・タブレット・PCで同じデータをリアルタイムに確認。専用アプリ不要。' },
            { icon: Star, title: 'いつでも無料', body: '基本機能は無料でご利用いただけます。大規模現場向けの有料プランも近日公開予定。' },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="p-6">
              <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Icon size={22} className="text-orange-500" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-16 px-5 bg-gray-50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-black text-gray-900 mb-2">始め方はかんたん3ステップ</h2>
          <p className="text-gray-500 text-sm mb-10">最短5分でチーム全員が使い始められます</p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { step: '01', title: 'アカウント登録', body: 'メールアドレスとパスワードで登録完了。組織名を設定するだけで準備OK。', time: '約2分' },
              { step: '02', title: 'スタッフを招待', body: 'メールアドレスを入力して招待リンクを送信。スタッフはリンクをクリックして参加。', time: '約1分/人' },
              { step: '03', title: '今日から現場管理', body: '現場を登録してタスクを作成。スタッフはスマホから打刻・日報を開始できます。', time: '設定 約5分' },
            ].map(({ step, title, body, time }) => (
              <div key={step} className="bg-white rounded-2xl p-6 shadow-sm text-left relative">
                <div className="text-4xl font-black text-orange-100 absolute top-4 right-4">{step}</div>
                <div className="inline-block bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-lg mb-3">{time}</div>
                <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section className="py-16 px-5 bg-white" id="pricing">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-black text-gray-900 mb-2">シンプルな料金体系</h2>
          <p className="text-gray-500 text-sm mb-10">隠れた費用はありません</p>
          <div className="grid sm:grid-cols-2 gap-5">
            {/* Free */}
            <div className="border-2 border-gray-200 rounded-2xl p-6 text-left">
              <div className="font-bold text-gray-500 text-sm mb-1">FREE</div>
              <div className="text-3xl font-black text-gray-900 mb-1">¥0<span className="text-base font-normal text-gray-400"> / 月</span></div>
              <p className="text-gray-400 text-xs mb-5">クレジットカード不要・管理者1名</p>
              <ul className="space-y-2 mb-6">
                {([
                  ['ダッシュボード', true],
                  ['現場管理（2件まで）', true],
                  ['タスク管理（優先度・期限設定）', true],
                  ['打刻・日報（写真添付）', true],
                  ['スタッフ招待・管理', false],
                  ['PDF・CSVエクスポート', false],
                ] as [string, boolean][]).map(([f, ok]) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    {ok
                      ? <CheckCircle2 size={14} className="text-green-500 flex-shrink-0" />
                      : <X size={14} className="text-gray-300 flex-shrink-0" />
                    }
                    <span className={ok ? 'text-gray-700' : 'text-gray-400'}>{f}</span>
                  </li>
                ))}
              </ul>
              <Link href="/auth/signup" className="block text-center bg-gray-900 hover:bg-gray-800 text-white font-bold py-3 rounded-xl transition-colors">
                無料で始める
              </Link>
            </div>
            {/* Team */}
            <div className="border-2 border-orange-400 rounded-2xl p-6 text-left relative overflow-hidden">
              <div className="absolute top-3 right-3 bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">おすすめ</div>
              <div className="font-bold text-orange-500 text-sm mb-1">TEAM</div>
              <div className="text-3xl font-black text-gray-900 mb-0.5">
                ¥980<span className="text-base font-normal text-gray-400"> / 名 / 月</span>
              </div>
              <p className="text-gray-400 text-xs mb-5">管理者含む人数分 · 最低2名〜</p>
              <ul className="space-y-2 mb-6">
                {[
                  'FREEプランのすべての機能',
                  '現場登録数 無制限',
                  'スタッフ招待・管理',
                  '権限管理（管理者 / 作業者）',
                  'PDF・CSVエクスポート',
                  '優先サポート（予定）',
                ].map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle2 size={14} className="text-orange-500 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/auth/signup" className="block text-center bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition-colors">
                無料で試してみる
              </Link>
              <p className="text-center text-gray-400 text-[11px] mt-2">まずFREEで始めて、チームが増えたらアップグレード</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-20 px-5 bg-gray-900 text-center">
        <div className="max-w-xl mx-auto">
          <div className="w-14 h-14 bg-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <HardHat size={28} className="text-white" />
          </div>
          <h2 className="text-3xl font-black text-white mb-4">
            今日から、現場管理を変えよう。
          </h2>
          <p className="text-gray-400 mb-8">
            初期費用ゼロ。契約期間なし。<br />
            いつでも無料で始められます。
          </p>
          <Link href="/auth/signup" className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-10 py-4 rounded-xl text-base transition-colors shadow-xl shadow-orange-500/30">
            無料アカウントを作成する <ArrowRight size={16} />
          </Link>
          <p className="text-gray-600 text-xs mt-4">クレジットカード不要 · 2分で登録完了</p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-gray-950 py-8 px-5">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-orange-500 rounded-md flex items-center justify-center">
              <HardHat size={12} className="text-white" />
            </div>
            <span className="font-black text-white tracking-widest text-sm">GENBA</span>
            <span className="text-gray-600 text-xs ml-2">現場タスク・進捗管理</span>
          </div>
          <div className="flex items-center gap-5 text-xs text-gray-600">
            <Link href="/auth/login" className="hover:text-gray-400 transition-colors">ログイン</Link>
            <Link href="/auth/signup" className="hover:text-gray-400 transition-colors">新規登録</Link>
            <Link href="/privacy" className="hover:text-gray-400 transition-colors">プライバシーポリシー</Link>
            <Link href="/tokusho" className="hover:text-gray-400 transition-colors">特定商取引法に基づく表記</Link>
            <span>© 2026 GENBA</span>
          </div>
        </div>
      </footer>

    </div>
  )
}
