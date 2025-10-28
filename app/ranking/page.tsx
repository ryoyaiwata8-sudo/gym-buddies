'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

interface RankingEntry {
  rank: number
  user: {
    id: string
    displayName: string
    avatarUrl?: string
  }
  totalLoad: number
  totalLoadDisplay: string
  totalLoadTons: string
  workoutsCount: number
  setsCount: number
  isCurrentUser: boolean
}

export default function RankingPage() {
  const { data: session, status } = useSession()
  const [ranking, setRanking] = useState<RankingEntry[]>([])
  const [period, setPeriod] = useState<{ start: string; end: string }>()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/login')
    }
    if (status === 'authenticated') {
      fetchRanking()
    }
  }, [status])

  const fetchRanking = async () => {
    try {
      const response = await fetch('/api/ranking?period=week')
      if (response.ok) {
        const data = await response.json()
        setRanking(data.ranking)
        setPeriod(data.period)
      }
    } catch (error) {
      console.error('Failed to fetch ranking:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200 px-4 py-4">
          <h1 className="text-xl font-bold text-gray-900">週間ランキング</h1>
        </div>
        <div className="flex items-center justify-center h-96">
          <div className="text-gray-500">読み込み中...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10">
        <h1 className="text-xl font-bold text-gray-900">🏆 週間ランキング</h1>
        {period && (
          <p className="text-sm text-gray-500 mt-1">
            {format(new Date(period.start), 'M月d日', { locale: ja })} -{' '}
            {format(new Date(period.end), 'M月d日', { locale: ja })}
          </p>
        )}
      </div>

      {/* Ranking List */}
      <div className="p-4">
        {ranking.length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center">
            <div className="text-6xl mb-4">🏆</div>
            <p className="text-gray-600">今週のデータがまだありません</p>
            <p className="text-sm text-gray-400 mt-2">
              トレーニングを記録してランキングに参加しましょう！
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {ranking.map((entry) => (
              <div
                key={entry.user.id}
                className={`bg-white rounded-lg p-4 shadow-sm border ${
                  entry.isCurrentUser
                    ? 'border-primary-300 bg-primary-50'
                    : 'border-gray-100'
                }`}
              >
                <div className="flex items-center">
                  {/* Rank */}
                  <div
                    className={`w-12 h-12 flex-shrink-0 rounded-full flex items-center justify-center font-bold text-xl mr-3 ${
                      entry.rank === 1
                        ? 'bg-yellow-100 text-yellow-700'
                        : entry.rank === 2
                        ? 'bg-gray-200 text-gray-700'
                        : entry.rank === 3
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {entry.rank === 1
                      ? '🥇'
                      : entry.rank === 2
                      ? '🥈'
                      : entry.rank === 3
                      ? '🥉'
                      : entry.rank}
                  </div>

                  {/* User Info */}
                  <div className="flex-1">
                    <div className="flex items-center mb-1">
                      <span className="font-semibold text-gray-900 mr-2">
                        {entry.user.displayName}
                      </span>
                      {entry.isCurrentUser && (
                        <span className="text-xs bg-primary-600 text-white px-2 py-0.5 rounded">
                          あなた
                        </span>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="text-sm text-gray-600 space-y-0.5">
                      <div className="font-bold text-primary-600">
                        {entry.totalLoadDisplay} kg-reps
                        <span className="text-xs text-gray-400 ml-1">
                          ({entry.totalLoadTons}t)
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {entry.workoutsCount}回 トレーニング・{entry.setsCount}セット
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
