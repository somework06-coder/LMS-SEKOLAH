'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

interface NavItem {
    icon: string
    label: string
    path: string
}

const siswaNav: NavItem[] = [
    { icon: '🏠', label: 'Home', path: '/dashboard/siswa' },
    { icon: '📚', label: 'Materi', path: '/dashboard/siswa/materi' },
    { icon: '📝', label: 'Tugas', path: '/dashboard/siswa/tugas' },
    { icon: '🧠', label: 'Kuis', path: '/dashboard/siswa/kuis' },
    { icon: '📊', label: 'Nilai', path: '/dashboard/siswa/nilai' },
]

const guruNav: NavItem[] = [
    { icon: '🏠', label: 'Home', path: '/dashboard/guru' },
    { icon: '📚', label: 'Materi', path: '/dashboard/guru/materi' },
    { icon: '📝', label: 'Tugas', path: '/dashboard/guru/tugas' },
    { icon: '🧠', label: 'Kuis', path: '/dashboard/guru/kuis' },
    { icon: '⏰', label: 'Ulangan', path: '/dashboard/guru/ulangan' },
]

const adminNav: NavItem[] = [
    { icon: '🏠', label: 'Home', path: '/dashboard/admin' },
    { icon: '👥', label: 'Siswa', path: '/dashboard/admin/siswa' },
    { icon: '👨‍🏫', label: 'Guru', path: '/dashboard/admin/guru' },
    { icon: '🏫', label: 'Kelas', path: '/dashboard/admin/kelas' },
    { icon: '📢', label: 'Pengumuman', path: '/dashboard/admin/pengumuman' },
]

export default function BottomNavigation() {
    const pathname = usePathname()
    const { user } = useAuth()

    if (!user) return null

    const getNavItems = (): NavItem[] => {
        switch (user.role) {
            case 'SISWA': return siswaNav
            case 'GURU': return guruNav
            case 'ADMIN': return adminNav
            default: return []
        }
    }

    const navItems = getNavItems()

    const isActive = (path: string) => {
        if (path === `/dashboard/${user.role.toLowerCase()}`) {
            return pathname === path
        }
        return pathname.startsWith(path)
    }

    return (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-surface-dark/95 backdrop-blur-xl border-t border-secondary/20 dark:border-white/10 shadow-lg shadow-black/5">
            <div className="flex items-center justify-around h-[72px] px-2">
                {navItems.map((item) => {
                    const active = isActive(item.path)

                    return (
                        <Link
                            key={item.path}
                            href={item.path}
                            className="relative flex flex-col items-center justify-center flex-1 h-full"
                        >
                            {/* Active Background Pill */}
                            {active && (
                                <div className="absolute inset-x-2 top-2 bottom-2 bg-primary/15 dark:bg-primary/20 rounded-2xl" />
                            )}

                            {/* Icon Container */}
                            <div className={`relative z-10 flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300 ${active
                                ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-110'
                                : 'text-text-secondary hover:text-text-main dark:hover:text-white'
                                }`}>
                                <span className="text-xl">{item.icon}</span>
                            </div>

                            {/* Label */}
                            <span className={`relative z-10 text-[10px] mt-1 transition-all duration-300 ${active
                                ? 'font-bold text-primary'
                                : 'font-medium text-text-secondary'
                                }`}>
                                {item.label}
                            </span>
                        </Link>
                    )
                })}
            </div>

            {/* Safe area padding for iPhone */}
            <div className="h-safe-area-inset-bottom bg-white/95 dark:bg-surface-dark/95" />
        </nav>
    )
}

