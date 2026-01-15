'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'

interface Assignment {
    id: string
    title: string
    description: string | null
    type: string
    due_date: string | null
    teaching_assignment: {
        subject: { name: string }
        class: { name: string }
    }
}

interface Submission {
    id: string
    assignment_id: string
    answers: unknown
    submitted_at: string
}

export default function SiswaTugasPage() {
    const { user } = useAuth()
    const [assignments, setAssignments] = useState<Assignment[]>([])
    const [submissions, setSubmissions] = useState<Submission[]>([])
    const [studentId, setStudentId] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState<{ assignmentId: string; answer: string; type: 'text' | 'link' } | null>(null)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const studentsRes = await fetch('/api/students')
                const students = await studentsRes.json()
                const myStudent = students.find((s: { user: { id: string } }) => s.user.id === user?.id)

                if (!myStudent?.class_id) {
                    setLoading(false)
                    return
                }

                setStudentId(myStudent.id)

                const [assignmentsRes, submissionsRes] = await Promise.all([
                    fetch('/api/assignments'),
                    fetch(`/api/submissions?student_id=${myStudent.id}`)
                ])
                const [assignmentsData, submissionsData] = await Promise.all([
                    assignmentsRes.json(),
                    submissionsRes.json()
                ])

                const myAssignments = assignmentsData.filter((a: Assignment) =>
                    a.teaching_assignment?.class?.name === myStudent.class.name
                )
                setAssignments(myAssignments)
                setSubmissions(submissionsData)
            } catch (error) {
                console.error('Error:', error)
            } finally {
                setLoading(false)
            }
        }
        if (user) fetchData()
    }, [user])

    const getSubmission = (assignmentId: string) => {
        return submissions.find((s) => s.assignment_id === assignmentId)
    }

    const handleSubmit = async () => {
        if (!submitting) return
        setSaving(true)
        try {
            await fetch('/api/submissions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    assignment_id: submitting.assignmentId,
                    answers: [{
                        type: submitting.type,
                        answer: submitting.answer
                    }]
                })
            })

            // Refresh submissions
            const res = await fetch(`/api/submissions?student_id=${studentId}`)
            setSubmissions(await res.json())
            setSubmitting(null)
        } finally {
            setSaving(false)
        }
    }

    const isOverdue = (dueDate: string | null) => {
        if (!dueDate) return false
        return new Date(dueDate) < new Date()
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
                    <h1 className="text-2xl font-bold text-white">Tugas & Ulangan</h1>
                    <p className="text-slate-400">Kerjakan tugas dari guru</p>
                </div>
            </div>

            {loading ? (
                <div className="text-center text-slate-400 py-8">Memuat...</div>
            ) : assignments.length === 0 ? (
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-8 text-center text-slate-400">
                    Belum ada tugas tersedia
                </div>
            ) : (
                <div className="space-y-4">
                    {assignments.map((assignment) => {
                        const submission = getSubmission(assignment.id)
                        const overdue = isOverdue(assignment.due_date)

                        return (
                            <div key={assignment.id} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`px-2 py-1 text-xs rounded ${assignment.type === 'ULANGAN' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
                                                {assignment.type}
                                            </span>
                                            <h3 className="font-semibold text-white">{assignment.title}</h3>
                                        </div>
                                        <p className="text-sm text-slate-400 mb-2">{assignment.description || '-'}</p>
                                        <div className="flex items-center gap-2 text-xs">
                                            <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded">{assignment.teaching_assignment?.subject?.name}</span>
                                            {assignment.due_date && (
                                                <span className={`${overdue ? 'text-red-400' : 'text-slate-400'}`}>
                                                    📅 {new Date(assignment.due_date).toLocaleDateString('id-ID')} {overdue && '(Lewat deadline)'}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="ml-4">
                                        {submission ? (
                                            <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm">✓ Sudah dikumpulkan</span>
                                        ) : overdue ? (
                                            <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-sm">Terlambat</span>
                                        ) : (
                                            <button
                                                onClick={() => setSubmitting({ assignmentId: assignment.id, answer: '', type: 'text' })}
                                                className="px-3 py-1 bg-amber-500/20 text-amber-400 rounded-lg hover:bg-amber-500/30 transition-colors text-sm"
                                            >
                                                Kerjakan
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {submitting && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-lg">
                        <h2 className="text-xl font-bold text-white mb-4">Kumpulkan Tugas</h2>

                        {/* Tab Toggle */}
                        <div className="flex bg-slate-900/50 p-1 rounded-xl mb-4">
                            <button
                                onClick={() => setSubmitting({ ...submitting, type: 'text' })}
                                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${submitting.type === 'text'
                                    ? 'bg-slate-700 text-white shadow'
                                    : 'text-slate-400 hover:text-slate-200'
                                    }`}
                            >
                                📝 Jawaban Teks
                            </button>
                            <button
                                onClick={() => setSubmitting({ ...submitting, type: 'link' })}
                                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${submitting.type === 'link'
                                    ? 'bg-slate-700 text-white shadow'
                                    : 'text-slate-400 hover:text-slate-200'
                                    }`}
                            >
                                🔗 Lampirkan Link
                            </button>
                        </div>

                        <div className="space-y-4">
                            {submitting.type === 'text' ? (
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Jawaban Teks</label>
                                    <textarea
                                        value={submitting.answer}
                                        onChange={(e) => setSubmitting({ ...submitting, answer: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        rows={6}
                                        placeholder="Tulis jawaban kamu di sini..."
                                    />
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Link Dokumen / File</label>
                                    <input
                                        type="url"
                                        value={submitting.answer}
                                        onChange={(e) => setSubmitting({ ...submitting, answer: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        placeholder="https://docs.google.com/..."
                                    />
                                    <p className="mt-2 text-xs text-slate-400">
                                        *Pastikan link Google Drive/Docs dapat diakses (Setting: Anyone with the link)
                                    </p>
                                </div>
                            )}

                            <div className="flex gap-3 pt-4">
                                <button onClick={() => setSubmitting(null)} className="flex-1 px-4 py-3 bg-slate-700 text-white rounded-xl hover:bg-slate-600 transition-colors">Batal</button>
                                <button onClick={handleSubmit} disabled={saving || !submitting.answer} className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
                                    {saving ? 'Mengirim...' : 'Kumpulkan'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
