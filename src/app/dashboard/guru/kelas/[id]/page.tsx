'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { PageHeader, Card, EmptyState, Button } from '@/components/ui'

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
            <PageHeader
                title={`Daftar Siswa ${className ? `- ${className}` : ''}`}
                subtitle="Kelola data siswa yang terdaftar di kelas ini"
                backHref="/dashboard/guru"
                icon={
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary text-xl">
                        👥
                    </div>
                }
            />

            {loading ? (
                <div className="flex flex-col items-center justify-center py-12">
                    <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4"></div>
                    <p className="text-text-secondary dark:text-zinc-400 animate-pulse">Memuat data siswa...</p>
                </div>
            ) : students.length === 0 ? (
                <EmptyState
                    icon="👥"
                    title="Belum Ada Siswa"
                    description="Belum ada siswa yang terdaftar di kelas ini."
                />
            ) : (
                <Card className="overflow-hidden bg-white dark:bg-surface-dark border-secondary/20">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left bg-transparent">
                            <thead className="bg-secondary/10 dark:bg-black/20 text-text-secondary dark:text-zinc-300 sticky top-0 z-10">
                                <tr>
                                    <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">No</th>
                                    <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">NIS</th>
                                    <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Nama Lengkap</th>
                                    <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Username</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-secondary/20 dark:divide-white/10">
                                {students.map((student, idx) => (
                                    <tr key={student.id} className="hover:bg-secondary/10 dark:hover:bg-white/5 transition-colors group">
                                        <td className="px-6 py-4 text-text-secondary dark:text-zinc-400 w-16">{idx + 1}</td>
                                        <td className="px-6 py-4 text-text-main dark:text-zinc-300 font-mono text-sm">{student.nis}</td>
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-text-main dark:text-white group-hover:text-primary transition-colors">
                                                {student.user.full_name}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4 text-text-secondary dark:text-zinc-400 text-sm">{student.user.username}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}
        </div>
    )
}
