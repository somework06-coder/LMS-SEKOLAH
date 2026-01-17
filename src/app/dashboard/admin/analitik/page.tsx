'use client'

import { useEffect, useState } from 'react'
import { PageHeader, EmptyState, Modal } from '@/components/ui'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface AcademicYear {
    id: string
    name: string
    is_active: boolean
}

interface StudentGrade {
    student_id: string
    student_name: string
    student_nis: string
    average: number | null
    grade_count: number
}

interface SubjectAnalytics {
    subject_id: string
    subject_name: string
    average: number | null
    student_count: number
    pass_count: number
    fail_count: number
    students: StudentGrade[]
}

interface ClassAnalytics {
    class_id: string
    class_name: string
    total_students: number
    subjects: SubjectAnalytics[]
}

export default function AnalitikPage() {
    const [academicYears, setAcademicYears] = useState<AcademicYear[]>([])
    const [selectedYear, setSelectedYear] = useState('')
    const [loading, setLoading] = useState(true)
    const [loadingData, setLoadingData] = useState(false)
    const [classData, setClassData] = useState<ClassAnalytics[]>([])

    // Modal state for student grades
    const [showModal, setShowModal] = useState(false)
    const [selectedClass, setSelectedClass] = useState<ClassAnalytics | null>(null)
    const [selectedSubject, setSelectedSubject] = useState<SubjectAnalytics | null>(null)

    useEffect(() => {
        fetchAcademicYears()
    }, [])

    const fetchAcademicYears = async () => {
        try {
            const res = await fetch('/api/academic-years')
            const data = await res.json()
            const years = Array.isArray(data) ? data : []
            setAcademicYears(years)

            // Auto select active year
            const activeYear = years.find((y: AcademicYear) => y.is_active)
            if (activeYear) {
                setSelectedYear(activeYear.id)
            }
        } catch (error) {
            console.error('Error:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (selectedYear) {
            fetchAnalytics()
        } else {
            setClassData([])
        }
    }, [selectedYear])

    const fetchAnalytics = async () => {
        setLoadingData(true)
        try {
            const res = await fetch(`/api/analytics/class-grades?academic_year_id=${selectedYear}`)
            const data = await res.json()
            setClassData(Array.isArray(data) ? data : [])
        } catch (error) {
            console.error('Error:', error)
            setClassData([])
        } finally {
            setLoadingData(false)
        }
    }

    const handleSubjectClick = (cls: ClassAnalytics, subject: SubjectAnalytics) => {
        setSelectedClass(cls)
        setSelectedSubject(subject)
        setShowModal(true)
    }

    const getScoreColor = (score: number | null) => {
        if (score === null) return 'text-slate-500'
        if (score >= 80) return 'text-green-400'
        if (score >= 70) return 'text-amber-400'
        if (score >= 60) return 'text-orange-400'
        return 'text-red-400'
    }

    const getBarColor = (score: number) => {
        if (score >= 80) return '#4ade80'
        if (score >= 70) return '#fbbf24'
        if (score >= 60) return '#fb923c'
        return '#f87171'
    }

    const getScoreBgColor = (score: number | null) => {
        if (score === null) return 'bg-slate-700/50'
        if (score >= 80) return 'bg-green-500/20 border-green-500/30'
        if (score >= 70) return 'bg-amber-500/20 border-amber-500/30'
        if (score >= 60) return 'bg-orange-500/20 border-orange-500/30'
        return 'bg-red-500/20 border-red-500/30'
    }

    const formatScore = (score: number | null) => {
        if (score === null) return '-'
        return score.toFixed(1)
    }

    // Calculate overall stats
    const overallStats = {
        totalClasses: classData.length,
        totalSubjectsWithGrades: classData.reduce((acc, cls) =>
            acc + cls.subjects.filter(s => s.average !== null).length, 0
        ),
        overallAverage: (() => {
            const allAverages = classData.flatMap(cls =>
                cls.subjects.filter(s => s.average !== null).map(s => s.average as number)
            )
            return allAverages.length > 0
                ? allAverages.reduce((a, b) => a + b, 0) / allAverages.length
                : null
        })()
    }

    // Prepare chart data - Class comparison
    const classChartData = classData.map(cls => {
        const subjectsWithGrades = cls.subjects.filter(s => s.average !== null)
        const classAvg = subjectsWithGrades.length > 0
            ? subjectsWithGrades.reduce((sum, s) => sum + (s.average || 0), 0) / subjectsWithGrades.length
            : 0
        return {
            name: cls.class_name,
            average: Math.round(classAvg * 10) / 10
        }
    }).filter(c => c.average > 0).sort((a, b) => b.average - a.average)

    // Prepare chart data - Subject averages
    const subjectChartData = (() => {
        const subjectMap: Record<string, { name: string; scores: number[] }> = {}
        classData.forEach(cls => {
            cls.subjects.forEach(sub => {
                if (sub.average !== null) {
                    if (!subjectMap[sub.subject_id]) {
                        subjectMap[sub.subject_id] = { name: sub.subject_name, scores: [] }
                    }
                    subjectMap[sub.subject_id].scores.push(sub.average)
                }
            })
        })
        return Object.values(subjectMap).map(sub => ({
            name: sub.name.length > 15 ? sub.name.substring(0, 15) + '...' : sub.name,
            fullName: sub.name,
            average: Math.round((sub.scores.reduce((a, b) => a + b, 0) / sub.scores.length) * 10) / 10
        })).sort((a, b) => b.average - a.average)
    })()

    return (
        <div className="space-y-6">
            <PageHeader
                title="📈 Analitik"
                subtitle="Performa per kelas dan mata pelajaran"
                backHref="/dashboard/admin"
            />

            {/* Filter Tahun Ajaran */}
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
                <div className="flex items-center gap-4">
                    <label className="text-sm font-medium text-slate-300">Tahun Ajaran:</label>
                    <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                        className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        disabled={loading}
                    >
                        <option value="">Pilih Tahun Ajaran</option>
                        {academicYears.map(y => (
                            <option key={y.id} value={y.id}>
                                {y.name} {y.is_active && '(Aktif)'}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="text-center text-slate-400 py-8">Memuat...</div>
            ) : !selectedYear ? (
                <EmptyState
                    icon="📅"
                    title="Pilih Tahun Ajaran"
                    description="Pilih tahun ajaran untuk melihat analitik"
                />
            ) : loadingData ? (
                <div className="text-center text-slate-400 py-8">Memuat data analitik...</div>
            ) : classData.length === 0 ? (
                <EmptyState
                    icon="📊"
                    title="Belum Ada Data"
                    description="Belum ada data kelas untuk tahun ajaran ini"
                />
            ) : (
                <>
                    {/* Overall Stats */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-xl p-4">
                            <p className="text-sm text-slate-400">Total Kelas</p>
                            <p className="text-2xl font-bold text-white">{overallStats.totalClasses}</p>
                        </div>
                        <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-xl p-4">
                            <p className="text-sm text-slate-400">Mapel dengan Nilai</p>
                            <p className="text-2xl font-bold text-white">{overallStats.totalSubjectsWithGrades}</p>
                        </div>
                        <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl p-4">
                            <p className="text-sm text-slate-400">Rata-rata Keseluruhan</p>
                            <p className={`text-2xl font-bold ${getScoreColor(overallStats.overallAverage)}`}>
                                {formatScore(overallStats.overallAverage)}
                            </p>
                        </div>
                    </div>

                    {/* Charts Section */}
                    <div className="grid grid-cols-1 gap-6">
                        {/* Bar Chart - Class Comparison */}
                        {classChartData.length > 0 && (
                            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
                                <h3 className="text-lg font-semibold text-white mb-4">📊 Perbandingan Rata-rata Kelas</h3>
                                <div className="h-64" style={{ minWidth: 0, minHeight: 200, position: 'relative' }}>
                                    <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={200}>
                                        <BarChart data={classChartData} layout="vertical" margin={{ left: 20, right: 30 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                            <XAxis type="number" domain={[0, 100]} stroke="#94a3b8" fontSize={12} />
                                            <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={12} width={80} />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                                                labelStyle={{ color: '#fff' }}
                                                formatter={(value) => [`${value}`, 'Rata-rata']}
                                            />
                                            <Bar dataKey="average" radius={[0, 4, 4, 0]}>
                                                {classChartData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={getBarColor(entry.average)} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        )}

                        {/* Bar Chart - Subject Averages */}
                        {subjectChartData.length > 0 && (
                            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
                                <h3 className="text-lg font-semibold text-white mb-4">📚 Rata-rata per Mata Pelajaran</h3>
                                <div className="h-64" style={{ minWidth: 0, minHeight: 200, position: 'relative' }}>
                                    <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={200}>
                                        <BarChart data={subjectChartData} layout="vertical" margin={{ left: 20, right: 30 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                            <XAxis type="number" domain={[0, 100]} stroke="#94a3b8" fontSize={12} />
                                            <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={11} width={100} />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                                                labelStyle={{ color: '#fff' }}
                                                formatter={(value, _name, props) => [`${value}`, (props?.payload as any)?.fullName || 'Mapel']}
                                            />
                                            <Bar dataKey="average" radius={[0, 4, 4, 0]}>
                                                {subjectChartData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={getBarColor(entry.average)} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Class Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {classData.map(cls => (
                            <div key={cls.class_id} className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
                                {/* Class Header */}
                                <div className="p-4 border-b border-slate-700/50 bg-gradient-to-r from-purple-500/10 to-pink-500/10">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center text-xl">
                                            🏫
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-white">{cls.class_name}</h3>
                                            <p className="text-xs text-slate-400">{cls.total_students} siswa</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Subject Averages */}
                                <div className="p-3 space-y-2 max-h-64 overflow-y-auto">
                                    {cls.subjects.filter(s => s.student_count > 0).length === 0 ? (
                                        <p className="text-sm text-slate-500 text-center py-4">
                                            Belum ada nilai
                                        </p>
                                    ) : (
                                        cls.subjects
                                            .filter(s => s.student_count > 0)
                                            .sort((a, b) => ((b.average || 0) - (a.average || 0)))
                                            .map(subject => (
                                                <button
                                                    key={subject.subject_id}
                                                    onClick={() => handleSubjectClick(cls, subject)}
                                                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border transition-all hover:opacity-80 ${getScoreBgColor(subject.average)}`}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm text-white">{subject.subject_name}</span>
                                                        <span className="text-xs text-slate-500">({subject.student_count})</span>
                                                    </div>
                                                    <span className={`font-bold ${getScoreColor(subject.average)}`}>
                                                        {formatScore(subject.average)}
                                                    </span>
                                                </button>
                                            ))
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Legend */}
                    <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4">
                        <p className="text-sm text-slate-400">
                            <strong className="text-white">Keterangan:</strong> Klik pada mata pelajaran untuk melihat daftar siswa.
                            Warna: <span className="text-green-400">≥80</span> |
                            <span className="text-amber-400"> 70-79</span> |
                            <span className="text-orange-400"> 60-69</span> |
                            <span className="text-red-400"> &lt;60</span>
                        </p>
                    </div>
                </>
            )}

            {/* Student Grades Modal */}
            <Modal
                open={showModal}
                onClose={() => setShowModal(false)}
                title={`📚 ${selectedSubject?.subject_name || ''} - ${selectedClass?.class_name || ''}`}
                maxWidth="lg"
            >
                {selectedSubject && (
                    <div className="space-y-4">
                        {/* Summary */}
                        <div className="grid grid-cols-4 gap-3">
                            <div className="bg-slate-700/50 rounded-lg p-3 text-center">
                                <p className="text-xs text-slate-400">Rata-rata</p>
                                <p className={`text-xl font-bold ${getScoreColor(selectedSubject.average)}`}>
                                    {formatScore(selectedSubject.average)}
                                </p>
                            </div>
                            <div className="bg-slate-700/50 rounded-lg p-3 text-center">
                                <p className="text-xs text-slate-400">Jumlah Siswa</p>
                                <p className="text-xl font-bold text-white">{selectedSubject.student_count}</p>
                            </div>
                            <div className="bg-green-500/20 rounded-lg p-3 text-center">
                                <p className="text-xs text-slate-400">Lulus (≥75)</p>
                                <p className="text-xl font-bold text-green-400">{selectedSubject.pass_count}</p>
                            </div>
                            <div className="bg-red-500/20 rounded-lg p-3 text-center">
                                <p className="text-xs text-slate-400">Tidak Lulus</p>
                                <p className="text-xl font-bold text-red-400">{selectedSubject.fail_count}</p>
                            </div>
                        </div>

                        {/* Student List */}
                        <div className="max-h-80 overflow-y-auto">
                            <table className="w-full">
                                <thead className="bg-slate-700/50 sticky top-0">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-sm font-medium text-slate-300">No</th>
                                        <th className="px-4 py-2 text-left text-sm font-medium text-slate-300">Nama Siswa</th>
                                        <th className="px-4 py-2 text-left text-sm font-medium text-slate-300">NIS</th>
                                        <th className="px-4 py-2 text-center text-sm font-medium text-slate-300">Jumlah Nilai</th>
                                        <th className="px-4 py-2 text-center text-sm font-medium text-slate-300">Rata-rata</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700/50">
                                    {selectedSubject.students
                                        .sort((a, b) => (b.average || 0) - (a.average || 0))
                                        .map((student, idx) => (
                                            <tr key={student.student_id} className="hover:bg-slate-700/30">
                                                <td className="px-4 py-2 text-slate-400">{idx + 1}</td>
                                                <td className="px-4 py-2 text-white">{student.student_name}</td>
                                                <td className="px-4 py-2 text-slate-400">{student.student_nis}</td>
                                                <td className="px-4 py-2 text-center text-slate-400">{student.grade_count}</td>
                                                <td className="px-4 py-2 text-center">
                                                    <span className={`font-bold ${getScoreColor(student.average)}`}>
                                                        {formatScore(student.average)}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    )
}
