'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { redirect, useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

interface Exercise {
  id: string
  name: string
  bodyPart: string
}

interface Goal {
  id: string
  type: string
  targetValue: number
  deadline: string | null
  exerciseId: string | null
  exercise: Exercise | null
  completed: boolean
  completedAt: string | null
  currentValue?: number
  progress?: number
  achieved?: boolean
}

const GOAL_TYPE_LABELS: Record<string, string> = {
  bodyWeight: '体重目標',
  weeklyVolume: '週間ボリューム目標',
  exerciseWeight: '種目別重量目標',
}

export default function GoalsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [goals, setGoals] = useState<Goal[]>([])
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    type: 'bodyWeight',
    targetValue: '',
    deadline: '',
    exerciseId: '',
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (session) {
      fetchGoals()
      fetchExercises()
    }
  }, [session?.user?.id])

  const fetchGoals = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/goals/progress')
      if (!response.ok) throw new Error('Failed to fetch goals')
      const data = await response.json()
      setGoals(data.goals)
    } catch (error) {
      console.error('Error fetching goals:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchExercises = async () => {
    try {
      const response = await fetch('/api/exercises')
      if (response.ok) {
        const data = await response.json()
        setExercises(data.exercises)
      }
    } catch (error) {
      console.error('Error fetching exercises:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.targetValue) {
      alert('目標値を入力してください')
      return
    }

    if (formData.type === 'exerciseWeight' && !formData.exerciseId) {
      alert('種目を選択してください')
      return
    }

    try {
      setSubmitting(true)
      const response = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: formData.type,
          targetValue: parseFloat(formData.targetValue),
          deadline: formData.deadline || null,
          exerciseId: formData.exerciseId || null,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '目標の作成に失敗しました')
      }

      setFormData({
        type: 'bodyWeight',
        targetValue: '',
        deadline: '',
        exerciseId: '',
      })
      setShowForm(false)
      fetchGoals()
    } catch (error: any) {
      alert(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('この目標を削除しますか？')) return

    try {
      const response = await fetch(`/api/goals?id=${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('削除に失敗しました')

      fetchGoals()
    } catch (error: any) {
      alert(error.message)
    }
  }

  if (!session) {
    redirect('/login')
  }

  const activeGoals = goals.filter((g) => !g.completed)
  const completedGoals = goals.filter((g) => g.completed)

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="text-gray-600 hover:text-gray-900"
            >
              ←
            </button>
            <h1 className="text-xl font-bold text-gray-900">🎯 目標設定</h1>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
          >
            {showForm ? 'キャンセル' : '+ 目標追加'}
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {/* Add Goal Form */}
        {showForm && (
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <h2 className="font-bold text-gray-900 mb-4">新しい目標</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  目標タイプ <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                >
                  <option value="bodyWeight">体重目標</option>
                  <option value="weeklyVolume">週間ボリューム目標</option>
                  <option value="exerciseWeight">種目別重量目標</option>
                </select>
              </div>

              {formData.type === 'exerciseWeight' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    種目 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.exerciseId}
                    onChange={(e) => setFormData({ ...formData, exerciseId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  >
                    <option value="">種目を選択</option>
                    {exercises.map((ex) => (
                      <option key={ex.id} value={ex.id}>
                        {ex.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  目標値 <span className="text-red-500">*</span>
                  <span className="text-xs text-gray-500 ml-2">
                    {formData.type === 'bodyWeight' && '(kg)'}
                    {formData.type === 'weeklyVolume' && '(kg-reps)'}
                    {formData.type === 'exerciseWeight' && '(kg)'}
                  </span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.targetValue}
                  onChange={(e) => setFormData({ ...formData, targetValue: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder={
                    formData.type === 'bodyWeight'
                      ? '70.0'
                      : formData.type === 'weeklyVolume'
                      ? '50000'
                      : '100.0'
                  }
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  期限（任意）
                </label>
                <input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:bg-gray-300"
              >
                {submitting ? '作成中...' : '目標を作成'}
              </button>
            </form>
          </div>
        )}

        {/* Active Goals */}
        {activeGoals.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-4 py-3 border-b border-gray-200">
              <h2 className="font-bold text-gray-900">進行中の目標</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {activeGoals.map((goal) => (
                <div key={goal.id} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">
                          {GOAL_TYPE_LABELS[goal.type]}
                        </h3>
                        {goal.achieved && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                            達成！
                          </span>
                        )}
                      </div>
                      {goal.exercise && (
                        <div className="text-sm text-gray-600 mt-1">
                          {goal.exercise.name}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleDelete(goal.id)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      削除
                    </button>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-2">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-600">
                        現在: {goal.currentValue}
                        {goal.type === 'bodyWeight' && ' kg'}
                        {goal.type === 'weeklyVolume' && ' kg-reps'}
                        {goal.type === 'exerciseWeight' && ' kg'}
                      </span>
                      <span className="text-gray-600">
                        目標: {goal.targetValue}
                        {goal.type === 'bodyWeight' && ' kg'}
                        {goal.type === 'weeklyVolume' && ' kg-reps'}
                        {goal.type === 'exerciseWeight' && ' kg'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          goal.achieved ? 'bg-green-500' : 'bg-primary-600'
                        }`}
                        style={{ width: `${Math.min(goal.progress || 0, 100)}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 text-center mt-1">
                      {goal.progress}%
                    </div>
                  </div>

                  {goal.deadline && (
                    <div className="text-xs text-gray-500">
                      期限: {format(new Date(goal.deadline), 'yyyy年M月d日', { locale: ja })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Completed Goals */}
        {completedGoals.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-4 py-3 border-b border-gray-200">
              <h2 className="font-bold text-gray-900">達成済みの目標</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {completedGoals.map((goal) => (
                <div key={goal.id} className="p-4 bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-700">
                          {GOAL_TYPE_LABELS[goal.type]}
                        </h3>
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                          ✓ 達成
                        </span>
                      </div>
                      {goal.exercise && (
                        <div className="text-sm text-gray-600 mt-1">
                          {goal.exercise.name}
                        </div>
                      )}
                      <div className="text-sm text-gray-600 mt-1">
                        目標: {goal.targetValue}
                        {goal.type === 'bodyWeight' && ' kg'}
                        {goal.type === 'weeklyVolume' && ' kg-reps'}
                        {goal.type === 'exerciseWeight' && ' kg'}
                      </div>
                      {goal.completedAt && (
                        <div className="text-xs text-gray-500 mt-1">
                          達成日:{' '}
                          {format(new Date(goal.completedAt), 'yyyy年M月d日', { locale: ja })}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleDelete(goal.id)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      削除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && goals.length === 0 && (
          <div className="bg-white rounded-lg p-8 text-center">
            <div className="text-6xl mb-4">🎯</div>
            <p className="text-gray-600 mb-2">まだ目標が設定されていません</p>
            <p className="text-sm text-gray-400 mb-4">
              目標を設定して、<br />
              モチベーションを高めましょう！
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              最初の目標を追加
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
