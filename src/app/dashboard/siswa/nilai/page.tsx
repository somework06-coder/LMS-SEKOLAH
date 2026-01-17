'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'

// Interfaces
interface AssignmentSubmission {
    id: string
    submitted_at: string
    assignment: {
        id: string
        title: string
        type: 'TUGAS' | 'ULANGAN'
        teaching_assignment: {
            subject: { name: string }
        }
    }
    grade: Array<{
        score: number
        feedback: string | null
        graded_at: string
    }>
}

interface QuizSubmission {
    id: string
    submitted_at: string
    total_score: number
    max_score: number
    is_graded: boolean
    quiz: {
        id: string
        title: string
        teaching_assignment: {
            subject: { name: string }
        }
    }
}

interface ExamSubmission {
    id: string
    exam_id: string
    is_submitted: boolean
    submitted_at: string
    total_score: number
    max_score: number
    violation_count: number
    exam: {
        id: string
        title: string
        teaching_assignment: {
            subject: { name: string }
        }
    }
}

interface SubjectGrades {
    subjectName: string
    kuis: QuizSubmission[]
    tugas: AssignmentSubmission[]
    ulangan: (AssignmentSubmission | ExamSubmission)[]
}

type TabType = 'kuis' | 'tugas' | 'ulangan'

export default function SiswaNilaiPage() {
    const { user } = useAuth()
    const [loading, setLoading] = useState(true)
    const [groupedGrades, setGroupedGrades] = useState<SubjectGrades[]>([])

    // UI State
    const [selectedSubject, setSelectedSubject] = useState<SubjectGrades | null>(null)
    const [activeTab, setActiveTab] = useState<TabType>('kuis')

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Get student record
                const studentsRes = await fetch('/api/students')
                const students = await studentsRes.json()
                const myStudent = students.find((s: { user: { id: string } }) => s.user.id === user?.id)

                if (!myStudent) {
                    setLoading(false)
                    return
                }

                // Fetch all data sources in parallel
                const [submissionsRes, quizSubsRes, examSubsRes] = await Promise.all([
                    fetch(`/api/submissions?student_id=${myStudent.id}`),
                    fetch(`/api/quiz-submissions?student_id=${myStudent.id}`),
                    fetch(`/api/exam-submissions?student_id=${myStudent.id}`)
                ])

                const [submissions, quizSubmissions, examSubmissions]: [AssignmentSubmission[], QuizSubmission[], ExamSubmission[]] = await Promise.all([
                    submissionsRes.json(),
                    quizSubsRes.json(),
                    examSubsRes.json()
                ])

                // Group by Subject
                const subjectsMap: Record<string, SubjectGrades> = {}

                // Process Quiz Submissions
                quizSubmissions.forEach((qs) => {
                    const subjectName = qs.quiz?.teaching_assignment?.subject?.name || 'Lainnya'
                    if (!subjectsMap[subjectName]) {
                        subjectsMap[subjectName] = { subjectName, kuis: [], tugas: [], ulangan: [] }
                    }
                    subjectsMap[subjectName].kuis.push(qs)
                })

                // Process Assignment Submissions
                submissions.forEach((sub) => {
                    const subjectName = sub.assignment?.teaching_assignment?.subject?.name || 'Lainnya'
                    if (!subjectsMap[subjectName]) {
                        subjectsMap[subjectName] = { subjectName, kuis: [], tugas: [], ulangan: [] }
                    }
                    if (sub.assignment.type === 'TUGAS') {
                        subjectsMap[subjectName].tugas.push(sub)
                    } else if (sub.assignment.type === 'ULANGAN') {
                        subjectsMap[subjectName].ulangan.push(sub)
                    }
                })

                // Process Exam Submissions (new ulangan system)
                if (Array.isArray(examSubmissions)) {
                    examSubmissions.filter(es => es.is_submitted).forEach((es) => {
                        const subjectName = es.exam?.teaching_assignment?.subject?.name || 'Lainnya'
                        if (!subjectsMap[subjectName]) {
                            subjectsMap[subjectName] = { subjectName, kuis: [], tugas: [], ulangan: [] }
                        }
                        subjectsMap[subjectName].ulangan.push(es)
                    })
                }

                setGroupedGrades(Object.values(subjectsMap))

            } catch (error) {
                console.error('Error fetching grades:', error)
            } finally {
                setLoading(false)
            }
        }

        if (user) fetchData()
    }, [user])

    const getScoreColor = (score: number, max: number = 100) => {
        const percentage = (score / max) * 100
        if (percentage >= 80) return 'text-green-400 bg-green-500/20'
        if (percentage >= 60) return 'text-yellow-400 bg-yellow-500/20'
        return 'text-red-400 bg-red-500/20'
    }

    if (loading) {
        return <div className="text-center text-slate-400 py-8">Memuat nilai...</div>
    }

    // ==================== VIEW 1: Subject List ====================
    if (!selectedSubject) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/siswa" className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Nilai Saya</h1>
                        <p className="text-slate-400">Pilih mata pelajaran untuk lihat detail nilai</p>
                    </div>
                </div>

                {groupedGrades.length === 0 ? (
                    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-8 text-center text-slate-400">
                        Belum ada nilai yang tercatat.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {groupedGrades.map((subject) => {
                            const totalItems = subject.kuis.length + subject.tugas.length + subject.ulangan.length
                            return (
                                <button
                                    key={subject.subjectName}
                                    onClick={() => { setSelectedSubject(subject); setActiveTab('kuis'); }}
                                    className="group bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 hover:border-purple-500/50 hover:bg-slate-800 transition-all text-left"
                                >
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white mb-4 shadow-lg shadow-purple-500/20 group-hover:scale-110 transition-transform">
                                        <span className="text-2xl">📊</span>
                                    </div>
                                    <h3 className="text-lg font-bold text-white mb-1 group-hover:text-purple-400 transition-colors">
                                        {subject.subjectName}
                                    </h3>
                                    <p className="text-sm text-slate-400">
                                        {totalItems} Nilai Tercatat
                                    </p>
                                    <div className="flex gap-2 mt-3 text-xs">
                                        <span className="px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded">Kuis: {subject.kuis.length}</span>
                                        <span className="px-2 py-1 bg-amber-500/20 text-amber-400 rounded">Tugas: {subject.tugas.length}</span>
                                        <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded">Ulangan: {subject.ulangan.length}</span>
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                )}
            </div>
        )
    }

    // ==================== VIEW 2: Subject Detail with Tabs ====================
    const tabs: { key: TabType; label: string; icon: string; color: string }[] = [
        { key: 'kuis', label: 'Kuis', icon: '📝', color: 'cyan' },
        { key: 'tugas', label: 'Tugas', icon: '📋', color: 'amber' },
        { key: 'ulangan', label: 'Ulangan', icon: '📄', color: 'red' },
    ]

    const renderQuizList = () => (
        selectedSubject.kuis.length === 0 ? (
            <div className="text-center text-slate-400 py-8">Belum ada nilai kuis.</div>
        ) : (
            <div className="space-y-3">
                {selectedSubject.kuis.map((qs) => (
                    <div key={qs.id} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 flex items-center justify-between">
                        <div>
                            <p className="text-white font-medium">{qs.quiz?.title}</p>
                            <p className="text-xs text-slate-500">{new Date(qs.submitted_at).toLocaleDateString('id-ID')}</p>
                        </div>
                        {qs.is_graded ? (
                            <span className={`px-3 py-1 rounded-full font-bold ${getScoreColor(qs.total_score, qs.max_score)}`}>
                                {qs.total_score}/{qs.max_score}
                            </span>
                        ) : (
                            <span className="px-3 py-1 bg-slate-600/30 text-slate-400 rounded-full text-sm">⏳ Menunggu</span>
                        )}
                    </div>
                ))}
            </div>
        )
    )

    const renderAssignmentList = (items: AssignmentSubmission[]) => (
        items.length === 0 ? (
            <div className="text-center text-slate-400 py-8">Belum ada nilai.</div>
        ) : (
            <div className="space-y-3">
                {items.map((sub) => (
                    <div key={sub.id} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 flex items-center justify-between">
                        <div className="flex-1">
                            <p className="text-white font-medium">{sub.assignment?.title}</p>
                            <p className="text-xs text-slate-500">{new Date(sub.submitted_at).toLocaleDateString('id-ID')}</p>
                            {sub.grade?.[0]?.feedback && (
                                <p className="text-sm text-slate-400 mt-1 italic">💬 {sub.grade[0].feedback}</p>
                            )}
                        </div>
                        {sub.grade && sub.grade.length > 0 ? (
                            <span className={`px-3 py-1 rounded-full font-bold ${getScoreColor(sub.grade[0].score)}`}>
                                {sub.grade[0].score}
                            </span>
                        ) : (
                            <span className="px-3 py-1 bg-slate-600/30 text-slate-400 rounded-full text-sm">⏳ Menunggu</span>
                        )}
                    </div>
                ))}
            </div>
        )
    )

    // Helper to check if item is ExamSubmission
    const isExamSubmission = (item: AssignmentSubmission | ExamSubmission): item is ExamSubmission => {
        return 'exam' in item && 'max_score' in item
    }

    const renderUlanganList = (items: (AssignmentSubmission | ExamSubmission)[]) => (
        items.length === 0 ? (
            <div className="text-center text-slate-400 py-8">Belum ada nilai ulangan.</div>
        ) : (
            <div className="space-y-3">
                {items.map((item) => {
                    if (isExamSubmission(item)) {
                        // Render ExamSubmission
                        return (
                            <div key={item.id} className="bg-slate-800/50 border border-purple-500/30 rounded-xl p-4 flex items-center justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <p className="text-white font-medium">{item.exam?.title}</p>
                                        <span className="px-2 py-0.5 text-xs bg-purple-500/20 text-purple-400 rounded">Ulangan</span>
                                    </div>
                                    <p className="text-xs text-slate-500">{new Date(item.submitted_at).toLocaleDateString('id-ID')}</p>
                                    {item.violation_count > 0 && (
                                        <p className="text-xs text-red-400 mt-1">⚠️ {item.violation_count} pelanggaran</p>
                                    )}
                                </div>
                                <span className={`px-3 py-1 rounded-full font-bold ${getScoreColor(item.total_score, item.max_score)}`}>
                                    {item.total_score}/{item.max_score}
                                </span>
                            </div>
                        )
                    } else {
                        // Render AssignmentSubmission
                        return (
                            <div key={item.id} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 flex items-center justify-between">
                                <div className="flex-1">
                                    <p className="text-white font-medium">{item.assignment?.title}</p>
                                    <p className="text-xs text-slate-500">{new Date(item.submitted_at).toLocaleDateString('id-ID')}</p>
                                    {item.grade?.[0]?.feedback && (
                                        <p className="text-sm text-slate-400 mt-1 italic">💬 {item.grade[0].feedback}</p>
                                    )}
                                </div>
                                {item.grade && item.grade.length > 0 ? (
                                    <span className={`px-3 py-1 rounded-full font-bold ${getScoreColor(item.grade[0].score)}`}>
                                        {item.grade[0].score}
                                    </span>
                                ) : (
                                    <span className="px-3 py-1 bg-slate-600/30 text-slate-400 rounded-full text-sm">⏳ Menunggu</span>
                                )}
                            </div>
                        )
                    }
                })}
            </div>
        )
    )

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => setSelectedSubject(null)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-white">{selectedSubject.subjectName}</h1>
                    <p className="text-slate-400">Detail Nilai</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-slate-700 pb-2">
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`px-4 py-2 rounded-t-xl font-medium transition-colors flex items-center gap-2 ${activeTab === tab.key
                            ? `bg-${tab.color}-500/20 text-${tab.color}-400 border-b-2 border-${tab.color}-500`
                            : 'text-slate-400 hover:text-white hover:bg-slate-800'
                            }`}
                    >
                        <span>{tab.icon}</span>
                        {tab.label}
                        <span className="text-xs opacity-70">
                            ({tab.key === 'kuis' ? selectedSubject.kuis.length : tab.key === 'tugas' ? selectedSubject.tugas.length : selectedSubject.ulangan.length})
                        </span>
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div>
                {activeTab === 'kuis' && renderQuizList()}
                {activeTab === 'tugas' && renderAssignmentList(selectedSubject.tugas)}
                {activeTab === 'ulangan' && renderUlanganList(selectedSubject.ulangan)}
            </div>
        </div>
    )
}
