'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Download } from 'lucide-react'

interface BodyComposition {
  id: string
  date: string
  bodyWeightKg: number
  bodyFatPercent: number | null
  note: string | null
}

export default function BodyPage() {
  const { data: session } = useSession()
  const [records, setRecords] = useState<BodyComposition[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    bodyWeightKg: '',
    bodyFatPercent: '',
    note: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    if (session) {
      fetchRecords()
    }
  }, [session])

  const fetchRecords = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/body')
      if (!response.ok) throw new Error('Failed to fetch records')
      const data = await response.json()
      setRecords(data.records)
    } catch (error) {
      console.error('Error fetching records:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.bodyWeightKg) {
      alert('体重を入力してください')
      return
    }

    try {
      setSubmitting(true)
      const response = await fetch('/api/body', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: formData.date,
          bodyWeightKg: parseFloat(formData.bodyWeightKg),
          bodyFatPercent: formData.bodyFatPercent ? parseFloat(formData.bodyFatPercent) : null,
          note: formData.note || null,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '記録に失敗しました')
      }

      // Reset form and refresh records
      setFormData({
        date: format(new Date(), 'yyyy-MM-dd'),
        bodyWeightKg: '',
        bodyFatPercent: '',
        note: '',
      })
      setShowForm(false)
      fetchRecords()
    } catch (error: any) {
      alert(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('この記録を削除しますか？')) return

    try {
      const response = await fetch(`/api/body?id=${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('削除に失敗しました')

      fetchRecords()
    } catch (error: any) {
      alert(error.message)
    }
  }

  const handleExport = async () => {
    try {
      setExporting(true)
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
      setExporting(false)
    }
  }

  if (!session) {
    redirect('/login')
  }

  const latestRecord = records[0]
  const oldestInView = records[records.length - 1]
  const weightChange = latestRecord && oldestInView && records.length > 1
    ? latestRecord.bodyWeightKg - oldestInView.bodyWeightKg
    : null

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">⚖️ 体組成</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              disabled={exporting}
              className="flex items-center gap-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              {exporting ? 'エクスポート中...' : 'CSV'}
            </button>
            <button
              onClick={() => setShowForm(!showForm)}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
            >
              {showForm ? 'キャンセル' : '+ 記録'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {/* Add Record Form */}
        {showForm && (
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <h2 className="font-bold text-gray-900 mb-4">新しい記録</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  日付 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  体重 (kg) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.bodyWeightKg}
                  onChange={(e) => setFormData({ ...formData, bodyWeightKg: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="70.5"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  体脂肪率 (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.bodyFatPercent}
                  onChange={(e) => setFormData({ ...formData, bodyFatPercent: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="15.0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  メモ
                </label>
                <textarea
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={2}
                  placeholder="体調など"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:bg-gray-300"
              >
                {submitting ? '記録中...' : '記録する'}
              </button>
            </form>
          </div>
        )}

        {/* Current Stats */}
        {latestRecord && (
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <h2 className="font-bold text-gray-900 mb-3">現在の体組成</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-3xl font-bold text-primary-600">
                  {latestRecord.bodyWeightKg.toFixed(1)}
                </div>
                <div className="text-xs text-gray-600 mt-1">体重 (kg)</div>
                {weightChange !== null && (
                  <div className={`text-xs mt-1 ${weightChange >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                    {weightChange > 0 ? '+' : ''}{weightChange.toFixed(1)}kg
                  </div>
                )}
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-3xl font-bold text-primary-600">
                  {latestRecord.bodyFatPercent?.toFixed(1) || '---'}
                </div>
                <div className="text-xs text-gray-600 mt-1">体脂肪率 (%)</div>
              </div>
            </div>
            <div className="text-xs text-gray-500 text-center mt-3">
              {format(new Date(latestRecord.date), 'yyyy年M月d日', { locale: ja })} の記録
            </div>
          </div>
        )}

        {/* Records List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-200">
            <h2 className="font-bold text-gray-900">記録一覧</h2>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-500">読み込み中...</div>
          ) : records.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              まだ記録がありません
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {records.map((record) => (
                <div key={record.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-baseline gap-3">
                        <span className="text-2xl font-bold text-gray-900">
                          {record.bodyWeightKg.toFixed(1)}
                        </span>
                        <span className="text-sm text-gray-600">kg</span>
                        {record.bodyFatPercent && (
                          <>
                            <span className="text-gray-300">|</span>
                            <span className="text-lg font-semibold text-gray-700">
                              {record.bodyFatPercent.toFixed(1)}
                            </span>
                            <span className="text-xs text-gray-600">%</span>
                          </>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {format(new Date(record.date), 'yyyy年M月d日(E)', { locale: ja })}
                      </div>
                      {record.note && (
                        <div className="text-sm text-gray-600 mt-1">{record.note}</div>
                      )}
                    </div>
                    <button
                      onClick={() => handleDelete(record.id)}
                      className="ml-4 text-red-500 hover:text-red-700 text-sm"
                    >
                      削除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
