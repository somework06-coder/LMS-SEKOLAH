'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AcademicYear, Class, Subject } from '@/lib/types'

interface Teacher {
    id: string
    nip: string | null
    user: { id: string; username: string; full_name: string | null }
}

interface TeachingAssignment {
    id: string
    teacher: Teacher
    subject: Subject
    class: Class
    academic_year: AcademicYear
}

export default function PenugasanPage() {
    const [assignments, setAssignments] = useState<TeachingAssignment[]>([])
    const [teachers, setTeachers] = useState<Teacher[]>([])
    const [subjects, setSubjects] = useState<Subject[]>([])
    const [classes, setClasses] = useState<Class[]>([])
    const [academicYears, setAcademicYears] = useState<AcademicYear[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [formData, setFormData] = useState({ teacher_id: '', subject_id: '', class_id: '', academic_year_id: '' })
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    const fetchData = async () => {
        try {
            const [assignmentsRes, teachersRes, subjectsRes, classesRes, yearsRes] = await Promise.all([
                fetch('/api/teaching-assignments'),
                fetch('/api/teachers'),
                fetch('/api/subjects'),
                fetch('/api/classes'),
                fetch('/api/academic-years')
            ])
            const [assignmentsData, teachersData, subjectsData, classesData, yearsData] = await Promise.all([
                assignmentsRes.json(),
                teachersRes.json(),
                subjectsRes.json(),
                classesRes.json(),
                yearsRes.json()
            ])
            setAssignments(assignmentsData)
            setTeachers(teachersData)
            setSubjects(subjectsData)
            setClasses(classesData)
            setAcademicYears(yearsData)
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
            const res = await fetch('/api/teaching-assignments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            const data = await res.json()

            if (!res.ok) {
                setError(data.error || 'Gagal menyimpan')
                return
            }

            setShowModal(false)
            setFormData({ teacher_id: '', subject_id: '', class_id: '', academic_year_id: '' })
            fetchData()
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Yakin ingin menghapus penugasan ini?')) return
        await fetch(`/api/teaching-assignments/${id}`, { method: 'DELETE' })
        fetchData()
    }

    const openAdd = () => {
        const activeYear = academicYears.find(y => y.is_active)
        setFormData({ teacher_id: '', subject_id: '', class_id: '', academic_year_id: activeYear?.id || '' })
        setError('')
        setShowModal(true)
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/admin" className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Penugasan Mengajar</h1>
                        <p className="text-slate-400">Assign guru ke kelas & mata pelajaran</p>
                    </div>
                </div>
                <button
                    onClick={openAdd}
                    className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Tambah Penugasan
                </button>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-slate-400">Memuat...</div>
                ) : assignments.length === 0 ? (
                    <div className="p-8 text-center text-slate-400">Belum ada penugasan</div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-slate-900/50">
                            <tr>
                                <th className="px-6 py-4 text-left text-sm font-medium text-slate-300">Guru</th>
                                <th className="px-6 py-4 text-left text-sm font-medium text-slate-300">Mata Pelajaran</th>
                                <th className="px-6 py-4 text-left text-sm font-medium text-slate-300">Kelas</th>
                                <th className="px-6 py-4 text-left text-sm font-medium text-slate-300">Tahun Ajaran</th>
                                <th className="px-6 py-4 text-right text-sm font-medium text-slate-300">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                            {assignments.map((assignment) => (
                                <tr key={assignment.id} className="hover:bg-slate-800/30">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 flex items-center justify-center text-white text-sm font-bold">
                                                {assignment.teacher?.user?.full_name?.[0] || '?'}
                                            </div>
                                            <span className="text-white">{assignment.teacher?.user?.full_name || '-'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm">{assignment.subject?.name}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm">{assignment.class?.name}</span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-300">{assignment.academic_year?.name}</td>
                                    <td className="px-6 py-4 text-right">
                                        <button onClick={() => handleDelete(assignment.id)} className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold text-white mb-4">Tambah Penugasan</h2>
                        {error && (
                            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 text-sm">{error}</div>
                        )}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Guru</label>
                                <select
                                    value={formData.teacher_id}
                                    onChange={(e) => setFormData({ ...formData, teacher_id: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    required
                                >
                                    <option value="">Pilih Guru</option>
                                    {teachers.map((t) => (
                                        <option key={t.id} value={t.id}>{t.user.full_name || t.user.username}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Mata Pelajaran</label>
                                <select
                                    value={formData.subject_id}
                                    onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    required
                                >
                                    <option value="">Pilih Mata Pelajaran</option>
                                    {subjects.map((s) => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Kelas</label>
                                <select
                                    value={formData.class_id}
                                    onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    required
                                >
                                    <option value="">Pilih Kelas</option>
                                    {classes.map((c) => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Tahun Ajaran</label>
                                <select
                                    value={formData.academic_year_id}
                                    onChange={(e) => setFormData({ ...formData, academic_year_id: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    required
                                >
                                    <option value="">Pilih Tahun Ajaran</option>
                                    {academicYears.map((y) => (
                                        <option key={y.id} value={y.id}>{y.name} {y.is_active && '(Aktif)'}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-3 bg-slate-700 text-white rounded-xl hover:bg-slate-600 transition-colors">Batal</button>
                                <button type="submit" disabled={saving} className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
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
