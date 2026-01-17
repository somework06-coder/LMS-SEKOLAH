'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

interface ExamResult {
    id: string
    total_score: number
    max_score: number
    violation_count: number
    started_at: string
    submitted_at: string
    exam: {
        title: string
        duration_minutes: number
        teaching_assignment: {
            subject: { name: string }
            class: { name: string }
        }
    }
}

interface Answer {
    id: string
    answer: string
    is_correct: boolean
    points_earned: number
    question: {
        question_text: string
        question_type: string
        options: string[] | null
        correct_answer: string | null
        points: number
    }
}

export default function ExamResultPage() {
    const params = useParams()
    const examId = params.id as string
    const [result, setResult] = useState<ExamResult | null>(null)
    const [answers, setAnswers] = useState<Answer[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchResult()
    }, [examId])

    const fetchResult = async () => {
        try {
            const res = await fetch(`/api/exam-submissions?exam_id=${examId}`)
            const data = await res.json()

            if (Array.isArray(data) && data.length > 0) {
                setResult(data[0])
            }
        } catch (error) {
            console.error('Error:', error)
        } finally {
            setLoading(false)
        }
    }

    const formatDuration = (start: string, end: string) => {
        const diff = new Date(end).getTime() - new Date(start).getTime()
        const mins = Math.floor(diff / 60000)
        const secs = Math.floor((diff % 60000) / 1000)
        return `${mins} menit ${secs} detik`
    }

    const getGradeColor = (percentage: number) => {
        if (percentage >= 80) return 'from-green-500 to-emerald-500'
        if (percentage >= 60) return 'from-blue-500 to-cyan-500'
        if (percentage >= 40) return 'from-yellow-500 to-amber-500'
        return 'from-red-500 to-rose-500'
    }

    if (loading) {
        return <div className="text-center text-slate-400 py-8">Memuat hasil...</div>
    }

    if (!result) {
        return (
            <div className="text-center text-slate-400 py-8">
                <p>Hasil tidak ditemukan</p>
                <Link href="/dashboard/siswa/ulangan" className="text-purple-400 underline mt-2 inline-block">
                    Kembali
                </Link>
            </div>
        )
    }

    const percentage = Math.round((result.total_score / result.max_score) * 100)

    return (
        <div className="space-y-6 max-w-3xl mx-auto">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/siswa/ulangan" className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-white">Hasil Ulangan</h1>
                    <p className="text-slate-400">{result.exam?.title}</p>
                </div>
            </div>

            {/* Score Card */}
            <div className={`bg-gradient-to-r ${getGradeColor(percentage)} p-6 rounded-2xl text-white text-center`}>
                <p className="text-lg opacity-80 mb-2">{result.exam?.teaching_assignment?.subject?.name}</p>
                <p className="text-6xl font-bold mb-2">{result.total_score}<span className="text-3xl opacity-70">/{result.max_score}</span></p>
                <p className="text-2xl">{percentage}%</p>
                <p className="mt-4 text-lg">
                    {percentage >= 80 ? '🎉 Excellent!' : percentage >= 60 ? '👍 Good Job!' : percentage >= 40 ? '💪 Keep Trying!' : '📚 Need More Study'}
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-white">{formatDuration(result.started_at, result.submitted_at)}</p>
                    <p className="text-sm text-slate-400">Waktu Pengerjaan</p>
                </div>
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-white">{result.exam?.duration_minutes} menit</p>
                    <p className="text-sm text-slate-400">Batas Waktu</p>
                </div>
                <div className={`bg-slate-800/50 border rounded-xl p-4 text-center ${result.violation_count > 0 ? 'border-red-500/50' : 'border-slate-700/50'}`}>
                    <p className={`text-2xl font-bold ${result.violation_count > 0 ? 'text-red-400' : 'text-green-400'}`}>{result.violation_count}</p>
                    <p className="text-sm text-slate-400">Pelanggaran</p>
                </div>
            </div>

            {/* Completion notice */}
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 flex items-center gap-3">
                <div className="text-3xl">✅</div>
                <div>
                    <p className="text-green-400 font-medium">Ulangan Selesai</p>
                    <p className="text-sm text-slate-400">Dikumpulkan pada {new Date(result.submitted_at).toLocaleString('id-ID')}</p>
                </div>
            </div>

            <Link
                href="/dashboard/siswa/ulangan"
                className="block w-full text-center px-6 py-3 bg-purple-500/20 text-purple-400 rounded-xl hover:bg-purple-500/30 transition-colors"
            >
                ← Kembali ke Daftar Ulangan
            </Link>
        </div>
    )
}
