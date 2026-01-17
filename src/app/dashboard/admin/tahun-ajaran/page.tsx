'use client'

import { useEffect, useState } from 'react'
import { Modal, PageHeader, Button, EmptyState } from '@/components/ui'
import { AcademicYear } from '@/lib/types'

export default function TahunAjaranPage() {
    const [years, setYears] = useState<AcademicYear[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editingYear, setEditingYear] = useState<AcademicYear | null>(null)
    const [formData, setFormData] = useState({ name: '', is_active: false })
    const [saving, setSaving] = useState(false)

    const fetchYears = async () => {
        try {
            const res = await fetch('/api/academic-years')
            const data = await res.json()
            setYears(data)
        } catch (error) {
            console.error('Error:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchYears()
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        try {
            const url = editingYear ? `/api/academic-years/${editingYear.id}` : '/api/academic-years'
            const method = editingYear ? 'PUT' : 'POST'

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            if (res.ok) {
                setShowModal(false)
                setEditingYear(null)
                setFormData({ name: '', is_active: false })
                fetchYears()
            }
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Yakin ingin menghapus tahun ajaran ini?')) return
        await fetch(`/api/academic-years/${id}`, { method: 'DELETE' })
        fetchYears()
    }

    const openEdit = (year: AcademicYear) => {
        setEditingYear(year)
        setFormData({ name: year.name, is_active: year.is_active })
        setShowModal(true)
    }

    const openAdd = () => {
        setEditingYear(null)
        setFormData({ name: '', is_active: false })
        setShowModal(true)
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="Tahun Ajaran"
                subtitle="Kelola daftar tahun ajaran"
                backHref="/dashboard/admin"
                action={
                    <Button onClick={openAdd} icon={
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                    }>
                        Tambah
                    </Button>
                }
            />

            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-slate-400">Memuat...</div>
                ) : years.length === 0 ? (
                    <EmptyState
                        icon="📅"
                        title="Belum Ada Tahun Ajaran"
                        description="Tambahkan tahun ajaran untuk memulai"
                        action={<Button onClick={openAdd}>Tambah Tahun Ajaran</Button>}
                    />
                ) : (
                    <table className="w-full">
                        <thead className="bg-slate-900/50">
                            <tr>
                                <th className="px-6 py-4 text-left text-sm font-medium text-slate-300">Nama</th>
                                <th className="px-6 py-4 text-left text-sm font-medium text-slate-300">Status</th>
                                <th className="px-6 py-4 text-right text-sm font-medium text-slate-300">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                            {years.map((year) => (
                                <tr key={year.id} className="hover:bg-slate-800/30">
                                    <td className="px-6 py-4 text-white font-medium">{year.name}</td>
                                    <td className="px-6 py-4">
                                        {year.is_active ? (
                                            <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-medium">Aktif</span>
                                        ) : (
                                            <span className="px-3 py-1 bg-slate-600/30 text-slate-400 rounded-full text-sm">Tidak Aktif</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button onClick={() => openEdit(year)} className="p-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </button>
                                            <button onClick={() => handleDelete(year.id)} className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <Modal
                open={showModal}
                onClose={() => setShowModal(false)}
                title={editingYear ? 'Edit Tahun Ajaran' : 'Tambah Tahun Ajaran'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Nama Tahun Ajaran</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder="Contoh: 2024/2025"
                            required
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            id="is_active"
                            checked={formData.is_active}
                            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                            className="w-5 h-5 rounded bg-slate-700 border-slate-600 text-purple-500 focus:ring-purple-500"
                        />
                        <label htmlFor="is_active" className="text-slate-300">Aktifkan tahun ajaran ini</label>
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
