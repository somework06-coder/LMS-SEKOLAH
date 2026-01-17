'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

interface Exam {
    id: string
    title: string
    description: string | null
    start_time: string
    duration_minutes: number
    is_active: boolean
    is_randomized: boolean
    max_violations: number
    question_count: number
    created_at: string
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

export default function GuruUlanganPage() {
    const { user } = useAuth()
    const router = useRouter()
    const [exams, setExams] = useState<Exam[]>([])
    const [teachingAssignments, setTeachingAssignments] = useState<TeachingAssignment[]>([])
    const [loading, setLoading] = useState(true)
    const [showCreate, setShowCreate] = useState(false)
    const [creating, setCreating] = useState(false)
    const [form, setForm] = useState({
        teaching_assignment_id: '',
        title: '',
        description: '',
        start_time: '',
        duration_minutes: 60,
        is_randomized: true,
        max_violations: 3
    })

    useEffect(() => {
        fetchData()
    }, [user])

    const fetchData = async () => {
        if (!user) return

        try {
            const [examsRes, myAssignmentsRes] = await Promise.all([
                fetch('/api/exams'),
                fetch('/api/my-teaching-assignments')
            ])

            let examsData = []
            if (examsRes.ok) {
                const data = await examsRes.json()
                examsData = Array.isArray(data) ? data : []
            }

            let myAssignments = []
            if (myAssignmentsRes.ok) {
                const data = await myAssignmentsRes.json()
                myAssignments = Array.isArray(data) ? data : []
            }

            setTeachingAssignments(myAssignments)

            // Filter exams by my teaching assignments
            const myExams = examsData.filter((e: Exam) =>
                myAssignments.some((ta: TeachingAssignment) => ta.id === e.teaching_assignment?.id)
            )
            setExams(myExams)
        } catch (error) {
            console.error('Error fetching data:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleCreate = async () => {
        if (!form.teaching_assignment_id || !form.title || !form.start_time) return
        setCreating(true)
        try {
            const res = await fetch('/api/exams', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            })
            if (res.ok) {
                const newExam = await res.json()
                setShowCreate(false)
                setForm({
                    teaching_assignment_id: '',
                    title: '',
                    description: '',
                    start_time: '',
                    duration_minutes: 60,
                    is_randomized: true,
                    max_violations: 3
                })
                router.push(`/dashboard/guru/ulangan/${newExam.id}`)
            }
        } finally {
            setCreating(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Hapus ulangan ini?')) return
        await fetch(`/api/exams/${id}`, { method: 'DELETE' })
        fetchData()
    }

    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const getExamStatus = (exam: Exam) => {
        const now = new Date()
        const startTime = new Date(exam.start_time)
        const endTime = new Date(startTime.getTime() + exam.duration_minutes * 60000)

        if (!exam.is_active) return { label: 'Draft', color: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/20' }
        if (now < startTime) return { label: 'Terjadwal', color: 'bg-blue-500/20 text-blue-400' }
        if (now >= startTime && now <= endTime) return { label: 'Berlangsung', color: 'bg-green-500/20 text-green-400' }
        return { label: 'Selesai', color: 'bg-slate-500/20 text-slate-400' }
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
                        <h1 className="text-2xl font-bold text-white">📄 Ulangan</h1>
                        <p className="text-slate-400">Buat ulangan dengan pengawasan ketat</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowCreate(true)}
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Buat Ulangan
                </button>
            </div>

            {/* Info cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-xl p-4">
                    <div className="text-3xl mb-2">🔒</div>
                    <h3 className="font-semibold text-white">Tab Lock</h3>
                    <p className="text-sm text-slate-400">Siswa tidak bisa keluar tab</p>
                </div>
                <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-xl p-4">
                    <div className="text-3xl mb-2">⏰</div>
                    <h3 className="font-semibold text-white">Waktu Mulai</h3>
                    <p className="text-sm text-slate-400">Jadwalkan waktu start ulangan</p>
                </div>
                <div className="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 rounded-xl p-4">
                    <div className="text-3xl mb-2">⚠️</div>
                    <h3 className="font-semibold text-white">Violation Limit</h3>
                    <p className="text-sm text-slate-400">Auto-submit jika melebihi batas</p>
                </div>
            </div>

            {loading ? (
                <div className="text-center text-slate-400 py-8">Memuat...</div>
            ) : exams.length === 0 ? (
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-8 text-center">
                    <div className="text-6xl mb-4">📄</div>
                    <h3 className="text-xl font-semibold text-white mb-2">Belum Ada Ulangan</h3>
                    <p className="text-slate-400 mb-4">Buat ulangan dengan fitur pengawasan!</p>
                    <button
                        onClick={() => setShowCreate(true)}
                        className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
                    >
                        Buat Ulangan Sekarang
                    </button>
                </div>
            ) : (
                <div className="grid gap-4">
                    {exams.map((exam) => {
                        const status = getExamStatus(exam)
                        return (
                            <div key={exam.id} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-semibold text-white text-lg">{exam.title}</h3>
                                            <span className={`px-2 py-0.5 text-xs rounded-full ${status.color}`}>{status.label}</span>
                                        </div>
                                        <p className="text-sm text-slate-400 mb-2">{exam.description || '-'}</p>
                                        <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                                            <span className="px-2 py-1 bg-slate-700/50 rounded">{exam.teaching_assignment?.subject?.name}</span>
                                            <span className="px-2 py-1 bg-slate-700/50 rounded">{exam.teaching_assignment?.class?.name}</span>
                                            <span>📅 {formatDateTime(exam.start_time)}</span>
                                            <span>⏱️ {exam.duration_minutes} menit</span>
                                            <span>📝 {exam.question_count || 0} soal</span>
                                            <span>⚠️ Max {exam.max_violations} pelanggaran</span>
                                            {exam.is_randomized && <span>🔀 Acak</span>}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {exam.is_active && (
                                            <Link
                                                href={`/dashboard/guru/ulangan/${exam.id}/hasil`}
                                                className="px-3 py-1.5 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors text-sm"
                                            >
                                                📊 Hasil
                                            </Link>
                                        )}
                                        <Link
                                            href={`/dashboard/guru/ulangan/${exam.id}`}
                                            className="px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors text-sm"
                                        >
                                            ✏️ Edit
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(exam.id)}
                                            className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors text-sm"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Create Modal */}
            {showCreate && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold text-white mb-4">Buat Ulangan Baru</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Kelas & Mata Pelajaran</label>
                                <select
                                    value={form.teaching_assignment_id}
                                    onChange={(e) => setForm({ ...form, teaching_assignment_id: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                >
                                    <option value="">Pilih kelas...</option>
                                    {teachingAssignments.map((ta) => (
                                        <option key={ta.id} value={ta.id}>
                                            {ta.class.name} - {ta.subject.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Judul Ulangan</label>
                                <input
                                    type="text"
                                    value={form.title}
                                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    placeholder="Contoh: UTS Matematika Bab 1-3"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Deskripsi (Opsional)</label>
                                <textarea
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    rows={2}
                                    placeholder="Materi yang diujikan..."
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Waktu Mulai</label>
                                    <input
                                        type="datetime-local"
                                        value={form.start_time}
                                        onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Durasi (menit)</label>
                                    <input
                                        type="number"
                                        value={form.duration_minutes}
                                        onChange={(e) => setForm({ ...form, duration_minutes: parseInt(e.target.value) || 60 })}
                                        className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        min={5}
                                        max={180}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Max Pelanggaran (auto-submit)</label>
                                <input
                                    type="number"
                                    value={form.max_violations}
                                    onChange={(e) => setForm({ ...form, max_violations: parseInt(e.target.value) || 3 })}
                                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    min={1}
                                    max={10}
                                />
                                <p className="text-xs text-slate-500 mt-1">Jika siswa keluar tab melebihi batas, ulangan auto-submit</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="randomize"
                                    checked={form.is_randomized}
                                    onChange={(e) => setForm({ ...form, is_randomized: e.target.checked })}
                                    className="w-4 h-4 rounded bg-slate-700 border-slate-600 text-purple-500 focus:ring-purple-500"
                                />
                                <label htmlFor="randomize" className="text-sm text-slate-300">Acak urutan soal per siswa</label>
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
                                    disabled={creating || !form.teaching_assignment_id || !form.title || !form.start_time}
                                    className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                                >
                                    {creating ? 'Membuat...' : 'Buat & Tambah Soal'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
