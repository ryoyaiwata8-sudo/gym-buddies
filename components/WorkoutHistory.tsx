'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { ChevronDown, ChevronRight, Dumbbell, Award } from 'lucide-react'

interface WorkoutSet {
  id: string
  weightKg: number
  reps: number
  rpe?: number
  prType?: string
}

interface Exercise {
  name: string
  bodyPart: string
  sets: WorkoutSet[]
}

interface Workout {
  id: string
  date: string
  note?: string
  totalSets: number
  totalVolume: number
  exerciseCount: number
  exercises: Exercise[]
}

const BODY_PART_LABELS: Record<string, string> = {
  chest: '胸',
  arms: '腕',
  shoulders: '肩',
  back: '背中',
  legs: '脚',
  abs: '腹筋',
}

export default function WorkoutHistory() {
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('all')
  const [expandedWorkout, setExpandedWorkout] = useState<string | null>(null)

  useEffect(() => {
    fetchHistory()
  }, [period])

  const fetchHistory = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/workouts/history?period=${period}`)
      if (!response.ok) throw new Error('Failed to fetch history')
      const data = await response.json()
      setWorkouts(data.workouts)
    } catch (error) {
      console.error('Error fetching history:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleWorkout = (workoutId: string) => {
    setExpandedWorkout(expandedWorkout === workoutId ? null : workoutId)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="px-6 py-6 space-y-5">
      {/* Period Filter */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="flex gap-2 overflow-x-auto">
          {[
            { value: 'all', label: '全期間' },
            { value: 'week', label: '過去7日' },
            { value: 'month', label: '過去30日' },
            { value: '3months', label: '過去90日' },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setPeriod(option.value)}
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
                period === option.value
                  ? 'bg-[#0ea5e9] text-white shadow-sm'
                  : 'bg-[#f8fafc] text-gray-600 hover:bg-gray-200'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Workouts List */}
      {workouts.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-[#0ea5e9]/10 rounded-full">
              <Dumbbell className="w-12 h-12 text-[#0ea5e9]" />
            </div>
          </div>
          <p className="text-[#1e293b] font-semibold">この期間にトレーニング記録がありません</p>
        </div>
      ) : (
        <div className="space-y-4">
          {workouts.map((workout) => {
            const isExpanded = expandedWorkout === workout.id

            return (
              <div
                key={workout.id}
                className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Workout Header */}
                <button
                  onClick={() => toggleWorkout(workout.id)}
                  className="w-full px-5 py-4 text-left hover:bg-[#f8fafc] transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="font-bold text-[#1e293b] text-lg">
                      {format(new Date(workout.date), 'M月d日(E)', { locale: ja })}
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="font-medium">{workout.exerciseCount} 種目</span>
                    <span className="font-medium">{workout.totalSets} セット</span>
                    <span className="font-medium">{Math.round(workout.totalVolume).toLocaleString()} kg-reps</span>
                  </div>
                </button>

                {/* Workout Details */}
                {isExpanded && (
                  <div className="bg-[#f8fafc] px-5 py-4">
                    <div className="space-y-3">
                      {workout.exercises.map((exercise, idx) => (
                        <div key={idx} className="bg-white rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Dumbbell className="w-4 h-4 text-[#0ea5e9]" />
                              <h4 className="font-semibold text-[#1e293b]">{exercise.name}</h4>
                            </div>
                            <span className="text-xs bg-[#0ea5e9]/10 text-[#0ea5e9] px-3 py-1 rounded-full font-medium">
                              {BODY_PART_LABELS[exercise.bodyPart] || exercise.bodyPart}
                            </span>
                          </div>
                          <div className="space-y-2">
                            {exercise.sets.map((set, setIdx) => (
                              <div
                                key={set.id}
                                className="flex items-center justify-between text-sm bg-[#f8fafc] rounded-lg px-3 py-2"
                              >
                                <span className="text-gray-600 font-medium">
                                  セット {setIdx + 1}
                                </span>
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-[#1e293b]">
                                    {set.weightKg}kg × {set.reps}回
                                  </span>
                                  {set.rpe && (
                                    <span className="text-xs text-gray-500 font-medium">
                                      RPE {set.rpe}
                                    </span>
                                  )}
                                  {set.prType && (
                                    <span className="flex items-center gap-1 text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full font-medium">
                                      <Award className="w-3 h-3" />
                                      PR
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                      {workout.note && (
                        <div className="bg-white rounded-lg p-4">
                          <div className="text-xs text-gray-500 font-semibold mb-2">メモ</div>
                          <p className="text-sm text-[#1e293b]">{workout.note}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
