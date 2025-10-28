'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import Link from 'next/link'

interface WorkoutSet {
  id: string
  exercise: string
  weightKg: number
  reps: number
  rpe?: number
  prType?: string
}

interface FeedWorkout {
  id: string
  user: {
    id: string
    displayName: string
    avatarUrl?: string
  }
  date: string
  note?: string
  createdAt: string
  totalSets: number
  sets: WorkoutSet[]
  likesCount: number
  likedByMe: boolean
  totalLoad: number
}

export default function FeedPage() {
  const { data: session, status } = useSession()
  const [workouts, setWorkouts] = useState<FeedWorkout[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/login')
    }
    if (status === 'authenticated') {
      fetchFeed()
    }
  }, [status])

  const fetchFeed = async () => {
    try {
      const response = await fetch('/api/feed')
      if (response.ok) {
        const data = await response.json()
        setWorkouts(data.workouts)
      }
    } catch (error) {
      console.error('Failed to fetch feed:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLike = async (workoutId: string, isLiked: boolean) => {
    try {
      if (isLiked) {
        // Unlike
        await fetch(`/api/likes?workoutId=${workoutId}`, {
          method: 'DELETE',
        })
      } else {
        // Like
        await fetch('/api/likes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ workoutId }),
        })
      }

      // Update local state
      setWorkouts(
        workouts.map((w) =>
          w.id === workoutId
            ? {
                ...w,
                likedByMe: !isLiked,
                likesCount: isLiked ? w.likesCount - 1 : w.likesCount + 1,
              }
            : w
        )
      )
    } catch (error) {
      console.error('Failed to toggle like:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200 px-4 py-4">
          <h1 className="text-xl font-bold text-gray-900">友達フィード</h1>
        </div>
        <div className="flex items-center justify-center h-96">
          <div className="text-gray-500">読み込み中...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">友達フィード</h1>
          <Link
            href="/users"
            className="text-primary-600 hover:text-primary-700 text-sm font-medium"
          >
            🔍 ユーザー検索
          </Link>
        </div>
      </div>

      {/* Feed */}
      <div className="p-4 space-y-4">
        {workouts.length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center">
            <div className="text-6xl mb-4">👥</div>
            <p className="text-gray-600 mb-2">フィードが空です</p>
            <p className="text-sm text-gray-400 mb-4">
              友達をフォローして、<br />
              トレーニング記録を共有しましょう！
            </p>
            <Link
              href="/users"
              className="inline-block px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              ユーザーを探す
            </Link>
          </div>
        ) : (
          workouts.map((workout) => (
            <div
              key={workout.id}
              className="bg-white rounded-lg p-4 shadow-sm border border-gray-100"
            >
              {/* User Info */}
              <div className="flex items-center mb-3">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-semibold mr-3">
                  {workout.user.displayName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-semibold text-gray-900">
                    {workout.user.displayName}
                    {workout.user.id === session?.user?.id && (
                      <span className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded">
                        自分
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    {format(new Date(workout.createdAt), 'M月d日 HH:mm', {
                      locale: ja,
                    })}
                  </div>
                </div>
              </div>

              {/* Workout Details */}
              <div className="mb-3">
                <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                  <span>{workout.totalSets} セット</span>
                  <span>
                    {Math.round(workout.totalLoad).toLocaleString()} kg-reps
                  </span>
                </div>

                {/* Sets Preview */}
                <div className="space-y-1">
                  {workout.sets.map((set, idx) => (
                    <div key={set.id} className="text-sm text-gray-700">
                      {set.exercise}: {set.weightKg}kg × {set.reps}回
                      {set.prType && (
                        <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
                          🏆 PR
                        </span>
                      )}
                    </div>
                  ))}
                  {workout.totalSets > 3 && (
                    <div className="text-sm text-gray-400">
                      ...他 {workout.totalSets - 3} セット
                    </div>
                  )}
                </div>

                {/* Note */}
                {workout.note && (
                  <p className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                    {workout.note}
                  </p>
                )}
              </div>

              {/* Like Button */}
              <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                <button
                  onClick={() => handleLike(workout.id, workout.likedByMe)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    workout.likedByMe
                      ? 'bg-red-50 text-red-600'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {workout.likedByMe ? '❤️' : '🤍'}{' '}
                  {workout.likesCount > 0 && workout.likesCount}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
