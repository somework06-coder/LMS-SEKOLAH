'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'

interface TeachingAssignment {
    id: string
    subject: { name: string }
    class: { name: string }
}

interface Assignment {
    id: string
    title: string
    description: string | null
    type: string
    due_date: string | null
    created_at: string
    teaching_assignment: TeachingAssignment
}

export default function TugasPage() {
    const { user } = useAuth()
    const [assignments, setAssignments] = useState<Assignment[]>([])
    const [teachingAssignments, setTeachingAssignments] = useState<TeachingAssignment[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [formData, setFormData] = useState({
        teaching_assignment_id: '',
        title: '',
        description: '',
        type: 'TUGAS',
        due_date: ''
    })
    const [saving, setSaving] = useState(false)

    const fetchData = async () => {
        try {
            const teachersRes = await fetch('/api/teachers')
            const teachers = await teachersRes.json()
            const myTeacher = teachers.find((t: { user: { id: string } }) => t.user.id === user?.id)

            if (!myTeacher) {
                setLoading(false)
                return
            }

            const [taRes, assignmentsRes] = await Promise.all([
                fetch('/api/teaching-assignments'),
                fetch('/api/assignments')
            ])
            const [taData, assignmentsData] = await Promise.all([
                taRes.json(),
                assignmentsRes.json()
            ])

            const myTA = taData.filter((a: { teacher: { id: string } }) => a.teacher.id === myTeacher.id)
            const myAssignments = assignmentsData.filter((a: Assignment) =>
                myTA.some((ta: TeachingAssignment) => ta.id === a.teaching_assignment?.id)
            )

            setTeachingAssignments(myTA)
            setAssignments(myAssignments)
        } catch (error) {
            console.error('Error:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (user) fetchData()
    }, [user])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        try {
            const res = await fetch('/api/assignments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    due_date: formData.due_date ? new Date(formData.due_date).toISOString() : null
                })
            })

            if (res.ok) {
                setShowModal(false)
                setFormData({ teaching_assignment_id: '', title: '', description: '', type: 'TUGAS', due_date: '' })
                fetchData()
            }
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Yakin ingin menghapus tugas ini?')) return
        await fetch(`/api/assignments/${id}`, { method: 'DELETE' })
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
                        <h1 className="text-2xl font-bold text-white">Tugas & Ulangan</h1>
                        <p className="text-slate-400">Buat dan kelola tugas</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-xl font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Buat Tugas
                </button>
            </div>

            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-slate-400">Memuat...</div>
                ) : assignments.length === 0 ? (
                    <div className="p-8 text-center text-slate-400">Belum ada tugas</div>
                ) : (
                    <div className="divide-y divide-slate-700/50">
                        {assignments.map((assignment) => (
                            <div key={assignment.id} className="p-4 hover:bg-slate-800/30">
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
                                            <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded">{assignment.teaching_assignment?.class?.name}</span>
                                            {assignment.due_date && (
                                                <span className="text-slate-400">
                                                    📅 {new Date(assignment.due_date).toLocaleDateString('id-ID')}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <button onClick={() => handleDelete(assignment.id)} className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold text-white mb-4">Buat Tugas</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Kelas & Mata Pelajaran</label>
                                <select
                                    value={formData.teaching_assignment_id}
                                    onChange={(e) => setFormData({ ...formData, teaching_assignment_id: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                                    required
                                >
                                    <option value="">Pilih Kelas & Mapel</option>
                                    {teachingAssignments.map((a) => (
                                        <option key={a.id} value={a.id}>{a.class.name} - {a.subject.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Judul</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Deskripsi</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                                    rows={2}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Tipe</label>
                                    <select
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                                    >
                                        <option value="TUGAS">Tugas</option>
                                        <option value="ULANGAN">Ulangan</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Deadline</label>
                                    <input
                                        type="datetime-local"
                                        value={formData.due_date}
                                        onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-3 bg-slate-700 text-white rounded-xl hover:bg-slate-600 transition-colors">Batal</button>
                                <button type="submit" disabled={saving} className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
                                    {saving ? 'Menyimpan...' : 'Simpan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
