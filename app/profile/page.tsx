'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { useRouter } from 'next/navigation'

interface UserProfile {
  id: string
  email: string
  displayName: string
  avatarUrl: string | null
  bodyWeightKg: number | null
  heightCm: number | null
  bio: string | null
  unitPref: string
}

export default function ProfilePage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    displayName: '',
    avatarUrl: '',
    bodyWeightKg: '',
    heightCm: '',
    bio: '',
    unitPref: 'kg',
  })

  useEffect(() => {
    if (session) {
      fetchProfile()
    }
  }, [session])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/profile')
      if (!response.ok) throw new Error('Failed to fetch profile')
      const data = await response.json()
      setProfile(data.user)
      setFormData({
        displayName: data.user.displayName || '',
        avatarUrl: data.user.avatarUrl || '',
        bodyWeightKg: data.user.bodyWeightKg?.toString() || '',
        heightCm: data.user.heightCm?.toString() || '',
        bio: data.user.bio || '',
        unitPref: data.user.unitPref || 'kg',
      })
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.displayName.trim()) {
      alert('表示名を入力してください')
      return
    }

    try {
      setSubmitting(true)
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: formData.displayName.trim(),
          avatarUrl: formData.avatarUrl || null,
          bodyWeightKg: formData.bodyWeightKg ? parseFloat(formData.bodyWeightKg) : null,
          heightCm: formData.heightCm ? parseFloat(formData.heightCm) : null,
          bio: formData.bio || null,
          unitPref: formData.unitPref,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '更新に失敗しました')
      }

      alert('プロフィールを更新しました')
      router.push('/settings')
    } catch (error: any) {
      alert(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (!session) {
    redirect('/login')
  }

  const bmi = formData.bodyWeightKg && formData.heightCm
    ? (parseFloat(formData.bodyWeightKg) / Math.pow(parseFloat(formData.heightCm) / 100, 2)).toFixed(1)
    : null

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-900"
          >
            ←
          </button>
          <h1 className="text-xl font-bold text-gray-900">プロフィール編集</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-gray-500">読み込み中...</div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Avatar */}
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                アバター
              </label>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-3xl overflow-hidden">
                  {formData.avatarUrl ? (
                    <img
                      src={formData.avatarUrl}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>👤</span>
                  )}
                </div>
                <div className="flex-1">
                  <input
                    type="url"
                    value={formData.avatarUrl}
                    onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="画像URLを入力"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    画像のURLを入力してください
                  </p>
                </div>
              </div>
            </div>

            {/* Basic Info */}
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 space-y-4">
              <h2 className="font-bold text-gray-900">基本情報</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  表示名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="山田太郎"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  メールアドレス
                </label>
                <input
                  type="email"
                  value={profile?.email || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  disabled
                />
                <p className="text-xs text-gray-500 mt-1">
                  メールアドレスは変更できません
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  自己紹介
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={3}
                  placeholder="筋トレ歴3年です。一緒に頑張りましょう！"
                  maxLength={500}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.bio.length} / 500文字
                </p>
              </div>
            </div>

            {/* Body Stats */}
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 space-y-4">
              <h2 className="font-bold text-gray-900">身体情報</h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    体重 (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.bodyWeightKg}
                    onChange={(e) => setFormData({ ...formData, bodyWeightKg: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="70.0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    身長 (cm)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.heightCm}
                    onChange={(e) => setFormData({ ...formData, heightCm: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="170.0"
                  />
                </div>
              </div>

              {bmi && (
                <div className="p-3 bg-primary-50 rounded-lg">
                  <div className="text-sm text-gray-700">
                    BMI: <span className="font-bold text-primary-600">{bmi}</span>
                  </div>
                </div>
              )}

              <p className="text-xs text-gray-500">
                体重は体組成ページで詳細な記録ができます
              </p>
            </div>

            {/* Preferences */}
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 space-y-4">
              <h2 className="font-bold text-gray-900">設定</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  重量の単位
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="kg"
                      checked={formData.unitPref === 'kg'}
                      onChange={(e) => setFormData({ ...formData, unitPref: e.target.value })}
                      className="mr-2"
                    />
                    kg (キログラム)
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="lbs"
                      checked={formData.unitPref === 'lbs'}
                      onChange={(e) => setFormData({ ...formData, unitPref: e.target.value })}
                      className="mr-2"
                    />
                    lbs (ポンド)
                  </label>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:bg-gray-300"
            >
              {submitting ? '更新中...' : '保存する'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
