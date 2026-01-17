'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Modal, PageHeader, EmptyState } from '@/components/ui'

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
    const [selectedSubject, setSelectedSubject] = useState<SubjectGroup | null>(null)
    const [viewingMaterial, setViewingMaterial] = useState<Material | null>(null)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const studentsRes = await fetch('/api/students')
                const students = await studentsRes.json()
                const myStudent = students.find((s: { user: { id: string } }) => s.user.id === user?.id)

                if (!myStudent?.class_id) {
                    setLoading(false)
                    return
                }

                const materialsRes = await fetch('/api/materials')
                const materialsData = await materialsRes.json()

                const classMaterials = materialsData.filter((m: Material) =>
                    m.teaching_assignment?.class?.name === myStudent.class.name
                )

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
        return <div className="text-center text-slate-400 py-8">Memuat materi...</div>
    }

    // View 1: Subject List (Default)
    if (!selectedSubject) {
        return (
            <div className="space-y-6">
                <PageHeader
                    title="📚 Materi Pembelajaran"
                    subtitle="Pilih mata pelajaran"
                    backHref="/dashboard/siswa"
                />

                {groupedMaterials.length === 0 ? (
                    <EmptyState
                        icon="📚"
                        title="Belum Ada Materi"
                        description="Belum ada materi tersedia untuk kelas Anda"
                    />
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
            <PageHeader
                title={selectedSubject.subjectName}
                subtitle="Daftar Materi"
                backHref="#"
                action={
                    <button
                        onClick={() => setSelectedSubject(null)}
                        className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                    >
                        ← Kembali
                    </button>
                }
            />

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
            <Modal
                open={!!viewingMaterial}
                onClose={() => setViewingMaterial(null)}
                title={viewingMaterial?.title || ''}
                subtitle={viewingMaterial?.teaching_assignment?.subject?.name}
                maxWidth="2xl"
            >
                {viewingMaterial && (
                    <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-800 text-slate-300 leading-relaxed whitespace-pre-wrap">
                        {viewingMaterial.content_text}
                    </div>
                )}
            </Modal>
        </div>
    )
}
