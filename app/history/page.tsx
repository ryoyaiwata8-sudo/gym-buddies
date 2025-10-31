'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import Calendar from '@/components/Calendar'
import WorkoutHistory from '@/components/WorkoutHistory'
import WorkoutAnalytics from '@/components/WorkoutAnalytics'
import { Calendar as CalendarIcon, List, TrendingUp, Download } from 'lucide-react'

export default function HistoryPage() {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState<'calendar' | 'list' | 'analysis'>('calendar')
  const [exporting, setExporting] = useState(false)

  if (!session) {
    redirect('/login')
  }

  async function handleExport() {
    try {
      setExporting(true)
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
      setExporting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20">
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-[#1e293b]">履歴・分析</h1>
            <button
              onClick={handleExport}
              disabled={exporting}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              {exporting ? 'エクスポート中...' : 'CSVエクスポート'}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-2 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('calendar')}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold transition-all relative ${
                activeTab === 'calendar'
                  ? 'text-[#0ea5e9]'
                  : 'text-gray-600 hover:text-[#1e293b]'
              }`}
            >
              <CalendarIcon className="w-4 h-4" />
              カレンダー
              {activeTab === 'calendar' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0ea5e9]" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('list')}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold transition-all relative ${
                activeTab === 'list'
                  ? 'text-[#0ea5e9]'
                  : 'text-gray-600 hover:text-[#1e293b]'
              }`}
            >
              <List className="w-4 h-4" />
              リスト
              {activeTab === 'list' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0ea5e9]" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('analysis')}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold transition-all relative ${
                activeTab === 'analysis'
                  ? 'text-[#0ea5e9]'
                  : 'text-gray-600 hover:text-[#1e293b]'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              分析
              {activeTab === 'analysis' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0ea5e9]" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto">
        {activeTab === 'calendar' && <Calendar />}
        {activeTab === 'list' && <WorkoutHistory />}
        {activeTab === 'analysis' && <WorkoutAnalytics />}
      </div>
    </div>
  )
}
