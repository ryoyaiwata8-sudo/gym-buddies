'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Dumbbell, ChevronRight } from 'lucide-react'

interface Exercise {
  id: string
  name: string
  bodyPart: string
  lastWorkoutDate?: string
}

const bodyParts = [
  { id: 'all', label: 'ALL' },
  { id: 'chest', label: '胸' },
  { id: 'arms', label: '腕' },
  { id: 'shoulders', label: '肩' },
  { id: 'back', label: '背中' },
  { id: 'legs', label: '脚' },
  { id: 'abs', label: '腹筋' },
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
        setExercises(data.exercises || data)
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
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Header */}
      <div className="bg-white shadow-sm px-6 py-5 sticky top-0 z-10">
        <div className="flex items-center max-w-7xl mx-auto">
          <button
            onClick={() => router.back()}
            className="mr-4 p-2 hover:bg-[#f8fafc] rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-[#1e293b]" />
          </button>
          <h1 className="text-2xl font-bold text-[#1e293b]">種目を選択</h1>
        </div>
      </div>

      {/* Body Part Tabs */}
      <div className="bg-white shadow-sm sticky top-[73px] z-10">
        <div className="overflow-x-auto px-4 py-4 scrollbar-hide">
          <div className="flex gap-2 min-w-max">
            {bodyParts.map((part) => (
              <button
                key={part.id}
                onClick={() => setSelectedBodyPart(part.id)}
                className={`px-5 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
                  selectedBodyPart === part.id
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
          <div className="text-center py-12 text-gray-500">読み込み中...</div>
        ) : exercises.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-[#0ea5e9]/10 rounded-full">
                <Dumbbell className="w-12 h-12 text-[#0ea5e9]" />
              </div>
            </div>
            <p className="text-[#1e293b] font-semibold">この部位の種目が見つかりません</p>
          </div>
        ) : (
          <div className="space-y-3">
            {exercises.map((exercise) => (
              <button
                key={exercise.id}
                onClick={() => handleExerciseSelect(exercise.id)}
                className="w-full bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-all text-left group"
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#0ea5e9]/10 rounded-lg">
                      <Dumbbell className="w-5 h-5 text-[#0ea5e9]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#1e293b] text-lg">{exercise.name}</h3>
                      {exercise.lastWorkoutDate && (
                        <p className="text-sm text-gray-500 mt-1">
                          前回: {exercise.lastWorkoutDate}
                        </p>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[#0ea5e9] transition-colors" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
