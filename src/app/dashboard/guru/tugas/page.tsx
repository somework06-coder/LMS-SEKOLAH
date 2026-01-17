'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Modal, PageHeader, Button, EmptyState } from '@/components/ui'
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

            const taArray = Array.isArray(taData) ? taData : []
            const assignmentsArray = Array.isArray(assignmentsData) ? assignmentsData : []

            const myTA = taArray.filter((a: { teacher: { id: string } }) => a.teacher.id === myTeacher.id)
            const myAssignments = assignmentsArray.filter((a: Assignment) =>
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
            <PageHeader
                title="📋 Tugas"
                subtitle="Buat dan kelola tugas"
                backHref="/dashboard/guru"
                action={
                    <Button onClick={() => setShowModal(true)} icon={
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                    }>
                        Buat Tugas
                    </Button>
                }
            />

            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-slate-400">Memuat...</div>
                ) : assignments.length === 0 ? (
                    <EmptyState
                        icon="📝"
                        title="Belum Ada Tugas"
                        description="Buat tugas untuk siswa"
                        action={<Button onClick={() => setShowModal(true)}>Buat Tugas</Button>}
                    />
                ) : (
                    <div className="divide-y divide-slate-700/50">
                        {assignments.map((assignment) => (
                            <div key={assignment.id} className="p-4 hover:bg-slate-800/30">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="px-2 py-1 text-xs rounded bg-amber-500/20 text-amber-400">
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
                                    <div className="flex items-center gap-2">
                                        <Link
                                            href={`/dashboard/guru/tugas/${assignment.id}/hasil`}
                                            className="px-3 py-1.5 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors text-sm"
                                        >
                                            📊 Hasil
                                        </Link>
                                        <button onClick={() => handleDelete(assignment.id)} className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <Modal
                open={showModal}
                onClose={() => setShowModal(false)}
                title="Buat Tugas"
            >
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
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Deadline</label>
                        <input
                            type="datetime-local"
                            value={formData.due_date}
                            onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                            className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button type="button" variant="secondary" onClick={() => setShowModal(false)} className="flex-1">
                            Batal
                        </Button>
                        <Button type="submit" loading={saving} className="flex-1">
                            Simpan
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    )
}
