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
            return { status: 'submitted', label: '✅ Sudah Dikumpulkan', color: 'bg-green-500/20 text-green-400' }
        }
        if (now < startTime) {
            const diff = startTime.getTime() - now.getTime()
            const hours = Math.floor(diff / 3600000)
            const mins = Math.floor((diff % 3600000) / 60000)
            return { status: 'scheduled', label: `⏰ Mulai dalam ${hours}j ${mins}m`, color: 'bg-blue-500/20 text-blue-400' }
        }
        if (now >= startTime && now <= endTime) {
            if (submission) {
                return { status: 'in_progress', label: '📝 Lanjutkan', color: 'bg-amber-500/20 text-amber-400' }
            }
            return { status: 'available', label: '🚀 Mulai Sekarang', color: 'bg-green-500/20 text-green-400' }
        }
        return { status: 'ended', label: '⌛ Waktu Habis', color: 'bg-slate-500/20 text-slate-400' }
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
            <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-xl p-4">
                <div className="flex items-start gap-3">
                    <div className="text-2xl">⚠️</div>
                    <div>
                        <h3 className="font-semibold text-amber-400">Perhatian!</h3>
                        <p className="text-sm text-slate-300">Saat mengerjakan ulangan, Anda <strong>tidak boleh keluar</strong> dari halaman ulangan. Jika keluar terlalu sering, ulangan akan dikumpulkan otomatis.</p>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="text-center text-slate-400 py-8">Memuat...</div>
            ) : exams.length === 0 ? (
                <EmptyState
                    icon="📄"
                    title="Belum Ada Ulangan"
                    description="Ulangan akan muncul di sini saat guru mempublishnya"
                />
            ) : (
                <div className="grid gap-4">
                    {exams.map((exam) => {
                        const { status, label, color } = getExamStatus(exam)
                        const submission = submissions.find(s => s.exam_id === exam.id)
                        const canStart = status === 'available' || status === 'in_progress'

                        return (
                            <div key={exam.id} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="font-semibold text-white text-lg">{exam.title}</h3>
                                            <span className={`px-3 py-1 text-xs rounded-full ${color}`}>{label}</span>
                                        </div>
                                        <p className="text-sm text-slate-400 mb-3">{exam.description || '-'}</p>
                                        <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                                            <span className="px-2 py-1 bg-slate-700/50 rounded">{exam.teaching_assignment?.subject?.name}</span>
                                            <span>📅 {formatDateTime(exam.start_time)}</span>
                                            <span>⏱️ {exam.duration_minutes} menit</span>
                                            <span>⚠️ Max {exam.max_violations} pelanggaran</span>
                                        </div>

                                        {submission?.is_submitted && (
                                            <div className="mt-3 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                                                <p className="text-green-400 font-medium">Nilai: {submission.total_score} / {submission.max_score}</p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="ml-4">
                                        {canStart && (
                                            <Link
                                                href={`/dashboard/siswa/ulangan/${exam.id}`}
                                                className="px-5 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
                                            >
                                                {status === 'in_progress' ? '▶️ Lanjut' : '🚀 Mulai'}
                                            </Link>
                                        )}
                                        {status === 'submitted' && (
                                            <Link
                                                href={`/dashboard/siswa/ulangan/${exam.id}/hasil`}
                                                className="px-5 py-3 bg-green-500/20 text-green-400 rounded-xl font-medium hover:bg-green-500/30 transition-colors flex items-center gap-2"
                                            >
                                                📊 Lihat Hasil
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
