import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export default async function CalendarPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center">
          <h1 className="text-xl font-bold text-gray-900">カレンダー</h1>
        </div>
      </div>

      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="text-6xl mb-4">📅</div>
          <p className="text-gray-600 font-medium">カレンダー機能</p>
          <p className="text-sm text-gray-400 mt-2">Phase 2で実装予定</p>
          <p className="text-xs text-gray-400 mt-1">
            月次カレンダービューと<br />日別のトレーニング記録
          </p>
        </div>
      </div>
    </div>
  )
}
