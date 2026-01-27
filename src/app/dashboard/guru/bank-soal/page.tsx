'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { Modal, Button, EmptyState, PageHeader } from '@/components/ui'

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
        if (user) fetchData()
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
                return 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-200'
            case 'MEDIUM':
                return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200'
            case 'HARD':
                return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-200'
            default:
                return 'bg-secondary/10 text-text-secondary border-secondary/20'
        }
    }

    const getDifficultyLabel = (difficulty: string) => {
        switch (difficulty) {
            case 'EASY': return 'Mudah'
            case 'MEDIUM': return 'Sedang'
            case 'HARD': return 'Sulit'
            default: return difficulty
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
        if (selectedIds.size === filteredQuestions.length && filteredQuestions.length > 0) {
            setSelectedIds(new Set())
        } else {
            setSelectedIds(new Set(filteredQuestions.map(q => q.id)))
        }
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="🗃️ Bank Soal"
                subtitle="Kelola dan reuse soal-soal Anda"
                backHref="/dashboard/guru"
                action={
                    <div className="flex items-center gap-3">
                        <div className="text-right hidden sm:block">
                            <p className="text-xl font-bold text-primary">{questions.length}</p>
                            <p className="text-xs text-text-secondary">Total Soal</p>
                        </div>
                        <Button
                            onClick={() => setShowExportConfirm(true)}
                            disabled={selectedIds.size === 0}
                            className="disabled:opacity-50 disabled:cursor-not-allowed"
                            icon={
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                            }
                        >
                            Export ({selectedIds.size})
                        </Button>
                    </div>
                }
            />

            {/* Filters & Select All */}
            <div className="flex flex-col sm:flex-row gap-4 items-center bg-white dark:bg-surface-dark p-4 rounded-2xl shadow-sm border border-secondary/10">
                <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className="w-full sm:w-auto px-4 py-2.5 bg-secondary/5 border border-secondary/20 rounded-xl text-text-main dark:text-white focus:outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer hover:bg-secondary/10 transition-colors"
                >
                    <option value="">Semua Mata Pelajaran</option>
                    {subjects.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                </select>
                <select
                    value={selectedDifficulty}
                    onChange={(e) => setSelectedDifficulty(e.target.value)}
                    className="w-full sm:w-auto px-4 py-2.5 bg-secondary/5 border border-secondary/20 rounded-xl text-text-main dark:text-white focus:outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer hover:bg-secondary/10 transition-colors"
                >
                    <option value="">Semua Kesulitan</option>
                    <option value="EASY">Mudah</option>
                    <option value="MEDIUM">Sedang</option>
                    <option value="HARD">Sulit</option>
                </select>
                {filteredQuestions.length > 0 && (
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={toggleSelectAll}
                        className="w-full sm:w-auto"
                    >
                        {selectedIds.size === filteredQuestions.length && filteredQuestions.length > 0 ? 'Batal Pilih Semua' : 'Pilih Semua'}
                    </Button>
                )}
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin text-3xl text-primary">⏳</div>
                </div>
            ) : filteredQuestions.length === 0 ? (
                <EmptyState
                    icon="🗃️"
                    title="Bank Soal Kosong"
                    description="Simpan soal ke bank soal saat membuat kuis dengan OCR atau AI Generate."
                    action={
                        <Link href="/dashboard/guru/kuis">
                            <Button>Buat Kuis dengan AI</Button>
                        </Link>
                    }
                />
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {filteredQuestions.map((q, idx) => (
                        <label
                            key={q.id}
                            className={`block bg-white dark:bg-surface-dark border rounded-2xl p-5 cursor-pointer transition-all hover:shadow-md ${selectedIds.has(q.id)
                                ? 'border-primary bg-primary/5 dark:bg-primary/10'
                                : 'border-transparent hover:border-primary/30'
                                }`}
                        >
                            <div className="flex items-start gap-4">
                                <div className="pt-1">
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
                                        className="w-5 h-5 rounded-md border-secondary/30 text-primary focus:ring-primary bg-secondary/10"
                                    />
                                </div>
                                <div className="w-8 h-8 rounded-lg bg-secondary/10 text-primary flex items-center justify-center font-bold text-sm flex-shrink-0">
                                    {idx + 1}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                                        <span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${q.question_type === 'MULTIPLE_CHOICE' ? 'bg-blue-500/10 text-blue-600 border-blue-200 dark:text-blue-400' : 'bg-orange-500/10 text-orange-600 border-orange-200 dark:text-orange-400'}`}>
                                            {q.question_type === 'MULTIPLE_CHOICE' ? 'Pilihan Ganda' : 'Essay'}
                                        </span>
                                        <span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${getDifficultyBadge(q.difficulty)}`}>
                                            {getDifficultyLabel(q.difficulty)}
                                        </span>
                                        {q.subject && (
                                            <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-secondary/10 text-text-secondary border border-secondary/20">
                                                {q.subject.name}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-text-main dark:text-white mb-4 text-lg font-medium leading-relaxed">{q.question_text}</p>
                                    {q.question_type === 'MULTIPLE_CHOICE' && q.options && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                            {q.options.map((opt, optIdx) => (
                                                <div key={optIdx} className={`px-4 py-3 rounded-xl border flex items-center gap-3 ${q.correct_answer === String.fromCharCode(65 + optIdx) ? 'bg-green-500/5 border-green-200 text-green-700 dark:text-green-400 dark:border-green-500/20' : 'bg-secondary/5 border-transparent text-text-secondary'}`}>
                                                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${q.correct_answer === String.fromCharCode(65 + optIdx) ? 'bg-green-500 text-white' : 'bg-secondary/20 text-text-secondary'}`}>
                                                        {String.fromCharCode(65 + optIdx)}
                                                    </span>
                                                    {opt}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={(e: any) => { e.preventDefault(); handleDelete(q.id) }}
                                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </Button>
                            </div>
                        </label>
                    ))}
                </div>
            )}

            {/* Export Confirmation Modal */}
            <Modal
                open={showExportConfirm}
                onClose={() => setShowExportConfirm(false)}
                title="Export ke Word"
                maxWidth="sm"
            >
                <div className="text-center py-4">
                    <div className="w-20 h-20 bg-blue-500/10 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold text-text-main dark:text-white mb-2">Konfirmasi Export</h3>
                    <p className="text-text-secondary mb-8">
                        Kamu akan mengexport <span className="text-primary font-bold">{selectedIds.size} soal</span> terpilih ke dalam format Microsoft Word (.doc).
                    </p>
                    <div className="flex gap-3">
                        <Button variant="secondary" onClick={() => setShowExportConfirm(false)} className="flex-1">
                            Batal
                        </Button>
                        <Button onClick={handleExport} className="flex-1">
                            Ya, Export Sekarang
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}
