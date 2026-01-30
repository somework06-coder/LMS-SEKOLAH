'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Modal, Button, PageHeader, EmptyState } from '@/components/ui'
import Card from '@/components/ui/Card'
import { ClipboardList, UserPlus, Loader2, BookOpen, GraduationCap, User, Trash2, ArrowLeft, AlertCircle } from 'lucide-react'
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
            <PageHeader
                title="Penugasan Mengajar"
                subtitle="Assign guru ke kelas dan mata pelajaran"
                backHref="/dashboard/admin"
                icon={<BookOpen className="w-6 h-6 text-teal-500" />}
                action={
                    <Button onClick={openAdd} icon={<UserPlus className="w-4 h-4" />}>
                        Tambah Penugasan
                    </Button>
                }
            />

            <Card className="overflow-hidden p-0">
                {loading ? (
                    <div className="p-12 flex justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : assignments.length === 0 ? (
                    <div className="p-6">
                        <EmptyState
                            icon={<ClipboardList className="w-12 h-12 text-teal-200" />}
                            title="Belum Ada Penugasan"
                            description="Assign guru ke kelas dan mata pelajaran"
                            action={<Button onClick={openAdd}>Tambah Penugasan</Button>}
                        />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-secondary/10 dark:bg-white/5 border-b border-secondary/20">
                                <tr>
                                    <th className="px-6 py-4 text-left text-sm font-bold text-text-main dark:text-white uppercase tracking-wider">Guru</th>
                                    <th className="px-6 py-4 text-left text-sm font-bold text-text-main dark:text-white uppercase tracking-wider">Mapel</th>
                                    <th className="px-6 py-4 text-left text-sm font-bold text-text-main dark:text-white uppercase tracking-wider">Kelas</th>
                                    <th className="px-6 py-4 text-left text-sm font-bold text-text-main dark:text-white uppercase tracking-wider">Tahun Ajaran</th>
                                    <th className="px-6 py-4 text-right text-sm font-bold text-text-main dark:text-white uppercase tracking-wider">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-secondary/20 dark:divide-white/5">
                                {assignments.map((assignment) => (
                                    <tr key={assignment.id} className="hover:bg-secondary/5 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 flex items-center justify-center text-white text-sm font-bold shadow-sm">
                                                    {assignment.teacher?.user?.full_name?.[0] || <User className="w-4 h-4" />}
                                                </div>
                                                <span className="text-text-main dark:text-white font-bold">{assignment.teacher?.user?.full_name || '-'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-3 py-1 bg-green-500/10 text-green-600 dark:text-green-400 rounded-full text-xs font-bold border border-green-500/20">
                                                {assignment.subject?.name}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-3 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full text-xs font-bold border border-blue-500/20">
                                                {assignment.class?.name}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-text-secondary dark:text-zinc-300">{assignment.academic_year?.name}</td>
                                        <td className="px-6 py-4 text-right">
                                            <button onClick={() => handleDelete(assignment.id)} className="w-8 h-8 rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500/20 flex items-center justify-center transition-colors">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
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
                title="➕ Tambah Penugasan"
            >
                {error && (
                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-600 text-sm font-medium flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        {error}
                    </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-text-main dark:text-white mb-2">Guru</label>
                        <div className="relative">
                            <select
                                value={formData.teacher_id}
                                onChange={(e) => setFormData({ ...formData, teacher_id: e.target.value })}
                                className="w-full px-4 py-3 bg-secondary/5 border border-secondary/20 rounded-xl text-text-main dark:text-white focus:outline-none focus:ring-2 focus:ring-primary appearance-none"
                                required
                            >
                                <option value="">Pilih Guru</option>
                                {teachers.map((t) => (
                                    <option key={t.id} value={t.id}>{t.user.full_name || t.user.username}</option>
                                ))}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-text-secondary">▼</div>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-text-main dark:text-white mb-2">Mata Pelajaran</label>
                        <div className="relative">
                            <select
                                value={formData.subject_id}
                                onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
                                className="w-full px-4 py-3 bg-secondary/5 border border-secondary/20 rounded-xl text-text-main dark:text-white focus:outline-none focus:ring-2 focus:ring-primary appearance-none"
                                required
                            >
                                <option value="">Pilih Mata Pelajaran</option>
                                {subjects.map((s) => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-text-secondary">▼</div>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-text-main dark:text-white mb-2">Kelas</label>
                        <div className="relative">
                            <select
                                value={formData.class_id}
                                onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
                                className="w-full px-4 py-3 bg-secondary/5 border border-secondary/20 rounded-xl text-text-main dark:text-white focus:outline-none focus:ring-2 focus:ring-primary appearance-none"
                                required
                            >
                                <option value="">Pilih Kelas</option>
                                {classes.map((c) => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-text-secondary">▼</div>
                        </div>
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
                                {academicYears.map((y) => (
                                    <option key={y.id} value={y.id}>{y.name} {y.is_active && '(Aktif)'}</option>
                                ))}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-text-secondary">▼</div>
                        </div>
                    </div>
                    <div className="flex gap-3 pt-4 border-t border-secondary/10 mt-4">
                        <Button type="button" variant="secondary" onClick={() => setShowModal(false)} className="flex-1">
                            Batal
                        </Button>
                        <Button type="submit" loading={saving} className="flex-1">
                            Simpan Penugasan
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    )
}
