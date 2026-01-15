'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'

interface Material {
    id: string
    title: string
    description: string | null
    type: string
    content_url: string | null
    content_text: string | null
    created_at: string
    teaching_assignment: {
        subject: { name: string }
        class: { name: string }
    }
}

interface SubjectGroup {
    subjectName: string
    materials: Material[]
}

export default function SiswaMateriPage() {
    const { user } = useAuth()
    const [groupedMaterials, setGroupedMaterials] = useState<SubjectGroup[]>([])
    const [loading, setLoading] = useState(true)

    // UI State
    const [selectedSubject, setSelectedSubject] = useState<SubjectGroup | null>(null)
    const [viewingMaterial, setViewingMaterial] = useState<Material | null>(null)

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Get student class
                const studentsRes = await fetch('/api/students')
                const students = await studentsRes.json()
                const myStudent = students.find((s: { user: { id: string } }) => s.user.id === user?.id)

                if (!myStudent?.class_id) {
                    setLoading(false)
                    return
                }

                // Get materials for student's class
                const materialsRes = await fetch('/api/materials')
                const materialsData = await materialsRes.json()

                // Filter by class
                const classMaterials = materialsData.filter((m: Material) =>
                    m.teaching_assignment?.class?.name === myStudent.class.name
                )

                // Group by Subject
                const groups: Record<string, Material[]> = {}
                classMaterials.forEach((m: Material) => {
                    const subjectName = m.teaching_assignment?.subject?.name || 'Lainnya'
                    if (!groups[subjectName]) {
                        groups[subjectName] = []
                    }
                    groups[subjectName].push(m)
                })

                const groupList = Object.entries(groups).map(([subjectName, materials]) => ({
                    subjectName,
                    materials
                }))

                setGroupedMaterials(groupList)
            } catch (error) {
                console.error('Error:', error)
            } finally {
                setLoading(false)
            }
        }
        if (user) fetchData()
    }, [user])

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'PDF': return '📄'
            case 'VIDEO': return '🎬'
            case 'TEXT': return '📝'
            case 'LINK': return '🔗'
            default: return '📚'
        }
    }

    if (loading) {
        return <div className="text-center text-slate-400 py-8">Memuat mater...</div>
    }

    // View 1: Subject List (Default)
    if (!selectedSubject) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/siswa" className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Materi Pembelajaran</h1>
                        <p className="text-slate-400">Pilih mata pelajaran</p>
                    </div>
                </div>

                {groupedMaterials.length === 0 ? (
                    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-8 text-center text-slate-400">
                        Belum ada materi tersedia untuk kelas Anda.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {groupedMaterials.map((group) => (
                            <button
                                key={group.subjectName}
                                onClick={() => setSelectedSubject(group)}
                                className="group bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 hover:border-cyan-500/50 hover:bg-slate-800 transition-all text-left"
                            >
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white mb-4 shadow-lg shadow-cyan-500/20 group-hover:scale-110 transition-transform">
                                    <span className="text-2xl">📚</span>
                                </div>
                                <h3 className="text-lg font-bold text-white mb-1 group-hover:text-cyan-400 transition-colors">
                                    {group.subjectName}
                                </h3>
                                <p className="text-sm text-slate-400">
                                    {group.materials.length} Materi Tersedia
                                </p>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        )
    }

    // View 2: Material List for Selected Subject
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => setSelectedSubject(null)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-white">{selectedSubject.subjectName}</h1>
                    <p className="text-slate-400">Daftar Materi</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedSubject.materials.map((material) => (
                    <div key={material.id} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 hover:border-blue-500/50 transition-all">
                        <div className="flex items-start gap-3">
                            <span className="text-2xl">{getTypeIcon(material.type)}</span>
                            <div className="flex-1">
                                <h3 className="font-semibold text-white">{material.title}</h3>
                                <p className="text-sm text-slate-400 mb-2">{material.description || '-'}</p>

                                {material.type === 'TEXT' ? (
                                    <button
                                        onClick={() => setViewingMaterial(material)}
                                        className="inline-flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors font-medium"
                                    >
                                        Baca Materi →
                                    </button>
                                ) : material.type === 'PDF' && material.content_url ? (
                                    <a
                                        href={material.content_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 text-sm text-red-400 hover:text-red-300 transition-colors font-medium"
                                    >
                                        Buka PDF →
                                    </a>
                                ) : material.content_url ? (
                                    <a
                                        href={material.content_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors font-medium"
                                    >
                                        Buka Link →
                                    </a>
                                ) : null}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Material Viewer Modal (Text) */}
            {viewingMaterial && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-3xl max-h-[85vh] overflow-y-auto shadow-2xl">
                        <div className="flex items-start justify-between mb-6 border-b border-slate-800 pb-4">
                            <div>
                                <h2 className="text-xl font-bold text-white">{viewingMaterial.title}</h2>
                                <p className="text-sm text-slate-400 mt-1">{viewingMaterial.teaching_assignment.subject.name}</p>
                            </div>
                            <button onClick={() => setViewingMaterial(null)} className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="prose prose-invert max-w-none">
                            <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-800 text-slate-300 leading-relaxed whitespace-pre-wrap">
                                {viewingMaterial.content_text}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
