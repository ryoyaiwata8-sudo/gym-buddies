'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ChevronRight, Plus } from 'lucide-react'

interface Exercise {
  id: string
  name: string
  bodyPart: string
  lastWorkoutDate?: string
}

const BODY_PARTS = [
  { key: 'all', label: 'すべて' },
  { key: 'chest', label: '胸' },
  { key: 'back', label: '背中' },
  { key: 'legs', label: '脚' },
  { key: 'shoulders', label: '肩' },
  { key: 'arms', label: '腕' },
  { key: 'abs', label: '腹筋' },
]

export default function ExercisesPage() {
  const router = useRouter()
  const [selectedBodyPart, setSelectedBodyPart] = useState('all')
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newExerciseName, setNewExerciseName] = useState('')
  const [newExerciseBodyPart, setNewExerciseBodyPart] = useState('chest')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    fetchExercises()
  }, [selectedBodyPart])

  const fetchExercises = async () => {
    setLoading(true)
    try {
      const bodyPartParam = selectedBodyPart === 'all' ? '' : `?bodyPart=${selectedBodyPart}`
      const response = await fetch(`/api/exercises${bodyPartParam}`)
      if (response.ok) {
        const data = await response.json()
        setExercises(data.exercises)
      }
    } catch (error) {
      console.error('Failed to fetch exercises:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExerciseSelect = (exerciseName: string) => {
    router.push(`/workout/new?exerciseName=${encodeURIComponent(exerciseName)}`)
  }

  const handleCreateExercise = async () => {
    if (!newExerciseName.trim()) {
      alert('種目名を入力してください')
      return
    }

    setCreating(true)
    try {
      const response = await fetch('/api/exercises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newExerciseName.trim(),
          bodyPart: newExerciseBodyPart,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        alert(error.error || 'カスタム種目の作成に失敗しました')
        return
      }

      const data = await response.json()
      alert(data.message || 'カスタム種目を作成しました')

      // Close modal and reset form
      setShowCreateModal(false)
      setNewExerciseName('')
      setNewExerciseBodyPart('chest')

      // Refresh exercises list
      fetchExercises()
    } catch (error) {
      console.error('Failed to create exercise:', error)
      alert('カスタム種目の作成に失敗しました')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Header */}
      <div className="bg-white shadow-sm px-6 py-5 sticky top-0 z-10">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center">
            <button
              onClick={() => router.back()}
              className="mr-4 p-2 hover:bg-[#f8fafc] rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-[#1e293b]" />
            </button>
            <h1 className="text-2xl font-bold text-[#1e293b]">種目を選択</h1>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#0ea5e9] text-white rounded-lg hover:bg-[#0284c7] transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium">カスタム種目</span>
          </button>
        </div>
      </div>

      {/* Body Part Tabs */}
      <div className="bg-white shadow-sm sticky top-[73px] z-10">
        <div className="overflow-x-auto px-4 py-4 scrollbar-hide">
          <div className="flex gap-2 min-w-max">
            {BODY_PARTS.map((part) => (
              <button
                key={part.key}
                onClick={() => setSelectedBodyPart(part.key)}
                className={`px-5 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
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
      <div className="max-w-7xl mx-auto px-6 py-6">
        {loading ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm">
            <p className="text-[#1e293b] font-semibold">読み込み中...</p>
          </div>
        ) : exercises.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm">
            <p className="text-[#1e293b] font-semibold">この部位の種目が見つかりません</p>
            <p className="text-gray-600 text-sm mt-2">カスタム種目を作成してください</p>
          </div>
        ) : (
          <div className="space-y-3">
            {exercises.map((exercise) => (
              <button
                key={exercise.id}
                onClick={() => handleExerciseSelect(exercise.name)}
                className="w-full bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-all text-left group"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-[#1e293b] text-lg">{exercise.name}</h3>
                    {exercise.lastWorkoutDate && (
                      <p className="text-sm text-gray-500 mt-1">
                        前回: {exercise.lastWorkoutDate}
                      </p>
                    )}
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[#0ea5e9] transition-colors" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Create Custom Exercise Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-[#1e293b] mb-4">カスタム種目を作成</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  種目名
                </label>
                <input
                  type="text"
                  value={newExerciseName}
                  onChange={(e) => setNewExerciseName(e.target.value)}
                  placeholder="例: ケーブルフライ"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0ea5e9] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  部位
                </label>
                <select
                  value={newExerciseBodyPart}
                  onChange={(e) => setNewExerciseBodyPart(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0ea5e9] focus:border-transparent"
                >
                  {BODY_PARTS.filter(p => p.key !== 'all').map((part) => (
                    <option key={part.key} value={part.key}>
                      {part.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  setNewExerciseName('')
                  setNewExerciseBodyPart('chest')
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                disabled={creating}
              >
                キャンセル
              </button>
              <button
                onClick={handleCreateExercise}
                disabled={creating}
                className="flex-1 px-4 py-2 bg-[#0ea5e9] text-white rounded-lg hover:bg-[#0284c7] transition-colors disabled:opacity-50"
              >
                {creating ? '作成中...' : '作成'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
