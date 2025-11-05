'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { format, formatDistanceToNow } from 'date-fns'
import { ja } from 'date-fns/locale'

interface Notification {
  id: string
  type: string
  isRead: boolean
  createdAt: string
  followId?: string
  actor?: {
    id: string
    displayName: string
    avatarUrl: string | null
  }
  workout?: {
    id: string
    date: string
  }
  goal?: {
    id: string
    type: string
    targetValue: number
  }
}

export default function NotificationsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [processingFollow, setProcessingFollow] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated') {
      fetchNotifications()
    }
  }, [status, filter])

  async function fetchNotifications() {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filter === 'unread') {
        params.append('unreadOnly', 'true')
      }

      const res = await fetch(`/api/notifications?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || data)
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  async function markAsRead(notificationId: string) {
    try {
      const res = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
      })
      if (res.ok) {
        setNotifications(prev =>
          prev.map(n => (n.id === notificationId ? { ...n, isRead: true } : n))
        )
      }
    } catch (error) {
      console.error('Failed to mark as read:', error)
    }
  }

  async function markAllAsRead() {
    try {
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
      })
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      }
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    }
  }

  async function handleFollowRequest(followId: string, action: 'accept' | 'reject', notificationId: string) {
    try {
      setProcessingFollow(followId)
      const res = await fetch(`/api/follows/${followId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })

      if (res.ok) {
        const data = await res.json()
        alert(data.message)
        // Remove notification from list
        setNotifications(prev => prev.filter(n => n.id !== notificationId))
      } else {
        const error = await res.json()
        alert(error.error || 'リクエストの処理に失敗しました')
      }
    } catch (error) {
      console.error('Failed to handle follow request:', error)
      alert('リクエストの処理に失敗しました')
    } finally {
      setProcessingFollow(null)
    }
  }

  function getNotificationMessage(notif: Notification): string {
    switch (notif.type) {
      case 'LIKE':
        return `${notif.actor?.displayName || 'ユーザー'}があなたのワークアウトにいいねしました`
      case 'COMMENT':
        return `${notif.actor?.displayName || 'ユーザー'}があなたのワークアウトにコメントしました`
      case 'FOLLOW':
        return `${notif.actor?.displayName || 'ユーザー'}があなたをフォローしました`
      case 'FOLLOW_REQUEST':
        return `${notif.actor?.displayName || 'ユーザー'}からフォローリクエストが届きました`
      case 'FOLLOW_ACCEPTED':
        return `${notif.actor?.displayName || 'ユーザー'}があなたのフォローリクエストを承認しました`
      case 'NEW_POST':
        return `${notif.actor?.displayName || 'ユーザー'}が新しいワークアウトを投稿しました`
      case 'GOAL_ACHIEVED':
        return '目標を達成しました！'
      default:
        return '新しい通知があります'
    }
  }

  function handleNotificationClick(notif: Notification) {
    if (!notif.isRead) {
      markAsRead(notif.id)
    }

    // Navigate to relevant page
    if (notif.workout) {
      router.push(`/feed`)
    } else if (notif.type === 'FOLLOW' && notif.actor) {
      router.push(`/feed`)
    } else if (notif.type === 'GOAL_ACHIEVED') {
      router.push(`/goals`)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">読み込み中...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-2xl mx-auto p-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">通知</h1>
          {notifications.some(n => !n.isRead) && (
            <button
              onClick={markAllAsRead}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              すべて既読にする
            </button>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-4 mb-4 border-b border-gray-200">
          <button
            onClick={() => setFilter('all')}
            className={`pb-2 px-2 ${
              filter === 'all'
                ? 'border-b-2 border-blue-600 text-blue-600 font-medium'
                : 'text-gray-500'
            }`}
          >
            すべて
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`pb-2 px-2 ${
              filter === 'unread'
                ? 'border-b-2 border-blue-600 text-blue-600 font-medium'
                : 'text-gray-500'
            }`}
          >
            未読
          </button>
        </div>

        {/* Notifications list */}
        {notifications.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">通知はありません</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map(notif => (
              <div
                key={notif.id}
                className={`bg-white rounded-lg p-4 ${
                  notif.type !== 'FOLLOW_REQUEST' ? 'cursor-pointer hover:shadow-md' : ''
                } transition-shadow ${
                  !notif.isRead ? 'border-l-4 border-blue-600' : ''
                }`}
                onClick={notif.type !== 'FOLLOW_REQUEST' ? () => handleNotificationClick(notif) : undefined}
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  {notif.actor && (
                    <div className="flex-shrink-0">
                      {notif.actor.avatarUrl ? (
                        <img
                          src={notif.actor.avatarUrl}
                          alt={notif.actor.displayName}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-600 text-lg">
                            {notif.actor.displayName.charAt(0)}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className={`${!notif.isRead ? 'font-semibold' : ''} text-sm`}>
                      {getNotificationMessage(notif)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDistanceToNow(new Date(notif.createdAt), {
                        addSuffix: true,
                        locale: ja,
                      })}
                    </p>

                    {/* Follow Request Actions */}
                    {notif.type === 'FOLLOW_REQUEST' && notif.followId && (
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleFollowRequest(notif.followId!, 'accept', notif.id)
                          }}
                          disabled={processingFollow === notif.followId}
                          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
                        >
                          {processingFollow === notif.followId ? '処理中...' : '承認'}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleFollowRequest(notif.followId!, 'reject', notif.id)
                          }}
                          disabled={processingFollow === notif.followId}
                          className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 text-sm font-medium"
                        >
                          {processingFollow === notif.followId ? '処理中...' : '拒否'}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Unread indicator */}
                  {!notif.isRead && (
                    <div className="flex-shrink-0">
                      <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
