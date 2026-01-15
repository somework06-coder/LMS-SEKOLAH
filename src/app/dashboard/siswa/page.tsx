'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

interface StudentData {
    id: string
    nis: string | null
    class: { id: string; name: string } | null
}

export default function SiswaDashboard() {
    const { user } = useAuth()
    const router = useRouter()
    const [student, setStudent] = useState<StudentData | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (user && user.role !== 'SISWA') {
            router.replace('/dashboard')
        }
    }, [user, router])

    useEffect(() => {
        const fetchStudent = async () => {
            try {
                const res = await fetch('/api/students')
                const students = await res.json()
                const myStudent = students.find((s: { user: { id: string } }) => s.user.id === user?.id)
                setStudent(myStudent || null)
            } catch (error) {
                console.error('Error:', error)
            } finally {
                setLoading(false)
            }
        }
        if (user) fetchStudent()
    }, [user])

    return (
        <div className="space-y-8">
            {/* Welcome */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-green-600 to-emerald-600 p-8">
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
                <div className="relative">
                    <h1 className="text-3xl font-bold text-white mb-2">
                        Selamat Datang, {user?.full_name || 'Siswa'}! 👋
                    </h1>
                    <p className="text-green-100">
                        Dashboard Siswa - Akses materi dan kerjakan tugas
                    </p>
                    {!loading && student?.class && (
                        <p className="mt-2 text-green-200">
                            Kelas: <span className="font-semibold">{student.class.name}</span>
                        </p>
                    )}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Link href="/dashboard/siswa/materi" className="group bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 hover:border-blue-500/50 transition-all">
                    <div className="flex flex-col items-center text-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center text-white">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">Materi</h3>
                            <p className="text-xs text-slate-400">Bahan belajar</p>
                        </div>
                    </div>
                </Link>

                <Link href="/dashboard/siswa/tugas" className="group bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 hover:border-amber-500/50 transition-all">
                    <div className="flex flex-col items-center text-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center text-white">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-white group-hover:text-amber-400 transition-colors">Tugas</h3>
                            <p className="text-xs text-slate-400">PR & ulangan</p>
                        </div>
                    </div>
                </Link>

                <Link href="/dashboard/siswa/kuis" className="group bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 hover:border-cyan-500/50 transition-all">
                    <div className="flex flex-col items-center text-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center text-white">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-white group-hover:text-cyan-400 transition-colors">Kuis</h3>
                            <p className="text-xs text-slate-400">Kerjakan kuis</p>
                        </div>
                    </div>
                </Link>

                <Link href="/dashboard/siswa/nilai" className="group bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 hover:border-purple-500/50 transition-all">
                    <div className="flex flex-col items-center text-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-white group-hover:text-purple-400 transition-colors">Nilai</h3>
                            <p className="text-xs text-slate-400">Lihat nilai</p>
                        </div>
                    </div>
                </Link>
            </div>

            {/* Info Card */}
            {!loading && (
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
                    <h2 className="text-lg font-semibold text-white mb-4">Informasi Akun</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <p className="text-sm text-slate-400">Nama Lengkap</p>
                            <p className="text-white font-medium">{user?.full_name || '-'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-slate-400">NIS</p>
                            <p className="text-white font-medium">{student?.nis || '-'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-slate-400">Kelas</p>
                            <p className="text-white font-medium">{student?.class?.name || 'Belum ada kelas'}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
