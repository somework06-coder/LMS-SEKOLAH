'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

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

    return (
        <div className="space-y-8">
            {/* Welcome */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 p-8">
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
                <div className="relative">
                    <h1 className="text-3xl font-bold text-white mb-2">
                        Selamat Datang, {user?.full_name || 'Guru'}! 👋
                    </h1>
                    <p className="text-blue-100">
                        Dashboard Guru - Kelola materi dan tugas Anda
                    </p>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <Link href="/dashboard/guru/materi" className="group bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 hover:border-green-500/50 transition-all">
                    <div className="flex flex-col items-center text-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center text-white">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-white group-hover:text-green-400 transition-colors">Materi</h3>
                            <p className="text-xs text-slate-400">Upload bahan ajar</p>
                        </div>
                    </div>
                </Link>

                <Link href="/dashboard/guru/tugas" className="group bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 hover:border-amber-500/50 transition-all">
                    <div className="flex flex-col items-center text-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center text-white">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-white group-hover:text-amber-400 transition-colors">Tugas</h3>
                            <p className="text-xs text-slate-400">Buat PR siswa</p>
                        </div>
                    </div>
                </Link>

                <Link href="/dashboard/guru/ulangan" className="group bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 hover:border-pink-500/50 transition-all">
                    <div className="flex flex-col items-center text-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-white group-hover:text-pink-400 transition-colors">Ulangan</h3>
                            <p className="text-xs text-slate-400">Tab lock + timer</p>
                        </div>
                    </div>
                </Link>

                <Link href="/dashboard/guru/kuis" className="group bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 hover:border-cyan-500/50 transition-all">
                    <div className="flex flex-col items-center text-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center text-white">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-white group-hover:text-cyan-400 transition-colors">Kuis</h3>
                            <p className="text-xs text-slate-400">Buat kuis + AI</p>
                        </div>
                    </div>
                </Link>

                <Link href="/dashboard/guru/bank-soal" className="group bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 hover:border-indigo-500/50 transition-all">
                    <div className="flex flex-col items-center text-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-white group-hover:text-indigo-400 transition-colors">Bank Soal</h3>
                            <p className="text-xs text-slate-400">Simpan & reuse</p>
                        </div>
                    </div>
                </Link>

                <Link href="/dashboard/guru/nilai" className="group bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 hover:border-purple-500/50 transition-all">
                    <div className="flex flex-col items-center text-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-white group-hover:text-purple-400 transition-colors">Nilai</h3>
                            <p className="text-xs text-slate-400">Koreksi & penilaian</p>
                        </div>
                    </div>
                </Link>
            </div>

            {/* Teaching Assignments */}
            <div>
                <h2 className="text-xl font-bold text-white mb-4">Kelas yang Diampu</h2>
                {loading ? (
                    <div className="text-center text-slate-400 py-8">Memuat...</div>
                ) : assignments.length === 0 ? (
                    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-8 text-center text-slate-400">
                        Belum ada penugasan mengajar. Hubungi admin untuk ditugaskan.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">


                        {assignments.map((assignment) => (
                            <div key={assignment.id} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-white">{assignment.subject.name}</h3>
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm text-slate-400">{assignment.class.name}</p>
                                            <Link
                                                href={`/dashboard/guru/kelas/${assignment.class.id}`}
                                                className="text-xs px-2 py-0.5 bg-cyan-500/10 text-cyan-400 rounded hover:bg-cyan-500/20 transition-colors flex items-center gap-1"
                                            >
                                                <span>👥 Lihat Siswa</span>
                                            </Link>
                                        </div>
                                    </div>
                                    {assignment.academic_year.is_active && (
                                        <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">Aktif</span>
                                    )}
                                </div>
                                <p className="text-xs text-slate-500">{assignment.academic_year.name}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
