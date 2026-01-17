'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

interface StatsData {
    totalTeachers: number
    totalStudents: number
    totalClasses: number
    totalSubjects: number
}

export default function AdminDashboard() {
    const { user } = useAuth()
    const router = useRouter()
    const [stats, setStats] = useState<StatsData>({
        totalTeachers: 0,
        totalStudents: 0,
        totalClasses: 0,
        totalSubjects: 0
    })

    useEffect(() => {
        if (user && user.role !== 'ADMIN') {
            router.replace('/dashboard')
        }
    }, [user, router])

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [teachersRes, studentsRes, classesRes, subjectsRes] = await Promise.all([
                    fetch('/api/teachers'),
                    fetch('/api/students'),
                    fetch('/api/classes'),
                    fetch('/api/subjects')
                ])
                const [teachers, students, classes, subjects] = await Promise.all([
                    teachersRes.json(),
                    studentsRes.json(),
                    classesRes.json(),
                    subjectsRes.json()
                ])
                setStats({
                    totalTeachers: Array.isArray(teachers) ? teachers.length : 0,
                    totalStudents: Array.isArray(students) ? students.length : 0,
                    totalClasses: Array.isArray(classes) ? classes.length : 0,
                    totalSubjects: Array.isArray(subjects) ? subjects.length : 0
                })
            } catch (error) {
                console.error('Error fetching stats:', error)
            }
        }
        if (user) fetchStats()
    }, [user])

    const menuItems = [
        {
            title: 'Tahun Ajaran',
            description: 'Kelola tahun ajaran aktif',
            icon: (
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            ),
            href: '/dashboard/admin/tahun-ajaran',
            color: 'from-purple-500 to-pink-500'
        },
        {
            title: 'Kelas',
            description: 'Kelola daftar kelas',
            icon: (
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
            ),
            href: '/dashboard/admin/kelas',
            color: 'from-blue-500 to-cyan-500'
        },
        {
            title: 'Mata Pelajaran',
            description: 'Kelola daftar mapel',
            icon: (
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
            ),
            href: '/dashboard/admin/mapel',
            color: 'from-green-500 to-emerald-500'
        },
        {
            title: 'Akun Guru',
            description: 'Kelola akun guru',
            icon: (
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
            ),
            href: '/dashboard/admin/guru',
            color: 'from-amber-500 to-orange-500'
        },
        {
            title: 'Akun Siswa',
            description: 'Kelola akun siswa',
            icon: (
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
            ),
            href: '/dashboard/admin/siswa',
            color: 'from-rose-500 to-red-500'
        },
        {
            title: 'Penugasan Mengajar',
            description: 'Assign guru ke kelas & mapel',
            icon: (
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
            ),
            href: '/dashboard/admin/penugasan',
            color: 'from-indigo-500 to-violet-500'
        },
        {
            title: 'Rekap Nilai',
            description: 'Rekap nilai per kelas',
            icon: (
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            ),
            href: '/dashboard/admin/rekap-nilai',
            color: 'from-teal-500 to-cyan-500'
        },
        {
            title: 'Analitik',
            description: 'Performa per mapel',
            icon: (
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            ),
            href: '/dashboard/admin/analitik',
            color: 'from-fuchsia-500 to-purple-500'
        }
    ]

    return (
        <div className="space-y-8">
            {/* Welcome Section */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 p-8">
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
                <div className="relative">
                    <h1 className="text-3xl font-bold text-white mb-2">
                        Selamat Datang, {user?.full_name || 'Admin'}! 👋
                    </h1>
                    <p className="text-purple-100">
                        Panel administrasi LMS Sekolah
                    </p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total Guru', value: stats.totalTeachers, icon: '👨‍🏫' },
                    { label: 'Total Siswa', value: stats.totalStudents, icon: '👨‍🎓' },
                    { label: 'Total Kelas', value: stats.totalClasses, icon: '🏫' },
                    { label: 'Total Mapel', value: stats.totalSubjects, icon: '📚' },
                ].map((stat, i) => (
                    <div key={i} className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4">
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">{stat.icon}</span>
                            <div>
                                <p className="text-2xl font-bold text-white">{stat.value}</p>
                                <p className="text-sm text-slate-400">{stat.label}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Menu Grid */}
            <div>
                <h2 className="text-xl font-bold text-white mb-4">Menu Kelola</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {menuItems.map((item, i) => (
                        <Link
                            key={i}
                            href={item.href}
                            className="group relative overflow-hidden bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:border-slate-600 transition-all duration-300"
                        >
                            <div className={`absolute inset-0 bg-gradient-to-r ${item.color} opacity-0 group-hover:opacity-10 transition-opacity`}></div>
                            <div className="relative flex items-start gap-4">
                                <div className={`flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-r ${item.color} flex items-center justify-center text-white shadow-lg`}>
                                    {item.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-lg font-semibold text-white group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:bg-clip-text group-hover:from-white group-hover:to-slate-300 transition-all">
                                        {item.title}
                                    </h3>
                                    <p className="text-sm text-slate-400 mt-1">{item.description}</p>
                                </div>
                                <svg className="w-5 h-5 text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    )
}
