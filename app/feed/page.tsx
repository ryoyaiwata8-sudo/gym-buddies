'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import Link from 'next/link'
import { Heart, MessageCircle, Send, Search, Users, Award, Dumbbell } from 'lucide-react'

interface WorkoutSet {
  id: string
  exercise: string
  weightKg: number
  reps: number
  rpe?: number
  prType?: string
}

interface Comment {
  id: string
  userId: string
  content: string
  createdAt: string
  user: {
    id: string
    displayName: string
    avatarUrl?: string
  }
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
  commentsCount: number
  totalLoad: number
}

export default function FeedPage() {
  const { data: session, status } = useSession()
  const [workouts, setWorkouts] = useState<FeedWorkout[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({})
  const [comments, setComments] = useState<Record<string, Comment[]>>({})
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({})
  const [submittingComment, setSubmittingComment] = useState<Record<string, boolean>>({})

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

  const toggleComments = async (workoutId: string) => {
    const isExpanded = expandedComments[workoutId]

    if (!isExpanded) {
      // Fetch comments
      try {
        const response = await fetch(`/api/comments?workoutId=${workoutId}`)
        if (response.ok) {
          const data = await response.json()
          setComments({ ...comments, [workoutId]: data.comments })
        }
      } catch (error) {
        console.error('Failed to fetch comments:', error)
      }
    }

    setExpandedComments({ ...expandedComments, [workoutId]: !isExpanded })
  }

  const handleCommentSubmit = async (workoutId: string) => {
    const content = commentInputs[workoutId]?.trim()
    if (!content) return

    try {
      setSubmittingComment({ ...submittingComment, [workoutId]: true })

      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workoutId, content }),
      })

      if (response.ok) {
        const data = await response.json()
        // Add new comment to list
        setComments({
          ...comments,
          [workoutId]: [...(comments[workoutId] || []), data.comment],
        })
        // Clear input
        setCommentInputs({ ...commentInputs, [workoutId]: '' })
        // Update comment count
        setWorkouts(
          workouts.map((w) =>
            w.id === workoutId
              ? { ...w, commentsCount: w.commentsCount + 1 }
              : w
          )
        )
      }
    } catch (error) {
      console.error('Failed to post comment:', error)
    } finally {
      setSubmittingComment({ ...submittingComment, [workoutId]: false })
    }
  }

  const handleCommentDelete = async (workoutId: string, commentId: string) => {
    if (!confirm('コメントを削除しますか？')) return

    try {
      const response = await fetch(`/api/comments?id=${commentId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        // Remove comment from list
        setComments({
          ...comments,
          [workoutId]: comments[workoutId].filter((c) => c.id !== commentId),
        })
        // Update comment count
        setWorkouts(
          workouts.map((w) =>
            w.id === workoutId
              ? { ...w, commentsCount: w.commentsCount - 1 }
              : w
          )
        )
      }
    } catch (error) {
      console.error('Failed to delete comment:', error)
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
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Header */}
      <div className="bg-white shadow-sm px-6 py-5 sticky top-0 z-10">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-[#1e293b]">友達フィード</h1>
          <Link
            href="/users"
            className="flex items-center gap-2 px-4 py-2 bg-[#0ea5e9] text-white rounded-lg hover:bg-[#0ea5e9]/90 transition-all font-medium"
          >
            <Search className="w-4 h-4" />
            ユーザー検索
          </Link>
        </div>
      </div>

      {/* Feed */}
      <div className="max-w-3xl mx-auto px-6 py-6 space-y-4">
        {workouts.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-[#0ea5e9]/10 rounded-full">
                <Users className="w-12 h-12 text-[#0ea5e9]" />
              </div>
            </div>
            <p className="text-[#1e293b] font-semibold mb-2">フィードが空です</p>
            <p className="text-sm text-gray-500 mb-6">
              友達をフォローして、<br />
              トレーニング記録を共有しましょう！
            </p>
            <Link
              href="/users"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#0ea5e9] text-white rounded-lg hover:bg-[#0ea5e9]/90 font-medium"
            >
              <Search className="w-4 h-4" />
              ユーザーを探す
            </Link>
          </div>
        ) : (
          workouts.map((workout) => (
            <div
              key={workout.id}
              className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              {/* User Info */}
              <div className="flex items-center mb-4">
                <div className="w-11 h-11 bg-[#0ea5e9]/10 rounded-full flex items-center justify-center text-[#0ea5e9] font-bold mr-3">
                  {workout.user.displayName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-semibold text-[#1e293b]">
                    {workout.user.displayName}
                    {workout.user.id === session?.user?.id && (
                      <span className="ml-2 text-xs bg-[#0ea5e9]/10 text-[#0ea5e9] px-2 py-1 rounded-full font-medium">
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
              <div className="mb-4">
                <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                  <span className="flex items-center gap-1 font-medium">
                    <Dumbbell className="w-4 h-4" />
                    {workout.totalSets} セット
                  </span>
                  <span className="font-medium">
                    {Math.round(workout.totalLoad).toLocaleString()} kg-reps
                  </span>
                </div>

                {/* Sets Preview */}
                <div className="space-y-2 bg-[#f8fafc] rounded-lg p-3">
                  {workout.sets.map((set, idx) => (
                    <div key={set.id} className="text-sm text-[#1e293b] flex items-center justify-between">
                      <span className="font-medium">{set.exercise}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{set.weightKg}kg × {set.reps}回</span>
                        {set.prType && (
                          <span className="flex items-center gap-1 text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full font-medium">
                            <Award className="w-3 h-3" />
                            PR
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  {workout.totalSets > 3 && (
                    <div className="text-sm text-gray-400 text-center pt-1">
                      ...他 {workout.totalSets - 3} セット
                    </div>
                  )}
                </div>

                {/* Note */}
                {workout.note && (
                  <p className="mt-3 text-sm text-gray-600 bg-[#f8fafc] p-3 rounded-lg border-l-4 border-[#0ea5e9]">
                    {workout.note}
                  </p>
                )}
              </div>

              {/* Like & Comment Buttons */}
              <div className="flex items-center gap-2 pt-4 border-t">
                <button
                  onClick={() => handleLike(workout.id, workout.likedByMe)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    workout.likedByMe
                      ? 'bg-red-50 text-red-600'
                      : 'bg-[#f8fafc] text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${workout.likedByMe ? 'fill-current' : ''}`} />
                  {workout.likesCount > 0 && workout.likesCount}
                </button>
                <button
                  onClick={() => toggleComments(workout.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    expandedComments[workout.id]
                      ? 'bg-[#0ea5e9]/10 text-[#0ea5e9]'
                      : 'bg-[#f8fafc] text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <MessageCircle className="w-4 h-4" />
                  {workout.commentsCount > 0 && workout.commentsCount}
                </button>
              </div>

              {/* Comments Section */}
              {expandedComments[workout.id] && (
                <div className="mt-4 pt-4 border-t">
                  {/* Comments List */}
                  {comments[workout.id] && comments[workout.id].length > 0 && (
                    <div className="space-y-3 mb-4">
                      {comments[workout.id].map((comment) => (
                        <div key={comment.id} className="flex gap-3">
                          <div className="w-9 h-9 bg-[#0ea5e9]/10 rounded-full flex items-center justify-center text-[#0ea5e9] text-sm font-bold flex-shrink-0">
                            {comment.user.displayName.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 bg-[#f8fafc] rounded-lg p-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-semibold text-[#1e293b]">
                                {comment.user.displayName}
                              </span>
                              {comment.userId === session?.user?.id && (
                                <button
                                  onClick={() => handleCommentDelete(workout.id, comment.id)}
                                  className="text-xs text-red-500 hover:text-red-700 font-medium"
                                >
                                  削除
                                </button>
                              )}
                            </div>
                            <p className="text-sm text-[#1e293b]">{comment.content}</p>
                            <div className="text-xs text-gray-500 mt-1">
                              {format(new Date(comment.createdAt), 'M月d日 HH:mm', { locale: ja })}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Comment Form */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={commentInputs[workout.id] || ''}
                      onChange={(e) =>
                        setCommentInputs({ ...commentInputs, [workout.id]: e.target.value })
                      }
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !submittingComment[workout.id]) {
                          handleCommentSubmit(workout.id)
                        }
                      }}
                      placeholder="コメントを入力..."
                      className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5e9] focus:border-transparent text-sm"
                      maxLength={500}
                    />
                    <button
                      onClick={() => handleCommentSubmit(workout.id)}
                      disabled={
                        !commentInputs[workout.id]?.trim() ||
                        submittingComment[workout.id]
                      }
                      className="flex items-center gap-2 px-4 py-2.5 bg-[#0ea5e9] text-white rounded-lg hover:bg-[#0ea5e9]/90 transition-colors disabled:bg-gray-300 text-sm font-semibold"
                    >
                      <Send className="w-4 h-4" />
                      送信
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
