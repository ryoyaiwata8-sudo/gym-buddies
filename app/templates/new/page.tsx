'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { redirect, useRouter } from 'next/navigation'
import { EXERCISES, BODY_PARTS, searchExercises } from '@/lib/exercises'

interface Exercise {
  id: string
  name: string
  bodyPart: string
}

export default function NewTemplatePage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [selectedBodyPart, setSelectedBodyPart] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  const [step, setStep] = useState<'name' | 'exercises'>('name')
  const [templateName, setTemplateName] = useState('')
  const [templateDescription, setTemplateDescription] = useState('')
  const [selectedExercises, setSelectedExercises] = useState<Exercise[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [exerciseIdMap, setExerciseIdMap] = useState<Record<string, string>>({})
  const [loadingIds, setLoadingIds] = useState(true)

  // 即座に種目を表示（APIリクエスト不要）
  const filteredExercises = useMemo(() => {
    return searchExercises(searchQuery, selectedBodyPart)
  }, [searchQuery, selectedBodyPart])

  // データベースの種目IDマッピングを取得
  useEffect(() => {
    if (session) {
      fetchExerciseIds()
    }
  }, [session])

  const fetchExerciseIds = async () => {
    try {
      setLoadingIds(true)
      console.log('Fetching exercise IDs...')
      const response = await fetch('/api/exercises')
      console.log('Response status:', response.status)

      if (response.ok) {
        const data = await response.json()
        console.log('Fetched exercises:', data)
        // 種目名からIDへのマッピングを作成
        const map: Record<string, string> = {}
        if (data.exercises && Array.isArray(data.exercises)) {
          data.exercises.forEach((ex: any) => {
            map[ex.name] = ex.id
          })
        }
        console.log('Exercise ID map created:', map)
        console.log('Map has', Object.keys(map).length, 'entries')
        setExerciseIdMap(map)
      } else {
        console.error('Failed to fetch exercises:', response.status, response.statusText)
        alert('種目データの読み込みに失敗しました。ページを再読み込みしてください。')
      }
    } catch (error) {
      console.error('Error fetching exercise IDs:', error)
      alert('種目データの読み込みに失敗しました。ページを再読み込みしてください。')
    } finally {
      console.log('Setting loadingIds to false')
      setLoadingIds(false)
    }
  }

  const handleNameSubmit = () => {
    if (!templateName.trim()) {
      alert('テンプレート名を入力してください')
      return
    }
    setStep('exercises')
  }

  const handleExerciseToggle = (exercise: Exercise) => {
    const isSelected = selectedExercises.some((e) => e.id === exercise.id)
    if (isSelected) {
      setSelectedExercises(selectedExercises.filter((e) => e.id !== exercise.id))
    } else {
      setSelectedExercises([...selectedExercises, exercise])
    }
  }

  const moveExerciseUp = (index: number) => {
    if (index === 0) return
    const newExercises = [...selectedExercises]
    ;[newExercises[index - 1], newExercises[index]] = [newExercises[index], newExercises[index - 1]]
    setSelectedExercises(newExercises)
  }

  const moveExerciseDown = (index: number) => {
    if (index === selectedExercises.length - 1) return
    const newExercises = [...selectedExercises]
    ;[newExercises[index], newExercises[index + 1]] = [newExercises[index + 1], newExercises[index]]
    setSelectedExercises(newExercises)
  }

  const removeExercise = (exerciseId: string) => {
    setSelectedExercises(selectedExercises.filter((e) => e.id !== exerciseId))
  }

  const handleSubmit = async () => {
    if (selectedExercises.length === 0) {
      alert('少なくとも1つの種目を追加してください')
      return
    }

    try {
      setSubmitting(true)

      console.log('Selected exercises:', selectedExercises)
      console.log('Exercise ID map:', exerciseIdMap)

      // 種目名からデータベースIDに変換
      const exerciseIds = selectedExercises.map((ex) => {
        const id = exerciseIdMap[ex.name]
        console.log(`Mapping ${ex.name} to ${id}`)
        return id
      }).filter(Boolean)

      console.log('Final exercise IDs:', exerciseIds)

      if (exerciseIds.length === 0) {
        throw new Error('種目IDの取得に失敗しました。ページを再読み込みしてください。')
      }

      if (exerciseIds.length !== selectedExercises.length) {
        throw new Error(`一部の種目IDが見つかりませんでした (${exerciseIds.length}/${selectedExercises.length})`)
      }

      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: templateName,
          description: templateDescription || null,
          exercises: exerciseIds,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'テンプレートの作成に失敗しました')
      }

      router.push('/templates')
    } catch (error: any) {
      console.error('Template creation error:', error)
      alert(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (!session) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (step === 'exercises') {
                  setStep('name')
                } else {
                  router.back()
                }
              }}
              className="text-gray-600 hover:text-gray-900"
            >
              ←
            </button>
            <h1 className="text-xl font-bold text-gray-900">
              {step === 'name' ? 'テンプレート名' : '種目選択'}
            </h1>
          </div>
          {step === 'exercises' && selectedExercises.length > 0 && (
            <div className="flex items-center gap-2">
              {loadingIds && (
                <span className="text-xs text-gray-500">種目データ読み込み中...</span>
              )}
              {!loadingIds && Object.keys(exerciseIdMap).length === 0 && (
                <span className="text-xs text-red-500">種目データが読み込めませんでした</span>
              )}
              <button
                onClick={() => {
                  console.log('Button clicked')
                  console.log('loadingIds:', loadingIds)
                  console.log('exerciseIdMap keys:', Object.keys(exerciseIdMap).length)
                  console.log('submitting:', submitting)
                  handleSubmit()
                }}
                disabled={submitting || loadingIds || Object.keys(exerciseIdMap).length === 0}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {loadingIds ? '準備中...' : submitting ? '作成中...' : '完了'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Step 1: Template Name */}
      {step === 'name' && (
        <div className="max-w-2xl mx-auto p-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  テンプレート名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="例: 胸の日（基本構成）"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  説明（任意）
                </label>
                <textarea
                  value={templateDescription}
                  onChange={(e) => setTemplateDescription(e.target.value)}
                  placeholder="このテンプレートの説明を入力"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={3}
                />
              </div>
              <button
                onClick={handleNameSubmit}
                className="w-full py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
              >
                次へ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Exercise Selection */}
      {step === 'exercises' && (
        <div className="max-w-2xl mx-auto p-4 space-y-4">
          {/* Selected Exercises */}
          {selectedExercises.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                <h2 className="font-bold text-gray-900">選択済み種目</h2>
                <span className="text-sm text-gray-500">
                  {selectedExercises.length}種目
                </span>
              </div>
              <div className="divide-y divide-gray-200">
                {selectedExercises.map((ex, index) => (
                  <div key={ex.id} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => moveExerciseUp(index)}
                          disabled={index === 0}
                          className="text-gray-400 hover:text-gray-600 disabled:opacity-30 text-xs"
                        >
                          ▲
                        </button>
                        <button
                          onClick={() => moveExerciseDown(index)}
                          disabled={index === selectedExercises.length - 1}
                          className="text-gray-400 hover:text-gray-600 disabled:opacity-30 text-xs"
                        >
                          ▼
                        </button>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{index + 1}. {ex.name}</div>
                        <div className="text-xs text-gray-500">{ex.bodyPart}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => removeExercise(ex.id)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      削除
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Search */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="種目を検索..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Body Part Filter */}
          <div className="bg-white shadow-sm sticky top-[73px] z-10">
            <div className="overflow-x-auto px-4 py-4 scrollbar-hide">
              <div className="flex gap-2 min-w-max">
                {BODY_PARTS.map((part) => (
                  <button
                    key={part.key}
                    onClick={() => setSelectedBodyPart(part.key)}
                    className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors text-sm font-semibold ${
                      selectedBodyPart === part.key
                        ? 'bg-[#0ea5e9] text-white shadow-sm'
                        : 'bg-[#f8fafc] text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {part.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Exercise List */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {filteredExercises.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {filteredExercises.map((exercise) => {
                  const isSelected = selectedExercises.some((e) => e.id === exercise.id)
                  return (
                    <button
                      key={exercise.id}
                      onClick={() => handleExerciseToggle(exercise)}
                      className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                        isSelected ? 'bg-primary-50' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-gray-900">{exercise.name}</div>
                        {isSelected && (
                          <div className="text-primary-600 font-bold">✓</div>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                該当する種目が見つかりません
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
