'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Exercise {
  id: string
  name: string
  bodyPart: string
  lastWorkoutDate?: string
}

const bodyParts = [
  { id: 'all', label: 'ALL', emoji: '💪' },
  { id: 'chest', label: '胸', emoji: '🫀' },
  { id: 'arms', label: '腕', emoji: '💪' },
  { id: 'shoulders', label: '肩', emoji: '🤷' },
  { id: 'back', label: '背中', emoji: '🧑' },
  { id: 'legs', label: '脚', emoji: '🦵' },
  { id: 'abs', label: '腹筋', emoji: '🦴' },
]

export default function ExercisesPage() {
  const router = useRouter()
  const [selectedBodyPart, setSelectedBodyPart] = useState('all')
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchExercises()
  }, [selectedBodyPart])

  const fetchExercises = async () => {
    try {
      const url =
        selectedBodyPart === 'all'
          ? '/api/exercises'
          : `/api/exercises?bodyPart=${selectedBodyPart}`

      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setExercises(data)
      }
    } catch (error) {
      console.error('Failed to fetch exercises:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExerciseSelect = (exerciseId: string) => {
    router.push(`/workout/new?exerciseId=${exerciseId}`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center">
          <button
            onClick={() => router.back()}
            className="mr-3 text-gray-600 hover:text-gray-900"
          >
            ← 戻る
          </button>
          <h1 className="text-xl font-bold text-gray-900">種目を選択</h1>
        </div>
      </div>

      {/* Body Part Tabs */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-[60px] z-10 overflow-x-auto">
        <div className="flex gap-2">
          {bodyParts.map((part) => (
            <button
              key={part.id}
              onClick={() => setSelectedBodyPart(part.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                selectedBodyPart === part.id
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {part.emoji} {part.label}
            </button>
          ))}
        </div>
      </div>

      {/* Exercise List */}
      <div className="p-4">
        {loading ? (
          <div className="text-center py-12 text-gray-500">読み込み中...</div>
        ) : exercises.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            この部位の種目が見つかりません
          </div>
        ) : (
          <div className="space-y-2">
            {exercises.map((exercise) => (
              <button
                key={exercise.id}
                onClick={() => handleExerciseSelect(exercise.id)}
                className="w-full bg-white rounded-lg p-4 shadow-sm border border-gray-100 hover:border-primary-300 transition-colors text-left"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-gray-900">{exercise.name}</h3>
                    {exercise.lastWorkoutDate && (
                      <p className="text-sm text-gray-500 mt-1">
                        前回: {exercise.lastWorkoutDate}
                      </p>
                    )}
                  </div>
                  <span className="text-gray-400">→</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
