'use client'

export default function PrintButtons() {
  return (
    <div className="flex gap-3 mb-6 print:hidden">
      <button
        onClick={() => window.print()}
        className="px-5 py-2.5 bg-orange-500 text-white rounded-xl font-bold text-sm hover:bg-orange-600 transition-colors"
      >
        🖨️ 印刷・PDF保存
      </button>
      <button
        onClick={() => window.close()}
        className="px-5 py-2.5 bg-gray-200 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-300 transition-colors"
      >
        閉じる
      </button>
    </div>
  )
}
