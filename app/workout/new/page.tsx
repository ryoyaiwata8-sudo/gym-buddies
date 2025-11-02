'use client'

import { useEffect, useState, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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

interface LastSet {
  weightKg: number
  reps: number
  rpe?: number
  date: string
}

function WorkoutForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const exerciseId = searchParams.get('exerciseId')
  const exerciseName = searchParams.get('exerciseName')
  const fromTemplate = searchParams.get('fromTemplate') === 'true'

  const [exercise, setExercise] = useState<Exercise | null>(null)
  const [unit, setUnit] = useState<'kg' | 'lbs'>('kg')
  const [sets, setSets] = useState<SetData[]>([
    {
      id: Math.random().toString(),
      weightKg: 0,
      reps: 0,
    },
  ])
  const [note, setNote] = useState('')
  const [privacy, setPrivacy] = useState<'friends' | 'private'>('friends')
  const [lastSets, setLastSets] = useState<LastSet[]>([])
  const [timerSeconds, setTimerSeconds] = useState(60)
  const [timerRunning, setTimerRunning] = useState(false)
  const [saving, setSaving] = useState(false)
  const [templateInfo, setTemplateInfo] = useState<{
    exerciseIds: string[]
    exerciseNames: string[]
    currentIndex: number
    templateName: string
    completedExercises: string[]
  } | null>(null)
  const [showExerciseList, setShowExerciseList] = useState(false)
  const timerRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    if (exerciseId) {
      fetchExerciseData()
    } else if (exerciseName) {
      fetchExerciseDataByName()
    }

    // Load template info if coming from template
    if (fromTemplate) {
      const exerciseIdsStr = sessionStorage.getItem('templateExerciseIds')
      const exerciseNamesStr = sessionStorage.getItem('templateExerciseNames')
      const currentIndexStr = sessionStorage.getItem('currentTemplateIndex')
      const templateName = sessionStorage.getItem('templateName')
      const completedStr = sessionStorage.getItem('templateCompletedExercises')

      if (exerciseIdsStr && currentIndexStr && templateName) {
        setTemplateInfo({
          exerciseIds: JSON.parse(exerciseIdsStr),
          exerciseNames: exerciseNamesStr ? JSON.parse(exerciseNamesStr) : [],
          currentIndex: parseInt(currentIndexStr),
          templateName,
          completedExercises: completedStr ? JSON.parse(completedStr) : [],
        })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exerciseId, exerciseName, fromTemplate])

  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            setTimerRunning(false)
            return 60
          }
          return prev - 1
        })
      }, 1000)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [timerRunning])

  const fetchExerciseData = async () => {
    try {
      const response = await fetch(`/api/exercises/${exerciseId}`)
      if (response.ok) {
        const data = await response.json()
        setExercise(data.exercise)
        setLastSets(data.lastSets || [])

        // Pre-fill first set with last workout data
        if (data.lastSets && data.lastSets.length > 0) {
          const lastSet = data.lastSets[0]
          setSets([
            {
              id: Math.random().toString(),
              weightKg: lastSet.weightKg,
              reps: lastSet.reps,
              rpe: lastSet.rpe,
            },
          ])
        }
      }
    } catch (error) {
      console.error('Failed to fetch exercise data:', error)
    }
  }

  const fetchExerciseDataByName = async () => {
    try {
      const response = await fetch(`/api/exercises/by-name?name=${encodeURIComponent(exerciseName!)}`)
      if (response.ok) {
        const data = await response.json()
        setExercise(data.exercise)
        setLastSets(data.lastSets || [])

        // Pre-fill first set with last workout data
        if (data.lastSets && data.lastSets.length > 0) {
          const lastSet = data.lastSets[0]
          setSets([
            {
              id: Math.random().toString(),
              weightKg: lastSet.weightKg,
              reps: lastSet.reps,
              rpe: lastSet.rpe,
            },
          ])
        }
      }
    } catch (error) {
      console.error('Failed to fetch exercise data:', error)
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

  const toggleTimer = () => {
    if (timerRunning) {
      setTimerRunning(false)
    } else {
      setTimerSeconds(60)
      setTimerRunning(true)
    }
  }

  const navigateToExercise = (index: number) => {
    if (!templateInfo) return
    sessionStorage.setItem('currentTemplateIndex', index.toString())
    const targetExerciseId = templateInfo.exerciseIds[index]
    router.push(`/workout/new?exerciseId=${targetExerciseId}&fromTemplate=true`)
  }

  const goToPreviousExercise = () => {
    if (!templateInfo || templateInfo.currentIndex <= 0) return
    navigateToExercise(templateInfo.currentIndex - 1)
  }

  const goToNextExercise = () => {
    if (!templateInfo || templateInfo.currentIndex >= templateInfo.exerciseIds.length - 1) return
    navigateToExercise(templateInfo.currentIndex + 1)
  }

  const skipExercise = () => {
    if (!templateInfo) return
    // Just go to next without marking as completed
    goToNextExercise()
  }

  const handleSave = async () => {
    if (!exercise?.id) return

    // 重量または回数が入力されているセットのみを保存
    const validSets = sets.filter((set) => set.weightKg > 0 && set.reps > 0)
    if (validSets.length === 0) {
      alert('少なくとも1セットの重量と回数を入力してください')
      return
    }

    setSaving(true)

    try {
      const response = await fetch('/api/workouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exerciseId: exercise.id,
          sets: validSets.map((set) => ({
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
        const data = await response.json()
        if (data.prs && data.prs.length > 0) {
          alert(`🏆 PR達成！\n${data.prs.map((pr: any) => pr.type).join(', ')}`)
        }

        // Check if we're in template mode and have more exercises
        if (templateInfo && fromTemplate) {
          // Mark current exercise as completed
          const updatedCompleted = [...templateInfo.completedExercises]
          if (!updatedCompleted.includes(exercise.id)) {
            updatedCompleted.push(exercise.id)
            sessionStorage.setItem('templateCompletedExercises', JSON.stringify(updatedCompleted))
          }

          const nextIndex = templateInfo.currentIndex + 1
          if (nextIndex < templateInfo.exerciseIds.length) {
            // Move to next exercise
            sessionStorage.setItem('currentTemplateIndex', nextIndex.toString())
            const nextExerciseId = templateInfo.exerciseIds[nextIndex]
            router.push(`/workout/new?exerciseId=${nextExerciseId}&fromTemplate=true`)
          } else {
            // All exercises completed, clear session storage and go to dashboard
            sessionStorage.removeItem('templateExerciseIds')
            sessionStorage.removeItem('templateExerciseNames')
            sessionStorage.removeItem('currentTemplateIndex')
            sessionStorage.removeItem('templateName')
            sessionStorage.removeItem('templateCompletedExercises')
            router.push('/')
          }
        } else {
          // Normal mode, go to dashboard
          router.push('/')
        }
      } else {
        const error = await response.json()
        alert(error.error || '保存に失敗しました')
      }
    } catch (error) {
      console.error('Failed to save workout:', error)
      alert('保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  if (!exercise) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">読み込み中...</div>
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
              <p className="text-sm text-gray-500">
                {exercise.bodyPart}
                {templateInfo && (
                  <span className="ml-2 text-blue-600 font-medium">
                    📋 {templateInfo.templateName} ({templateInfo.currentIndex + 1}/{templateInfo.exerciseIds.length})
                  </span>
                )}
              </p>
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

      {/* Template Navigation */}
      {templateInfo && (
        <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-[73px] z-10">
          <div className="flex items-center gap-2">
            <button
              onClick={goToPreviousExercise}
              disabled={templateInfo.currentIndex === 0}
              className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded text-sm font-medium hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ← 前へ
            </button>
            <button
              onClick={() => setShowExerciseList(true)}
              className="flex-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded text-sm font-medium hover:bg-blue-100"
            >
              📋 種目一覧 ({templateInfo.completedExercises.length}/{templateInfo.exerciseIds.length})
            </button>
            <button
              onClick={goToNextExercise}
              disabled={templateInfo.currentIndex === templateInfo.exerciseIds.length - 1}
              className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded text-sm font-medium hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              次へ →
            </button>
          </div>
        </div>
      )}

      {/* Last Record */}
      {lastSets.length > 0 && (
        <div className="bg-blue-50 border-b border-blue-100 px-4 py-3">
          <div className="text-sm font-medium text-blue-900 mb-2">
            前回の記録 ({lastSets[0].date})
          </div>
          <div className="space-y-1">
            {lastSets.slice(0, 5).map((set, idx) => (
              <div key={idx} className="text-sm text-blue-800">
                {idx + 1}. {convertWeight(set.weightKg, unit).toFixed(1)}{unit} × {set.reps}回
                {set.rpe && ` (RPE: ${set.rpe})`}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timer */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="text-3xl font-bold text-gray-900">
            {Math.floor(timerSeconds / 60)}:{(timerSeconds % 60).toString().padStart(2, '0')}
          </div>
          <button
            onClick={toggleTimer}
            className={`px-6 py-2 rounded-lg font-medium ${
              timerRunning
                ? 'bg-red-100 text-red-700'
                : 'bg-primary-600 text-white'
            }`}
          >
            {timerRunning ? 'STOP' : 'START'}
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
                  value={convertWeight(set.weightKg, unit)}
                  onChange={(e) => handleWeightChange(set.id, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">回数</label>
                <input
                  type="number"
                  value={set.reps || ''}
                  onChange={(e) =>
                    updateSet(set.id, 'reps', parseInt(e.target.value) || 0)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-primary-500 focus:border-primary-500"
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

      {/* Exercise List Modal */}
      {showExerciseList && templateInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-end">
          <div className="bg-white rounded-t-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="px-4 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">
                📋 {templateInfo.templateName}
              </h3>
              <button
                onClick={() => setShowExerciseList(false)}
                className="text-gray-600 hover:text-gray-900 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            {/* Exercise List */}
            <div className="overflow-y-auto flex-1 p-4">
              <div className="space-y-2">
                {templateInfo.exerciseIds.map((exId, idx) => {
                  const isCompleted = templateInfo.completedExercises.includes(exId)
                  const isCurrent = idx === templateInfo.currentIndex
                  const exerciseName = templateInfo.exerciseNames[idx] || `種目 ${idx + 1}`

                  return (
                    <button
                      key={exId}
                      onClick={() => {
                        navigateToExercise(idx)
                        setShowExerciseList(false)
                      }}
                      className={`w-full p-4 rounded-lg border text-left transition-all ${
                        isCurrent
                          ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-200'
                          : isCompleted
                          ? 'bg-green-50 border-green-200'
                          : 'bg-white border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-gray-500">
                            {idx + 1}
                          </span>
                          <div>
                            <div className="font-medium text-gray-900">
                              {exerciseName}
                            </div>
                            {isCurrent && (
                              <div className="text-xs text-blue-600 font-medium">
                                現在の種目
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-xl">
                          {isCompleted ? '✅' : isCurrent ? '▶️' : '⭕'}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Save Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 z-50">
        <div className="text-xs text-gray-500 mb-2 text-center">
          {templateInfo ? (
            templateInfo.currentIndex + 1 < templateInfo.exerciseIds.length ? (
              `次の種目: ${templateInfo.exerciseIds.length - templateInfo.currentIndex - 1}種目残っています`
            ) : (
              'これが最後の種目です'
            )
          ) : (
            '記録は下書きとして保存されます。ダッシュボードから公開できます。'
          )}
        </div>
        <button
          onClick={handleSave}
          disabled={saving || sets.filter((s) => s.weightKg > 0 && s.reps > 0).length === 0}
          className="w-full py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? '保存中...' : (
            templateInfo && templateInfo.currentIndex + 1 < templateInfo.exerciseIds.length ? '次の種目へ' :
            templateInfo ? 'テンプレート完了' : '下書き保存'
          )}
        </button>
      </div>
    </div>
  )
}

export default function WorkoutNewPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <WorkoutForm />
    </Suspense>
  )
}
