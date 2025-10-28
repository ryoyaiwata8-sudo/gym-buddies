'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'

interface User {
  id: string
  displayName: string
  avatarUrl?: string
  email: string
  isFollowing: boolean
}

export default function UsersPage() {
  const { data: session, status } = useSession()
  const [query, setQuery] = useState('')
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/login')
    }
  }, [status])

  const handleSearch = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/users?query=${encodeURIComponent(query)}`)
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users)
      }
    } catch (error) {
      console.error('Failed to search users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFollow = async (userId: string, isFollowing: boolean) => {
    try {
      if (isFollowing) {
        // Unfollow
        await fetch(`/api/follows?followeeId=${userId}`, {
          method: 'DELETE',
        })
      } else {
        // Follow
        await fetch('/api/follows', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ followeeId: userId }),
        })
      }

      // Update local state
      setUsers(
        users.map((u) =>
          u.id === userId ? { ...u, isFollowing: !isFollowing } : u
        )
      )
    } catch (error) {
      console.error('Failed to toggle follow:', error)
    }
  }

  useEffect(() => {
    // Load all users on mount
    handleSearch()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10">
        <h1 className="text-xl font-bold text-gray-900 mb-3">ユーザー検索</h1>

        {/* Search Bar */}
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="名前やメールアドレスで検索..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            {loading ? '検索中...' : '検索'}
          </button>
        </div>
      </div>

      {/* Users List */}
      <div className="p-4">
        {users.length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-gray-600">
              {query ? 'ユーザーが見つかりませんでした' : 'ユーザーを検索してください'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {users.map((user) => (
              <div
                key={user.id}
                className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 flex items-center justify-between"
              >
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-semibold text-lg mr-3">
                    {user.displayName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">
                      {user.displayName}
                    </div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </div>
                </div>

                <button
                  onClick={() => handleFollow(user.id, user.isFollowing)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    user.isFollowing
                      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      : 'bg-primary-600 text-white hover:bg-primary-700'
                  }`}
                >
                  {user.isFollowing ? 'フォロー中' : 'フォロー'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
