'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'

interface Quiz {
    id: string
    title: string
    description: string | null
    duration_minutes: number
    is_active: boolean
    teaching_assignment: {
        subject: { name: string }
        class: { name: string }
    }
    questions: { count: number }[]
}

interface QuizSubmission {
    id: string
    quiz_id: string
    submitted_at: string | null
    total_score: number
    max_score: number
    is_graded: boolean
}

export default function SiswaKuisPage() {
    const { user } = useAuth()
    const [quizzes, setQuizzes] = useState<Quiz[]>([])
    const [submissions, setSubmissions] = useState<QuizSubmission[]>([])
    const [studentId, setStudentId] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchData()
    }, [user])

    const fetchData = async () => {
        try {
            // Get student info
            const studentsRes = await fetch('/api/students')
            const students = await studentsRes.json()
            const myStudent = students.find((s: any) => s.user.id === user?.id)

            if (!myStudent?.class_id) {
                setLoading(false)
                return
            }

            setStudentId(myStudent.id)

            // Get quizzes and submissions
            const [quizzesRes, subsRes] = await Promise.all([
                fetch('/api/quizzes'),
                fetch(`/api/quiz-submissions?student_id=${myStudent.id}`)
            ])
            const [quizzesData, subsData] = await Promise.all([
                quizzesRes.json(),
                subsRes.json()
            ])

            // Filter quizzes for student's class
            const myQuizzes = quizzesData.filter((q: Quiz) =>
                q.is_active && q.teaching_assignment?.class?.name === myStudent.class.name
            )
            setQuizzes(myQuizzes)
            setSubmissions(subsData)
        } catch (error) {
            console.error('Error:', error)
        } finally {
            setLoading(false)
        }
    }

    const getSubmission = (quizId: string) => {
        return submissions.find((s) => s.quiz_id === quizId)
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/siswa" className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-white">🎯 Kuis</h1>
                    <p className="text-slate-400">Kerjakan kuis dari guru</p>
                </div>
            </div>

            {loading ? (
                <div className="text-center text-slate-400 py-8">Memuat...</div>
            ) : quizzes.length === 0 ? (
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-8 text-center">
                    <div className="text-6xl mb-4">🎯</div>
                    <h3 className="text-xl font-semibold text-white mb-2">Belum Ada Kuis</h3>
                    <p className="text-slate-400">Belum ada kuis aktif untuk kelasmu.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {quizzes.map((quiz) => {
                        const submission = getSubmission(quiz.id)
                        const isCompleted = !!submission?.submitted_at
                        const questionCount = quiz.questions?.[0]?.count || 0

                        return (
                            <div key={quiz.id} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-semibold text-white text-lg">{quiz.title}</h3>
                                            {isCompleted && (
                                                <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">
                                                    Selesai
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-slate-400 mb-2">{quiz.description || '-'}</p>
                                        <div className="flex items-center gap-4 text-xs text-slate-500">
                                            <span className="px-2 py-1 bg-slate-700/50 rounded">{quiz.teaching_assignment?.subject?.name}</span>
                                            <span>⏱️ {quiz.duration_minutes} menit</span>
                                            <span>📝 {questionCount} soal</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        {isCompleted ? (
                                            <>
                                                <div className="text-right">
                                                    <p className="text-2xl font-bold text-cyan-400">
                                                        {submission.total_score}/{submission.max_score}
                                                    </p>
                                                    <p className="text-xs text-slate-400">
                                                        {submission.is_graded ? 'Nilai Final' : 'Menunggu penilaian essay'}
                                                    </p>
                                                </div>
                                                <Link
                                                    href={`/dashboard/siswa/kuis/${quiz.id}/hasil`}
                                                    className="px-4 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors text-sm"
                                                >
                                                    Lihat Hasil
                                                </Link>
                                            </>
                                        ) : (
                                            <Link
                                                href={`/dashboard/siswa/kuis/${quiz.id}`}
                                                className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
                                            >
                                                Mulai Kuis
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
