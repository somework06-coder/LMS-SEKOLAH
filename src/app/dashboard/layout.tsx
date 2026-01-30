'use client'

import { ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import NotificationBell from '@/components/NotificationBell'
import BottomNavigation from '@/components/BottomNavigation'

interface DashboardLayoutProps {
    children: ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    const router = useRouter()
    const pathname = usePathname()
    const { user, logout, loading } = useAuth()

    const handleLogout = async () => {
        await logout()
        router.push('/login')
    }

    // Only show loading screen on initial mount, not after login redirect
    if (loading && !user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#D4E0D2]">
                <div className="flex flex-col items-center gap-4 text-primary">
                    <svg className="animate-spin w-10 h-10" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="font-medium text-text-main">Memuat...</span>
                </div>
            </div>
        )
    }

    const getRoleLabel = (role: string) => {
        switch (role) {
            case 'ADMIN': return 'Administrator'
            case 'GURU': return 'Guru'
            case 'SISWA': return 'Siswa'
            default: return role
        }
    }

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark transition-colors duration-300">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white/80 dark:bg-surface-dark/90 backdrop-blur-xl border-b border-secondary/20 dark:border-white/5">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-20">
                        {/* Logo */}
                        <Link href="/dashboard" className="flex items-center gap-3 group">
                            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xl font-bold text-text-main dark:text-white leading-none">LMS Sekolah</span>
                                <span className="text-xs text-text-secondary dark:text-[#A8BC9F] font-medium tracking-wide">Soft Sage v2.0</span>
                            </div>
                        </Link>

                        {/* User info */}
                        <div className="flex items-center gap-4">
                            <NotificationBell />
                            <div className="hidden sm:flex flex-col items-end">
                                <p className="text-sm font-bold text-text-main dark:text-white">{user?.full_name || user?.username}</p>
                                <p className="text-xs text-primary font-semibold bg-primary/10 px-2 py-0.5 rounded-full mt-0.5">
                                    {getRoleLabel(user?.role || '')}
                                </p>
                            </div>
                            <div className="relative group cursor-pointer">
                                <div className="w-11 h-11 rounded-full bg-primary ring-2 ring-white dark:ring-surface-dark flex items-center justify-center text-white font-bold text-lg shadow-soft group-hover:scale-105 transition-all">
                                    {user?.full_name?.[0] || user?.username?.[0] || '?'}
                                </div>
                                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-surface-dark rounded-full"></div>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="p-2.5 rounded-full text-text-secondary hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                                title="Logout"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main content - add bottom padding on mobile for bottom nav */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 lg:pb-8 animate-in fade-in duration-500">
                {children}
            </main>

            {/* Bottom Navigation - only visible on mobile/tablet */}
            <BottomNavigation />
        </div>
    )
}

