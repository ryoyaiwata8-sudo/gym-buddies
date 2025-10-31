import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Calendar from '@/components/Calendar'

export default async function CalendarPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center">
          <h1 className="text-xl font-bold text-gray-900">📅 カレンダー</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        <Calendar />
      </div>
    </div>
  )
}
