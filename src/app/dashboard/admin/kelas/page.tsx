'use client'

import { useEffect, useState } from 'react'
import { Modal, Button, EmptyState } from '@/components/ui'
import Card from '@/components/ui/Card'
import { Class, AcademicYear } from '@/lib/types'

interface Student {
    id: string
    nisn: string
    user: {
        full_name: string
        email: string
    }
}

export default function KelasPage() {
    const [classes, setClasses] = useState<Class[]>([])
    const [academicYears, setAcademicYears] = useState<AcademicYear[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editingClass, setEditingClass] = useState<Class | null>(null)
    const [formData, setFormData] = useState({ name: '', academic_year_id: '' })
    const [saving, setSaving] = useState(false)

    // Students modal state
    const [showStudentsModal, setShowStudentsModal] = useState(false)
    const [selectedClass, setSelectedClass] = useState<Class | null>(null)
    const [students, setStudents] = useState<Student[]>([])
    const [loadingStudents, setLoadingStudents] = useState(false)

    const fetchData = async () => {
        try {
            const [classesRes, yearsRes] = await Promise.all([
                fetch('/api/classes'),
                fetch('/api/academic-years')
            ])
            const [classesData, yearsData] = await Promise.all([
                classesRes.json(),
                yearsRes.json()
            ])
            setClasses(classesData)
            setAcademicYears(yearsData)
        } catch (error) {
            console.error('Error:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        try {
            const url = editingClass ? `/api/classes/${editingClass.id}` : '/api/classes'
            const method = editingClass ? 'PUT' : 'POST'

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            if (res.ok) {
                setShowModal(false)
                setEditingClass(null)
                setFormData({ name: '', academic_year_id: '' })
                fetchData()
            }
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Yakin ingin menghapus kelas ini?')) return
        await fetch(`/api/classes/${id}`, { method: 'DELETE' })
        fetchData()
    }

    const openEdit = (cls: Class) => {
        setEditingClass(cls)
        setFormData({ name: cls.name, academic_year_id: cls.academic_year_id })
        setShowModal(true)
    }

    const openAdd = () => {
        setEditingClass(null)
        const activeYear = academicYears.find(y => y.is_active)
        setFormData({ name: '', academic_year_id: activeYear?.id || '' })
        setShowModal(true)
    }

    const viewStudents = async (cls: Class) => {
        setSelectedClass(cls)
        setShowStudentsModal(true)
        setLoadingStudents(true)
        try {
            const res = await fetch(`/api/students?class_id=${cls.id}`)
            const data = await res.json()
            setStudents(Array.isArray(data) ? data : [])
        } catch (error) {
            console.error('Error fetching students:', error)
            setStudents([])
        } finally {
            setLoadingStudents(false)
        }
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
                        <h1 className="text-2xl font-bold text-text-main dark:text-white leading-tight">Kelas</h1>
                        <p className="text-text-secondary dark:text-[#A8BC9F] text-sm">Kelola daftar kelas dan siswa</p>
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
                ) : classes.length === 0 ? (
                    <div className="p-6">
                        <EmptyState
                            icon="🏫"
                            title="Belum Ada Kelas"
                            description="Tambahkan kelas untuk memulai"
                            action={<Button onClick={openAdd}>Tambah Kelas</Button>}
                        />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-secondary/10 dark:bg-white/5 border-b border-secondary/20">
                                <tr>
                                    <th className="px-6 py-4 text-left text-sm font-bold text-text-main dark:text-white uppercase tracking-wider">Nama Kelas</th>
                                    <th className="px-6 py-4 text-left text-sm font-bold text-text-main dark:text-white uppercase tracking-wider">Tahun Ajaran</th>
                                    <th className="px-6 py-4 text-right text-sm font-bold text-text-main dark:text-white uppercase tracking-wider">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-secondary/20 dark:divide-white/5">
                                {classes.map((cls) => (
                                    <tr key={cls.id} className="hover:bg-secondary/5 transition-colors">
                                        <td className="px-6 py-4 text-text-main dark:text-white font-medium">{cls.name}</td>
                                        <td className="px-6 py-4 text-text-secondary dark:text-zinc-400">{cls.academic_year?.name || '-'}</td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => viewStudents(cls)}
                                                    className="w-8 h-8 rounded-lg bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-500/20 flex items-center justify-center transition-colors"
                                                    title="Lihat Siswa"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => openEdit(cls)}
                                                    className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 flex items-center justify-center transition-colors"
                                                    title="Edit"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(cls.id)}
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

            {/* Add/Edit Class Modal */}
            <Modal
                open={showModal}
                onClose={() => setShowModal(false)}
                title={editingClass ? '✏️ Edit Kelas' : '➕ Tambah Kelas'}
            >
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-text-main dark:text-white mb-2">Nama Kelas</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-3 bg-secondary/5 border border-secondary/20 rounded-xl text-text-main dark:text-white focus:outline-none focus:ring-2 focus:ring-primary placeholder-text-secondary/50"
                            placeholder="Contoh: X IPA 1"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-text-main dark:text-white mb-2">Tahun Ajaran</label>
                        <div className="relative">
                            <select
                                value={formData.academic_year_id}
                                onChange={(e) => setFormData({ ...formData, academic_year_id: e.target.value })}
                                className="w-full px-4 py-3 bg-secondary/5 border border-secondary/20 rounded-xl text-text-main dark:text-white focus:outline-none focus:ring-2 focus:ring-primary appearance-none"
                                required
                            >
                                <option value="">Pilih Tahun Ajaran</option>
                                {academicYears.map((year) => (
                                    <option key={year.id} value={year.id}>{year.name} {year.is_active && '(Aktif)'}</option>
                                ))}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-text-secondary">
                                ▼
                            </div>
                        </div>
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

            {/* Students List Modal */}
            <Modal
                open={showStudentsModal}
                onClose={() => setShowStudentsModal(false)}
                title={`Students in ${selectedClass?.name || 'Class'}`}
                maxWidth="lg"
            >
                <div className="max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                    {loadingStudents ? (
                        <div className="py-12 flex justify-center">
                            <div className="animate-spin text-2xl text-primary">⏳</div>
                        </div>
                    ) : students.length === 0 ? (
                        <EmptyState
                            icon="👨‍🎓"
                            title="Belum ada siswa"
                            description="Kelas ini belum memiliki siswa terdaftar."
                        />
                    ) : (
                        <div className="space-y-3">
                            <div className="flex justify-between items-center mb-4 sticky top-0 bg-white dark:bg-surface-dark pb-2 z-10 border-b border-secondary/10">
                                <h3 className="font-bold text-text-main dark:text-white">Daftar Siswa</h3>
                                <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold">{students.length} Siswa</span>
                            </div>

                            {students.map((student, idx) => (
                                <div key={student.id} className="flex items-center gap-4 p-4 bg-secondary/5 rounded-2xl hover:bg-secondary/10 transition-colors border border-transparent hover:border-secondary/20">
                                    <div className="w-10 h-10 rounded-full bg-white dark:bg-white/10 flex items-center justify-center font-bold text-primary shadow-sm">
                                        {idx + 1}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold text-text-main dark:text-white">{student.user?.full_name || 'Tanpa Nama'}</p>
                                        <p className="text-sm text-text-secondary dark:text-[#A8BC9F]">NISN: {student.nisn}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xs text-text-secondary px-2 py-1 bg-white dark:bg-black/20 rounded-md">
                                            ID: {student.id.substring(0, 6)}...
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div className="pt-6 border-t border-secondary/10 mt-2">
                    <Button variant="secondary" onClick={() => setShowStudentsModal(false)} className="w-full">
                        Tutup
                    </Button>
                </div>
            </Modal>
        </div>
    )
}
