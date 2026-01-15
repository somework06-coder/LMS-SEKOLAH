'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'

interface QuestionBankItem {
    id: string
    question_text: string
    question_type: 'ESSAY' | 'MULTIPLE_CHOICE'
    options: string[] | null
    correct_answer: string | null
    difficulty: 'EASY' | 'MEDIUM' | 'HARD'
    created_at: string
    subject: { id: string; name: string } | null
}

interface Subject {
    id: string
    name: string
}

export default function BankSoalPage() {
    const { user } = useAuth()
    const [questions, setQuestions] = useState<QuestionBankItem[]>([])
    const [subjects, setSubjects] = useState<Subject[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedSubject, setSelectedSubject] = useState('')
    const [selectedDifficulty, setSelectedDifficulty] = useState('')

    // Selection state for export
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [showExportConfirm, setShowExportConfirm] = useState(false)

    useEffect(() => {
        fetchData()
    }, [user])

    const fetchData = async () => {
        try {
            const [questionsRes, subjectsRes] = await Promise.all([
                fetch('/api/question-bank'),
                fetch('/api/subjects')
            ])
            const [questionsData, subjectsData] = await Promise.all([
                questionsRes.json(),
                subjectsRes.json()
            ])
            setQuestions(questionsData)
            setSubjects(subjectsData)
        } catch (error) {
            console.error('Error:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Hapus soal dari bank soal?')) return
        await fetch(`/api/question-bank?id=${id}`, { method: 'DELETE' })
        fetchData()
    }

    const filteredQuestions = questions.filter((q) => {
        if (selectedSubject && q.subject?.id !== selectedSubject) return false
        if (selectedDifficulty && q.difficulty !== selectedDifficulty) return false
        return true
    })

    const getDifficultyBadge = (difficulty: string) => {
        switch (difficulty) {
            case 'EASY':
                return 'bg-green-500/20 text-green-400'
            case 'MEDIUM':
                return 'bg-amber-500/20 text-amber-400'
            case 'HARD':
                return 'bg-red-500/20 text-red-400'
            default:
                return 'bg-slate-500/20 text-slate-400'
        }
    }

    const getDifficultyLabel = (difficulty: string) => {
        switch (difficulty) {
            case 'EASY':
                return 'Mudah'
            case 'MEDIUM':
                return 'Sedang'
            case 'HARD':
                return 'Sulit'
            default:
                return difficulty
        }
    }

    const handleExport = () => {
        const questionsToExport = filteredQuestions.filter(q => selectedIds.has(q.id))

        const htmlContent = `
            <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word'>
            <head><meta charset='utf-8'><title>Bank Soal</title></head>
            <body style="font-family: Arial, sans-serif;">
            <h1 style="text-align:center;">Bank Soal</h1>
            <p style="text-align:center; color:#666;">Total: ${questionsToExport.length} Soal</p>
            <hr/>
            ${questionsToExport.map((q, idx) => `
                <div style="margin-bottom: 24px; page-break-inside: avoid;">
                    <p style="margin-bottom: 8px;"><strong>${idx + 1}. ${q.question_text}</strong></p>
                    ${q.question_type === 'MULTIPLE_CHOICE' && q.options ? `
                        <ul style="list-style:none; padding-left:20px; margin:0;">
                            ${q.options.map((opt, optIdx) => `
                                <li style="margin-bottom: 4px; ${q.correct_answer === String.fromCharCode(65 + optIdx) ? 'font-weight:bold; color:green;' : ''}">
                                    ${String.fromCharCode(65 + optIdx)}. ${opt}
                                </li>
                            `).join('')}
                        </ul>
                    ` : ''}
                </div>
            `).join('')}
            </body>
            </html>
        `
        const blob = new Blob([htmlContent], { type: 'application/msword' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'Bank_Soal.doc'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        setShowExportConfirm(false)
        setSelectedIds(new Set())
    }

    const toggleSelectAll = () => {
        if (selectedIds.size === filteredQuestions.length) {
            setSelectedIds(new Set())
        } else {
            setSelectedIds(new Set(filteredQuestions.map(q => q.id)))
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/guru" className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-white">🗃️ Bank Soal</h1>
                        <p className="text-slate-400">Kelola dan reuse soal-soal Anda</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setShowExportConfirm(true)}
                        disabled={selectedIds.size === 0}
                        className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-xl hover:bg-blue-500/30 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Export ({selectedIds.size})
                    </button>
                    <div className="text-right">
                        <p className="text-2xl font-bold text-indigo-400">{questions.length}</p>
                        <p className="text-xs text-slate-400">Total Soal</p>
                    </div>
                </div>
            </div>

            {/* Filters & Select All */}
            <div className="flex gap-4 items-center">
                <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                    <option value="">Semua Mata Pelajaran</option>
                    {subjects.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                </select>
                <select
                    value={selectedDifficulty}
                    onChange={(e) => setSelectedDifficulty(e.target.value)}
                    className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                    <option value="">Semua Kesulitan</option>
                    <option value="EASY">Mudah</option>
                    <option value="MEDIUM">Sedang</option>
                    <option value="HARD">Sulit</option>
                </select>
                {filteredQuestions.length > 0 && (
                    <button
                        onClick={toggleSelectAll}
                        className="px-4 py-2 bg-slate-700 text-slate-300 rounded-xl hover:bg-slate-600 transition-colors text-sm"
                    >
                        {selectedIds.size === filteredQuestions.length ? 'Batal Pilih Semua' : 'Pilih Semua'}
                    </button>
                )}
            </div>

            {loading ? (
                <div className="text-center text-slate-400 py-8">Memuat...</div>
            ) : filteredQuestions.length === 0 ? (
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-8 text-center">
                    <div className="text-6xl mb-4">🗃️</div>
                    <h3 className="text-xl font-semibold text-white mb-2">Bank Soal Kosong</h3>
                    <p className="text-slate-400 mb-4">
                        Simpan soal ke bank soal saat membuat kuis dengan OCR atau AI Generate.
                    </p>
                    <Link
                        href="/dashboard/guru/kuis"
                        className="inline-block px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
                    >
                        Buat Kuis dengan AI
                    </Link>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredQuestions.map((q, idx) => (
                        <label
                            key={q.id}
                            className={`block bg-slate-800/50 border rounded-xl p-4 cursor-pointer transition-all ${selectedIds.has(q.id)
                                    ? 'border-indigo-500 bg-indigo-500/10'
                                    : 'border-slate-700/50 hover:border-slate-600'
                                }`}
                        >
                            <div className="flex items-start gap-4">
                                <input
                                    type="checkbox"
                                    checked={selectedIds.has(q.id)}
                                    onChange={(e) => {
                                        const newSet = new Set(selectedIds)
                                        if (e.target.checked) {
                                            newSet.add(q.id)
                                        } else {
                                            newSet.delete(q.id)
                                        }
                                        setSelectedIds(newSet)
                                    }}
                                    className="mt-1 w-5 h-5 rounded bg-slate-700 border-slate-600 text-indigo-500 focus:ring-indigo-500"
                                />
                                <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-sm flex-shrink-0">
                                    {idx + 1}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                                        <span className={`px-2 py-0.5 text-xs rounded ${q.question_type === 'MULTIPLE_CHOICE' ? 'bg-blue-500/20 text-blue-400' : 'bg-amber-500/20 text-amber-400'}`}>
                                            {q.question_type === 'MULTIPLE_CHOICE' ? 'Pilihan Ganda' : 'Essay'}
                                        </span>
                                        <span className={`px-2 py-0.5 text-xs rounded ${getDifficultyBadge(q.difficulty)}`}>
                                            {getDifficultyLabel(q.difficulty)}
                                        </span>
                                        {q.subject && (
                                            <span className="px-2 py-0.5 text-xs rounded bg-slate-700 text-slate-300">
                                                {q.subject.name}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-white mb-2">{q.question_text}</p>
                                    {q.question_type === 'MULTIPLE_CHOICE' && q.options && (
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                            {q.options.map((opt, optIdx) => (
                                                <div key={optIdx} className={`px-3 py-1 rounded ${q.correct_answer === String.fromCharCode(65 + optIdx) ? 'bg-green-500/20 text-green-400' : 'bg-slate-700/50 text-slate-300'}`}>
                                                    {String.fromCharCode(65 + optIdx)}. {opt}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={(e) => { e.preventDefault(); handleDelete(q.id) }}
                                    className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </div>
                        </label>
                    ))}
                </div>
            )}

            {/* Export Confirmation Modal */}
            {showExportConfirm && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-sm text-center shadow-xl">
                        <div className="w-16 h-16 bg-blue-500/20 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Export ke Word?</h3>
                        <p className="text-slate-400 mb-6">
                            Kamu akan mengexport <span className="text-white font-bold">{selectedIds.size} soal</span> ke file Word (.doc)
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowExportConfirm(false)}
                                className="flex-1 px-4 py-3 bg-slate-700 text-slate-200 rounded-xl hover:bg-slate-600 transition-colors font-medium"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleExport}
                                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold hover:opacity-90 transition-opacity"
                            >
                                Ya, Export
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
