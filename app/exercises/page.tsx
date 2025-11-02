'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ChevronRight } from 'lucide-react'
import { EXERCISES, BODY_PARTS, getExercisesByBodyPart } from '@/lib/exercises'

interface Exercise {
  id: string
  name: string
  bodyPart: string
}

export default function ExercisesPage() {
  const router = useRouter()
  const [selectedBodyPart, setSelectedBodyPart] = useState('all')

  // 即座に種目を表示（APIリクエスト不要）
  const exercises = useMemo(() => {
    return getExercisesByBodyPart(selectedBodyPart)
  }, [selectedBodyPart])

  const handleExerciseSelect = (exerciseName: string) => {
    // 種目名をURLパラメータとして渡す
    router.push(`/workout/new?exerciseName=${encodeURIComponent(exerciseName)}`)
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
        {exercises.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm">
            <p className="text-[#1e293b] font-semibold">この部位の種目が見つかりません</p>
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
                  <h3 className="font-semibold text-[#1e293b] text-lg">{exercise.name}</h3>
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
