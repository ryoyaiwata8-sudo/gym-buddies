'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Dumbbell, Activity, TrendingUp, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

interface UserProfile {
  user: {
    id: string
    displayName: string
    avatarUrl?: string
    bio?: string
    bodyWeightKg?: number
    heightCm?: number
    createdAt: string
  }
  stats?: {
    totalWorkouts: number
    totalSets: number
    totalLoad: number
  }
  isOwnProfile: boolean
  isFriend: boolean
  message?: string
}

interface Exercise {
  name: string
  bodyPart: string
  sets: {
    id: string
    weightKg: number
    reps: number
    rpe?: number
    prType?: string
  }[]
}

interface Workout {
  id: string
  date: string
  note?: string
  exercises: Exercise[]
  totalSets: number
  totalLoad: number
}

export default function UserProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const userId = params.id as string

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'profile' | 'workouts'>('profile')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated' && userId) {
      fetchProfile()
    }
  }, [status, userId])

  useEffect(() => {
    if (status === 'authenticated' && userId && tab === 'workouts' && profile?.isFriend) {
      fetchWorkouts()
    }
  }, [status, userId, tab, profile])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/users/${userId}`)
      if (response.ok) {
        const data = await response.json()
        setProfile(data)
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchWorkouts = async () => {
    try {
      const response = await fetch(`/api/users/${userId}/workouts`)
      if (response.ok) {
        const data = await response.json()
        setWorkouts(data.workouts)
      }
    } catch (error) {
      console.error('Failed to fetch workouts:', error)
    }
  }

  const calculateBMI = (weightKg?: number, heightCm?: number) => {
    if (!weightKg || !heightCm) return null
    const heightM = heightCm / 100
    return (weightKg / (heightM * heightM)).toFixed(1)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">読み込み中...</p>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">ユーザーが見つかりません</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm px-6 py-5 sticky top-0 z-10">
        <div className="flex items-center gap-4 max-w-7xl mx-auto">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-[#f8fafc] rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-[#1e293b]" />
          </button>
          <h1 className="text-2xl font-bold text-[#1e293b]">プロフィール</h1>
        </div>
      </div>

      {/* Profile Header */}
      <div className="max-w-3xl mx-auto px-6 py-6">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 bg-[#0ea5e9]/10 rounded-full flex items-center justify-center text-[#0ea5e9] text-3xl font-bold">
              {profile.user.displayName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-[#1e293b] mb-2">
                {profile.user.displayName}
              </h2>
              {profile.user.bio && (
                <p className="text-gray-600 mb-3">{profile.user.bio}</p>
              )}
              <p className="text-sm text-gray-500">
                登録日: {format(new Date(profile.user.createdAt), 'yyyy年M月d日', { locale: ja })}
              </p>
            </div>
          </div>
        </div>

        {/* Not Friend Message */}
        {!profile.isFriend && profile.message && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mt-4">
            <p className="text-yellow-800 text-center">{profile.message}</p>
          </div>
        )}

        {/* Tabs */}
        {profile.isFriend && (
          <div className="flex gap-4 mt-6 border-b border-gray-200">
            <button
              onClick={() => setTab('profile')}
              className={`pb-3 px-2 font-medium transition-colors ${
                tab === 'profile'
                  ? 'border-b-2 border-[#0ea5e9] text-[#0ea5e9]'
                  : 'text-gray-500'
              }`}
            >
              プロフィール
            </button>
            <button
              onClick={() => setTab('workouts')}
              className={`pb-3 px-2 font-medium transition-colors ${
                tab === 'workouts'
                  ? 'border-b-2 border-[#0ea5e9] text-[#0ea5e9]'
                  : 'text-gray-500'
              }`}
            >
              ワークアウト履歴
            </button>
          </div>
        )}

        {/* Profile Tab */}
        {tab === 'profile' && profile.isFriend && profile.stats && (
          <div className="space-y-4 mt-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-center mb-2">
                  <Dumbbell className="w-6 h-6 text-[#0ea5e9]" />
                </div>
                <div className="text-2xl font-bold text-center text-[#1e293b]">
                  {profile.stats.totalWorkouts}
                </div>
                <div className="text-xs text-center text-gray-600">
                  ワークアウト
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-center mb-2">
                  <Activity className="w-6 h-6 text-[#0ea5e9]" />
                </div>
                <div className="text-2xl font-bold text-center text-[#1e293b]">
                  {profile.stats.totalSets}
                </div>
                <div className="text-xs text-center text-gray-600">
                  総セット数
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-center mb-2">
                  <TrendingUp className="w-6 h-6 text-[#0ea5e9]" />
                </div>
                <div className="text-2xl font-bold text-center text-[#1e293b]">
                  {Math.round(profile.stats.totalLoad / 1000)}k
                </div>
                <div className="text-xs text-center text-gray-600">
                  総負荷量(kg-reps)
                </div>
              </div>
            </div>

            {/* Body Stats */}
            {(profile.user.bodyWeightKg || profile.user.heightCm) && (
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="font-bold text-[#1e293b] mb-4">体組成</h3>
                <div className="grid grid-cols-2 gap-4">
                  {profile.user.bodyWeightKg && (
                    <div>
                      <p className="text-sm text-gray-600">体重</p>
                      <p className="text-xl font-bold text-[#1e293b]">
                        {profile.user.bodyWeightKg} kg
                      </p>
                    </div>
                  )}
                  {profile.user.heightCm && (
                    <div>
                      <p className="text-sm text-gray-600">身長</p>
                      <p className="text-xl font-bold text-[#1e293b]">
                        {profile.user.heightCm} cm
                      </p>
                    </div>
                  )}
                  {profile.user.bodyWeightKg && profile.user.heightCm && (
                    <div>
                      <p className="text-sm text-gray-600">BMI</p>
                      <p className="text-xl font-bold text-[#1e293b]">
                        {calculateBMI(profile.user.bodyWeightKg, profile.user.heightCm)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Workouts Tab */}
        {tab === 'workouts' && profile.isFriend && (
          <div className="space-y-4 mt-6">
            {workouts.length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center shadow-sm">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">ワークアウト履歴がありません</p>
              </div>
            ) : (
              workouts.map((workout) => (
                <div key={workout.id} className="bg-white rounded-xl p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-[#1e293b]">
                      {format(new Date(workout.date), 'M月d日（E）', { locale: ja })}
                    </h3>
                    <div className="text-sm text-gray-600">
                      {workout.totalSets}セット · {Math.round(workout.totalLoad).toLocaleString()} kg-reps
                    </div>
                  </div>
                  {workout.exercises.map((exercise, idx) => (
                    <div key={idx} className="mb-3 last:mb-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-semibold text-[#1e293b]">
                          {exercise.name}
                        </span>
                        <span className="text-xs bg-[#0ea5e9]/10 text-[#0ea5e9] px-2 py-1 rounded-full">
                          {exercise.bodyPart}
                        </span>
                      </div>
                      <div className="space-y-1">
                        {exercise.sets.map((set, setIdx) => (
                          <div key={set.id} className="text-sm text-gray-600 flex items-center justify-between">
                            <span>セット {setIdx + 1}</span>
                            <span className="font-medium text-[#1e293b]">
                              {set.weightKg}kg × {set.reps}回
                              {set.rpe && ` (RPE: ${set.rpe})`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  {workout.note && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-sm text-gray-600">{workout.note}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
