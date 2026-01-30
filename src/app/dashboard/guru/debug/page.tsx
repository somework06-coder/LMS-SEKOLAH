'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { BarChart3, UserCheck, AlertTriangle, BookOpen, Database, Bug, User } from 'lucide-react'

export default function DebugDataPage() {
    const { user } = useAuth()
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchDebugData = async () => {
            try {
                const res = await fetch('/api/debug/my-data')
                const result = await res.json()
                setData(result)
            } catch (error) {
                console.error('Error:', error)
            } finally {
                setLoading(false)
            }
        }
        if (user) fetchDebugData()
    }, [user])

    if (loading) return <div className="text-white p-8">Loading...</div>

    return (
        <div className="space-y-6 text-white p-8">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/guru" className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </Link>
                <h1 className="text-2xl font-bold">🔍 Diagnostic Data</h1>
            </div>

            {data?.error ? (
                <div className="bg-red-500/20 border border-red-500 rounded-xl p-4">
                    <p className="text-red-400">Error: {data.error}</p>
                    {data.details && <p className="text-sm text-red-300 mt-2">{data.details}</p>}
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Diagnostics Summary */}
                    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                <BarChart3 className="w-5 h-5 text-green-600 dark:text-green-400" strokeWidth={2} />
                            </div>
                            <h2 className="text-xl font-bold">Status</h2>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className={`p-4 rounded-lg ${data?.diagnostics?.hasTeacherRecord ? 'bg-green-500/20 border border-green-500' : 'bg-red-500/20 border border-red-500'}`}>
                                <p className="text-sm text-slate-400">Teacher Record</p>
                                <p className={`text-2xl font-bold ${data?.diagnostics?.hasTeacherRecord ? 'text-green-400' : 'text-red-400'}`}>
                                    {data?.diagnostics?.hasTeacherRecord ? '✓ Ada' : '✗ Tidak Ada'}
                                </p>
                            </div>
                            <div className={`p-4 rounded-lg ${data?.diagnostics?.hasAssignments ? 'bg-green-500/20 border border-green-500' : 'bg-red-500/20 border border-red-500'}`}>
                                <p className="text-sm text-slate-400">Teaching Assignments</p>
                                <p className={`text-2xl font-bold ${data?.diagnostics?.hasAssignments ? 'text-green-400' : 'text-red-400'}`}>
                                    {data?.teachingAssignments || 0}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* User Info */}
                    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                        <h2 className="text-xl font-bold mb-4">👤 User Info</h2>
                        <pre className="bg-slate-900 p-4 rounded-lg overflow-auto text-sm">
                            {JSON.stringify(data?.user, null, 2)}
                        </pre>
                    </div>

                    {/* Teacher Info */}
                    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                                <UserCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" strokeWidth={2} />
                            </div>
                            <h2 className="text-xl font-bold">Teacher Info</h2>
                        </div>
                        {data?.teacher ? (
                            <pre className="bg-slate-900 p-4 rounded-lg overflow-auto text-sm">
                                {JSON.stringify(data.teacher, null, 2)}
                            </pre>
                        ) : (
                            <div className="bg-red-500/20 border border-red-500 rounded-lg p-4">
                                <div className="flex items-center gap-2">
                                    <AlertTriangle className="w-5 h-5 text-red-400" strokeWidth={2} />
                                    <p className="text-red-400 font-bold">Tidak ada data Teacher untuk user ini!</p>
                                </div>
                                <p className="text-sm text-red-300 mt-2">
                                    Solusi: Login sebagai ADMIN, buka menu "Data Guru", dan pastikan user ini terdaftar sebagai Guru dengan NIP.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Assignments */}
                    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" strokeWidth={2} />
                            </div>
                            <h2 className="text-xl font-bold">Teaching Assignments</h2>
                        </div>
                        {data?.assignments && data.assignments.length > 0 ? (
                            <div className="space-y-2">
                                {data.assignments.map((a: any, idx: number) => (
                                    <div key={idx} className="bg-slate-900 p-3 rounded-lg">
                                        <p className="font-medium">{a.class} - {a.subject}</p>
                                        <p className="text-sm text-slate-400">Tahun Ajaran: {a.academic_year}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-amber-500/20 border border-amber-500 rounded-lg p-4">
                                <div className="flex items-center gap-2">
                                    <AlertTriangle className="w-5 h-5 text-amber-400" strokeWidth={2} />
                                    <p className="text-amber-400 font-bold">Tidak ada Teaching Assignments!</p>
                                </div>
                                <p className="text-sm text-amber-300 mt-2">
                                    Solusi: Login sebagai ADMIN, buka menu "Guru Mapel", dan tambahkan penugasan Kelas + Mata Pelajaran untuk guru ini.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Database Stats */}
                    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-900/30 flex items-center justify-center">
                                <Database className="w-5 h-5 text-slate-600 dark:text-slate-400" strokeWidth={2} />
                            </div>
                            <h2 className="text-xl font-bold">Database Statistics</h2>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-900 p-4 rounded-lg">
                                <p className="text-sm text-slate-400">Total Teachers</p>
                                <p className="text-2xl font-bold">{data?.diagnostics?.totalTeachersInDb || 0}</p>
                            </div>
                            <div className="bg-slate-900 p-4 rounded-lg">
                                <p className="text-sm text-slate-400">Total Assignments</p>
                                <p className="text-2xl font-bold">{data?.diagnostics?.totalAssignmentsInDb || 0}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
