'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Modal, Button, PageHeader, EmptyState } from '@/components/ui'
import Card from '@/components/ui/Card'
import { Document as BookOpen, Plus, Edit, Delete } from 'react-iconly'
import { Loader2 } from 'lucide-react'
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
                icon={<div className="text-emerald-500"><BookOpen set="bold" primaryColor="currentColor" size={24} /></div>}
                action={
                    <Button onClick={openAdd} icon={<Plus set="bold" primaryColor="currentColor" size={20} />}>
                        Tambah Mapel
                    </Button>
                }
            />

            <div className="min-h-[50vh]">
                {loading ? (
                    <div className="p-12 flex justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : subjects.length === 0 ? (
                    <EmptyState
                        icon={<div className="text-secondary"><BookOpen set="bold" primaryColor="currentColor" size={48} /></div>}
                        title="Belum Ada Mata Pelajaran"
                        description="Tambahkan mata pelajaran untuk memulai"
                        action={<Button onClick={openAdd}>Tambah Mapel</Button>}
                    />
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {subjects.map((subject) => (
                            <Card key={subject.id} className="group hover:border-emerald-500/50 transition-all hover:shadow-lg">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/10 flex items-center justify-center text-xl font-bold text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                                            {subject.name[0]}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{subject.name}</h3>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">Aktif</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => openEdit(subject)}
                                            className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 flex items-center justify-center transition-colors"
                                            title="Edit"
                                        >
                                            <Edit set="bold" primaryColor="currentColor" size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(subject.id)}
                                            className="w-8 h-8 rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500/20 flex items-center justify-center transition-colors"
                                            title="Hapus"
                                        >
                                            <Delete set="bold" primaryColor="currentColor" size={16} />
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
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder-slate-400 transition-all"
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
