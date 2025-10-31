'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Download } from 'lucide-react'

export default function ExportPage() {
  const { data: session, status } = useSession()
  const [exportingWorkouts, setExportingWorkouts] = useState(false)
  const [exportingBody, setExportingBody] = useState(false)

  if (status === 'unauthenticated') {
    redirect('/login')
  }

  async function handleExportWorkouts() {
    try {
      setExportingWorkouts(true)
      const response = await fetch('/api/export/workouts')
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `workouts_${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        alert('エクスポートに失敗しました')
      }
    } catch (error) {
      console.error('Export failed:', error)
      alert('エクスポートに失敗しました')
    } finally {
      setExportingWorkouts(false)
    }
  }

  async function handleExportBody() {
    try {
      setExportingBody(true)
      const response = await fetch('/api/export/body')
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `body_composition_${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        alert('エクスポートに失敗しました')
      }
    } catch (error) {
      console.error('Export failed:', error)
      alert('エクスポートに失敗しました')
    } finally {
      setExportingBody(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">読み込み中...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Link href="/settings" className="text-gray-600 hover:text-gray-900">
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-xl font-bold text-gray-900">データエクスポート</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">📊 データをエクスポート</h3>
          <p className="text-sm text-blue-800">
            トレーニングデータや体組成データをCSV形式でダウンロードできます。
            ExcelやGoogleスプレッドシートで開いて、詳細な分析やバックアップにご活用ください。
          </p>
        </div>

        {/* Workout Export */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">
                💪 ワークアウト履歴
              </h2>
              <p className="text-sm text-gray-600">
                すべてのトレーニング記録をエクスポート
              </p>
            </div>
          </div>
          <div className="space-y-3 mb-4">
            <div className="text-sm text-gray-600">
              <strong>含まれるデータ:</strong>
              <ul className="list-disc list-inside ml-2 mt-1 space-y-1">
                <li>日付、種目、部位</li>
                <li>セット番号、重量、回数、RPE</li>
                <li>総負荷量（kg）</li>
                <li>PR記録、メモ</li>
              </ul>
            </div>
          </div>
          <button
            onClick={handleExportWorkouts}
            disabled={exportingWorkouts}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            <Download className="w-5 h-5" />
            {exportingWorkouts ? 'エクスポート中...' : 'CSVをダウンロード'}
          </button>
        </div>

        {/* Body Composition Export */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">
                ⚖️ 体組成データ
              </h2>
              <p className="text-sm text-gray-600">
                体重・体脂肪率の記録をエクスポート
              </p>
            </div>
          </div>
          <div className="space-y-3 mb-4">
            <div className="text-sm text-gray-600">
              <strong>含まれるデータ:</strong>
              <ul className="list-disc list-inside ml-2 mt-1 space-y-1">
                <li>日付、体重（kg）</li>
                <li>体脂肪率（%）</li>
                <li>BMI</li>
                <li>メモ</li>
              </ul>
            </div>
          </div>
          <button
            onClick={handleExportBody}
            disabled={exportingBody}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            <Download className="w-5 h-5" />
            {exportingBody ? 'エクスポート中...' : 'CSVをダウンロード'}
          </button>
        </div>

        {/* Tips */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-2">💡 ヒント</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>・CSVファイルはExcelやGoogleスプレッドシートで開けます</li>
            <li>・日本語が文字化けする場合は、UTF-8で開いてください</li>
            <li>・データは全期間が対象です</li>
            <li>・定期的にバックアップとしてダウンロードすることをおすすめします</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
