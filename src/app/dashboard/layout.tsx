'use client'

import { ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import NotificationBell from '@/components/NotificationBell'

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

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-900">
                <div className="flex items-center gap-3 text-white">
                    <svg className="animate-spin w-6 h-6" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Memuat...</span>
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

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'ADMIN': return 'from-purple-500 to-pink-500'
            case 'GURU': return 'from-blue-500 to-cyan-500'
            case 'SISWA': return 'from-green-500 to-emerald-500'
            default: return 'from-gray-500 to-gray-600'
        }
    }

    return (
        <div className="min-h-screen bg-slate-900">
            {/* Header */}
            <header className="bg-slate-800/50 backdrop-blur-xl border-b border-slate-700/50 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <Link href="/dashboard" className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                            </div>
                            <span className="text-xl font-bold text-white">LMS Sekolah</span>
                        </Link>

                        {/* User info */}
                        <div className="flex items-center gap-3">
                            <NotificationBell />
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-medium text-white">{user?.full_name || user?.username}</p>
                                <p className={`text-xs bg-gradient-to-r ${getRoleColor(user?.role || '')} bg-clip-text text-transparent font-semibold`}>
                                    {getRoleLabel(user?.role || '')}
                                </p>
                            </div>
                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getRoleColor(user?.role || '')} flex items-center justify-center text-white font-bold`}>
                                {user?.full_name?.[0] || user?.username?.[0] || '?'}
                            </div>
                            <button
                                onClick={handleLogout}
                                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
                                title="Logout"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {children}
            </main>
        </div>
    )
}
