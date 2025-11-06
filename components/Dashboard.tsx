'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import Link from 'next/link'
import Calendar from './Calendar'
import { Dumbbell, TrendingUp, Activity, Target, Plus, FileText, ChevronRight, X, Edit2, Trash2, PlayCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

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

interface Template {
  id: string
  name: string
  description: string | null
  exercises: {
    exercise: {
      id: string
      name: string
    }
  }[]
}

const GOAL_TYPE_LABELS: Record<string, string> = {
  bodyWeight: '体重',
  weeklyVolume: '週間ボリューム',
  exerciseWeight: '種目別重量',
}

export default function Dashboard() {
  const { data: session } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<TodayStats>({
    totalExercises: 0,
    totalSets: 0,
    totalReps: 0,
    totalLoad: 0,
  })
  const [exercises, setExercises] = useState<WorkoutExercise[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [showFabMenu, setShowFabMenu] = useState(false)
  const [hasUnpublished, setHasUnpublished] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deletingExercise, setDeletingExercise] = useState<string | null>(null)
  const today = format(new Date(), 'yyyy年M月d日（EEEE）', { locale: ja })

  useEffect(() => {
    // Fetch all data in parallel for better performance
    Promise.all([
      fetchTodayData(),
      fetchGoals(),
      fetchTemplates(),
    ]).finally(() => {
      setLoading(false)
    })
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

  const handleDelete = async () => {
    if (!confirm('今日のワークアウトを削除しますか？\nこの操作は取り消せません。')) {
      return
    }

    try {
      setDeleting(true)
      const response = await fetch('/api/workouts/today', {
        method: 'DELETE',
      })

      if (response.ok) {
        alert('✅ 削除しました')
        setHasUnpublished(false)
        fetchTodayData()
      } else {
        const error = await response.json()
        alert(error.error || '削除に失敗しました')
      }
    } catch (error) {
      console.error('Failed to delete workouts:', error)
      alert('削除に失敗しました')
    } finally {
      setDeleting(false)
    }
  }

  const handleDeleteExercise = async (workoutId: string, exerciseName: string, e: React.MouseEvent) => {
    e.preventDefault() // Prevent navigation
    e.stopPropagation()

    if (!confirm(`${exerciseName}を削除しますか？\nこの操作は取り消せません。`)) {
      return
    }

    try {
      setDeletingExercise(workoutId)
      const response = await fetch(`/api/workouts/${workoutId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchTodayData()
      } else {
        const error = await response.json()
        alert(error.error || '削除に失敗しました')
      }
    } catch (error) {
      console.error('Failed to delete exercise:', error)
      alert('削除に失敗しました')
    } finally {
      setDeletingExercise(null)
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

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/templates')
      if (response.ok) {
        const data = await response.json()
        // Show only first 3 templates
        setTemplates(data.templates.slice(0, 3))
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error)
    }
  }

  const handleStartTemplate = async (templateId: string) => {
    try {
      const template = templates.find(t => t.id === templateId)

      if (!template || template.exercises.length === 0) {
        alert('このテンプレートには種目がありません')
        return
      }

      // Store template exercises in sessionStorage
      const exerciseIds = template.exercises.map(ex => ex.exercise.id)
      const exerciseNames = template.exercises.map(ex => ex.exercise.name)
      sessionStorage.setItem('templateExerciseIds', JSON.stringify(exerciseIds))
      sessionStorage.setItem('templateExerciseNames', JSON.stringify(exerciseNames))
      sessionStorage.setItem('currentTemplateIndex', '0')
      sessionStorage.setItem('templateName', template.name)
      sessionStorage.setItem('templateCompletedExercises', JSON.stringify([]))

      // Redirect to first exercise workout page
      const firstExerciseId = exerciseIds[0]
      router.push(`/workout/new?exerciseId=${firstExerciseId}&fromTemplate=true`)
    } catch (error: any) {
      alert(error.message || 'テンプレートの読み込みに失敗しました')
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

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-6 pt-6 pb-4">
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

      {/* Quick Start Templates */}
      {templates.length > 0 && (
        <div className="max-w-7xl mx-auto px-6 pb-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#0ea5e9]/10 rounded-lg">
                  <FileText className="w-5 h-5 text-[#0ea5e9]" />
                </div>
                <h2 className="text-lg font-bold text-[#1e293b]">クイックスタート</h2>
              </div>
              <Link href="/templates" prefetch={true} className="text-sm text-[#0ea5e9] hover:text-[#0ea5e9]/80 font-medium flex items-center gap-1">
                すべて見る <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleStartTemplate(template.id)}
                  className="bg-gradient-to-br from-[#0ea5e9] to-[#0284c7] rounded-xl p-4 text-left hover:shadow-lg transition-all group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-bold text-white text-base">{template.name}</h3>
                    <PlayCircle className="w-5 h-5 text-white/80 group-hover:text-white group-hover:scale-110 transition-all" />
                  </div>
                  <div className="text-xs text-white/90 mb-2">
                    {template.exercises.length}種目
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {template.exercises.slice(0, 3).map((ex, idx) => (
                      <span key={idx} className="text-xs bg-white/20 text-white px-2 py-0.5 rounded">
                        {ex.exercise.name}
                      </span>
                    ))}
                    {template.exercises.length > 3 && (
                      <span className="text-xs text-white/70">+{template.exercises.length - 3}</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

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
              <Link href="/goals" prefetch={true} className="text-sm text-[#0ea5e9] hover:text-[#0ea5e9]/80 font-medium flex items-center gap-1">
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
          <>
            <h2 className="text-lg font-bold text-[#1e293b] mb-4">今日のワークアウト</h2>
            <div className="space-y-4">
            {exercises.map((exercise) => (
              <div
                key={exercise.id}
                className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-all"
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
                    <Link
                      href={`/workout/${exercise.id}/edit`}
                      prefetch={false}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title="編集"
                    >
                      <Edit2 className="w-4 h-4 text-gray-600" />
                    </Link>
                    <button
                      onClick={(e) => handleDeleteExercise(exercise.id, exercise.exercise.name, e)}
                      disabled={deletingExercise === exercise.id}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      title="削除"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
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
              </div>
            ))}
            </div>

            {/* Publish Button */}
            {hasUnpublished && (
              <div className="mt-6">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 shadow-lg">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="text-white">
                      <h3 className="font-bold text-base sm:text-lg mb-1">ワークアウトを公開しますか？</h3>
                      <p className="text-xs sm:text-sm text-blue-100">
                        フォロワーに今日のトレーニングを共有しましょう！
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleDelete}
                        disabled={deleting || publishing}
                        className="px-4 py-2.5 bg-white/10 text-white rounded-lg font-bold hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap text-sm sm:text-base border border-white/30"
                      >
                        {deleting ? '削除中...' : '削除する'}
                      </button>
                      <button
                        onClick={handlePublish}
                        disabled={publishing || deleting}
                        className="px-5 py-2.5 bg-white text-blue-600 rounded-lg font-bold hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap text-sm sm:text-base"
                      >
                        {publishing ? '公開中...' : '今すぐ公開'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
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
            prefetch={true}
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
            prefetch={true}
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
