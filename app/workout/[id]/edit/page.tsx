'use client'

import { useEffect, useState, useRef, Suspense } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { convertWeight, lbsToKg, calculateLoad } from '@/lib/units'

interface SetData {
  id: string
  weightKg: number
  reps: number
  rpe?: number
  note?: string
}

interface Exercise {
  id: string
  name: string
  bodyPart: string
}

function WorkoutEditForm() {
  const router = useRouter()
  const params = useParams()
  const workoutId = params.id as string

  const [exercise, setExercise] = useState<Exercise | null>(null)
  const [unit, setUnit] = useState<'kg' | 'lbs'>('kg')
  const [sets, setSets] = useState<SetData[]>([])
  const [note, setNote] = useState('')
  const [privacy, setPrivacy] = useState<'friends' | 'private'>('friends')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchWorkoutData()
  }, [workoutId])

  const fetchWorkoutData = async () => {
    try {
      const response = await fetch(`/api/workouts/${workoutId}`)
      if (response.ok) {
        const data = await response.json()
        const workout = data.workout

        // Set exercise info
        if (workout.sets && workout.sets.length > 0) {
          setExercise(workout.sets[0].exercise)

          // Set sets data
          setSets(
            workout.sets.map((set: any) => ({
              id: set.id,
              weightKg: set.weightKg,
              reps: set.reps,
              rpe: set.rpe,
              note: set.note,
            }))
          )
        }

        setNote(workout.note || '')
        setPrivacy(workout.privacy === 'PRIVATE' ? 'private' : 'friends')
      }
    } catch (error) {
      console.error('Failed to fetch workout data:', error)
      alert('ワークアウトデータの取得に失敗しました')
      router.back()
    } finally {
      setLoading(false)
    }
  }

  const addSet = () => {
    const lastSet = sets[sets.length - 1]
    setSets([
      ...sets,
      {
        id: Math.random().toString(),
        weightKg: lastSet?.weightKg || 0,
        reps: lastSet?.reps || 0,
        rpe: lastSet?.rpe,
      },
    ])
  }

  const removeSet = (id: string) => {
    if (sets.length > 1) {
      setSets(sets.filter((set) => set.id !== id))
    }
  }

  const updateSet = (id: string, field: keyof SetData, value: any) => {
    setSets(
      sets.map((set) => {
        if (set.id === id) {
          return { ...set, [field]: value }
        }
        return set
      })
    )
  }

  const handleWeightChange = (id: string, value: string) => {
    const numValue = parseFloat(value) || 0
    const weightKg = unit === 'lbs' ? lbsToKg(numValue) : numValue
    updateSet(id, 'weightKg', weightKg)
  }

  const handleSave = async () => {
    if (!exercise?.id) return

    const validSets = sets.filter((set) => set.weightKg > 0 && set.reps > 0)
    if (validSets.length === 0) {
      alert('少なくとも1セットの重量と回数を入力してください')
      return
    }

    setSaving(true)

    try {
      const response = await fetch(`/api/workouts/${workoutId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sets: validSets.map((set) => ({
            exerciseId: exercise.id,
            weightKg: set.weightKg,
            reps: set.reps,
            rpe: set.rpe || null,
            note: set.note || null,
          })),
          note,
          privacy,
        }),
      })

      if (response.ok) {
        alert('✅ 更新しました')
        router.push('/')
      } else {
        const error = await response.json()
        alert(error.error || '更新に失敗しました')
      }
    } catch (error) {
      console.error('Failed to update workout:', error)
      alert('更新に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">読み込み中...</div>
      </div>
    )
  }

  if (!exercise) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">ワークアウトが見つかりません</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => router.back()}
              className="mr-3 text-gray-600 hover:text-gray-900"
            >
              ←
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{exercise.name}</h1>
              <p className="text-sm text-gray-500">{exercise.bodyPart} - 編集</p>
            </div>
          </div>
          <button
            onClick={() => setUnit(unit === 'kg' ? 'lbs' : 'kg')}
            className="px-3 py-1 bg-gray-100 rounded text-sm font-medium"
          >
            {unit}
          </button>
        </div>
      </div>

      {/* Sets */}
      <div className="p-4 space-y-3">
        <h2 className="font-semibold text-gray-900">セット</h2>
        {sets.map((set, idx) => (
          <div
            key={set.id}
            className="bg-white rounded-lg p-4 border border-gray-200"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="font-medium text-gray-900">セット {idx + 1}</span>
              {sets.length > 1 && (
                <button
                  onClick={() => removeSet(set.id)}
                  className="text-red-600 hover:text-red-700 text-sm font-medium"
                >
                  削除
                </button>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs text-gray-600 mb-1">重量 ({unit})</label>
                <input
                  type="number"
                  step="0.1"
                  value={set.weightKg === 0 ? '' : convertWeight(set.weightKg, unit)}
                  onChange={(e) => handleWeightChange(set.id, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-primary-500 focus:border-primary-500"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">回数</label>
                <input
                  type="number"
                  value={set.reps === 0 ? '' : set.reps}
                  onChange={(e) =>
                    updateSet(set.id, 'reps', parseInt(e.target.value) || 0)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-primary-500 focus:border-primary-500"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">RPE</label>
                <input
                  type="number"
                  step="0.5"
                  min="5"
                  max="10"
                  value={set.rpe || ''}
                  onChange={(e) =>
                    updateSet(set.id, 'rpe', parseFloat(e.target.value) || undefined)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-primary-500 focus:border-primary-500"
                  placeholder="任意"
                />
              </div>
            </div>

            {set.weightKg > 0 && set.reps > 0 && (
              <div className="mt-2 text-sm text-gray-600">
                負荷量: {calculateLoad(set.weightKg, set.reps).toFixed(0)} kg-reps
              </div>
            )}
          </div>
        ))}

        <button
          onClick={addSet}
          className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-primary-400 hover:text-primary-600 font-medium"
        >
          + セット追加
        </button>
      </div>

      {/* Note and Privacy */}
      <div className="px-4 space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            メモ（任意）
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-primary-500 focus:border-primary-500"
            rows={2}
            placeholder="今日の調子、気づいたことなど"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            公開範囲
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => setPrivacy('friends')}
              className={`flex-1 py-2 rounded border ${
                privacy === 'friends'
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-white text-gray-700 border-gray-300'
              }`}
            >
              友達のみ
            </button>
            <button
              onClick={() => setPrivacy('private')}
              className={`flex-1 py-2 rounded border ${
                privacy === 'private'
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-white text-gray-700 border-gray-300'
              }`}
            >
              非公開
            </button>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 z-50">
        <button
          onClick={handleSave}
          disabled={saving || sets.filter((s) => s.weightKg > 0 && s.reps > 0).length === 0}
          className="w-full py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? '保存中...' : '更新する'}
        </button>
      </div>
    </div>
  )
}

export default function WorkoutEditPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <WorkoutEditForm />
    </Suspense>
  )
}
