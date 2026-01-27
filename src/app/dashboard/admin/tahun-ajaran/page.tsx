'use client'

import { useEffect, useState } from 'react'
import { Modal, Button, EmptyState } from '@/components/ui'
import Card from '@/components/ui/Card'
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
            <div className="flex items-center justify-between bg-white dark:bg-surface-dark p-6 rounded-3xl shadow-soft">
                <div className="flex items-center gap-4">
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => window.history.back()}
                        icon={
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        }
                    />
                    <div>
                        <h1 className="text-2xl font-bold text-text-main dark:text-white leading-tight">Tahun Ajaran</h1>
                        <p className="text-text-secondary dark:text-[#A8BC9F] text-sm">Kelola daftar tahun ajaran sekolah</p>
                    </div>
                </div>
                <Button onClick={openAdd} icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                }>
                    Tambah
                </Button>
            </div>

            <Card className="overflow-hidden p-0">
                {loading ? (
                    <div className="p-12 flex justify-center">
                        <div className="animate-spin text-3xl text-primary">⏳</div>
                    </div>
                ) : years.length === 0 ? (
                    <div className="p-6">
                        <EmptyState
                            icon="📅"
                            title="Belum Ada Tahun Ajaran"
                            description="Tambahkan tahun ajaran untuk memulai"
                            action={<Button onClick={openAdd}>Tambah Tahun Ajaran</Button>}
                        />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-secondary/10 dark:bg-white/5 border-b border-secondary/20">
                                <tr>
                                    <th className="px-6 py-4 text-left text-sm font-bold text-text-main dark:text-white uppercase tracking-wider">Nama</th>
                                    <th className="px-6 py-4 text-left text-sm font-bold text-text-main dark:text-white uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-right text-sm font-bold text-text-main dark:text-white uppercase tracking-wider">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-secondary/20 dark:divide-white/5">
                                {years.map((year) => (
                                    <tr key={year.id} className="hover:bg-secondary/5 transition-colors">
                                        <td className="px-6 py-4 text-text-main dark:text-white font-medium">{year.name}</td>
                                        <td className="px-6 py-4">
                                            {year.is_active ? (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-500/10 text-green-600 dark:text-green-400 rounded-full text-xs font-bold border border-green-500/20">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                                                    Aktif
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-3 py-1 bg-secondary/10 text-text-secondary rounded-full text-xs font-medium">
                                                    Tidak Aktif
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => openEdit(year)}
                                                    className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 flex items-center justify-center transition-colors"
                                                    title="Edit"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(year.id)}
                                                    className="w-8 h-8 rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500/20 flex items-center justify-center transition-colors"
                                                    title="Hapus"
                                                >
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
                    </div>
                )}
            </Card>

            <Modal
                open={showModal}
                onClose={() => setShowModal(false)}
                title={editingYear ? '✏️ Edit Tahun Ajaran' : '➕ Tambah Tahun Ajaran'}
            >
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-text-main dark:text-white mb-2">Nama Tahun Ajaran</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-3 bg-secondary/5 border border-secondary/20 rounded-xl text-text-main dark:text-white focus:outline-none focus:ring-2 focus:ring-primary placeholder-text-secondary/50 transition-all"
                            placeholder="Contoh: 2024/2025"
                            required
                        />
                    </div>
                    <div className="flex items-center gap-3 p-4 border border-secondary/20 rounded-xl bg-secondary/5">
                        <div className="relative flex items-center">
                            <input
                                type="checkbox"
                                id="is_active"
                                checked={formData.is_active}
                                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                className="w-5 h-5 rounded border-secondary text-primary focus:ring-primary/50 cursor-pointer"
                            />
                        </div>
                        <label htmlFor="is_active" className="text-sm font-medium text-text-main dark:text-white cursor-pointer select-none">
                            Set sebagai Tahun Ajaran Aktif
                        </label>
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
