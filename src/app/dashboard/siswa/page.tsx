'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Card from '@/components/ui/Card'

interface StudentData {
    id: string
    nis: string | null
    class: { id: string; name: string } | null
}

interface Announcement {
    id: string
    title: string
    content: string
    published_at: string
}

export default function SiswaDashboard() {
    const { user } = useAuth()
    const router = useRouter()
    const [student, setStudent] = useState<StudentData | null>(null)
    const [announcements, setAnnouncements] = useState<Announcement[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (user && user.role !== 'SISWA') {
            router.replace('/dashboard')
        }
    }, [user, router])

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch student data first to get class_id
                const studentsRes = await fetch('/api/students')
                const students = await studentsRes.json()
                const myStudent = students.find((s: { user: { id: string } }) => s.user.id === user?.id)
                setStudent(myStudent || null)

                // Fetch announcements for student's class
                if (myStudent?.class?.id) {
                    const announcementsRes = await fetch(`/api/announcements?class_id=${myStudent.class.id}&limit=5`)
                    if (announcementsRes.ok) {
                        const data = await announcementsRes.json()
                        setAnnouncements(Array.isArray(data) ? data : [])
                    }
                }
            } catch (error) {
                console.error('Error:', error)
            } finally {
                setLoading(false)
            }
        }
        if (user) fetchData()
    }, [user])

    const quickLinks = [
        { href: '/dashboard/siswa/materi', icon: '📚', label: 'Materi', sub: 'Bahan belajar' },
        { href: '/dashboard/siswa/tugas', icon: '📝', label: 'Tugas', sub: 'Kerjakan PR' },
        { href: '/dashboard/siswa/ulangan', icon: '⏰', label: 'Ulangan', sub: 'Ujian sekolah' },
        { href: '/dashboard/siswa/kuis', icon: '🧠', label: 'Kuis', sub: 'Latihan soal' },
        { href: '/dashboard/siswa/nilai', icon: '📊', label: 'Nilai', sub: 'Lihat rapor' },
    ]

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        })
    }

    return (
        <div className="space-y-8">
            {/* Welcome */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary to-primary-dark p-8 shadow-xl shadow-primary/20">
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
                <div className="absolute -right-20 -top-20 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>

                <div className="relative">
                    <h1 className="text-3xl font-bold text-white mb-2 leading-tight">
                        Selamat Datang, {user?.full_name || 'Siswa'}! 👋
                    </h1>
                    <p className="text-blue-50/90 text-lg mb-4">
                        Semangat belajar hari ini! Jangan lupa cek tugas terbaru.
                    </p>

                    {!loading && student?.class && (
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-md rounded-full text-white font-medium text-sm">
                            <span className="text-lg">🏫</span>
                            <span>Kelas: {student.class.name}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Actions */}
            <div>
                <h2 className="text-xl font-bold text-text-main dark:text-white mb-6">Menu Belajar</h2>
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    {quickLinks.map((link) => (
                        <Link key={link.href} href={link.href}>
                            <Card className="h-full border-2 border-primary/30 hover:border-primary hover:shadow-lg hover:shadow-primary/10 active:scale-95 transition-all group bg-white dark:bg-surface-dark cursor-pointer">
                                <div className="flex flex-col items-center text-center gap-3">
                                    <div className="w-14 h-14 rounded-2xl bg-secondary/10 flex items-center justify-center text-3xl group-hover:bg-primary group-hover:text-white transition-all duration-300">
                                        {link.icon}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-text-main dark:text-white group-hover:text-primary transition-colors">{link.label}</h3>
                                        <p className="text-xs text-text-secondary dark:text-[#A8BC9F] mt-1">{link.sub}</p>
                                    </div>
                                </div>
                            </Card>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Info Card */}
            {!loading && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center text-2xl text-primary">
                                👤
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-text-main dark:text-white">Informasi Akun</h3>
                                <p className="text-sm text-text-secondary dark:text-[#A8BC9F]">Detail data diri siswa</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-secondary/5 rounded-xl">
                                <span className="text-sm text-text-secondary dark:text-[#A8BC9F]">Nama Lengkap</span>
                                <span className="font-bold text-text-main dark:text-white">{user?.full_name || '-'}</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-secondary/5 rounded-xl">
                                <span className="text-sm text-text-secondary dark:text-[#A8BC9F]">NIS</span>
                                <span className="font-bold text-text-main dark:text-white">{student?.nis || '-'}</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-secondary/5 rounded-xl">
                                <span className="text-sm text-text-secondary dark:text-[#A8BC9F]">Kelas</span>
                                <span className="font-bold text-text-main dark:text-white">{student?.class?.name || 'Belum ada kelas'}</span>
                            </div>
                        </div>
                    </Card>

                    <Card className="bg-gradient-to-br from-secondary/10 to-primary/5 border-none">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-2xl shadow-sm">
                                📢
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-text-main dark:text-white">Pengumuman</h3>
                                <p className="text-sm text-text-secondary dark:text-[#A8BC9F]">Info terbaru dari sekolah</p>
                            </div>
                        </div>

                        {announcements.length === 0 ? (
                            <div className="text-center py-8 text-text-secondary dark:text-[#A8BC9F] italic">
                                Belum ada pengumuman baru untuk saat ini.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {announcements.slice(0, 3).map((announcement) => (
                                    <div key={announcement.id} className="p-3 bg-white/50 dark:bg-surface-dark/50 rounded-xl">
                                        <div className="flex items-start justify-between gap-2">
                                            <h4 className="font-bold text-text-main dark:text-white text-sm line-clamp-1">{announcement.title}</h4>
                                            <span className="text-xs text-text-secondary whitespace-nowrap">{formatDate(announcement.published_at)}</span>
                                        </div>
                                        <p className="text-xs text-text-secondary dark:text-zinc-400 mt-1 line-clamp-2">{announcement.content}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                </div>
            )}
        </div>
    )
}
