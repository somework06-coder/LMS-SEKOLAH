'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'

interface Student {
    id: string
    nis: string
    user: { full_name: string }
}

interface Submission {
    id: string
    submitted_at: string
    student: { id: string }
    assignment: { id: string; title: string; type: string }
    grade: Array<{ score: number }>
}

interface QuizSubmission {
    id: string
    student_id: string
    total_score: number
    max_score: number
    is_graded: boolean
    quiz: { id: string; title: string }
}

interface ExamSubmission {
    id: string
    is_submitted: boolean
    total_score: number
    max_score: number
    student: { id: string }
    exam: { id: string; title: string }
}

interface Assignment {
    id: string
    title: string
    type: string
    teaching_assignment: { id: string }
}

interface Quiz {
    id: string
    title: string
    teaching_assignment: { id: string }
}

interface Exam {
    id: string
    title: string
    teaching_assignment: { id: string }
}

interface TeachingAssignment {
    id: string
    subject: { id: string; name: string }
    class: { id: string; name: string }
}

type TabType = 'rekap' | 'tugas' | 'kuis' | 'ulangan' | 'export'

export default function NilaiPage() {
    const { user } = useAuth()
    const [activeTab, setActiveTab] = useState<TabType>('rekap')
    const [teachingAssignments, setTeachingAssignments] = useState<TeachingAssignment[]>([])
    const [selectedTA, setSelectedTA] = useState<string>('')
    const [students, setStudents] = useState<Student[]>([])
    const [assignments, setAssignments] = useState<Assignment[]>([])
    const [quizzes, setQuizzes] = useState<Quiz[]>([])
    const [exams, setExams] = useState<Exam[]>([])
    const [allSubmissions, setAllSubmissions] = useState<Submission[]>([])
    const [quizSubmissions, setQuizSubmissions] = useState<QuizSubmission[]>([])
    const [examSubmissions, setExamSubmissions] = useState<ExamSubmission[]>([])
    const [loading, setLoading] = useState(true)
    const [loadingData, setLoadingData] = useState(false)

    useEffect(() => {
        const fetchInitial = async () => {
            try {
                const res = await fetch('/api/my-teaching-assignments')
                const data = await res.json()
                setTeachingAssignments(Array.isArray(data) ? data : [])
            } catch (error) {
                console.error('Error:', error)
            } finally {
                setLoading(false)
            }
        }
        if (user) fetchInitial()
    }, [user])

    useEffect(() => {
        if (!selectedTA) {
            setStudents([])
            setAssignments([])
            setQuizzes([])
            setExams([])
            setAllSubmissions([])
            setQuizSubmissions([])
            setExamSubmissions([])
            return
        }

        const fetchTAData = async () => {
            setLoadingData(true)
            try {
                const ta = teachingAssignments.find(t => t.id === selectedTA)
                if (!ta) return

                // Fetch students in the class
                const studentsRes = await fetch(`/api/students?class_id=${ta.class.id}`)
                const studentsData = await studentsRes.json()
                setStudents(Array.isArray(studentsData) ? studentsData : [])

                // Fetch assignments
                const assignmentsRes = await fetch('/api/assignments')
                const assignmentsData = await assignmentsRes.json()
                const myAssignments = (assignmentsData || []).filter((a: Assignment) =>
                    a.teaching_assignment?.id === selectedTA
                )
                setAssignments(myAssignments)

                // Fetch submissions for assignments
                const allSubs: Submission[] = []
                for (const assignment of myAssignments) {
                    const subRes = await fetch(`/api/submissions?assignment_id=${assignment.id}`)
                    const subData = await subRes.json()
                    if (Array.isArray(subData)) {
                        allSubs.push(...subData.map((s: any) => ({ ...s, assignment: { id: assignment.id, title: assignment.title, type: assignment.type } })))
                    }
                }
                setAllSubmissions(allSubs)

                // Fetch quizzes
                const quizzesRes = await fetch('/api/quizzes')
                const quizzesData = await quizzesRes.json()
                const myQuizzes = (quizzesData || []).filter((q: Quiz) => q.teaching_assignment?.id === selectedTA)
                setQuizzes(myQuizzes)

                // Fetch quiz submissions
                const allQuizSubs: QuizSubmission[] = []
                for (const quiz of myQuizzes) {
                    const qSubRes = await fetch(`/api/quiz-submissions?quiz_id=${quiz.id}`)
                    const qSubData = await qSubRes.json()
                    if (Array.isArray(qSubData)) {
                        allQuizSubs.push(...qSubData.map((s: any) => ({ ...s, quiz: { id: quiz.id, title: quiz.title } })))
                    }
                }
                setQuizSubmissions(allQuizSubs)

                // Fetch exams
                const examsRes = await fetch('/api/exams')
                const examsData = await examsRes.json()
                const myExams = (examsData || []).filter((e: Exam) => e.teaching_assignment?.id === selectedTA)
                setExams(myExams)

                // Fetch exam submissions
                const allExamSubs: ExamSubmission[] = []
                for (const exam of myExams) {
                    const eSubRes = await fetch(`/api/exam-submissions?exam_id=${exam.id}`)
                    const eSubData = await eSubRes.json()
                    if (Array.isArray(eSubData)) {
                        allExamSubs.push(...eSubData.filter((s: any) => s.is_submitted).map((s: any) => ({ ...s, exam: { id: exam.id, title: exam.title } })))
                    }
                }
                setExamSubmissions(allExamSubs)

            } catch (error) {
                console.error('Error:', error)
            } finally {
                setLoadingData(false)
            }
        }

        fetchTAData()
    }, [selectedTA, teachingAssignments])

    // Calculate average for a student
    const calculateAverage = (studentId: string) => {
        const grades: number[] = []

        // Assignment grades
        allSubmissions.filter(s => s.student?.id === studentId && s.grade?.length > 0).forEach(s => {
            grades.push(s.grade[0].score)
        })

        // Quiz grades
        quizSubmissions.filter(qs => qs.student_id === studentId && qs.is_graded).forEach(qs => {
            grades.push(Math.round((qs.total_score / qs.max_score) * 100))
        })

        // Exam grades
        examSubmissions.filter(es => es.student?.id === studentId).forEach(es => {
            grades.push(Math.round((es.total_score / es.max_score) * 100))
        })

        if (grades.length === 0) return null
        return Math.round(grades.reduce((sum, g) => sum + g, 0) / grades.length)
    }

    // Export to Excel
    const handleExport = () => {
        const ta = teachingAssignments.find(t => t.id === selectedTA)
        if (!ta) return

        const tugasAssignments = assignments.filter(a => a.type === 'TUGAS')

        let html = `
            <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:x='urn:schemas-microsoft-com:office:excel'>
            <head><meta charset='utf-8'><style>
                table { border-collapse: collapse; width: 100%; }
                th, td { border: 1px solid #000; padding: 8px; text-align: center; }
                th { background-color: #4472C4; color: white; }
                .student-name { text-align: left; }
                .avg { background-color: #FFC000; font-weight: bold; }
            </style></head>
            <body>
            <h2 style="text-align:center;">DAFTAR NILAI SISWA</h2>
            <p><strong>Kelas:</strong> ${ta.class.name}</p>
            <p><strong>Mata Pelajaran:</strong> ${ta.subject.name}</p>
            <br/>
            <table>
                <thead>
                    <tr>
                        <th>No</th>
                        <th>NIS</th>
                        <th>Nama Siswa</th>
                        ${tugasAssignments.map((a, i) => `<th>T${i + 1}</th>`).join('')}
                        ${quizzes.map((q, i) => `<th>K${i + 1}</th>`).join('')}
                        ${exams.map((e, i) => `<th>U${i + 1}</th>`).join('')}
                        <th class="avg">Rata-rata</th>
                    </tr>
                </thead>
                <tbody>
                    ${students.map((student, idx) => {
            const tugasGrades = tugasAssignments.map(a => {
                const sub = allSubmissions.find(s => s.student?.id === student.id && s.assignment?.id === a.id)
                return sub?.grade?.[0]?.score ?? '-'
            })
            const kuisGrades = quizzes.map(q => {
                const qs = quizSubmissions.find(qs => qs.student_id === student.id && qs.quiz.id === q.id)
                return qs?.is_graded ? Math.round((qs.total_score / qs.max_score) * 100) : '-'
            })
            const ulanganGrades = exams.map(e => {
                const es = examSubmissions.find(es => es.student?.id === student.id && es.exam.id === e.id)
                return es ? Math.round((es.total_score / es.max_score) * 100) : '-'
            })
            const avg = calculateAverage(student.id)

            return `
                        <tr>
                            <td>${idx + 1}</td>
                            <td>${student.nis}</td>
                            <td class="student-name">${student.user.full_name}</td>
                            ${tugasGrades.map(g => `<td>${g}</td>`).join('')}
                            ${kuisGrades.map(g => `<td>${g}</td>`).join('')}
                            ${ulanganGrades.map(g => `<td>${g}</td>`).join('')}
                            <td class="avg">${avg ?? '-'}</td>
                        </tr>
                    `
        }).join('')}
                </tbody>
            </table>
            </body>
            </html>
        `

        const blob = new Blob([html], { type: 'application/vnd.ms-excel' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `Nilai_${ta.class.name}_${ta.subject.name}.xls`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }

    const selectedTAData = teachingAssignments.find(t => t.id === selectedTA)
    const tugasAssignments = assignments.filter(a => a.type === 'TUGAS')

    // Stats
    const totalGraded = allSubmissions.filter(s => s.grade?.length > 0).length + quizSubmissions.filter(q => q.is_graded).length + examSubmissions.length
    const totalUngraded = allSubmissions.filter(s => !s.grade?.length).length + quizSubmissions.filter(q => !q.is_graded).length
    const classAverage = students.length > 0
        ? Math.round(students.map(s => calculateAverage(s.id)).filter(a => a !== null).reduce((sum, a) => sum + (a || 0), 0) / students.filter(s => calculateAverage(s.id) !== null).length) || 0
        : 0

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/dashboard/guru" className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-white">📊 Nilai</h1>
                    <p className="text-slate-400">Lihat rekap nilai siswa</p>
                </div>
            </div>

            {/* Select Class */}
            <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl p-6">
                <label className="block text-sm font-medium text-slate-300 mb-3">📚 Pilih Kelas & Mata Pelajaran</label>
                <select
                    value={selectedTA}
                    onChange={(e) => { setSelectedTA(e.target.value); setActiveTab('rekap') }}
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-lg"
                >
                    <option value="">-- Pilih Kelas --</option>
                    {teachingAssignments.map((ta) => (
                        <option key={ta.id} value={ta.id}>
                            {ta.class.name} - {ta.subject.name}
                        </option>
                    ))}
                </select>
            </div>

            {/* Content after class selected */}
            {selectedTA && (
                <>
                    {/* Stats Cards */}
                    <div className="grid grid-cols-4 gap-4">
                        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 text-center">
                            <p className="text-2xl font-bold text-cyan-400">{students.length}</p>
                            <p className="text-xs text-slate-400">Siswa</p>
                        </div>
                        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 text-center">
                            <p className="text-2xl font-bold text-green-400">{totalGraded}</p>
                            <p className="text-xs text-slate-400">Sudah Dinilai</p>
                        </div>
                        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 text-center">
                            <p className="text-2xl font-bold text-amber-400">{totalUngraded}</p>
                            <p className="text-xs text-slate-400">Belum Dinilai</p>
                        </div>
                        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 text-center">
                            <p className="text-2xl font-bold text-purple-400">{classAverage || '-'}</p>
                            <p className="text-xs text-slate-400">Rata-rata Kelas</p>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-1 bg-slate-800/50 p-1 rounded-xl overflow-x-auto">
                        <button
                            onClick={() => setActiveTab('rekap')}
                            className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${activeTab === 'rekap' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
                        >
                            📋 Rekap
                        </button>
                        <button
                            onClick={() => setActiveTab('tugas')}
                            className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${activeTab === 'tugas' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
                        >
                            📝 Tugas ({tugasAssignments.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('kuis')}
                            className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${activeTab === 'kuis' ? 'bg-green-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
                        >
                            🎯 Kuis ({quizzes.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('ulangan')}
                            className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${activeTab === 'ulangan' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
                        >
                            📄 Ulangan ({exams.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('export')}
                            className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${activeTab === 'export' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
                        >
                            📥 Export
                        </button>
                    </div>

                    {/* Tab Content */}
                    {loadingData ? (
                        <div className="text-center text-slate-400 py-8">Memuat data...</div>
                    ) : (
                        <>
                            {/* Tab: Rekap */}
                            {activeTab === 'rekap' && (
                                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead className="bg-slate-900/50">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-slate-300 font-medium sticky left-0 bg-slate-900">Nama Siswa</th>
                                                    {tugasAssignments.map((a, i) => (
                                                        <th key={a.id} className="px-3 py-3 text-center text-slate-300 font-medium">
                                                            <span className="px-1.5 py-0.5 text-xs rounded bg-amber-500/20 text-amber-400">T{i + 1}</span>
                                                        </th>
                                                    ))}
                                                    {quizzes.map((q, i) => (
                                                        <th key={q.id} className="px-3 py-3 text-center text-slate-300 font-medium">
                                                            <span className="px-1.5 py-0.5 text-xs rounded bg-green-500/20 text-green-400">K{i + 1}</span>
                                                        </th>
                                                    ))}
                                                    {exams.map((e, i) => (
                                                        <th key={e.id} className="px-3 py-3 text-center text-slate-300 font-medium">
                                                            <span className="px-1.5 py-0.5 text-xs rounded bg-purple-500/20 text-purple-400">U{i + 1}</span>
                                                        </th>
                                                    ))}
                                                    <th className="px-4 py-3 text-center text-cyan-400 font-bold">Rata-rata</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-700/50">
                                                {students.map((student) => {
                                                    const avg = calculateAverage(student.id)
                                                    return (
                                                        <tr key={student.id} className="hover:bg-slate-800/30">
                                                            <td className="px-4 py-3 sticky left-0 bg-slate-800/80">
                                                                <p className="text-white font-medium">{student.user.full_name}</p>
                                                                <p className="text-xs text-slate-500">{student.nis}</p>
                                                            </td>
                                                            {tugasAssignments.map(a => {
                                                                const sub = allSubmissions.find(s => s.student?.id === student.id && s.assignment?.id === a.id)
                                                                const score = sub?.grade?.[0]?.score
                                                                return (
                                                                    <td key={a.id} className="px-3 py-3 text-center">
                                                                        {score !== undefined ? (
                                                                            <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded font-bold text-sm">{score}</span>
                                                                        ) : sub ? (
                                                                            <span className="text-amber-400 text-xs">⏳</span>
                                                                        ) : (
                                                                            <span className="text-slate-600">-</span>
                                                                        )}
                                                                    </td>
                                                                )
                                                            })}
                                                            {quizzes.map(q => {
                                                                const qs = quizSubmissions.find(qs => qs.student_id === student.id && qs.quiz.id === q.id)
                                                                return (
                                                                    <td key={q.id} className="px-3 py-3 text-center">
                                                                        {qs?.is_graded ? (
                                                                            <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded font-bold text-sm">
                                                                                {Math.round((qs.total_score / qs.max_score) * 100)}
                                                                            </span>
                                                                        ) : qs ? (
                                                                            <span className="text-amber-400 text-xs">⏳</span>
                                                                        ) : (
                                                                            <span className="text-slate-600">-</span>
                                                                        )}
                                                                    </td>
                                                                )
                                                            })}
                                                            {exams.map(e => {
                                                                const es = examSubmissions.find(es => es.student?.id === student.id && es.exam.id === e.id)
                                                                return (
                                                                    <td key={e.id} className="px-3 py-3 text-center">
                                                                        {es ? (
                                                                            <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded font-bold text-sm">
                                                                                {Math.round((es.total_score / es.max_score) * 100)}
                                                                            </span>
                                                                        ) : (
                                                                            <span className="text-slate-600">-</span>
                                                                        )}
                                                                    </td>
                                                                )
                                                            })}
                                                            <td className="px-4 py-3 text-center">
                                                                {avg !== null ? (
                                                                    <span className={`px-3 py-1 rounded-full font-bold ${avg >= 75 ? 'bg-green-500/20 text-green-400' : avg >= 60 ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'}`}>
                                                                        {avg}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-slate-600">-</span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    )
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Tab: Tugas - Links to hasil pages */}
                            {activeTab === 'tugas' && (
                                <div className="space-y-4">
                                    {tugasAssignments.length === 0 ? (
                                        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-8 text-center text-slate-400">
                                            Belum ada tugas
                                        </div>
                                    ) : (
                                        <div className="grid gap-4">
                                            {tugasAssignments.map(assignment => {
                                                const subs = allSubmissions.filter(s => s.assignment?.id === assignment.id)
                                                const graded = subs.filter(s => s.grade?.length > 0).length
                                                return (
                                                    <div key={assignment.id} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
                                                        <div className="flex items-center justify-between">
                                                            <div>
                                                                <h3 className="text-lg font-semibold text-white">{assignment.title}</h3>
                                                                <p className="text-sm text-slate-400">{subs.length} submission • {graded} dinilai</p>
                                                            </div>
                                                            <Link
                                                                href={`/dashboard/guru/tugas/${assignment.id}/hasil`}
                                                                className="px-4 py-2 bg-amber-500/20 text-amber-400 rounded-lg hover:bg-amber-500/30 transition-colors text-sm font-medium"
                                                            >
                                                                Lihat & Nilai →
                                                            </Link>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Tab: Kuis - Links to hasil pages */}
                            {activeTab === 'kuis' && (
                                <div className="space-y-4">
                                    {quizzes.length === 0 ? (
                                        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-8 text-center text-slate-400">
                                            Belum ada kuis
                                        </div>
                                    ) : (
                                        <div className="grid gap-4">
                                            {quizzes.map(quiz => {
                                                const subs = quizSubmissions.filter(qs => qs.quiz.id === quiz.id)
                                                const graded = subs.filter(s => s.is_graded).length
                                                return (
                                                    <div key={quiz.id} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
                                                        <div className="flex items-center justify-between">
                                                            <div>
                                                                <h3 className="text-lg font-semibold text-white">{quiz.title}</h3>
                                                                <p className="text-sm text-slate-400">{subs.length} submission • {graded} dinilai</p>
                                                            </div>
                                                            <Link
                                                                href={`/dashboard/guru/kuis/${quiz.id}/hasil`}
                                                                className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors text-sm font-medium"
                                                            >
                                                                Lihat Hasil →
                                                            </Link>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Tab: Ulangan - Links to hasil pages */}
                            {activeTab === 'ulangan' && (
                                <div className="space-y-4">
                                    {exams.length === 0 ? (
                                        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-8 text-center text-slate-400">
                                            Belum ada ulangan
                                        </div>
                                    ) : (
                                        <div className="grid gap-4">
                                            {exams.map(exam => {
                                                const subs = examSubmissions.filter(es => es.exam.id === exam.id)
                                                return (
                                                    <div key={exam.id} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
                                                        <div className="flex items-center justify-between">
                                                            <div>
                                                                <h3 className="text-lg font-semibold text-white">{exam.title}</h3>
                                                                <p className="text-sm text-slate-400">{subs.length} submission</p>
                                                            </div>
                                                            <Link
                                                                href={`/dashboard/guru/ulangan/${exam.id}/hasil`}
                                                                className="px-4 py-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors text-sm font-medium"
                                                            >
                                                                Lihat Hasil →
                                                            </Link>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Tab: Export */}
                            {activeTab === 'export' && (
                                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-8 text-center">
                                    <div className="text-6xl mb-4">📥</div>
                                    <h3 className="text-xl font-semibold text-white mb-2">Export Nilai ke Excel</h3>
                                    <p className="text-slate-400 mb-6">
                                        Download rekap nilai dalam format buku nilai untuk kelas <span className="text-white font-medium">{selectedTAData?.class.name}</span> - <span className="text-white font-medium">{selectedTAData?.subject.name}</span>
                                    </p>
                                    <div className="bg-slate-900/50 rounded-xl p-4 mb-6 max-w-md mx-auto text-left">
                                        <p className="text-sm text-slate-400 mb-2">Format export meliputi:</p>
                                        <ul className="text-sm text-slate-300 space-y-1">
                                            <li>✅ Nama dan NIS siswa</li>
                                            <li>✅ Nilai Tugas (T1, T2, ...)</li>
                                            <li>✅ Nilai Kuis (K1, K2, ...)</li>
                                            <li>✅ Nilai Ulangan (U1, U2, ...)</li>
                                            <li>✅ Rata-rata nilai</li>
                                        </ul>
                                    </div>
                                    <button
                                        onClick={handleExport}
                                        disabled={students.length === 0}
                                        className="px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold hover:opacity-90 transition-opacity flex items-center gap-3 mx-auto disabled:opacity-50"
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                        Download Excel
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </>
            )}

            {loading && <div className="text-center text-slate-400 py-8">Memuat...</div>}
        </div>
    )
}
