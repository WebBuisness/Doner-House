'use client'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  UtensilsCrossed,
  FolderTree,
  TicketPercent,
  Settings,
  LogOut,
  Menu,
  X,
  LayoutDashboard,
} from 'lucide-react'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { Button, User, Divider } from '@heroui/react'

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/items', label: 'Menu Items', icon: UtensilsCrossed },
  { href: '/admin/categories', label: 'Categories', icon: FolderTree },
  { href: '/admin/promo-codes', label: 'Promo Codes', icon: TicketPercent },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
]

export default function Sidebar({ userEmail }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [open, setOpen] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.replace('/login')
  }

  const SidebarBody = (
    <div className="h-full flex flex-col bg-content1 border-r border-divider shadow-xl">
      {/* Logo */}
      <div className="p-6 flex items-center gap-3">
        <div className="relative">
          <div className="absolute inset-0 bg-orange-500 blur-lg opacity-20" />
          <Image
            src="/icons/icon-192.png"
            width={40}
            height={40}
            alt="WBS Admin"
            className="relative w-10 h-10 rounded-xl"
            priority
          />
        </div>
        <div>
          <h1 className="font-display text-lg font-bold leading-tight tracking-tight">WBS Admin</h1>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">Online</p>
          </div>
        </div>
      </div>

      <Divider className="opacity-50" />

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto scrollbar-hide">
        {navItems.map((item, idx) => {
          const Icon = item.icon
          const active =
            item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href)

          return (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.04 }}
            >
              <Link
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-2xl text-sm transition-all duration-200 relative group',
                  active
                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                    : 'text-muted-foreground hover:bg-content2 hover:text-foreground'
                )}
              >
                <Icon className={cn('w-5 h-5 shrink-0', active && 'scale-110')} />
                <span className="font-semibold">{item.label}</span>
                {!active && (
                   <div className="ml-auto w-1 h-1 rounded-full bg-orange-500 scale-0 group-hover:scale-100 transition-transform" />
                )}
              </Link>
            </motion.div>
          )
        })}
      </nav>

      {/* User footer */}
      <div className="p-4 mt-auto">
        <div className="bg-content2/50 rounded-2xl p-4 space-y-4">
          <User
            name={userEmail?.split('@')[0] || 'Admin'}
            description={userEmail || 'admin@wbs.menu'}
            avatarProps={{
              src: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userEmail}`,
              className: "bg-orange-100"
            }}
            classNames={{
              name: "font-bold text-sm",
              description: "text-[10px] font-mono",
            }}
          />
          <Button
            fullWidth
            variant="flat"
            color="danger"
            onPress={handleLogout}
            startContent={<LogOut className="w-4 h-4" />}
            className="font-bold rounded-xl"
          >
            Logout
          </Button>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile hamburger */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-content1/80 backdrop-blur-md border-b border-divider z-40 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Image
            src="/icons/icon-192.png"
            width={32}
            height={32}
            alt="WBS"
            className="w-8 h-8 rounded-lg"
          />
          <span className="font-display font-bold">WBS Admin</span>
        </div>
        <Button
          isIconOnly
          variant="light"
          onPress={() => setOpen(true)}
        >
          <Menu className="w-6 h-6" />
        </Button>
      </div>

      {/* Desktop */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-72 z-30">{SidebarBody}</aside>

      {/* Mobile drawer */}
      <AnimatePresence>
       {open && (
         <>
           <motion.div
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             onClick={() => setOpen(false)}
             className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
           />
           <motion.aside
             initial={{ x: '-100%' }}
             animate={{ x: 0 }}
             exit={{ x: '-100%' }}
             transition={{ type: 'spring', damping: 25, stiffness: 200 }}
             className="lg:hidden fixed left-0 top-0 bottom-0 w-72 z-50"
           >
             <button
               onClick={() => setOpen(false)}
               aria-label="Close navigation menu"
               className="absolute top-4 right-4 w-10 h-10 rounded-full bg-content2 flex items-center justify-center text-foreground z-[60] shadow-lg"
             >
               <X className="w-5 h-5" />
             </button>
             {SidebarBody}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
