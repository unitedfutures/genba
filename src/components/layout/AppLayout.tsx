import { getCurrentProfile } from '@/lib/supabase/actions'
import { redirect } from 'next/navigation'
import Sidebar from './Sidebar'
import MobileNav from './MobileNav'
import { HardHat } from 'lucide-react'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile()
  if (!profile) redirect('/auth/login')

  return (
    <div className="flex min-h-screen">
      <Sidebar profile={profile} />
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="md:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-2 sticky top-0 z-40">
          <HardHat className="text-orange-500" size={22} />
          <span className="text-xl font-black tracking-widest text-orange-500">GENBA</span>
          <span className="ml-auto text-sm text-gray-500">{profile.full_name}</span>
        </header>
        <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6">
          {children}
        </main>
      </div>
      <MobileNav profile={profile} />
    </div>
  )
}
