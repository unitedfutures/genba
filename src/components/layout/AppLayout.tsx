import { getCurrentProfile } from '@/lib/supabase/actions'
import { redirect } from 'next/navigation'
import Sidebar from './Sidebar'
import MobileNav from './MobileNav'
import Image from 'next/image'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile()
  if (!profile) redirect('/auth/login')

  return (
    <div className="flex min-h-screen">
      <Sidebar profile={profile} />
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="md:hidden bg-gray-900 px-4 py-3 flex items-center sticky top-0 z-40">
          <Image src="/logo/GENBA_logo_horizontal_large_dark.png" alt="GENBA" width={120} height={44} className="object-contain" />
          <span className="ml-auto text-sm text-gray-300">{profile.full_name}</span>
        </header>
        <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6">
          {children}
        </main>
      </div>
      <MobileNav profile={profile} />
    </div>
  )
}
