'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Home, TrendingUp, Scale, Users, Bell, Settings } from 'lucide-react'
import { memo } from 'react'

function Navigation() {
  const pathname = usePathname()
  const { data: session } = useSession()

  // Don't show navigation on auth pages and workout recording page
  if (!session || pathname === '/login' || pathname === '/register' || pathname === '/workout/new') {
    return null
  }

  const navItems = [
    { href: '/', label: 'ホーム', Icon: Home },
    { href: '/history', label: '履歴', Icon: TrendingUp },
    { href: '/body', label: '体組成', Icon: Scale },
    { href: '/notifications', label: '通知', Icon: Bell },
    { href: '/feed', label: '友達', Icon: Users },
    { href: '/settings', label: 'その他', Icon: Settings },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.05)] z-50">
      <div className="flex justify-around items-center h-16 max-w-7xl mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.Icon
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-all relative ${
                isActive ? 'text-[#0ea5e9]' : 'text-gray-500 hover:text-[#1e293b]'
              }`}
            >
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-[#0ea5e9] rounded-b-full" />
              )}
              <Icon className={`w-6 h-6 mb-1 transition-transform ${isActive ? 'scale-110' : ''}`} />
              <span className={`text-xs font-medium ${isActive ? 'font-semibold' : ''}`}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

export default memo(Navigation)
