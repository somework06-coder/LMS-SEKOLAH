'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'

interface Answer {
    question_id: string
    answer: string
    is_correct?: boolean | null // null for essay
    score?: number | null
    feedback?: string
}

interface Question {
    id: string
    question_text: string
    question_type: 'ESSAY' | 'MULTIPLE_CHOICE'
    options: string[] | null
    correct_answer: string | null
    points: number
    order_index: number
}

interface SubmissionDetail {
    id: string
    answers: Answer[]
    total_score: number
    max_score: number
    student: {
        user: { full_name: string }
        nis: string
    }
    quiz: {
        title: string
        questions: Question[]
    }
}

export default function GradingPage() {
    const params = useParams()
    const router = useRouter()
    const quizId = params.id as string
    const submissionId = params.submissionId as string

    const [submission, setSubmission] = useState<SubmissionDetail | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    // Local state for grading edits
    const [grades, setGrades] = useState<Record<string, { score: number, feedback: string }>>({})

    useEffect(() => {
        fetchData()
    }, [submissionId])

    const fetchData = async () => {
        try {
            const res = await fetch(`/api/quiz-submissions/${submissionId}`)
            const data = await res.json()
            setSubmission(data)

            // Initialize grades state
            const initialGrades: Record<string, { score: number, feedback: string }> = {}
            data.answers.forEach((ans: Answer) => {
                initialGrades[ans.question_id] = {
                    score: ans.score || 0,
                    feedback: ans.feedback || ''
                }
            })
            setGrades(initialGrades)

        } catch (error) {
            console.error('Error:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleGradeChange = (qId: string, field: 'score' | 'feedback', value: string | number) => {
        setGrades(prev => ({
            ...prev,
            [qId]: {
                ...prev[qId],
                [field]: value
            }
        }))
    }

    const handleSave = async () => {
        if (!submission) return
        setSaving(true)

        try {
            // Reconstruct answers array with new grades
            let totalScore = 0
            const updatedAnswers = submission.answers.map(ans => {
                const grade = grades[ans.question_id]
                // Ensure default if not graded yet
                const currentScore = grade ? grade.score : (ans.score || 0)
                const currentFeedback = grade ? grade.feedback : (ans.feedback || '')

                totalScore += currentScore

                return {
                    ...ans,
                    score: currentScore,
                    feedback: currentFeedback
                    // is_correct logic for Essay is subjective, handled by score > 0? 
                    // For MC, we keep existing is_correct unless we want to override it.
                    // Let's just update score and feedback.
                }
            })

            // Also check for answers that might not be in the submission (if student skipped?)
            // But usually submission contains all attempted.
            // Actually, we should iterate through QUIZ questions to calculate total score correctly 
            // incase student didn't answer some.
            // But `submission.answers` is what we update. 
            // Total score is sum of updated answers.

            await fetch(`/api/quiz-submissions/${submissionId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    answers: updatedAnswers,
                    total_score: totalScore,
                    is_graded: true
                })
            })

            alert('Penilaian berhasil disimpan!')
            router.push(`/dashboard/guru/kuis/${quizId}/hasil`)
        } catch (error) {
            console.error('Error saving:', error)
            alert('Gagal menyimpan penilaian')
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <div className="text-center text-slate-400 py-8">Memuat data...</div>
    if (!submission) return <div className="text-center text-slate-400 py-8">Data tidak ditemukan</div>

    // Sort questions by order
    const questions = [...(submission.quiz.questions || [])].sort((a, b) => a.order_index - b.order_index)

    return (
        <div className="space-y-6 pb-20">
            {/* Header Sticky */}
            <div className="sticky top-0 z-10 bg-slate-900/90 backdrop-blur border-b border-slate-700 pb-4 pt-2 -mx-4 px-4 md:-mx-8 md:px-8">
                <div className="flex items-center gap-4">
                    <Link href={`/dashboard/guru/kuis/${quizId}/hasil`} className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </Link>
                    <div className="flex-1">
                        <h1 className="text-xl font-bold text-white">Penilaian: {submission.student.user.full_name}</h1>
                        <p className="text-sm text-slate-400">{submission.quiz.title}</p>
                    </div>
                    <div className="text-right">
                        <span className="text-2xl font-bold text-cyan-400">
                            {Object.values(grades).reduce((acc, curr) => acc + (curr.score || 0), 0)}
                        </span>
                        <span className="text-sm text-slate-500">/{submission.max_score}</span>
                    </div>
                </div>
            </div>

            {/* Grading List */}
            <div className="space-y-6 max-w-4xl mx-auto">
                {questions.map((q, idx) => {
                    const ans = submission.answers.find(a => a.question_id === q.id)
                    const grade = grades[q.id] || { score: 0, feedback: '' }
                    const isCorrect = q.question_type === 'MULTIPLE_CHOICE'
                        ? (ans?.answer === q.correct_answer)
                        : null

                    return (
                        <div key={q.id} className={`border rounded-xl p-6 ${q.question_type === 'ESSAY' ? 'bg-slate-800/50 border-amber-500/30' : 'bg-slate-800/30 border-slate-700/50'
                            }`}>
                            <div className="flex items-start gap-4 mb-4">
                                <span className="w-8 h-8 rounded-full bg-slate-700 text-white flex items-center justify-center font-bold flex-shrink-0">
                                    {idx + 1}
                                </span>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className={`px-2 py-0.5 text-xs rounded ${q.question_type === 'MULTIPLE_CHOICE' ? 'bg-blue-500/20 text-blue-400' : 'bg-amber-500/20 text-amber-400'}`}>
                                            {q.question_type === 'MULTIPLE_CHOICE' ? 'Pilihan Ganda' : 'Essay'}
                                        </span>
                                        <span className="text-xs text-slate-500">Max: {q.points} Poin</span>
                                    </div>
                                    <p className="text-white text-lg mb-4">{q.question_text}</p>

                                    <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50 space-y-3">
                                        <div>
                                            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Jawaban Siswa</p>
                                            <p className={`font-medium ${q.question_type === 'MULTIPLE_CHOICE'
                                                    ? (isCorrect ? 'text-green-400' : 'text-red-400')
                                                    : 'text-white whitespace-pre-wrap'
                                                }`}>
                                                {q.question_type === 'MULTIPLE_CHOICE' && q.options
                                                    ? `${ans?.answer}. ${q.options[(ans?.answer.charCodeAt(0) || 65) - 65] || ''}`
                                                    : ans?.answer || '(Tidak menjawab)'}
                                            </p>
                                        </div>

                                        {q.question_type === 'MULTIPLE_CHOICE' && !isCorrect && (
                                            <div>
                                                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Kunci Jawaban</p>
                                                <p className="text-green-400">
                                                    {q.correct_answer}. {q.options?.[(q.correct_answer?.charCodeAt(0) || 65) - 65]}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="pl-12 grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-700/10 p-4 rounded-lg">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Nilai</label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            value={grade.score}
                                            onChange={(e) => {
                                                const val = Math.min(q.points, Math.max(0, parseInt(e.target.value) || 0))
                                                handleGradeChange(q.id, 'score', val)
                                            }}
                                            className={`w-24 px-3 py-2 bg-slate-700 border rounded-lg text-white focus:outline-none focus:ring-2 ${q.question_type === 'ESSAY' ? 'border-amber-500 text-amber-400 focus:ring-amber-500' : 'border-slate-600 focus:ring-cyan-500'
                                                }`}
                                            max={q.points}
                                            min={0}
                                        />
                                        <span className="text-slate-500 text-sm">/ {q.points}</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Feedback</label>
                                    <input
                                        type="text"
                                        value={grade.feedback}
                                        onChange={(e) => handleGradeChange(q.id, 'feedback', e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 placeholder-slate-500"
                                        placeholder="Berikan catatan..."
                                    />
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Save Action */}
            <div className="fixed bottom-0 left-0 right-0 bg-slate-900/90 backdrop-blur border-t border-slate-700 p-4 z-10">
                <div className="max-w-4xl mx-auto flex items-center justify-end gap-4">
                    <Link
                        href={`/dashboard/guru/kuis/${quizId}/hasil`}
                        className="px-6 py-3 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 transition-colors"
                    >
                        Batal
                    </Link>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-green-500/20 hover:opacity-90 transition-all disabled:opacity-50"
                    >
                        {saving ? 'Menyimpan...' : 'Simpan Penilaian'}
                    </button>
                </div>
            </div>
        </div>
    )
}
