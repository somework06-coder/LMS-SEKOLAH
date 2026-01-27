'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Card from '@/components/ui/Card'

interface TeachingAssignment {
    id: string
    subject: { name: string }
    class: { id: string; name: string }
    academic_year: { name: string; is_active: boolean }
}

export default function GuruDashboard() {
    const { user } = useAuth()
    const router = useRouter()
    const [assignments, setAssignments] = useState<TeachingAssignment[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (user && user.role !== 'GURU') {
            router.replace('/dashboard')
        }
    }, [user, router])

    useEffect(() => {
        const fetchAssignments = async () => {
            try {
                // Get teacher ID first
                const teachersRes = await fetch('/api/teachers')
                const teachers = await teachersRes.json()
                if (!Array.isArray(teachers)) {
                    setAssignments([])
                    setLoading(false)
                    return
                }
                const myTeacher = teachers.find((t: { user: { id: string } }) => t.user.id === user?.id)

                if (!myTeacher) {
                    setAssignments([])
                    setLoading(false)
                    return
                }

                const res = await fetch('/api/teaching-assignments')
                const data = await res.json()
                const myAssignments = data.filter((a: { teacher: { id: string } }) => a.teacher.id === myTeacher.id)
                setAssignments(myAssignments)
            } catch (error) {
                console.error('Error:', error)
            } finally {
                setLoading(false)
            }
        }
        if (user) fetchAssignments()
    }, [user])

    const quickLinks = [
        { href: '/dashboard/guru/materi', icon: '📚', label: 'Materi', sub: 'Upload bahan ajar' },
        { href: '/dashboard/guru/tugas', icon: '📝', label: 'Tugas', sub: 'Buat tugas siswa' },
        { href: '/dashboard/guru/ulangan', icon: '⏰', label: 'Ulangan', sub: 'Kunci tab & timer' },
        { href: '/dashboard/guru/kuis', icon: '🧠', label: 'Kuis', sub: 'Review & latihan' },
        { href: '/dashboard/guru/bank-soal', icon: '🗄️', label: 'Bank Soal', sub: 'Simpan & pakai lagi' },
        { href: '/dashboard/guru/nilai', icon: '📊', label: 'Nilai', sub: 'Rekap penilaian' },
    ]

    return (
        <div className="space-y-8">
            {/* Welcome */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary to-primary-dark p-8 shadow-xl shadow-primary/20">
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
                <div className="absolute -right-20 -top-20 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>

                <div className="relative">
                    <h1 className="text-3xl font-bold text-white mb-2 leading-tight">
                        Selamat Datang, {user?.full_name || 'Bapak/Ibu Guru'}! 👋
                    </h1>
                    <p className="text-blue-50/90 text-lg">
                        Dashboard Guru - Kelola pembelajaran dengan mudah
                    </p>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {quickLinks.map((link) => (
                    <Link key={link.href} href={link.href}>
                        <Card className="h-full border-2 border-primary/30 hover:border-primary hover:shadow-lg hover:shadow-primary/10 active:scale-95 transition-all group bg-white dark:bg-surface-dark cursor-pointer">
                            <div className="flex flex-col items-center text-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center text-2xl group-hover:bg-primary group-hover:text-white transition-all duration-300">
                                    {link.icon}
                                </div>
                                <div>
                                    <h3 className="font-bold text-text-main dark:text-white group-hover:text-primary transition-colors">{link.label}</h3>
                                    <p className="text-xs text-text-secondary dark:text-[#A8BC9F] mt-1">{link.sub}</p>
                                </div>
                            </div>
                        </Card>
                    </Link>
                ))}
            </div>

            {/* Teaching Assignments */}
            <div>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-text-main dark:text-white">Kelas yang Diampu</h2>
                    {!loading && assignments.length > 0 && (
                        <span className="bg-primary/10 text-primary-dark dark:text-primary px-3 py-1 rounded-full text-xs font-bold">
                            {assignments.length} Kelas
                        </span>
                    )}
                </div>

                {loading ? (
                    <div className="flex items-center justify-center h-40">
                        <div className="animate-spin text-3xl text-primary">⏳</div>
                    </div>
                ) : assignments.length === 0 ? (
                    <Card className="text-center py-12 border-dashed">
                        <div className="text-4xl mb-3">👨‍🏫</div>
                        <h3 className="text-lg font-bold text-text-main dark:text-white">Belum Ada Penugasan</h3>
                        <p className="text-text-secondary dark:text-[#A8BC9F]">Hubungi Administrator untuk mendapatkan akses kelas.</p>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {assignments.map((assignment) => (
                            <Link key={assignment.id} href={`/dashboard/guru/kelas/${assignment.class.id}`}>
                                <Card className="h-full hover:border-primary transition-all cursor-pointer group hover:shadow-md">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-lg text-primary font-bold">
                                            {assignment.subject.name.charAt(0)}
                                        </div>
                                        {assignment.academic_year.is_active && (
                                            <span className="px-2.5 py-1 bg-green-500/10 text-green-600 dark:text-green-400 text-xs font-bold rounded-full border border-green-500/20">
                                                Aktif
                                            </span>
                                        )}
                                    </div>

                                    <h3 className="text-lg font-bold text-text-main dark:text-white mb-1 group-hover:text-primary transition-colors">
                                        {assignment.subject.name}
                                    </h3>
                                    <p className="text-text-secondary dark:text-[#A8BC9F] font-medium mb-4">
                                        {assignment.class.name}
                                    </p>

                                    <div className="pt-4 border-t border-secondary/10 dark:border-white/5 flex items-center justify-between text-sm">
                                        <span className="text-text-secondary dark:text-zinc-500">{assignment.academic_year.name}</span>
                                        <span className="text-primary font-bold text-xs flex items-center gap-1 group-hover:gap-2 transition-all">
                                            Masuk Kelas
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                            </svg>
                                        </span>
                                    </div>
                                </Card>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
