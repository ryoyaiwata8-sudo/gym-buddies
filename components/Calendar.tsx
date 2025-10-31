'use client'

import { useState, useEffect } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns'
import { ja } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Dumbbell, X } from 'lucide-react'

interface DayStats {
  date: string
  workoutCount: number
  totalSets: number
  totalVolume: number
  exercises: string[]
  exerciseCount: number
}

interface CalendarData {
  year: number
  month: number
  days: DayStats[]
}

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [calendarData, setCalendarData] = useState<CalendarData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState<DayStats | null>(null)

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 })
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  useEffect(() => {
    fetchCalendarData()
  }, [currentDate])

  const fetchCalendarData = async () => {
    try {
      setLoading(true)
      const year = currentDate.getFullYear()
      const month = currentDate.getMonth() + 1
      const response = await fetch(`/api/workouts/calendar?year=${year}&month=${month}`)

      if (!response.ok) {
        throw new Error('Failed to fetch calendar data')
      }

      const data = await response.json()
      setCalendarData(data)
    } catch (error) {
      console.error('Error fetching calendar data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getDayData = (day: Date): DayStats | undefined => {
    const dateKey = format(day, 'yyyy-MM-dd')
    return calendarData?.days.find(d => d.date === dateKey)
  }

  const handlePrevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1))
    setSelectedDay(null)
  }

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1))
    setSelectedDay(null)
  }

  const handleDayClick = (day: Date) => {
    const dayData = getDayData(day)
    if (dayData) {
      setSelectedDay(dayData)
    }
  }

  return (
    <div className="bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5">
        <button
          onClick={handlePrevMonth}
          className="p-2 hover:bg-[#0ea5e9]/10 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-6 h-6 text-[#1e293b]" />
        </button>
        <h2 className="text-lg font-bold text-[#1e293b]">
          {format(currentDate, 'yyyy年M月', { locale: ja })}
        </h2>
        <button
          onClick={handleNextMonth}
          className="p-2 hover:bg-[#0ea5e9]/10 rounded-lg transition-colors"
        >
          <ChevronRight className="w-6 h-6 text-[#1e293b]" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="px-6 pb-6">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-2 mb-3">
          {['日', '月', '火', '水', '木', '金', '土'].map((day, index) => (
            <div
              key={day}
              className={`text-center text-xs font-semibold py-2 ${
                index === 0 ? 'text-red-500' : index === 6 ? 'text-blue-500' : 'text-gray-600'
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((day, index) => {
            const dayData = getDayData(day)
            const isCurrentMonth = isSameMonth(day, currentDate)
            const isToday = isSameDay(day, new Date())
            const hasWorkout = !!dayData

            return (
              <button
                key={index}
                onClick={() => handleDayClick(day)}
                disabled={!hasWorkout}
                className={`
                  aspect-square p-2 rounded-xl text-sm relative transition-all
                  ${!isCurrentMonth ? 'text-gray-300' : 'text-[#1e293b]'}
                  ${isToday && !hasWorkout ? 'bg-[#0ea5e9]/10 ring-2 ring-[#0ea5e9]' : ''}
                  ${isToday && hasWorkout ? 'ring-2 ring-[#0ea5e9]' : ''}
                  ${hasWorkout ? 'bg-[#0ea5e9] hover:bg-[#0ea5e9]/90 cursor-pointer shadow-sm hover:shadow-md text-white' : 'cursor-default'}
                  ${!hasWorkout && isCurrentMonth ? 'hover:bg-[#f8fafc]' : ''}
                `}
              >
                <div className="flex flex-col items-center justify-center h-full">
                  <div className={`font-bold text-base ${hasWorkout ? 'text-white' : isToday ? 'text-[#0ea5e9]' : ''}`}>
                    {format(day, 'd')}
                  </div>
                  {hasWorkout && (
                    <div className="flex items-center justify-center mt-1">
                      <Dumbbell className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Selected Day Details */}
      {selectedDay && (
        <div className="bg-[#f8fafc] px-6 py-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-[#1e293b] text-lg">
              {format(new Date(selectedDay.date), 'M月d日(E)', { locale: ja })}のトレーニング
            </h3>
            <button
              onClick={() => setSelectedDay(null)}
              className="p-1.5 hover:bg-white rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="bg-white rounded-xl p-4 text-center shadow-sm">
              <div className="text-2xl font-bold text-[#0ea5e9] mb-1">
                {selectedDay.exerciseCount}
              </div>
              <div className="text-xs text-gray-600 font-medium">種目</div>
            </div>
            <div className="bg-white rounded-xl p-4 text-center shadow-sm">
              <div className="text-2xl font-bold text-[#0ea5e9] mb-1">
                {selectedDay.totalSets}
              </div>
              <div className="text-xs text-gray-600 font-medium">セット</div>
            </div>
            <div className="bg-white rounded-xl p-4 text-center shadow-sm">
              <div className="text-2xl font-bold text-[#0ea5e9] mb-1">
                {Math.round(selectedDay.totalVolume).toLocaleString()}
              </div>
              <div className="text-xs text-gray-600 font-medium">総負荷(kg)</div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm">
            <h4 className="text-sm font-semibold text-[#1e293b] mb-3">実施種目</h4>
            <div className="flex flex-wrap gap-2">
              {selectedDay.exercises.map((exercise, index) => (
                <span
                  key={index}
                  className="px-3 py-1.5 bg-[#0ea5e9]/10 text-[#0ea5e9] text-xs font-medium rounded-full"
                >
                  {exercise}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
          <div className="text-gray-500">読み込み中...</div>
        </div>
      )}
    </div>
  )
}
