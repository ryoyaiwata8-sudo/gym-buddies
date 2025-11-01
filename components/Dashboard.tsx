'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import Link from 'next/link'
import Calendar from './Calendar'
import { Dumbbell, TrendingUp, Activity, Target, Plus, FileText, ChevronRight, X } from 'lucide-react'

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

interface Goal {
  id: string
  type: string
  targetValue: number
  currentValue: number
  progress: number
  achieved: boolean
  completed: boolean
  exercise: { name: string } | null
}

const GOAL_TYPE_LABELS: Record<string, string> = {
  bodyWeight: '体重',
  weeklyVolume: '週間ボリューム',
  exerciseWeight: '種目別重量',
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
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [showFabMenu, setShowFabMenu] = useState(false)
  const [hasUnpublished, setHasUnpublished] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const today = format(new Date(), 'yyyy年M月d日（EEEE）', { locale: ja })

  useEffect(() => {
    fetchTodayData()
    fetchGoals()
  }, [])

  const fetchTodayData = async () => {
    try {
      const response = await fetch('/api/workouts/today')
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
        setExercises(data.exercises)
        setHasUnpublished(data.hasUnpublished || false)
      }
    } catch (error) {
      console.error('Failed to fetch today data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePublish = async () => {
    if (!confirm('今日のワークアウトを公開しますか？\nフォロワーに通知されます。')) {
      return
    }

    try {
      setPublishing(true)
      const response = await fetch('/api/workouts/publish', {
        method: 'PATCH',
      })

      if (response.ok) {
        const data = await response.json()
        alert(`✅ 公開しました！\n\n${data.summary.exercises.map((e: any) => `・${e.name} (${e.sets}セット)`).join('\n')}`)
        setHasUnpublished(false)
        fetchTodayData()
      } else {
        const error = await response.json()
        alert(error.error || '公開に失敗しました')
      }
    } catch (error) {
      console.error('Failed to publish workouts:', error)
      alert('公開に失敗しました')
    } finally {
      setPublishing(false)
    }
  }

  const fetchGoals = async () => {
    try {
      const response = await fetch('/api/goals/progress')
      if (response.ok) {
        const data = await response.json()
        // Show only active goals (limit to 3)
        setGoals(data.goals.filter((g: Goal) => !g.completed).slice(0, 3))
      }
    } catch (error) {
      console.error('Failed to fetch goals:', error)
    }
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Header */}
      <div className="bg-white shadow-sm px-6 py-5">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <div>
            <h1 className="text-2xl font-bold text-[#1e293b] mb-1">{today}</h1>
            <p className="text-sm text-gray-500">こんにちは、{session?.user?.name}さん</p>
          </div>
        </div>
      </div>

      {/* Publish Button */}
      {hasUnpublished && stats.totalExercises > 0 && (
        <div className="max-w-7xl mx-auto px-4 pt-4">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="text-white">
                <h3 className="font-bold text-base sm:text-lg mb-1">下書きのワークアウトがあります</h3>
                <p className="text-xs sm:text-sm text-blue-100">
                  今日のトレーニングを友達に公開しましょう！
                </p>
              </div>
              <button
                onClick={handlePublish}
                disabled={publishing}
                className="px-5 py-2.5 bg-white text-blue-600 rounded-lg font-bold hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap text-sm sm:text-base"
              >
                {publishing ? '公開中...' : '今すぐ公開'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-[#0ea5e9]/10 rounded-lg">
                <Dumbbell className="w-5 h-5 text-[#0ea5e9]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-[#1e293b] mb-1">{stats.totalExercises}</div>
            <div className="text-sm text-gray-600">種目数</div>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-[#0ea5e9]/10 rounded-lg">
                <Activity className="w-5 h-5 text-[#0ea5e9]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-[#1e293b] mb-1">{stats.totalSets}</div>
            <div className="text-sm text-gray-600">総セット数</div>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-[#0ea5e9]/10 rounded-lg">
                <TrendingUp className="w-5 h-5 text-[#0ea5e9]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-[#1e293b] mb-1">{stats.totalReps}</div>
            <div className="text-sm text-gray-600">総レップ数</div>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-[#0ea5e9]/10 rounded-lg">
                <Target className="w-5 h-5 text-[#0ea5e9]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-[#1e293b] mb-1">
              {stats.totalLoad.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">
              総負荷量 <span className="text-gray-400">(kg-reps)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Goals Progress */}
      {goals.length > 0 && (
        <div className="max-w-7xl mx-auto px-6 pb-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#0ea5e9]/10 rounded-lg">
                  <Target className="w-5 h-5 text-[#0ea5e9]" />
                </div>
                <h2 className="text-lg font-bold text-[#1e293b]">目標進捗</h2>
              </div>
              <Link href="/goals" className="text-sm text-[#0ea5e9] hover:text-[#0ea5e9]/80 font-medium flex items-center gap-1">
                すべて見る <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="space-y-4">
              {goals.map((goal) => (
                <div key={goal.id} className="bg-[#f8fafc] rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm font-semibold text-[#1e293b]">
                      {GOAL_TYPE_LABELS[goal.type]}
                      {goal.exercise && ` - ${goal.exercise.name}`}
                    </div>
                    {goal.achieved && (
                      <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">
                        達成！
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
                    <span className="font-medium">{goal.currentValue}</span>
                    <span className="font-medium">{goal.targetValue}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        goal.achieved ? 'bg-green-500' : 'bg-[#0ea5e9]'
                      }`}
                      style={{ width: `${Math.min(goal.progress, 100)}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 text-right mt-1 font-medium">
                    {goal.progress}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Calendar */}
      <div className="max-w-7xl mx-auto px-6 pb-6">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <Calendar />
        </div>
      </div>

      {/* Exercises List */}
      <div className="max-w-7xl mx-auto px-6 pb-24">
        {loading ? (
          <div className="text-center py-12 text-gray-500">読み込み中...</div>
        ) : exercises.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-[#0ea5e9]/10 rounded-full">
                <Dumbbell className="w-12 h-12 text-[#0ea5e9]" />
              </div>
            </div>
            <p className="text-[#1e293b] font-semibold mb-2">今日はまだトレーニング記録がありません</p>
            <p className="text-sm text-gray-500">下のボタンから記録を追加しましょう</p>
          </div>
        ) : (
          <div className="space-y-4">
            {exercises.map((exercise) => (
              <Link
                key={exercise.id}
                href={`/workout/${exercise.id}`}
                className="block bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-all group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#0ea5e9]/10 rounded-lg">
                      <Dumbbell className="w-5 h-5 text-[#0ea5e9]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#1e293b] text-lg">
                        {exercise.exercise.name}
                      </h3>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {exercise.sets.length} セット
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-[#0ea5e9]/10 text-[#0ea5e9] px-3 py-1 rounded-full font-medium">
                      {exercise.exercise.bodyPart}
                    </span>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[#0ea5e9] transition-colors" />
                  </div>
                </div>
                <div className="space-y-2 bg-[#f8fafc] rounded-lg p-3">
                  {exercise.sets.slice(0, 3).map((set, idx) => (
                    <div key={set.id} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 font-medium">セット {idx + 1}</span>
                      <div className="text-[#1e293b] font-semibold">
                        {set.weightKg}kg × {set.reps}回
                        {set.rpe && <span className="text-gray-400 font-normal ml-2">(RPE: {set.rpe})</span>}
                      </div>
                    </div>
                  ))}
                  {exercise.sets.length > 3 && (
                    <div className="text-sm text-gray-400 text-center pt-1">
                      ...他 {exercise.sets.length - 3} セット
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* FAB Menu */}
      {showFabMenu && (
        <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setShowFabMenu(false)} />
      )}
      {showFabMenu && (
        <div className="fixed bottom-36 right-6 z-50 space-y-3 animate-fade-in">
          <Link
            href="/templates"
            className="flex items-center gap-3 bg-white rounded-2xl shadow-lg pl-4 pr-6 py-4 hover:shadow-xl transition-all group"
            onClick={() => setShowFabMenu(false)}
          >
            <div className="w-11 h-11 bg-[#0ea5e9] rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm font-semibold text-[#1e293b] whitespace-nowrap">テンプレートから</span>
          </Link>
          <Link
            href="/exercises"
            className="flex items-center gap-3 bg-white rounded-2xl shadow-lg pl-4 pr-6 py-4 hover:shadow-xl transition-all group"
            onClick={() => setShowFabMenu(false)}
          >
            <div className="w-11 h-11 bg-[#0ea5e9] rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Dumbbell className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm font-semibold text-[#1e293b] whitespace-nowrap">種目から追加</span>
          </Link>
        </div>
      )}

      {/* FAB (Floating Action Button) */}
      <button
        onClick={() => setShowFabMenu(!showFabMenu)}
        className={`fixed bottom-20 right-6 w-16 h-16 bg-[#0ea5e9] hover:bg-[#0ea5e9]/90 text-white rounded-2xl shadow-lg hover:shadow-xl flex items-center justify-center transition-all z-50 ${
          showFabMenu ? 'rotate-45' : ''
        }`}
      >
        <Plus className="w-7 h-7" />
      </button>
    </div>
  )
}
