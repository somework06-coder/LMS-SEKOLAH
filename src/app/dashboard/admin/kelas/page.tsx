'use client'

import { useEffect, useState } from 'react'
import { Modal, PageHeader, Button, EmptyState } from '@/components/ui'
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
            <PageHeader
                title="Kelas"
                subtitle="Kelola daftar kelas"
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
                ) : classes.length === 0 ? (
                    <EmptyState
                        icon="🏫"
                        title="Belum Ada Kelas"
                        description="Tambahkan kelas untuk memulai"
                        action={<Button onClick={openAdd}>Tambah Kelas</Button>}
                    />
                ) : (
                    <table className="w-full">
                        <thead className="bg-slate-900/50">
                            <tr>
                                <th className="px-6 py-4 text-left text-sm font-medium text-slate-300">Nama Kelas</th>
                                <th className="px-6 py-4 text-left text-sm font-medium text-slate-300">Tahun Ajaran</th>
                                <th className="px-6 py-4 text-right text-sm font-medium text-slate-300">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                            {classes.map((cls) => (
                                <tr key={cls.id} className="hover:bg-slate-800/30">
                                    <td className="px-6 py-4 text-white font-medium">{cls.name}</td>
                                    <td className="px-6 py-4 text-slate-300">{cls.academic_year?.name || '-'}</td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => viewStudents(cls)}
                                                className="p-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"
                                                title="Lihat Siswa"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                                </svg>
                                            </button>
                                            <button onClick={() => openEdit(cls)} className="p-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </button>
                                            <button onClick={() => handleDelete(cls.id)} className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors">
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

            {/* Add/Edit Class Modal */}
            <Modal
                open={showModal}
                onClose={() => setShowModal(false)}
                title={editingClass ? 'Edit Kelas' : 'Tambah Kelas'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Nama Kelas</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Contoh: X IPA 1"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Tahun Ajaran</label>
                        <select
                            value={formData.academic_year_id}
                            onChange={(e) => setFormData({ ...formData, academic_year_id: e.target.value })}
                            className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        >
                            <option value="">Pilih Tahun Ajaran</option>
                            {academicYears.map((year) => (
                                <option key={year.id} value={year.id}>{year.name} {year.is_active && '(Aktif)'}</option>
                            ))}
                        </select>
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

            {/* Students List Modal */}
            <Modal
                open={showStudentsModal}
                onClose={() => setShowStudentsModal(false)}
                title={`👨‍🎓 Siswa Kelas ${selectedClass?.name || ''}`}
            >
                <div className="max-h-96 overflow-y-auto">
                    {loadingStudents ? (
                        <div className="text-center text-slate-400 py-8">Memuat...</div>
                    ) : students.length === 0 ? (
                        <div className="text-center text-slate-400 py-8">
                            <p className="text-4xl mb-2">📭</p>
                            <p>Belum ada siswa di kelas ini</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <p className="text-sm text-slate-400 mb-3">Total: {students.length} siswa</p>
                            {students.map((student, idx) => (
                                <div key={student.id} className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-xl">
                                    <div className="w-8 h-8 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-sm">
                                        {idx + 1}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-white font-medium">{student.user?.full_name || '-'}</p>
                                        <p className="text-xs text-slate-400">NISN: {student.nisn}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div className="pt-4">
                    <Button variant="secondary" onClick={() => setShowStudentsModal(false)} className="w-full">
                        Tutup
                    </Button>
                </div>
            </Modal>
        </div>
    )
}

