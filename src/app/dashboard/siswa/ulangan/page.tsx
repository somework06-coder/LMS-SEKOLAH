'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { PageHeader, EmptyState } from '@/components/ui'

interface Exam {
    id: string
    title: string
    description: string | null
    start_time: string
    duration_minutes: number
    is_active: boolean
    max_violations: number
    teaching_assignment: {
        subject: { name: string }
        class: { name: string }
    }
}

interface ExamSubmission {
    id: string
    exam_id: string
    is_submitted: boolean
    total_score: number
    max_score: number
}

export default function SiswaUlanganPage() {
    const { user } = useAuth()
    const [exams, setExams] = useState<Exam[]>([])
    const [submissions, setSubmissions] = useState<ExamSubmission[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (user) fetchData()
    }, [user])

    const fetchData = async () => {
        try {
            const [examsRes, submissionsRes] = await Promise.all([
                fetch('/api/exams'),
                fetch('/api/exam-submissions')
            ])
            const examsData = await examsRes.json()
            const submissionsData = await submissionsRes.json()

            const activeExams = (Array.isArray(examsData) ? examsData : []).filter((e: Exam) => e.is_active)
            setExams(activeExams)
            setSubmissions(Array.isArray(submissionsData) ? submissionsData : [])
        } catch (error) {
            console.error('Error:', error)
        } finally {
            setLoading(false)
        }
    }

    const getExamStatus = (exam: Exam) => {
        const now = new Date()
        const startTime = new Date(exam.start_time)
        const endTime = new Date(startTime.getTime() + exam.duration_minutes * 60000)

        const submission = submissions.find(s => s.exam_id === exam.id)

        if (submission?.is_submitted) {
            return { status: 'submitted', label: '✅ Sudah Dikumpulkan', color: 'bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400' }
        }
        if (now < startTime) {
            const diff = startTime.getTime() - now.getTime()
            const hours = Math.floor(diff / 3600000)
            const mins = Math.floor((diff % 3600000) / 60000)
            return { status: 'scheduled', label: `⏰ Mulai dalam ${hours}j ${mins}m`, color: 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400' }
        }
        if (now >= startTime && now <= endTime) {
            if (submission) {
                return { status: 'in_progress', label: '📝 Lanjutkan', color: 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400' }
            }
            return { status: 'available', label: '🚀 Mulai Sekarang', color: 'bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400' }
        }
        return { status: 'ended', label: '⌛ Waktu Habis', color: 'bg-slate-100 text-slate-500 dark:bg-slate-500/20 dark:text-slate-400' }
    }

    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleString('id-ID', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        })
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="📄 Ulangan"
                subtitle="Daftar ulangan yang tersedia"
                backHref="/dashboard/siswa"
            />

            {/* Warning card */}
            <div className="bg-amber-50 border border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/30 rounded-xl p-4">
                <div className="flex items-start gap-3">
                    <div className="text-2xl">⚠️</div>
                    <div>
                        <h3 className="font-bold text-amber-700 dark:text-amber-400">Perhatian!</h3>
                        <p className="text-sm text-amber-600/80 dark:text-amber-200/80">Saat mengerjakan ulangan, Anda <strong>tidak boleh keluar</strong> dari halaman ulangan. Jika keluar terlalu sering, ulangan akan dikumpulkan otomatis.</p>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin text-3xl text-primary">⏳</div>
                </div>
            ) : exams.length === 0 ? (
                <EmptyState
                    icon="📄"
                    title="Belum Ada Ulangan"
                    description="Ulangan akan muncul di sini saat guru mempublishnya"
                />
            ) : (
                <div className="grid gap-4 md:grid-cols-2">
                    {exams.map((exam) => {
                        const { status, label, color } = getExamStatus(exam)
                        const submission = submissions.find(s => s.exam_id === exam.id)
                        const canStart = status === 'available' || status === 'in_progress'

                        // Adjust color for light mode if it was using hardcoded colors
                        // We'll rely on the getExamStatus logic but ensure the classes are compatible or tweak getExamStatus if needed.
                        // Ideally getExamStatus should return semantic variants, but for now we trust the classes returned or override them.
                        // Actually let's assume getExamStatus returns specific colors that might need tweaking for light mode visibility.
                        // For safetly, let's map the color classes or just ensure container contrast.

                        return (
                            <div key={exam.id} className="bg-white dark:bg-surface-dark border-2 border-primary/30 rounded-xl p-5 hover:border-primary hover:shadow-lg hover:shadow-primary/10 active:scale-[0.98] transition-all cursor-pointer">
                                <div className="flex flex-col h-full gap-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex flex-wrap items-center gap-2 mb-2">
                                                <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${color}`}>
                                                    {label}
                                                </span>
                                            </div>
                                            <h3 className="font-bold text-text-main dark:text-white text-lg">{exam.title}</h3>
                                        </div>
                                    </div>

                                    <p className="text-sm text-text-secondary dark:text-zinc-400 line-clamp-2">{exam.description || 'Tidak ada deskripsi'}</p>

                                    <div className="space-y-2 pt-3 border-t border-secondary/10">
                                        <div className="flex items-center justify-between text-xs text-text-secondary">
                                            <span>Mata Pelajaran</span>
                                            <span className="font-bold text-text-main dark:text-zinc-300">{exam.teaching_assignment?.subject?.name}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs text-text-secondary">
                                            <span>Waktu Mulai</span>
                                            <span className="font-medium">{formatDateTime(exam.start_time)}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs text-text-secondary">
                                            <span>Durasi</span>
                                            <span className="font-medium">⏱️ {exam.duration_minutes} menit</span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs text-text-secondary">
                                            <span>Max Pelanggaran</span>
                                            <span className="font-medium text-red-500">⚠️ {exam.max_violations}x</span>
                                        </div>
                                    </div>

                                    {submission?.is_submitted && (
                                        <div className="mt-auto p-3 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/30 rounded-lg text-center">
                                            <p className="text-green-600 dark:text-green-400 font-bold text-sm">
                                                Nilai: {submission.total_score} / {submission.max_score}
                                            </p>
                                        </div>
                                    )}

                                    <div className="mt-auto pt-2">
                                        {canStart && (
                                            <Link
                                                href={`/dashboard/siswa/ulangan/${exam.id}`}
                                                className="w-full block text-center px-5 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 hover:scale-[1.02] transition-all"
                                            >
                                                {status === 'in_progress' ? '▶️ Lanjutkan Ulangan' : '🚀 Mulai Ulangan'}
                                            </Link>
                                        )}
                                        {status === 'submitted' && (
                                            <Link
                                                href={`/dashboard/siswa/ulangan/${exam.id}/hasil`}
                                                className="w-full block text-center px-5 py-3 bg-secondary/10 text-primary-dark dark:text-primary rounded-xl font-bold hover:bg-secondary/20 transition-colors"
                                            >
                                                📊 Lihat Detail Hasil
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
