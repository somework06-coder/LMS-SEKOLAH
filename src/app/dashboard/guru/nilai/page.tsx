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
    answers: string | Record<string, unknown> | null
    submitted_at: string
    student: {
        id: string
        nis: string | null
        user: { full_name: string | null }
    }
    assignment: {
        id: string
        title: string
        type: string
    }
    grade: Array<{
        id: string
        score: number
        feedback: string | null
    }>
}

interface QuizSubmission {
    id: string
    student_id: string
    total_score: number
    max_score: number
    is_graded: boolean
    student: {
        nis: string
        user: { full_name: string }
    }
    quiz: {
        id: string
        title: string
    }
}

interface Assignment {
    id: string
    title: string
    type: string
    teaching_assignment: {
        id: string
        subject: { name: string }
        class: { id: string; name: string }
    }
}

interface TeachingAssignment {
    id: string
    subject: { id: string; name: string }
    class: { id: string; name: string }
}

interface Quiz {
    id: string
    title: string
    teaching_assignment: { id: string }
}

type TabType = 'rekap' | 'tugas' | 'ulangan' | 'quiz' | 'export'

export default function NilaiPage() {
    const { user } = useAuth()
    const [activeTab, setActiveTab] = useState<TabType>('rekap')
    const [teachingAssignments, setTeachingAssignments] = useState<TeachingAssignment[]>([])
    const [selectedTA, setSelectedTA] = useState<string>('')
    const [students, setStudents] = useState<Student[]>([])
    const [assignments, setAssignments] = useState<Assignment[]>([])
    const [quizzes, setQuizzes] = useState<Quiz[]>([])
    const [allSubmissions, setAllSubmissions] = useState<Submission[]>([])
    const [quizSubmissions, setQuizSubmissions] = useState<QuizSubmission[]>([])
    const [loading, setLoading] = useState(true)
    const [loadingData, setLoadingData] = useState(false)

    // For grading
    const [selectedItem, setSelectedItem] = useState<string>('')
    const [submissions, setSubmissions] = useState<Submission[]>([])
    const [grading, setGrading] = useState<{ submissionId: string; score: string; feedback: string; answers: string } | null>(null)
    const [viewingAnswers, setViewingAnswers] = useState<{ studentName: string; answers: string; submittedAt: string } | null>(null)
    const [saving, setSaving] = useState(false)

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
            setAllSubmissions([])
            setQuizSubmissions([])
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

                // Fetch assignments for this teaching assignment
                const assignmentsRes = await fetch('/api/assignments')
                const assignmentsData = await assignmentsRes.json()
                const myAssignments = (assignmentsData || []).filter((a: Assignment) =>
                    a.teaching_assignment?.id === selectedTA
                )
                setAssignments(myAssignments)

                // Fetch all submissions for these assignments
                const allSubs: Submission[] = []
                for (const assignment of myAssignments) {
                    const subRes = await fetch(`/api/submissions?assignment_id=${assignment.id}`)
                    const subData = await subRes.json()
                    if (Array.isArray(subData)) {
                        allSubs.push(...subData)
                    }
                }
                setAllSubmissions(allSubs)

                // Fetch quizzes and quiz submissions
                const quizzesRes = await fetch('/api/quizzes')
                const quizzesData = await quizzesRes.json()
                const myQuizzes = (quizzesData || []).filter((q: any) => q.teaching_assignment?.id === selectedTA)
                setQuizzes(myQuizzes)

                const allQuizSubs: QuizSubmission[] = []
                for (const quiz of myQuizzes) {
                    const qSubRes = await fetch(`/api/quiz-submissions?quiz_id=${quiz.id}`)
                    const qSubData = await qSubRes.json()
                    if (Array.isArray(qSubData)) {
                        allQuizSubs.push(...qSubData.map((s: any) => ({ ...s, quiz: { id: quiz.id, title: quiz.title } })))
                    }
                }
                setQuizSubmissions(allQuizSubs)

            } catch (error) {
                console.error('Error:', error)
            } finally {
                setLoadingData(false)
            }
        }

        fetchTAData()
    }, [selectedTA, teachingAssignments])

    // Fetch submissions for selected assignment (Tugas/Ulangan tabs)
    useEffect(() => {
        if (selectedItem && (activeTab === 'tugas' || activeTab === 'ulangan')) {
            fetch(`/api/submissions?assignment_id=${selectedItem}`)
                .then((res) => res.json())
                .then((data) => setSubmissions(data))
        } else {
            setSubmissions([])
        }
    }, [selectedItem, activeTab])

    const handleGrade = async () => {
        if (!grading) return
        setSaving(true)
        try {
            await fetch('/api/grades', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    submission_id: grading.submissionId,
                    score: parseInt(grading.score),
                    feedback: grading.feedback
                })
            })
            setGrading(null)
            const res = await fetch(`/api/submissions?assignment_id=${selectedItem}`)
            setSubmissions(await res.json())
        } finally {
            setSaving(false)
        }
    }

    // Calculate average
    const calculateAverage = (studentId: string) => {
        const grades: number[] = []

        assignments.forEach(assignment => {
            const sub = allSubmissions.find(s => s.student?.id === studentId && s.assignment?.id === assignment.id)
            if (sub?.grade?.[0]?.score !== undefined) {
                grades.push(sub.grade[0].score)
            }
        })

        quizSubmissions.filter(qs => qs.student_id === studentId && qs.is_graded).forEach(qs => {
            grades.push(Math.round((qs.total_score / qs.max_score) * 100))
        })

        if (grades.length === 0) return null
        return Math.round(grades.reduce((sum, g) => sum + g, 0) / grades.length)
    }

    const handleExport = () => {
        const ta = teachingAssignments.find(t => t.id === selectedTA)
        if (!ta) return

        const tugasAssignments = assignments.filter(a => a.type === 'TUGAS')
        const ulanganAssignments = assignments.filter(a => a.type === 'ULANGAN')
        const quizTitles = Array.from(new Set(quizSubmissions.map(qs => qs.quiz.title)))

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
                        <th rowspan="2">No</th>
                        <th rowspan="2">NIS</th>
                        <th rowspan="2">Nama Siswa</th>
                        ${tugasAssignments.length ? `<th colspan="${tugasAssignments.length}">TUGAS</th>` : ''}
                        ${ulanganAssignments.length ? `<th colspan="${ulanganAssignments.length}">ULANGAN</th>` : ''}
                        ${quizTitles.length ? `<th colspan="${quizTitles.length}">KUIS</th>` : ''}
                        <th rowspan="2" class="avg">Rata-rata</th>
                    </tr>
                    <tr>
                        ${tugasAssignments.map((a, i) => `<th>T${i + 1}</th>`).join('')}
                        ${ulanganAssignments.map((a, i) => `<th>U${i + 1}</th>`).join('')}
                        ${quizTitles.map((t, i) => `<th>K${i + 1}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${students.map((student, idx) => {
            const tugasGrades = tugasAssignments.map(a => {
                const sub = allSubmissions.find(s => s.student?.id === student.id && s.assignment?.id === a.id)
                return sub?.grade?.[0]?.score ?? '-'
            })
            const ulanganGrades = ulanganAssignments.map(a => {
                const sub = allSubmissions.find(s => s.student?.id === student.id && s.assignment?.id === a.id)
                return sub?.grade?.[0]?.score ?? '-'
            })
            const kuisGrades = quizTitles.map(title => {
                const qs = quizSubmissions.find(q => q.student_id === student.id && q.quiz.title === title)
                return qs?.is_graded ? Math.round((qs.total_score / qs.max_score) * 100) : '-'
            })
            const avg = calculateAverage(student.id)

            return `
                            <tr>
                                <td>${idx + 1}</td>
                                <td>${student.nis}</td>
                                <td class="student-name">${student.user.full_name}</td>
                                ${tugasGrades.map(g => `<td>${g}</td>`).join('')}
                                ${ulanganGrades.map(g => `<td>${g}</td>`).join('')}
                                ${kuisGrades.map(g => `<td>${g}</td>`).join('')}
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
    const ulanganAssignments = assignments.filter(a => a.type === 'ULANGAN')

    // Stats
    const totalGraded = allSubmissions.filter(s => s.grade?.length > 0).length + quizSubmissions.filter(q => q.is_graded).length
    const totalUngraded = allSubmissions.filter(s => !s.grade?.length).length + quizSubmissions.filter(q => !q.is_graded).length
    const classAverage = students.length > 0
        ? Math.round(students.map(s => calculateAverage(s.id)).filter(a => a !== null).reduce((sum, a) => sum + (a || 0), 0) / students.filter(s => calculateAverage(s.id) !== null).length) || 0
        : 0

    // Render submission table for Tugas/Ulangan
    const renderSubmissionTable = (assignmentsList: Assignment[]) => (
        <div className="space-y-4">
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
                <label className="block text-sm font-medium text-slate-300 mb-2">Pilih {activeTab === 'tugas' ? 'Tugas' : 'Ulangan'}</label>
                <select
                    value={selectedItem}
                    onChange={(e) => setSelectedItem(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                    <option value="">-- Pilih --</option>
                    {assignmentsList.map((a) => (
                        <option key={a.id} value={a.id}>{a.title}</option>
                    ))}
                </select>
            </div>

            {assignmentsList.length === 0 ? (
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-8 text-center text-slate-400">
                    Belum ada {activeTab === 'tugas' ? 'tugas' : 'ulangan'}
                </div>
            ) : !selectedItem ? (
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-8 text-center text-slate-400">
                    Pilih {activeTab === 'tugas' ? 'tugas' : 'ulangan'} untuk melihat submission
                </div>
            ) : submissions.length === 0 ? (
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-8 text-center text-slate-400">
                    Belum ada submission
                </div>
            ) : (
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-slate-900/50">
                            <tr>
                                <th className="px-6 py-4 text-left text-sm font-medium text-slate-300">Siswa</th>
                                <th className="px-6 py-4 text-left text-sm font-medium text-slate-300">Waktu Submit</th>
                                <th className="px-6 py-4 text-center text-sm font-medium text-slate-300">Nilai</th>
                                <th className="px-6 py-4 text-right text-sm font-medium text-slate-300">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                            {submissions.map((sub) => {
                                let answersText = '-'
                                if (typeof sub.answers === 'string') {
                                    answersText = sub.answers
                                } else if (Array.isArray(sub.answers)) {
                                    answersText = sub.answers.map((a: any) => a.answer || JSON.stringify(a)).join('\n\n')
                                } else if (sub.answers) {
                                    answersText = JSON.stringify(sub.answers, null, 2)
                                }

                                return (
                                    <tr key={sub.id} className="hover:bg-slate-800/30">
                                        <td className="px-6 py-4">
                                            <p className="text-white font-medium">{sub.student?.user?.full_name || 'Unknown'}</p>
                                            <p className="text-sm text-slate-400">NIS: {sub.student?.nis || '-'}</p>
                                        </td>
                                        <td className="px-6 py-4 text-slate-300 text-sm">
                                            {new Date(sub.submitted_at).toLocaleString('id-ID')}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {sub.grade && sub.grade.length > 0 ? (
                                                <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full font-bold">{sub.grade[0].score}</span>
                                            ) : (
                                                <span className="px-3 py-1 bg-amber-500/20 text-amber-400 rounded-full text-xs">Belum</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right space-x-2">
                                            <button
                                                onClick={() => setViewingAnswers({
                                                    studentName: sub.student?.user?.full_name || 'Unknown',
                                                    answers: answersText,
                                                    submittedAt: new Date(sub.submitted_at).toLocaleString('id-ID')
                                                })}
                                                className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors text-sm"
                                            >
                                                Lihat
                                            </button>
                                            <button
                                                onClick={() => setGrading({
                                                    submissionId: sub.id,
                                                    score: sub.grade?.[0]?.score?.toString() || '',
                                                    feedback: sub.grade?.[0]?.feedback || '',
                                                    answers: answersText
                                                })}
                                                className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors text-sm"
                                            >
                                                {sub.grade?.length ? 'Edit' : 'Nilai'}
                                            </button>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )

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
                    <h1 className="text-2xl font-bold text-white">📊 Penilaian</h1>
                    <p className="text-slate-400">Kelola nilai siswa</p>
                </div>
            </div>

            {/* Select Class First */}
            <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl p-6">
                <label className="block text-sm font-medium text-slate-300 mb-3">📚 Pilih Kelas & Mata Pelajaran</label>
                <select
                    value={selectedTA}
                    onChange={(e) => { setSelectedTA(e.target.value); setSelectedItem(''); setActiveTab('rekap') }}
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

            {/* Show content only after class is selected */}
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

                    {/* Tabs - 5 tabs */}
                    <div className="flex gap-1 bg-slate-800/50 p-1 rounded-xl overflow-x-auto">
                        <button
                            onClick={() => { setActiveTab('rekap'); setSelectedItem('') }}
                            className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${activeTab === 'rekap' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
                        >
                            📋 Rekap
                        </button>
                        <button
                            onClick={() => { setActiveTab('tugas'); setSelectedItem('') }}
                            className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${activeTab === 'tugas' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
                        >
                            📝 Tugas ({tugasAssignments.length})
                        </button>
                        <button
                            onClick={() => { setActiveTab('ulangan'); setSelectedItem('') }}
                            className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${activeTab === 'ulangan' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
                        >
                            📄 Ulangan ({ulanganAssignments.length})
                        </button>
                        <button
                            onClick={() => { setActiveTab('quiz'); setSelectedItem('') }}
                            className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${activeTab === 'quiz' ? 'bg-green-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
                        >
                            🎯 Kuis ({quizzes.length})
                        </button>
                        <button
                            onClick={() => { setActiveTab('export'); setSelectedItem('') }}
                            className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${activeTab === 'export' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
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
                                                            <span className="px-1.5 py-0.5 text-xs rounded bg-blue-500/20 text-blue-400">T{i + 1}</span>
                                                        </th>
                                                    ))}
                                                    {ulanganAssignments.map((a, i) => (
                                                        <th key={a.id} className="px-3 py-3 text-center text-slate-300 font-medium">
                                                            <span className="px-1.5 py-0.5 text-xs rounded bg-red-500/20 text-red-400">U{i + 1}</span>
                                                        </th>
                                                    ))}
                                                    {quizzes.map((q, i) => (
                                                        <th key={q.id} className="px-3 py-3 text-center text-slate-300 font-medium">
                                                            <span className="px-1.5 py-0.5 text-xs rounded bg-green-500/20 text-green-400">K{i + 1}</span>
                                                        </th>
                                                    ))}
                                                    <th className="px-4 py-3 text-center text-purple-400 font-bold">Rata-rata</th>
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
                                                            {ulanganAssignments.map(a => {
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

                            {/* Tab: Tugas */}
                            {activeTab === 'tugas' && renderSubmissionTable(tugasAssignments)}

                            {/* Tab: Ulangan */}
                            {activeTab === 'ulangan' && renderSubmissionTable(ulanganAssignments)}

                            {/* Tab: Quiz */}
                            {activeTab === 'quiz' && (
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
                                            <li>✅ Nilai Ulangan (U1, U2, ...)</li>
                                            <li>✅ Nilai Kuis (K1, K2, ...)</li>
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

            {/* Modal Lihat Jawaban */}
            {viewingAnswers && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h2 className="text-xl font-bold text-white">Jawaban Siswa</h2>
                                <p className="text-slate-400">{viewingAnswers.studentName} • {viewingAnswers.submittedAt}</p>
                            </div>
                            <button onClick={() => setViewingAnswers(null)} className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-400 hover:text-white">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto bg-slate-900/50 rounded-xl p-4">
                            <pre className="text-slate-200 whitespace-pre-wrap font-mono text-sm">{viewingAnswers.answers}</pre>
                        </div>
                        <button onClick={() => setViewingAnswers(null)} className="mt-4 w-full px-4 py-3 bg-slate-700 text-white rounded-xl hover:bg-slate-600">Tutup</button>
                    </div>
                </div>
            )}

            {/* Modal Beri Nilai */}
            {grading && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-2xl">
                        <h2 className="text-xl font-bold text-white mb-4">Input Nilai</h2>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-slate-300 mb-2">Jawaban Siswa</label>
                            <div className="bg-slate-900/50 rounded-xl p-4 max-h-48 overflow-y-auto">
                                <pre className="text-slate-200 whitespace-pre-wrap font-mono text-sm">{grading.answers}</pre>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Nilai (0-100)</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={grading.score}
                                    onChange={(e) => setGrading({ ...grading, score: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Feedback (Opsional)</label>
                                <textarea
                                    value={grading.feedback}
                                    onChange={(e) => setGrading({ ...grading, feedback: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    rows={3}
                                    placeholder="Berikan feedback..."
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button onClick={() => setGrading(null)} className="flex-1 px-4 py-3 bg-slate-700 text-white rounded-xl hover:bg-slate-600">Batal</button>
                                <button onClick={handleGrade} disabled={saving} className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium disabled:opacity-50">
                                    {saving ? 'Menyimpan...' : 'Simpan Nilai'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {loading && <div className="text-center text-slate-400 py-8">Memuat...</div>}
        </div>
    )
}
