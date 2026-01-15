'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

interface QuizSubmission {
    id: string
    submitted_at: string
    total_score: number
    max_score: number
    is_graded: boolean
    student: {
        id: string
        nis: string
        user: { full_name: string }
    }
}

interface Quiz {
    title: string
    teaching_assignment: {
        class: { id: string; name: string }
        subject: { name: string }
    }
}

interface Student {
    id: string
    nis: string
    user: { full_name: string }
}

export default function QuizSubmissionsPage() {
    const params = useParams()
    const quizId = params.id as string

    const [submissions, setSubmissions] = useState<QuizSubmission[]>([])
    const [quiz, setQuiz] = useState<Quiz | null>(null)
    const [classStudents, setClassStudents] = useState<Student[]>([])
    const [loading, setLoading] = useState(true)
    const [showNotSubmitted, setShowNotSubmitted] = useState(false)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [quizRes, subsRes] = await Promise.all([
                    fetch(`/api/quizzes/${quizId}`),
                    fetch(`/api/quiz-submissions?quiz_id=${quizId}`)
                ])

                const quizData = await quizRes.json()
                const subsData = await subsRes.json()

                setQuiz(quizData)
                setSubmissions(subsData)

                // Fetch students in this class
                if (quizData.teaching_assignment?.class?.id) {
                    const studentsRes = await fetch(`/api/students?class_id=${quizData.teaching_assignment.class.id}`)
                    const studentsData = await studentsRes.json()
                    setClassStudents(studentsData)
                }

            } catch (error) {
                console.error('Error:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [quizId])

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
        })
    }

    // Calculate not submitted students
    const submittedStudentIds = submissions.map(s => s.student.id)
    const notSubmittedStudents = classStudents.filter(s => !submittedStudentIds.includes(s.id))

    if (loading) return <div className="text-center text-slate-400 py-8">Memuat data...</div>

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/guru/kuis" className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </Link>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-white">Hasil Kuis: {quiz?.title}</h1>
                    <p className="text-slate-400">
                        {quiz?.teaching_assignment?.class?.name} • {quiz?.teaching_assignment?.subject?.name} • {submissions.length} Pengumpulan
                    </p>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-green-400">{submissions.length}</p>
                    <p className="text-xs text-slate-400">Sudah Mengerjakan</p>
                </div>
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-red-400">{notSubmittedStudents.length}</p>
                    <p className="text-xs text-slate-400">Belum Mengerjakan</p>
                </div>
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-cyan-400">{classStudents.length}</p>
                    <p className="text-xs text-slate-400">Total Siswa</p>
                </div>
            </div>

            {/* Not Submitted Students Section */}
            {notSubmittedStudents.length > 0 && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl overflow-hidden">
                    <button
                        onClick={() => setShowNotSubmitted(!showNotSubmitted)}
                        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-red-500/20 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <span className="text-red-400 text-xl">⚠️</span>
                            <span className="text-red-400 font-medium">{notSubmittedStudents.length} Siswa Belum Mengerjakan</span>
                        </div>
                        <svg className={`w-5 h-5 text-red-400 transition-transform ${showNotSubmitted ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                    {showNotSubmitted && (
                        <div className="px-4 pb-4 space-y-2">
                            {notSubmittedStudents.map(student => (
                                <div key={student.id} className="flex items-center gap-3 px-3 py-2 bg-slate-800/50 rounded-lg">
                                    <div className="w-8 h-8 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center text-xs font-bold">
                                        {student.user.full_name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-white text-sm font-medium">{student.user.full_name}</p>
                                        <p className="text-xs text-slate-500">{student.nis}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Submissions Table */}
            {submissions.length === 0 ? (
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-8 text-center text-slate-400">
                    Belum ada siswa yang mengumpulkan kuis ini.
                </div>
            ) : (
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-900/50 text-slate-400 text-xs uppercase">
                            <tr>
                                <th className="px-6 py-4">Siswa</th>
                                <th className="px-6 py-4">Waktu Submit</th>
                                <th className="px-6 py-4">Nilai</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                            {submissions.map((sub) => (
                                <tr key={sub.id} className="hover:bg-slate-700/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <p className="font-medium text-white">{sub.student.user.full_name}</p>
                                        <p className="text-xs text-slate-500">{sub.student.nis}</p>
                                    </td>
                                    <td className="px-6 py-4 text-slate-300 font-mono text-sm">
                                        {formatDate(sub.submitted_at)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-xl font-bold text-white">{sub.total_score}</span>
                                            <span className="text-xs text-slate-500">/{sub.max_score}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {sub.is_graded ? (
                                            <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
                                                Selesai Dinilai
                                            </span>
                                        ) : (
                                            <span className="px-2 py-1 bg-amber-500/20 text-amber-400 text-xs rounded-full animate-pulse">
                                                Perlu Koreksi
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Link
                                            href={`/dashboard/guru/kuis/${quizId}/hasil/${sub.id}`}
                                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded-lg transition-colors text-sm font-medium"
                                        >
                                            {sub.is_graded ? 'Lihat/Edit' : 'Koreksi'}
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
