'use client'

import { useEffect, useState } from 'react'
import { Modal, PageHeader, Button, EmptyState } from '@/components/ui'
import { Class } from '@/lib/types'

interface Student {
    id: string
    nis: string | null
    class_id: string | null
    gender: 'L' | 'P' | null
    user: {
        id: string
        username: string
        full_name: string | null
    }
    class: { id: string; name: string } | null
}

export default function SiswaPage() {
    const [students, setStudents] = useState<Student[]>([])
    const [classes, setClasses] = useState<Class[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editingStudent, setEditingStudent] = useState<Student | null>(null)
    const [formData, setFormData] = useState({ username: '', password: '', full_name: '', nis: '', class_id: '', gender: '' })
    const [showPassword, setShowPassword] = useState(false)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    const fetchData = async () => {
        try {
            const [studentsRes, classesRes] = await Promise.all([
                fetch('/api/students'),
                fetch('/api/classes')
            ])
            const [studentsData, classesData] = await Promise.all([
                studentsRes.json(),
                classesRes.json()
            ])
            setStudents(studentsData)
            setClasses(classesData)
        } catch (error) {
            console.error('Error:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchData() }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        setError('')
        try {
            const url = editingStudent ? `/api/students/${editingStudent.id}` : '/api/students'
            const method = editingStudent ? 'PUT' : 'POST'

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    class_id: formData.class_id || null
                })
            })

            const data = await res.json()

            if (!res.ok) {
                setError(data.error || 'Gagal menyimpan')
                return
            }

            setShowModal(false)
            setEditingStudent(null)
            setFormData({ username: '', password: '', full_name: '', nis: '', class_id: '', gender: '' })
            fetchData()
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Yakin ingin menghapus siswa ini?')) return
        await fetch(`/api/students/${id}`, { method: 'DELETE' })
        fetchData()
    }

    const openEdit = (student: Student) => {
        setEditingStudent(student)
        setFormData({
            username: student.user.username,
            password: '',
            full_name: student.user.full_name || '',
            nis: student.nis || '',
            class_id: student.class_id || '',
            gender: student.gender || ''
        })
        setError('')
        setShowModal(true)
    }

    const openAdd = () => {
        setEditingStudent(null)
        setFormData({ username: '', password: '', full_name: '', nis: '', class_id: '', gender: '' })
        setError('')
        setShowModal(true)
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="Akun Siswa"
                subtitle="Kelola akun siswa"
                backHref="/dashboard/admin"
                action={
                    <Button onClick={openAdd} icon={
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                    }>
                        Tambah Siswa
                    </Button>
                }
            />

            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-slate-400">Memuat...</div>
                ) : students.length === 0 ? (
                    <EmptyState
                        icon="👨‍🎓"
                        title="Belum Ada Siswa"
                        description="Tambahkan akun siswa untuk memulai"
                        action={<Button onClick={openAdd}>Tambah Siswa</Button>}
                    />
                ) : (
                    <table className="w-full">
                        <thead className="bg-slate-900/50">
                            <tr>
                                <th className="px-6 py-4 text-left text-sm font-medium text-slate-300">Nama</th>
                                <th className="px-6 py-4 text-left text-sm font-medium text-slate-300">L/P</th>
                                <th className="px-6 py-4 text-left text-sm font-medium text-slate-300">NIS</th>
                                <th className="px-6 py-4 text-left text-sm font-medium text-slate-300">Kelas</th>
                                <th className="px-6 py-4 text-left text-sm font-medium text-slate-300">Username</th>
                                <th className="px-6 py-4 text-right text-sm font-medium text-slate-300">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                            {students.map((student) => (
                                <tr key={student.id} className="hover:bg-slate-800/30">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-rose-500 to-red-500 flex items-center justify-center text-white font-bold">
                                                {student.user.full_name?.[0] || '?'}
                                            </div>
                                            <span className="text-white font-medium">{student.user.full_name || '-'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {student.gender ? (
                                            <span className={`px-2 py-1 text-xs rounded-full ${student.gender === 'L' ? 'bg-blue-500/20 text-blue-400' : 'bg-pink-500/20 text-pink-400'}`}>
                                                {student.gender === 'L' ? '👦 L' : '👧 P'}
                                            </span>
                                        ) : (
                                            <span className="text-slate-500">-</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-slate-300">{student.nis || '-'}</td>
                                    <td className="px-6 py-4">
                                        {student.class ? (
                                            <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm">{student.class.name}</span>
                                        ) : (
                                            <span className="text-slate-500">-</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-slate-300">{student.user.username}</td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button onClick={() => openEdit(student)} className="p-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </button>
                                            <button onClick={() => handleDelete(student.id)} className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors">
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
                title={editingStudent ? 'Edit Siswa' : 'Tambah Siswa'}
            >
                {error && (
                    <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 text-sm">{error}</div>
                )}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Nama Lengkap</label>
                        <input
                            type="text"
                            value={formData.full_name}
                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                            className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">NIS</label>
                            <input
                                type="text"
                                value={formData.nis}
                                onChange={(e) => setFormData({ ...formData, nis: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Kelas</label>
                            <select
                                value={formData.class_id}
                                onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                            >
                                <option value="">Pilih Kelas</option>
                                {classes.map((c) => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Jenis Kelamin</label>
                        <select
                            value={formData.gender}
                            onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                            className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                        >
                            <option value="">Pilih Jenis Kelamin</option>
                            <option value="L">Laki-laki</option>
                            <option value="P">Perempuan</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Username</label>
                        <input
                            type="text"
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Password {editingStudent && '(kosongkan jika tidak diubah)'}
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-rose-500 pr-12"
                                required={!editingStudent}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white"
                            >
                                {showPassword ? (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                )}
                            </button>
                        </div>
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
