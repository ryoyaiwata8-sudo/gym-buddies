'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'

interface NotificationSettings {
  id: string
  enableLikeNotif: boolean
  enableCommentNotif: boolean
  enableFollowNotif: boolean
  enableNewPostNotif: boolean
  enableGoalAchievedNotif: boolean
}

export default function NotificationSettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [settings, setSettings] = useState<NotificationSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated') {
      fetchSettings()
    }
  }, [status])

  async function fetchSettings() {
    try {
      setLoading(true)
      const res = await fetch('/api/notifications/settings')
      if (res.ok) {
        const data = await res.json()
        setSettings(data)
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error)
    } finally {
      setLoading(false)
    }
  }

  async function updateSetting(key: keyof Omit<NotificationSettings, 'id'>, value: boolean) {
    if (!settings) return

    try {
      setSaving(true)
      const newSettings = { ...settings, [key]: value }

      const res = await fetch('/api/notifications/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value }),
      })

      if (res.ok) {
        const data = await res.json()
        setSettings(data)
      }
    } catch (error) {
      console.error('Failed to update setting:', error)
    } finally {
      setSaving(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">読み込み中...</p>
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">設定の読み込みに失敗しました</p>
      </div>
    )
  }

  const settingItems = [
    {
      key: 'enableLikeNotif' as const,
      label: 'いいね通知',
      description: 'ワークアウトにいいねされたときに通知を受け取る',
    },
    {
      key: 'enableCommentNotif' as const,
      label: 'コメント通知',
      description: 'ワークアウトにコメントされたときに通知を受け取る',
    },
    {
      key: 'enableFollowNotif' as const,
      label: 'フォロー通知',
      description: '誰かにフォローされたときに通知を受け取る',
    },
    {
      key: 'enableNewPostNotif' as const,
      label: '新規投稿通知',
      description: 'フォロー中のユーザーが投稿したときに通知を受け取る',
    },
    {
      key: 'enableGoalAchievedNotif' as const,
      label: '目標達成通知',
      description: '設定した目標を達成したときに通知を受け取る',
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Link href="/settings" className="text-gray-600 hover:text-gray-900">
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-xl font-bold text-gray-900">通知設定</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4">
        <p className="text-sm text-gray-600 mb-6">
          受け取りたい通知の種類を選択してください
        </p>

        <div className="bg-white rounded-lg shadow-sm border border-gray-100 divide-y divide-gray-100">
          {settingItems.map((item) => (
            <div key={item.key} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{item.label}</h3>
                  <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer ml-4">
                  <input
                    type="checkbox"
                    checked={settings[item.key]}
                    onChange={(e) => updateSetting(item.key, e.target.checked)}
                    disabled={saving}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <p className="text-sm text-blue-800">
            <strong>ヒント:</strong> 通知をオフにしても、アプリ内の通知一覧には表示されます。
          </p>
        </div>
      </div>
    </div>
  )
}
