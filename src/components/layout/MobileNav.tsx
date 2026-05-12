'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, MapPin, ClipboardList, FileText, Clock } from 'lucide-react'
import type { Profile } from '@/types'

const adminNav = [
  { href: '/dashboard', label: 'TOP', icon: LayoutDashboard },
  { href: '/staff', label: 'スタッフ', icon: Users },
  { href: '/sites', label: '現場', icon: MapPin },
  { href: '/tasks', label: 'タスク', icon: ClipboardList },
  { href: '/reports', label: '日報', icon: FileText },
]

const workerNav = [
  { href: '/my', label: 'TOP', icon: LayoutDashboard },
  { href: '/tasks', label: 'タスク', icon: ClipboardList },
  { href: '/my/clock', label: '打刻', icon: Clock },
  { href: '/my/reports', label: '日報', icon: FileText },
]

export default function MobileNav({ profile }: { profile: Profile }) {
  const pathname = usePathname()
  const nav = profile.role === 'admin' ? adminNav : workerNav

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-inset-bottom">
      <div className="flex">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && href !== '/my' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center py-2 gap-1 text-xs font-medium transition-colors ${
                active ? 'text-orange-500' : 'text-gray-500'
              }`}
            >
              <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
              {label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
