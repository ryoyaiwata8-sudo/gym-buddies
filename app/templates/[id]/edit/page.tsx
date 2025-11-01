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

export default function EditTemplatePage({ params }: { params: { id: string } }) {
  const { data: session } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [templateName, setTemplateName] = useState('')
  const [templateDescription, setTemplateDescription] = useState('')
  const [selectedExercises, setSelectedExercises] = useState<Exercise[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [exerciseIdMap, setExerciseIdMap] = useState<Record<string, string>>({})

  const [selectedBodyPart, setSelectedBodyPart] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showExerciseList, setShowExerciseList] = useState(false)

  // 即座に種目を表示（APIリクエスト不要）
  const filteredExercises = useMemo(() => {
    return searchExercises(searchQuery, selectedBodyPart)
  }, [searchQuery, selectedBodyPart])

  useEffect(() => {
    if (session) {
      fetchTemplate()
      fetchExerciseIds()
    }
  }, [session, params.id])

  const fetchExerciseIds = async () => {
    try {
      const response = await fetch('/api/exercises')
      if (response.ok) {
        const data = await response.json()
        // 種目名からIDへのマッピングを作成
        const map: Record<string, string> = {}
        if (data.exercises && Array.isArray(data.exercises)) {
          data.exercises.forEach((ex: any) => {
            map[ex.name] = ex.id
          })
        }
        setExerciseIdMap(map)
      }
    } catch (error) {
      console.error('Error fetching exercise IDs:', error)
    }
  }

  const fetchTemplate = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/templates/${params.id}`)
      if (!response.ok) throw new Error('Failed to fetch template')
      const data = await response.json()

      setTemplateName(data.template.name)
      setTemplateDescription(data.template.description || '')
      setSelectedExercises(
        data.template.exercises
          .sort((a: any, b: any) => a.order - b.order)
          .map((ex: any) => ex.exercise)
      )
    } catch (error) {
      console.error('Error fetching template:', error)
      alert('テンプレートの読み込みに失敗しました')
      router.back()
    } finally {
      setLoading(false)
    }
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
    if (!templateName.trim()) {
      alert('テンプレート名を入力してください')
      return
    }

    if (selectedExercises.length === 0) {
      alert('少なくとも1つの種目を追加してください')
      return
    }

    try {
      setSubmitting(true)
      // 種目名からデータベースIDに変換
      const exerciseIds = selectedExercises.map((ex) => exerciseIdMap[ex.name]).filter(Boolean)

      if (exerciseIds.length === 0) {
        throw new Error('種目IDの取得に失敗しました')
      }

      const response = await fetch(`/api/templates/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: templateName,
          description: templateDescription || null,
          exercises: exerciseIds,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'テンプレートの更新に失敗しました')
      }

      router.push('/templates')
    } catch (error: any) {
      alert(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (!session) {
    redirect('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="text-gray-600 hover:text-gray-900"
            >
              ←
            </button>
            <h1 className="text-xl font-bold text-gray-900">テンプレート編集</h1>
          </div>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium disabled:bg-gray-300"
          >
            {submitting ? '保存中...' : '保存'}
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {/* Template Info */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
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
          </div>
        </div>

        {/* Selected Exercises */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <h2 className="font-bold text-gray-900">選択済み種目</h2>
            <button
              onClick={() => setShowExerciseList(!showExerciseList)}
              className="px-3 py-1 bg-primary-600 text-white rounded text-sm hover:bg-primary-700"
            >
              {showExerciseList ? '閉じる' : '種目追加'}
            </button>
          </div>
          {selectedExercises.length > 0 ? (
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
          ) : (
            <div className="p-8 text-center text-gray-500">
              種目が選択されていません
            </div>
          )}
        </div>

        {/* Exercise Selection */}
        {showExerciseList && (
          <div className="space-y-4">
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
    </div>
  )
}
