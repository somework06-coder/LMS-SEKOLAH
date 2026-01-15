'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

interface Quiz {
    id: string
    title: string
    description: string | null
    duration_minutes: number
    is_active: boolean
    is_randomized: boolean
    created_at: string
    teaching_assignment: {
        id: string
        subject: { name: string }
        class: { name: string }
    }
    questions: { count: number }[]
}

interface TeachingAssignment {
    id: string
    subject: { id: string; name: string }
    class: { id: string; name: string }
}

export default function GuruKuisPage() {
    const { user } = useAuth()
    const router = useRouter()
    const [quizzes, setQuizzes] = useState<Quiz[]>([])
    const [teachingAssignments, setTeachingAssignments] = useState<TeachingAssignment[]>([])
    const [loading, setLoading] = useState(true)
    const [showCreate, setShowCreate] = useState(false)
    const [creating, setCreating] = useState(false)
    const [form, setForm] = useState({
        teaching_assignment_id: '',
        title: '',
        description: '',
        duration_minutes: 30,
        is_randomized: true
    })

    useEffect(() => {
        fetchData()
    }, [user])

    const fetchData = async () => {
        if (!user) {
            console.log('Quiz Page - User not loaded yet')
            return
        }

        try {
            console.log('Quiz Page - Fetching data for user:', user.id)

            const [quizzesRes, myAssignmentsRes] = await Promise.all([
                fetch('/api/quizzes'),
                fetch('/api/my-teaching-assignments')
            ])

            // Handle quiz response
            let quizzesData = []
            if (quizzesRes.ok) {
                const data = await quizzesRes.json()
                quizzesData = Array.isArray(data) ? data : []
            } else {
                console.error('Quiz Page - Quizzes API error:', quizzesRes.status)
            }

            // Handle assignments response
            let myAssignments = []
            if (myAssignmentsRes.ok) {
                const data = await myAssignmentsRes.json()
                myAssignments = Array.isArray(data) ? data : []
            } else {
                console.error('Quiz Page - Assignments API error:', myAssignmentsRes.status)
            }

            console.log('Quiz Page - My assignments loaded:', myAssignments.length)
            console.log('Quiz Page - Assignments data:', myAssignments)

            setTeachingAssignments(myAssignments)

            // Filter quizzes by my teaching assignments
            const myQuizzes = quizzesData.filter((q: Quiz) =>
                myAssignments.some((ta: TeachingAssignment) => ta.id === q.teaching_assignment?.id)
            )
            setQuizzes(myQuizzes)

            console.log('Quiz Page - Quizzes loaded:', myQuizzes.length)
        } catch (error) {
            console.error('Quiz Page - Error fetching data:', error)
            setTeachingAssignments([])
        } finally {
            setLoading(false)
        }
    }

    const handleCreate = async () => {
        if (!form.teaching_assignment_id || !form.title) return
        setCreating(true)
        try {
            const res = await fetch('/api/quizzes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            })
            if (res.ok) {
                const newQuiz = await res.json()
                setShowCreate(false)
                setForm({ teaching_assignment_id: '', title: '', description: '', duration_minutes: 30, is_randomized: true })
                router.push(`/dashboard/guru/kuis/${newQuiz.id}`)
            }
        } finally {
            setCreating(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Hapus kuis ini?')) return
        await fetch(`/api/quizzes/${id}`, { method: 'DELETE' })
        fetchData()
    }



    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/guru" className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-white">🎯 Kuis</h1>
                        <p className="text-slate-400">Buat dan kelola kuis dengan AI</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowCreate(true)}
                    className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-xl font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Buat Kuis
                </button>
            </div>

            {loading ? (
                <div className="text-center text-slate-400 py-8">Memuat...</div>
            ) : quizzes.length === 0 ? (
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-8 text-center">
                    <div className="text-6xl mb-4">🎯</div>
                    <h3 className="text-xl font-semibold text-white mb-2">Belum Ada Kuis</h3>
                    <p className="text-slate-400 mb-4">Buat kuis pertama Anda dengan bantuan AI!</p>
                    <button
                        onClick={() => setShowCreate(true)}
                        className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
                    >
                        Buat Kuis Sekarang
                    </button>
                </div>
            ) : (
                <div className="grid gap-4">
                    {quizzes.map((quiz) => (
                        <div key={quiz.id} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-semibold text-white text-lg">{quiz.title}</h3>
                                        {quiz.is_active ? (
                                            <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">Aktif</span>
                                        ) : (
                                            <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-500 text-xs rounded-full border border-yellow-500/20">Draft</span>
                                        )}
                                    </div>
                                    <p className="text-sm text-slate-400 mb-2">{quiz.description || '-'}</p>
                                    <div className="flex items-center gap-4 text-xs text-slate-500">
                                        <span className="px-2 py-1 bg-slate-700/50 rounded">{quiz.teaching_assignment?.subject?.name}</span>
                                        <span className="px-2 py-1 bg-slate-700/50 rounded">{quiz.teaching_assignment?.class?.name}</span>
                                        <span>⏱️ {quiz.duration_minutes} menit</span>
                                        <span>📝 {quiz.questions?.[0]?.count || 0} soal</span>
                                        {quiz.is_randomized && <span>🔀 Acak</span>}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {quiz.is_active && (
                                        <Link
                                            href={`/dashboard/guru/kuis/${quiz.id}/hasil`}
                                            className="px-3 py-1.5 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors text-sm"
                                        >
                                            📊 Hasil
                                        </Link>
                                    )}
                                    <Link
                                        href={`/dashboard/guru/kuis/${quiz.id}`}
                                        className="px-3 py-1.5 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-colors text-sm"
                                    >
                                        Edit Soal
                                    </Link>
                                    <button
                                        onClick={() => handleDelete(quiz.id)}
                                        className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors text-sm"
                                    >
                                        Hapus
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal Create Quiz */}
            {showCreate && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold text-white mb-4">Buat Kuis Baru</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Kelas & Mata Pelajaran</label>
                                <select
                                    value={form.teaching_assignment_id}
                                    onChange={(e) => setForm({ ...form, teaching_assignment_id: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                    disabled={teachingAssignments.length === 0}
                                >
                                    <option value="">-- Pilih --</option>
                                    {teachingAssignments.length === 0 ? (
                                        <option disabled>Tidak ada kelas (Hubungi Admin)</option>
                                    ) : (
                                        teachingAssignments.map((ta) => (
                                            <option key={ta.id} value={ta.id}>
                                                {ta.class?.name || 'Unknown Class'} - {ta.subject?.name || 'Unknown Subject'}
                                            </option>
                                        ))
                                    )}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Judul Kuis</label>
                                <input
                                    type="text"
                                    value={form.title}
                                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                    placeholder="Contoh: Kuis Bab 1 - Bilangan Bulat"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Deskripsi (Opsional)</label>
                                <textarea
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                    rows={2}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Durasi (menit)</label>
                                    <input
                                        type="number"
                                        value={form.duration_minutes}
                                        onChange={(e) => setForm({ ...form, duration_minutes: parseInt(e.target.value) || 30 })}
                                        className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                        min={5}
                                    />
                                </div>
                                <div className="flex items-end">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={form.is_randomized}
                                            onChange={(e) => setForm({ ...form, is_randomized: e.target.checked })}
                                            className="w-5 h-5 rounded bg-slate-700 border-slate-600 text-cyan-500 focus:ring-cyan-500"
                                        />
                                        <span className="text-slate-300">🔀 Acak Soal</span>
                                    </label>
                                </div>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => setShowCreate(false)}
                                    className="flex-1 px-4 py-3 bg-slate-700 text-white rounded-xl hover:bg-slate-600 transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={handleCreate}
                                    disabled={creating || !form.teaching_assignment_id || !form.title}
                                    className="flex-1 px-4 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                                >
                                    {creating ? 'Membuat...' : 'Buat Kuis'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
