'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import Link from 'next/link'

interface TodayStats {
  totalExercises: number
  totalSets: number
  totalReps: number
  totalLoad: number
}

interface WorkoutExercise {
  id: string
  exercise: {
    id: string
    name: string
    bodyPart: string
  }
  sets: {
    id: string
    weightKg: number
    reps: number
    rpe?: number
  }[]
}

export default function Dashboard() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<TodayStats>({
    totalExercises: 0,
    totalSets: 0,
    totalReps: 0,
    totalLoad: 0,
  })
  const [exercises, setExercises] = useState<WorkoutExercise[]>([])
  const [loading, setLoading] = useState(true)
  const today = format(new Date(), 'yyyy年M月d日（EEEE）', { locale: ja })

  useEffect(() => {
    fetchTodayData()
  }, [])

  const fetchTodayData = async () => {
    try {
      const response = await fetch('/api/workouts/today')
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
        setExercises(data.exercises)
      }
    } catch (error) {
      console.error('Failed to fetch today data:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{today}</h1>
            <p className="text-sm text-gray-500">こんにちは、{session?.user?.name}さん</p>
          </div>
          <Link
            href="/calendar"
            className="text-primary-600 hover:text-primary-700 font-medium text-sm"
          >
            📅 カレンダー
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 p-4">
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
          <div className="text-2xl font-bold text-gray-900">{stats.totalExercises}</div>
          <div className="text-xs text-gray-500 mt-1">種目数</div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
          <div className="text-2xl font-bold text-gray-900">{stats.totalSets}</div>
          <div className="text-xs text-gray-500 mt-1">総セット数</div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
          <div className="text-2xl font-bold text-gray-900">{stats.totalReps}</div>
          <div className="text-xs text-gray-500 mt-1">総レップ数</div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
          <div className="text-2xl font-bold text-gray-900">
            {stats.totalLoad.toLocaleString()}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            総負荷量 <span className="text-gray-400">(kg-reps)</span>
          </div>
        </div>
      </div>

      {/* Exercises List */}
      <div className="p-4">
        {loading ? (
          <div className="text-center py-12 text-gray-500">読み込み中...</div>
        ) : exercises.length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center">
            <div className="text-6xl mb-4">💪</div>
            <p className="text-gray-600 mb-2">今日はまだトレーニング記録がありません</p>
            <p className="text-sm text-gray-400">下のボタンから記録を追加しましょう</p>
          </div>
        ) : (
          <div className="space-y-3">
            {exercises.map((exercise) => (
              <Link
                key={exercise.id}
                href={`/workout/${exercise.id}`}
                className="block bg-white rounded-lg p-4 shadow-sm border border-gray-100 hover:border-primary-300 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {exercise.exercise.name}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {exercise.sets.length} セット
                    </p>
                  </div>
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                    {exercise.exercise.bodyPart}
                  </span>
                </div>
                <div className="mt-3 space-y-1">
                  {exercise.sets.slice(0, 3).map((set, idx) => (
                    <div key={set.id} className="text-sm text-gray-600">
                      {idx + 1}. {set.weightKg}kg × {set.reps}回
                      {set.rpe && <span className="text-gray-400"> (RPE: {set.rpe})</span>}
                    </div>
                  ))}
                  {exercise.sets.length > 3 && (
                    <div className="text-sm text-gray-400">
                      ...他 {exercise.sets.length - 3} セット
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* FAB (Floating Action Button) */}
      <Link
        href="/exercises"
        className="fixed bottom-20 right-4 w-14 h-14 bg-primary-600 hover:bg-primary-700 text-white rounded-full shadow-lg flex items-center justify-center text-3xl transition-colors z-40"
      >
        <span className="mb-1">+</span>
      </Link>
    </div>
  )
}
