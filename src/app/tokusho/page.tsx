import Link from 'next/link'
import { HardHat } from 'lucide-react'

const rows = [
  { label: '販売事業者',     value: '株式会社ユナイテッドフューチャーズ' },
  { label: '運営責任者',     value: '小林 佑輔' },
  { label: '所在地',         value: '東京都小金井市貫井南町3-22-27-703' },
  { label: '電話番号',       value: 'お問い合わせはメールにてお受けしております。ご請求があれば遅滞なく開示いたします。' },
  { label: 'メールアドレス', value: 'support@united-futures.com' },
  { label: 'サービス名',     value: 'GENBA（現場タスク・進捗管理）' },
  { label: 'サービスURL',    value: 'https://genba.works' },
  {
    label: '販売価格',
    value: '無料プラン：¥0／月\nTEAMプラン：¥980／名／月（税込）\n※料金の詳細はサービスサイトのプランページをご確認ください。',
  },
  { label: '支払方法',       value: 'クレジットカード決済（対応準備中）' },
  { label: '支払時期',       value: '月次自動更新（申込翌月以降、毎月同日に課金）' },
  { label: 'サービス提供時期', value: 'お申込み完了後、即時ご利用いただけます。' },
  {
    label: '解約・返金について',
    value: 'マイページより月次単位でいつでも解約できます。解約月の日割り返金はいたしかねます。',
  },
  {
    label: '動作環境',
    value: 'Google Chrome・Safari・Firefox・Microsoft Edge 各最新版\nスマートフォン：iOS 16以降 / Android 10以降\nインターネット接続環境が必要です。',
  },
]

export default function TokushoPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gray-900 border-b border-white/10">
        <div className="max-w-4xl mx-auto px-5 h-14 flex items-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-orange-500 rounded-lg flex items-center justify-center">
              <HardHat size={14} className="text-white" />
            </div>
            <span className="font-black text-white tracking-widest">GENBA</span>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-5 py-12">
        <h1 className="text-2xl font-black text-gray-900 mb-2">特定商取引法に基づく表記</h1>
        <p className="text-sm text-gray-400 mb-8">
          特定商取引に関する法律第11条に基づき、以下のとおり表示します。
        </p>

        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          {rows.map(({ label, value }, i) => (
            <div
              key={label}
              className={`flex flex-col sm:flex-row ${i !== rows.length - 1 ? 'border-b border-gray-100' : ''}`}
            >
              <div className="sm:w-48 flex-shrink-0 px-5 py-4 bg-gray-50 sm:border-r border-gray-100">
                <span className="text-sm font-bold text-gray-600">{label}</span>
              </div>
              <div className="flex-1 px-5 py-4">
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{value}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-gray-400 mt-8 text-center">
          内容は予告なく変更される場合があります。最新の情報はこのページをご確認ください。
        </p>
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
            <Link href="/" className="hover:text-gray-300 transition-colors">← トップページへ戻る</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
