'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'

interface Student {
    id: string
    nis: string
    user: {
        id: string
        username: string
        full_name: string
    }
    class: {
        id: string
        name: string
    }
}

export default function ClassStudentsPage() {
    const params = useParams()
    const { user } = useAuth()
    const router = useRouter()
    const classId = params.id as string

    const [students, setStudents] = useState<Student[]>([])
    const [loading, setLoading] = useState(true)
    const [className, setClassName] = useState<string>('')

    useEffect(() => {
        if (user && user.role !== 'GURU') {
            router.replace('/dashboard')
        }
    }, [user, router])

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                const res = await fetch(`/api/students?class_id=${classId}`)
                const data = await res.json()

                if (Array.isArray(data)) {
                    setStudents(data)
                    // Set class name from first student if available
                    if (data.length > 0 && data[0].class) {
                        setClassName(data[0].class.name)
                    }
                }
            } catch (error) {
                console.error('Error fetching students:', error)
            } finally {
                setLoading(false)
            }
        }

        if (classId) {
            fetchStudents()
        }
    }, [classId])

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/guru" className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-white">
                        Daftar Siswa {className ? `- ${className}` : ''}
                    </h1>
                    <p className="text-slate-400">Kelola data siswa di kelas ini</p>
                </div>
            </div>

            {loading ? (
                <div className="text-center text-slate-400 py-8">Memuat data siswa...</div>
            ) : students.length === 0 ? (
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-8 text-center">
                    <div className="text-5xl mb-4">👥</div>
                    <h3 className="text-xl font-semibold text-white mb-2">Belum Ada Siswa</h3>
                    <p className="text-slate-400">Belum ada siswa yang terdaftar di kelas ini.</p>
                </div>
            ) : (
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-700/50 text-slate-300">
                                <tr>
                                    <th className="px-6 py-4 font-semibold">No</th>
                                    <th className="px-6 py-4 font-semibold">NIS</th>
                                    <th className="px-6 py-4 font-semibold">Nama Lengkap</th>
                                    <th className="px-6 py-4 font-semibold">Username</th>
                                    <th className="px-6 py-4 font-semibold text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700/50">
                                {students.map((student, idx) => (
                                    <tr key={student.id} className="hover:bg-slate-700/20 transition-colors">
                                        <td className="px-6 py-4 text-slate-400 w-16">{idx + 1}</td>
                                        <td className="px-6 py-4 text-slate-300 font-mono">{student.nis}</td>
                                        <td className="px-6 py-4 text-white font-medium">{student.user.full_name}</td>
                                        <td className="px-6 py-4 text-slate-400">{student.user.username}</td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="text-xs px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors">
                                                Detail
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    )
}
