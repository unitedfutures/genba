import Link from 'next/link'
import Image from 'next/image'

const sections = [
  {
    title: '1. 事業者情報',
    content: `株式会社ユナイテッドフューチャーズ（以下「当社」）は、本サービス「GENBA」（以下「本サービス」）において取得した個人情報を以下の方針に基づき適切に管理します。`,
  },
  {
    title: '2. 取得する情報',
    content: `当社は、本サービスの提供にあたり以下の情報を取得します。

・氏名、電話番号、メールアドレス
・会社名・組織名
・クレジットカード情報（決済代行事業者 Stripe に直接送信され、当社サーバーには保存されません）
・打刻時の位置情報（緯度・経度・住所）
・アップロードされた写真・ファイル
・ブラウザの種類・OSなどの端末情報、アクセスログ`,
  },
  {
    title: '3. 利用目的',
    content: `取得した情報は以下の目的で利用します。

・本サービスの提供・運営・改善
・利用料金の請求・決済処理
・ご本人確認・認証
・サービスに関するお知らせ・サポート対応
・利用状況の分析による機能改善
・法令に基づく対応`,
  },
  {
    title: '4. 第三者への提供',
    content: `当社は、以下の場合を除き、取得した個人情報を第三者に提供しません。

・ご本人の同意がある場合
・法令に基づく開示要請がある場合
・人命・財産の保護のため緊急に必要な場合`,
  },
  {
    title: '5. 業務委託',
    content: `当社は、サービス提供のために以下の事業者に業務を委託する場合があります。委託先には適切な監督を行います。

・Supabase, Inc.（データベース・認証）
・Stripe, Inc.（決済処理）
・Vercel, Inc.（サーバーインフラ）
・Resend, Inc.（メール送信）`,
  },
  {
    title: '6. 安全管理措置',
    content: `取得した個人情報については、不正アクセス・漏洩・改ざん・滅失を防止するため、SSL/TLS による通信暗号化、アクセス権限の管理、定期的なセキュリティ見直しなどの措置を講じています。`,
  },
  {
    title: '7. 保存期間',
    content: `個人情報は、利用目的の達成に必要な期間、または法令で定められた期間を基準として保存し、不要になった情報は速やかに削除します。`,
  },
  {
    title: '8. 開示・訂正・削除のご請求',
    content: `ご本人から個人情報の開示・訂正・削除・利用停止を求められた場合は、合理的な期間内に対応します。下記お問い合わせ先までご連絡ください。`,
  },
  {
    title: '9. Cookieの使用',
    content: `本サービスでは、認証状態の維持のためにCookieを使用します。ブラウザの設定によりCookieを無効にすることができますが、その場合、本サービスの一部機能が利用できなくなる場合があります。`,
  },
  {
    title: '10. プライバシーポリシーの変更',
    content: `当社は、法令の改正やサービス内容の変更に応じて本ポリシーを改定することがあります。重要な変更がある場合は、本サービス上でお知らせします。改定後のポリシーは、掲載した時点から効力を生じます。`,
  },
  {
    title: '11. お問い合わせ',
    content: `個人情報の取り扱いに関するお問い合わせは、以下までご連絡ください。

株式会社ユナイテッドフューチャーズ
東京都小金井市貫井南町3-22-27-703
メール：support@united-futures.com`,
  },
]

export default function PrivacyPage() {
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
      <main className="max-w-3xl mx-auto px-5 py-12">
        <h1 className="text-2xl font-black text-gray-900 mb-2">プライバシーポリシー</h1>
        <p className="text-sm text-gray-400 mb-8">制定日：2026年5月15日</p>

        <div className="space-y-8">
          {sections.map(({ title, content }) => (
            <div key={title} className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="font-bold text-gray-900 mb-3">{title}</h2>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{content}</p>
            </div>
          ))}
        </div>

        <p className="text-xs text-gray-400 mt-8 text-center">
          内容は予告なく変更される場合があります。最新の情報はこのページをご確認ください。
        </p>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 mt-16 py-6 px-5">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo/GENBA_logo_horizontal_large_dark.png" alt="GENBA" width={80} height={28} className="object-contain" />
          </Link>
          <div className="flex items-center gap-5 text-xs text-gray-500">
            <Link href="/tokusho" className="hover:text-gray-300 transition-colors">特定商取引法に基づく表記</Link>
            <Link href="/" className="hover:text-gray-300 transition-colors">← トップページへ戻る</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
