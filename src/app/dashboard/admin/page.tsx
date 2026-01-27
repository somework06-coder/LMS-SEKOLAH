'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Card from '@/components/ui/Card'
import StatsCard from '@/components/ui/StatsCard'

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
            icon: '📅',
            href: '/dashboard/admin/tahun-ajaran',
        },
        {
            title: 'Kelas',
            description: 'Kelola daftar kelas',
            icon: '🏫',
            href: '/dashboard/admin/kelas',
        },
        {
            title: 'Mata Pelajaran',
            description: 'Kelola daftar mapel',
            icon: '📚',
            href: '/dashboard/admin/mapel',
        },
        {
            title: 'Akun Guru',
            description: 'Kelola akun guru',
            icon: '👨‍🏫',
            href: '/dashboard/admin/guru',
        },
        {
            title: 'Akun Siswa',
            description: 'Kelola akun siswa',
            icon: '👨‍🎓',
            href: '/dashboard/admin/siswa',
        },
        {
            title: 'Penugasan',
            description: 'Assign guru ke kelas',
            icon: '🤝',
            href: '/dashboard/admin/penugasan',
        },
        {
            title: 'Rekap Nilai',
            description: 'Rekap nilai per kelas',
            icon: '📊',
            href: '/dashboard/admin/rekap-nilai',
        },
        {
            title: 'Analitik',
            description: 'Performa per mapel',
            icon: '📈',
            href: '/dashboard/admin/analitik',
        }
    ]

    return (
        <div className="space-y-8">
            {/* Welcome Section */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary to-primary-dark p-8 shadow-xl shadow-primary/20">
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
                <div className="absolute -right-20 -top-20 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>

                <div className="relative">
                    <h1 className="text-3xl font-bold text-white mb-2 leading-tight">
                        Selamat Datang Admin, {user?.full_name}! 👋
                    </h1>
                    <p className="text-blue-50/90 text-lg">
                        Panel Administrasi - Kelola seluruh data sekolah
                    </p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard
                    label="Total Guru"
                    value={stats.totalTeachers}
                    icon="👨‍🏫"
                />
                <StatsCard
                    label="Total Siswa"
                    value={stats.totalStudents}
                    icon="👨‍🎓"
                />
                <StatsCard
                    label="Total Kelas"
                    value={stats.totalClasses}
                    icon="🏫"
                />
                <StatsCard
                    label="Total Mapel"
                    value={stats.totalSubjects}
                    icon="📚"
                />
            </div>

            {/* Menu Grid */}
            <div>
                <h2 className="text-xl font-bold text-text-main dark:text-white mb-6">Menu Kelola</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {menuItems.map((item, i) => (
                        <Link
                            key={i}
                            href={item.href}
                        >
                            <Card className="h-full border-2 border-primary/30 hover:border-primary hover:shadow-lg hover:shadow-primary/10 active:scale-95 transition-all group cursor-pointer">
                                <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-secondary/10 flex items-center justify-center text-3xl group-hover:bg-primary group-hover:text-white transition-all duration-300 shadow-sm">
                                        {item.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-lg font-bold text-text-main dark:text-white group-hover:text-primary transition-colors mb-1">
                                            {item.title}
                                        </h3>
                                        <p className="text-sm text-text-secondary dark:text-[#A8BC9F]">
                                            {item.description}
                                        </p>
                                    </div>
                                    <div className="self-center opacity-0 group-hover:opacity-100 transition-all transform translate-x-[-10px] group-hover:translate-x-0 text-primary">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </div>
                            </Card>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    )
}
