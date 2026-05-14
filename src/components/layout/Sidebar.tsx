'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { signOut } from '@/lib/supabase/actions'
import {
  LayoutDashboard, Users, MapPin, ClipboardList,
  FileText, UserCircle, LogOut, Clock
} from 'lucide-react'
import type { Profile } from '@/types'

interface SidebarProps {
  profile: Profile
}

const adminNav = [
  { href: '/dashboard', label: 'ダッシュボード', icon: LayoutDashboard },
  { href: '/staff', label: 'スタッフ管理', icon: Users },
  { href: '/sites', label: '現場管理', icon: MapPin },
  { href: '/tasks', label: 'タスク管理', icon: ClipboardList },
  { href: '/reports', label: '日報管理', icon: FileText },
]

const workerNav = [
  { href: '/my', label: 'マイページ', icon: LayoutDashboard },
  { href: '/tasks', label: 'タスク管理', icon: ClipboardList },
  { href: '/my/clock', label: '打刻', icon: Clock },
  { href: '/my/reports', label: '日報', icon: FileText },
]

export default function Sidebar({ profile }: SidebarProps) {
  const pathname = usePathname()
  const nav = profile.role === 'admin' ? adminNav : workerNav

  return (
    <aside className="hidden md:flex md:flex-col w-64 bg-gray-900 text-white min-h-screen">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-700">
        <Image src="/logo/GENBA_logo_horizontal_white.png" alt="GENBA" width={140} height={50} className="object-contain" />
      </div>

      {/* Org name */}
      <div className="px-6 py-3 text-xs text-gray-400 border-b border-gray-700">
        {profile.organization?.name ?? ''}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 py-4 space-y-1">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && href !== '/my' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                active
                  ? 'bg-orange-500 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <Icon size={20} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="px-4 py-4 border-t border-gray-700 space-y-1">
        <Link
          href="/profile"
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
        >
          <UserCircle size={20} />
          プロフィール
        </Link>
        <form action={signOut}>
          <button
            type="submit"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:bg-gray-800 hover:text-white transition-colors w-full text-left"
          >
            <LogOut size={20} />
            ログアウト
          </button>
        </form>
      </div>
    </aside>
  )
}
