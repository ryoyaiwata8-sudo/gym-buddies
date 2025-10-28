'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'

export default function Navigation() {
  const pathname = usePathname()
  const { data: session } = useSession()

  // Don't show navigation on auth pages
  if (!session || pathname === '/login' || pathname === '/register') {
    return null
  }

  const navItems = [
    { href: '/', label: 'ホーム', icon: '🏠' },
    { href: '/history', label: '履歴', icon: '📊' },
    { href: '/body', label: '体組成', icon: '⚖️' },
    { href: '/feed', label: '友達', icon: '👥' },
    { href: '/settings', label: 'その他', icon: '⚙️' },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 h-full ${
                isActive ? 'text-primary-600' : 'text-gray-500'
              }`}
            >
              <span className="text-2xl mb-1">{item.icon}</span>
              <span className="text-xs">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
