'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Modal, Button, PageHeader, EmptyState } from '@/components/ui'
import Card from '@/components/ui/Card'
import { BookOpen, Plus } from 'lucide-react'
import { Subject } from '@/lib/types'

export default function MapelPage() {
    const [subjects, setSubjects] = useState<Subject[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editingSubject, setEditingSubject] = useState<Subject | null>(null)
    const [formData, setFormData] = useState({ name: '' })
    const [saving, setSaving] = useState(false)

    const fetchSubjects = async () => {
        try {
            const res = await fetch('/api/subjects')
            const data = await res.json()
            setSubjects(data)
        } catch (error) {
            console.error('Error:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchSubjects()
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        try {
            const url = editingSubject ? `/api/subjects/${editingSubject.id}` : '/api/subjects'
            const method = editingSubject ? 'PUT' : 'POST'

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            if (res.ok) {
                setShowModal(false)
                setEditingSubject(null)
                setFormData({ name: '' })
                fetchSubjects()
            }
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Yakin ingin menghapus mata pelajaran ini?')) return
        await fetch(`/api/subjects/${id}`, { method: 'DELETE' })
        fetchSubjects()
    }

    const openEdit = (subject: Subject) => {
        setEditingSubject(subject)
        setFormData({ name: subject.name })
        setShowModal(true)
    }

    const openAdd = () => {
        setEditingSubject(null)
        setFormData({ name: '' })
        setShowModal(true)
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="Mata Pelajaran"
                subtitle="Kelola daftar mata pelajaran sekolah"
                backHref="/dashboard/admin"
                icon={<BookOpen className="w-6 h-6 text-green-500" />}
                action={
                    <Button onClick={openAdd} icon={<Plus className="w-5 h-5" />}>
                        Tambah Mapel
                    </Button>
                }
            />

            <div className="min-h-[50vh]">
                {loading ? (
                    <div className="p-12 flex justify-center">
                        <div className="animate-spin text-primary"><BookOpen className="w-8 h-8" /></div>
                    </div>
                ) : subjects.length === 0 ? (
                    <EmptyState
                        icon={<BookOpen className="w-12 h-12 text-secondary" />}
                        title="Belum Ada Mata Pelajaran"
                        description="Tambahkan mata pelajaran untuk memulai"
                        action={<Button onClick={openAdd}>Tambah Mapel</Button>}
                    />
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {subjects.map((subject) => (
                            <Card key={subject.id} className="group hover:border-primary/50 transition-all hover:shadow-lg">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center text-xl font-bold text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                                            {subject.name[0]}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-text-main dark:text-white group-hover:text-primary transition-colors">{subject.name}</h3>
                                            <p className="text-xs text-text-secondary dark:text-[#A8BC9F]">Aktif</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => openEdit(subject)}
                                            className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 flex items-center justify-center transition-colors"
                                            title="Edit"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => handleDelete(subject.id)}
                                            className="w-8 h-8 rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500/20 flex items-center justify-center transition-colors"
                                            title="Hapus"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            <Modal
                open={showModal}
                onClose={() => setShowModal(false)}
                title={editingSubject ? '✏️ Edit Mata Pelajaran' : '➕ Tambah Mata Pelajaran'}
            >
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-text-main dark:text-white mb-2">Nama Mata Pelajaran</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-3 bg-secondary/5 border border-secondary/20 rounded-xl text-text-main dark:text-white focus:outline-none focus:ring-2 focus:ring-primary placeholder-text-secondary/50 transition-all"
                            placeholder="Contoh: Matematika"
                            required
                        />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <Button type="button" variant="secondary" onClick={() => setShowModal(false)} className="flex-1">
                            Batal
                        </Button>
                        <Button type="submit" loading={saving} className="flex-1">
                            Simpan Perubahan
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    )
}
