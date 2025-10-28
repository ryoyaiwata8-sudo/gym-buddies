'use client'

import { useSession, signOut } from 'next-auth/react'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default function SettingsPage() {
  const { data: session } = useSession()

  if (!session) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <h1 className="text-xl font-bold text-gray-900">設定</h1>
      </div>

      <div className="p-4 space-y-4">
        {/* User Info */}
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-900 mb-3">アカウント情報</h2>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-gray-500">表示名:</span>{' '}
              <span className="text-gray-900">{session.user.name}</span>
            </div>
            <div>
              <span className="text-gray-500">メール:</span>{' '}
              <span className="text-gray-900">{session.user.email}</span>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-900 mb-3">メニュー</h2>
          <div className="space-y-2">
            <Link
              href="/ranking"
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <span className="text-gray-900">🏆 週間ランキング</span>
              <span className="text-gray-400">→</span>
            </Link>
            <Link
              href="/users"
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <span className="text-gray-900">🔍 ユーザー検索</span>
              <span className="text-gray-400">→</span>
            </Link>
          </div>
        </div>

        {/* Coming Soon Features */}
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-900 mb-3">今後実装予定</h2>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>・プロフィール編集</li>
            <li>・体重・身長の設定</li>
            <li>・単位設定（kg/lbs）</li>
            <li>・カレンダービュー</li>
            <li>・詳細分析グラフ</li>
            <li>・通知設定</li>
            <li>・データエクスポート</li>
          </ul>
        </div>

        {/* Logout */}
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full py-3 bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100 transition-colors"
        >
          ログアウト
        </button>
      </div>
    </div>
  )
}
