'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { TrendingUp, Activity, Target, Dumbbell, CheckCircle } from 'lucide-react'

interface VolumeDataPoint {
  date: string
  volume: number
  workouts: number
}

interface BodyPartData {
  bodyPart: string
  volume: number
}

interface AnalyticsData {
  period: string
  startDate: string
  endDate: string
  summary: {
    totalWorkouts: number
    totalSets: number
    totalVolume: number
    uniqueExercises: number
    avgSetsPerWorkout: number
    avgVolumePerWorkout: number
  }
  volumeOverTime: VolumeDataPoint[]
  bodyPartDistribution: BodyPartData[]
}

const BODY_PART_LABELS: Record<string, string> = {
  chest: '胸',
  arms: '腕',
  shoulders: '肩',
  back: '背中',
  legs: '脚',
  abs: '腹筋',
}

const BODY_PART_COLORS: Record<string, string> = {
  chest: '#ef4444',
  arms: '#f59e0b',
  shoulders: '#10b981',
  back: '#3b82f6',
  legs: '#8b5cf6',
  abs: '#ec4899',
}

export default function WorkoutAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('30days')

  useEffect(() => {
    fetchAnalytics()
  }, [period])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/workouts/analytics?period=${period}&groupBy=day`)
      if (!response.ok) throw new Error('Failed to fetch analytics')
      const analyticsData = await response.json()
      setData(analyticsData)
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">読み込み中...</div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">データがありません</div>
      </div>
    )
  }

  // Calculate max volume for scaling
  const maxVolume = Math.max(...data.volumeOverTime.map((d) => d.volume), 1)
  const maxWorkouts = Math.max(...data.volumeOverTime.map((d) => d.workouts), 1)

  // Calculate total for body part percentages
  const totalBodyPartVolume = data.bodyPartDistribution.reduce((sum, d) => sum + d.volume, 0)

  return (
    <div className="px-6 py-6 space-y-5">
      {/* Period Filter */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="flex gap-2 overflow-x-auto">
          {[
            { value: '7days', label: '過去7日' },
            { value: '30days', label: '過去30日' },
            { value: '90days', label: '過去90日' },
            { value: 'all', label: '全期間' },
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

      {/* Summary Stats */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="font-bold text-[#1e293b] text-lg mb-5">期間サマリー</h3>
        <div className="grid grid-cols-2 gap-4 mb-5">
          <div className="bg-[#f8fafc] rounded-xl p-4 text-center">
            <div className="flex justify-center mb-2">
              <div className="p-2 bg-[#0ea5e9]/10 rounded-lg">
                <Dumbbell className="w-5 h-5 text-[#0ea5e9]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-[#0ea5e9] mb-1">
              {data.summary.totalWorkouts}
            </div>
            <div className="text-xs text-gray-600 font-medium">トレーニング回数</div>
          </div>
          <div className="bg-[#f8fafc] rounded-xl p-4 text-center">
            <div className="flex justify-center mb-2">
              <div className="p-2 bg-[#0ea5e9]/10 rounded-lg">
                <Activity className="w-5 h-5 text-[#0ea5e9]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-[#0ea5e9] mb-1">
              {data.summary.totalSets}
            </div>
            <div className="text-xs text-gray-600 font-medium">総セット数</div>
          </div>
          <div className="bg-[#f8fafc] rounded-xl p-4 text-center">
            <div className="flex justify-center mb-2">
              <div className="p-2 bg-[#0ea5e9]/10 rounded-lg">
                <TrendingUp className="w-5 h-5 text-[#0ea5e9]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-[#0ea5e9] mb-1">
              {data.summary.totalVolume.toLocaleString()}
            </div>
            <div className="text-xs text-gray-600 font-medium">総負荷量 (kg-reps)</div>
          </div>
          <div className="bg-[#f8fafc] rounded-xl p-4 text-center">
            <div className="flex justify-center mb-2">
              <div className="p-2 bg-[#0ea5e9]/10 rounded-lg">
                <Target className="w-5 h-5 text-[#0ea5e9]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-[#0ea5e9] mb-1">
              {data.summary.uniqueExercises}
            </div>
            <div className="text-xs text-gray-600 font-medium">実施種目数</div>
          </div>
        </div>
        <div className="pt-4 border-t border-gray-200 grid grid-cols-2 gap-4 text-sm">
          <div className="text-center bg-[#f8fafc] rounded-lg p-3">
            <span className="text-gray-600 font-medium">平均セット数</span>
            <div className="text-2xl font-bold text-[#1e293b] mt-1">
              {data.summary.avgSetsPerWorkout}
            </div>
          </div>
          <div className="text-center bg-[#f8fafc] rounded-lg p-3">
            <span className="text-gray-600 font-medium">平均負荷量</span>
            <div className="text-2xl font-bold text-[#1e293b] mt-1">
              {data.summary.avgVolumePerWorkout.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Volume Over Time - Bar Chart */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 bg-[#0ea5e9]/10 rounded-lg">
            <TrendingUp className="w-5 h-5 text-[#0ea5e9]" />
          </div>
          <h3 className="font-bold text-[#1e293b] text-lg">総負荷量の推移</h3>
        </div>
        <div className="space-y-3 overflow-x-auto">
          <div className="min-w-full">
            {data.volumeOverTime
              .filter((d) => d.workouts > 0)
              .map((point, index) => (
                <div key={index} className="flex items-center gap-3 mb-3">
                  <div className="text-xs text-gray-600 w-24 flex-shrink-0 font-medium">
                    {format(new Date(point.date), 'M/d(E)', { locale: ja })}
                  </div>
                  <div className="flex-1 relative h-10">
                    <div
                      className="absolute left-0 top-0 h-full bg-gradient-to-r from-[#0ea5e9] to-[#0ea5e9]/80 rounded-lg transition-all shadow-sm"
                      style={{ width: `${(point.volume / maxVolume) * 100}%`, minWidth: '60px' }}
                    >
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white font-semibold">
                        {point.volume.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
        {data.volumeOverTime.every((d) => d.workouts === 0) && (
          <div className="text-center py-12 text-gray-500">
            この期間にトレーニング記録がありません
          </div>
        )}
      </div>

      {/* Training Frequency */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 bg-[#0ea5e9]/10 rounded-lg">
            <Activity className="w-5 h-5 text-[#0ea5e9]" />
          </div>
          <h3 className="font-bold text-[#1e293b] text-lg">トレーニング頻度</h3>
        </div>
        <div className="space-y-3">
          {data.volumeOverTime
            .filter((d) => d.workouts > 0)
            .map((point, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="text-xs text-gray-600 w-24 flex-shrink-0 font-medium">
                  {format(new Date(point.date), 'M/d(E)', { locale: ja })}
                </div>
                <div className="flex-1">
                  <div className="flex gap-2">
                    {Array.from({ length: point.workouts }).map((_, i) => (
                      <div
                        key={i}
                        className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center text-white shadow-sm"
                      >
                        <CheckCircle className="w-5 h-5" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
        </div>
        {data.volumeOverTime.every((d) => d.workouts === 0) && (
          <div className="text-center py-12 text-gray-500">
            この期間にトレーニング記録がありません
          </div>
        )}
      </div>

      {/* Body Part Distribution */}
      {data.bodyPartDistribution.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 bg-[#0ea5e9]/10 rounded-lg">
              <Target className="w-5 h-5 text-[#0ea5e9]" />
            </div>
            <h3 className="font-bold text-[#1e293b] text-lg">部位別ボリューム配分</h3>
          </div>
          <div className="space-y-4 mb-6">
            {data.bodyPartDistribution.map((bodyPart, index) => {
              const percentage = ((bodyPart.volume / totalBodyPartVolume) * 100).toFixed(1)
              const color = BODY_PART_COLORS[bodyPart.bodyPart] || '#6b7280'

              return (
                <div key={index}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-[#1e293b]">
                      {BODY_PART_LABELS[bodyPart.bodyPart] || bodyPart.bodyPart}
                    </span>
                    <span className="text-xs text-gray-600 font-medium">
                      {bodyPart.volume.toLocaleString()} kg-reps ({percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: color,
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Simple Pie Chart Representation */}
          <div className="mt-8 flex items-center justify-center">
            <div className="relative w-56 h-56">
              <svg viewBox="0 0 100 100" className="transform -rotate-90 drop-shadow-md">
                {data.bodyPartDistribution.map((bodyPart, index) => {
                  const percentage = (bodyPart.volume / totalBodyPartVolume) * 100
                  const previousPercentages = data.bodyPartDistribution
                    .slice(0, index)
                    .reduce((sum, bp) => sum + (bp.volume / totalBodyPartVolume) * 100, 0)

                  const startAngle = (previousPercentages / 100) * 360
                  const endAngle = startAngle + (percentage / 100) * 360

                  // Calculate path for pie slice
                  const startRad = (startAngle * Math.PI) / 180
                  const endRad = (endAngle * Math.PI) / 180
                  const x1 = 50 + 40 * Math.cos(startRad)
                  const y1 = 50 + 40 * Math.sin(startRad)
                  const x2 = 50 + 40 * Math.cos(endRad)
                  const y2 = 50 + 40 * Math.sin(endRad)
                  const largeArc = percentage > 50 ? 1 : 0

                  const color = BODY_PART_COLORS[bodyPart.bodyPart] || '#6b7280'

                  return (
                    <path
                      key={index}
                      d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`}
                      fill={color}
                      opacity="0.95"
                    />
                  )
                })}
                {/* Center white circle for donut effect */}
                <circle cx="50" cy="50" r="22" fill="white" />
              </svg>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
