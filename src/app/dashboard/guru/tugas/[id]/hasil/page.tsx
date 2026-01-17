'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Modal, PageHeader, Button } from '@/components/ui'

interface Submission {
    id: string
    answers: string | Record<string, unknown> | null
    submitted_at: string
    student: {
        id: string
        nis: string | null
        user: { full_name: string | null }
    }
    grade: Array<{
        id: string
        score: number
        feedback: string | null
    }>
}

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

export default function TugasHasilPage() {
    const params = useParams()
    const assignmentId = params.id as string

    const [assignment, setAssignment] = useState<Assignment | null>(null)
    const [submissions, setSubmissions] = useState<Submission[]>([])
    const [loading, setLoading] = useState(true)

    const [grading, setGrading] = useState<{
        submissionId: string
        score: string
        feedback: string
        answers: string
        studentName: string
    } | null>(null)
    const [saving, setSaving] = useState(false)

    const fetchData = useCallback(async () => {
        try {
            const [assignmentRes, subsRes] = await Promise.all([
                fetch(`/api/assignments/${assignmentId}`),
                fetch(`/api/submissions?assignment_id=${assignmentId}`)
            ])
            const assignmentData = await assignmentRes.json()
            const subsData = await subsRes.json()

            setAssignment(assignmentData)
            setSubmissions(Array.isArray(subsData) ? subsData : [])
        } catch (error) {
            console.error('Error:', error)
        } finally {
            setLoading(false)
        }
    }, [assignmentId])

    useEffect(() => {
        fetchData()
    }, [fetchData])

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
            fetchData()
        } catch (error) {
            console.error('Error grading:', error)
            alert('Gagal menyimpan nilai')
        } finally {
            setSaving(false)
        }
    }

    const getAnswersText = (answers: Submission['answers']) => {
        if (typeof answers === 'string') return answers
        if (Array.isArray(answers)) {
            return answers.map((a: any) => a.answer || JSON.stringify(a)).join('\n\n')
        }
        if (answers) return JSON.stringify(answers, null, 2)
        return '-'
    }

    const calculateStats = () => {
        const graded = submissions.filter(s => s.grade?.length > 0)
        if (graded.length === 0) return { avg: 0, highest: 0, lowest: 0, count: 0 }

        const scores = graded.map(s => s.grade[0].score)
        return {
            avg: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
            highest: Math.max(...scores),
            lowest: Math.min(...scores),
            count: graded.length
        }
    }

    if (loading) {
        return <div className="text-center text-slate-400 py-8">Memuat...</div>
    }

    if (!assignment) {
        return <div className="text-center text-slate-400 py-8">Tugas tidak ditemukan</div>
    }

    const stats = calculateStats()

    return (
        <div className="space-y-6">
            <PageHeader
                title={`📋 Hasil: ${assignment.title}`}
                subtitle={`${assignment.teaching_assignment?.class?.name} • ${assignment.teaching_assignment?.subject?.name}`}
                backHref="/dashboard/guru/tugas"
            />

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 text-center">
                    <p className="text-3xl font-bold text-purple-400">{submissions.length}</p>
                    <p className="text-xs text-slate-400">Submit</p>
                </div>
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 text-center">
                    <p className="text-3xl font-bold text-blue-400">{stats.avg || '-'}</p>
                    <p className="text-xs text-slate-400">Rata-rata</p>
                </div>
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 text-center">
                    <p className="text-3xl font-bold text-green-400">{stats.highest || '-'}</p>
                    <p className="text-xs text-slate-400">Tertinggi</p>
                </div>
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 text-center">
                    <p className="text-3xl font-bold text-amber-400">{submissions.length - stats.count}</p>
                    <p className="text-xs text-slate-400">Belum Dinilai</p>
                </div>
            </div>

            {/* Submissions Table */}
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-700">
                                <th className="text-left p-4 text-slate-400 font-medium">Siswa</th>
                                <th className="text-center p-4 text-slate-400 font-medium">Waktu</th>
                                <th className="text-center p-4 text-slate-400 font-medium">Nilai</th>
                                <th className="text-center p-4 text-slate-400 font-medium">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                            {submissions.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-slate-400">
                                        Belum ada siswa yang mengumpulkan
                                    </td>
                                </tr>
                            ) : (
                                submissions.map((sub) => (
                                    <tr key={sub.id} className="hover:bg-slate-700/30">
                                        <td className="p-4">
                                            <p className="text-white font-medium">{sub.student?.user?.full_name}</p>
                                            <p className="text-xs text-slate-500">{sub.student?.nis}</p>
                                        </td>
                                        <td className="p-4 text-center text-sm text-slate-300">
                                            {new Date(sub.submitted_at).toLocaleString('id-ID')}
                                        </td>
                                        <td className="p-4 text-center">
                                            {sub.grade?.length > 0 ? (
                                                <span className={`px-3 py-1 rounded-full font-bold ${sub.grade[0].score >= 75 ? 'bg-green-500/20 text-green-400' :
                                                        sub.grade[0].score >= 60 ? 'bg-amber-500/20 text-amber-400' :
                                                            'bg-red-500/20 text-red-400'
                                                    }`}>
                                                    {sub.grade[0].score}
                                                </span>
                                            ) : (
                                                <span className="px-2 py-1 bg-slate-600/30 text-slate-400 rounded-full text-xs">Belum</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-center">
                                            <button
                                                onClick={() => setGrading({
                                                    submissionId: sub.id,
                                                    score: sub.grade?.[0]?.score?.toString() || '',
                                                    feedback: sub.grade?.[0]?.feedback || '',
                                                    answers: getAnswersText(sub.answers),
                                                    studentName: sub.student?.user?.full_name || 'Unknown'
                                                })}
                                                className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors text-sm"
                                            >
                                                {sub.grade?.length ? '✏️ Edit' : '📝 Nilai'}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Grading Modal */}
            <Modal
                open={!!grading}
                onClose={() => setGrading(null)}
                title="Input Nilai"
                subtitle={grading?.studentName}
                maxWidth="lg"
            >
                {grading && (
                    <div className="space-y-4">
                        {/* Jawaban Siswa */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">📄 Jawaban Siswa</label>
                            <div className="bg-slate-900/50 rounded-xl p-4 max-h-48 overflow-y-auto">
                                <pre className="text-slate-200 whitespace-pre-wrap font-mono text-sm">{grading.answers}</pre>
                            </div>
                        </div>

                        {/* Score Input */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Nilai (0-100)</label>
                            <input
                                type="number"
                                min="0"
                                max="100"
                                value={grading.score}
                                onChange={(e) => setGrading({ ...grading, score: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-2xl font-bold text-center"
                                placeholder="0"
                            />
                        </div>

                        {/* Feedback */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Feedback (Opsional)</label>
                            <textarea
                                value={grading.feedback}
                                onChange={(e) => setGrading({ ...grading, feedback: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                rows={3}
                                placeholder="Berikan komentar atau feedback..."
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 pt-2">
                            <Button variant="secondary" onClick={() => setGrading(null)} className="flex-1">
                                Batal
                            </Button>
                            <Button onClick={handleGrade} loading={saving} disabled={!grading.score} className="flex-1">
                                Simpan Nilai
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    )
}
