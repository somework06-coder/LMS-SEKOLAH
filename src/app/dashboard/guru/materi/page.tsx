'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Modal, PageHeader, Button, EmptyState } from '@/components/ui'

interface TeachingAssignment {
    id: string
    subject: { name: string }
    class: { name: string }
}

interface Material {
    id: string
    title: string
    description: string | null
    type: string
    content_url: string | null
    content_text: string | null
    created_at: string
    teaching_assignment: TeachingAssignment
}

export default function MateriPage() {
    const { user } = useAuth()
    const [materials, setMaterials] = useState<Material[]>([])
    const [assignments, setAssignments] = useState<TeachingAssignment[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [formData, setFormData] = useState({
        teaching_assignment_id: '',
        title: '',
        description: '',
        type: 'TEXT',
        content_url: '',
        content_text: ''
    })
    const [saving, setSaving] = useState(false)
    const [file, setFile] = useState<File | null>(null)

    const fetchData = async () => {
        try {
            const teachersRes = await fetch('/api/teachers')
            const teachers = await teachersRes.json()
            const myTeacher = teachers.find((t: { user: { id: string } }) => t.user.id === user?.id)

            if (!myTeacher) {
                setLoading(false)
                return
            }

            const [assignmentsRes, materialsRes] = await Promise.all([
                fetch('/api/teaching-assignments'),
                fetch('/api/materials')
            ])
            const [assignmentsData, materialsData] = await Promise.all([
                assignmentsRes.json(),
                materialsRes.json()
            ])

            const myAssignments = assignmentsData.filter((a: { teacher: { id: string } }) => a.teacher.id === myTeacher.id)
            const myMaterials = materialsData.filter((m: Material) =>
                myAssignments.some((a: TeachingAssignment) => a.id === m.teaching_assignment?.id)
            )

            setAssignments(myAssignments)
            setMaterials(myMaterials)
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
            let finalContentUrl = formData.content_url

            if (formData.type === 'PDF' && file) {
                const uploadFormData = new FormData()
                uploadFormData.append('file', file)

                const uploadRes = await fetch('/api/materials/upload', {
                    method: 'POST',
                    body: uploadFormData
                })

                if (!uploadRes.ok) {
                    const errorData = await uploadRes.json()
                    throw new Error(errorData.error || 'Gagal upload file')
                }

                const data = await uploadRes.json()
                finalContentUrl = data.url
            }

            const res = await fetch('/api/materials', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    content_url: finalContentUrl
                })
            })

            if (res.ok) {
                setShowModal(false)
                setFormData({ teaching_assignment_id: '', title: '', description: '', type: 'TEXT', content_url: '', content_text: '' })
                setFile(null)
                fetchData()
            }
        } catch (error: any) {
            console.error('Error uploading/saving:', error)
            alert(error.message || 'Gagal menyimpan materi. Pastikan file valid.')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Yakin ingin menghapus materi ini?')) return
        await fetch(`/api/materials/${id}`, { method: 'DELETE' })
        fetchData()
    }

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'PDF': return '📄 PDF'
            case 'VIDEO': return '🎬 Video'
            case 'TEXT': return '📝 Teks'
            case 'LINK': return '🔗 Link'
            default: return type
        }
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="📚 Materi Pembelajaran"
                subtitle="Upload dan kelola materi"
                backHref="/dashboard/guru"
                action={
                    <Button onClick={() => setShowModal(true)} icon={
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                    }>
                        Tambah Materi
                    </Button>
                }
            />

            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-slate-400">Memuat...</div>
                ) : materials.length === 0 ? (
                    <EmptyState
                        icon="📚"
                        title="Belum Ada Materi"
                        description="Upload materi pembelajaran untuk siswa"
                        action={<Button onClick={() => setShowModal(true)}>Tambah Materi</Button>}
                    />
                ) : (
                    <div className="divide-y divide-slate-700/50">
                        {materials.map((material) => (
                            <div key={material.id} className="p-4 hover:bg-slate-800/30">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-lg">{getTypeLabel(material.type)}</span>
                                            <h3 className="font-semibold text-white">{material.title}</h3>
                                        </div>
                                        <p className="text-sm text-slate-400 mb-2">{material.description || '-'}</p>
                                        <div className="flex items-center gap-2 text-xs">
                                            <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded">{material.teaching_assignment?.subject?.name}</span>
                                            <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded">{material.teaching_assignment?.class?.name}</span>
                                        </div>
                                    </div>
                                    <button onClick={() => handleDelete(material.id)} className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors">
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

            <Modal open={showModal} onClose={() => setShowModal(false)} title="Tambah Materi">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Kelas & Mata Pelajaran</label>
                        <select
                            value={formData.teaching_assignment_id}
                            onChange={(e) => setFormData({ ...formData, teaching_assignment_id: e.target.value })}
                            className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                            required
                        >
                            <option value="">Pilih Kelas & Mapel</option>
                            {assignments.map((a) => (
                                <option key={a.id} value={a.id}>{a.class.name} - {a.subject.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Judul Materi</label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Deskripsi</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                            rows={2}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Tipe</label>
                        <select
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                            className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                            <option value="TEXT">Teks</option>
                            <option value="LINK">Link URL</option>
                            <option value="PDF">Upload PDF</option>
                            <option value="VIDEO">Video URL</option>
                        </select>
                    </div>

                    {formData.type === 'PDF' ? (
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">File PDF</label>
                            <input
                                type="file"
                                accept="application/pdf"
                                onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-slate-300 focus:outline-none focus:ring-2 focus:ring-green-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-slate-600 file:text-white hover:file:bg-slate-500"
                                required
                            />
                            <p className="mt-1 text-xs text-slate-500">Maksimal 5MB.</p>
                        </div>
                    ) : formData.type === 'TEXT' ? (
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Konten</label>
                            <textarea
                                value={formData.content_text}
                                onChange={(e) => setFormData({ ...formData, content_text: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                                rows={4}
                            />
                        </div>
                    ) : (
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">URL</label>
                            <input
                                type="url"
                                value={formData.content_url}
                                onChange={(e) => setFormData({ ...formData, content_url: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                                placeholder="https://..."
                            />
                        </div>
                    )}

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
