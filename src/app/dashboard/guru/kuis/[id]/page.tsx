'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import QuestionImageUpload from '@/components/QuestionImageUpload'
import { PageHeader, Button, Modal, EmptyState } from '@/components/ui'
import Card from '@/components/ui/Card'

interface QuizQuestion {
    id?: string
    question_text: string
    question_type: 'ESSAY' | 'MULTIPLE_CHOICE'
    options: string[] | null
    correct_answer: string | null
    points: number
    order_index: number
    image_url?: string | null
}

interface Quiz {
    id: string
    title: string
    description: string | null
    is_active: boolean
    teaching_assignment: {
        subject: { id: string; name: string }
        class: { name: string }
    }
    questions: QuizQuestion[]
}

type Mode = 'list' | 'manual' | 'ocr' | 'ai' | 'bank'

export default function EditQuizPage() {
    const params = useParams()
    const quizId = params.id as string

    const [quiz, setQuiz] = useState<Quiz | null>(null)
    const [questions, setQuestions] = useState<QuizQuestion[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [mode, setMode] = useState<Mode>('list')

    // Manual mode state
    const [manualForm, setManualForm] = useState<QuizQuestion>({
        question_text: '',
        question_type: 'MULTIPLE_CHOICE',
        options: ['', '', '', ''],
        correct_answer: '',
        points: 10,
        order_index: 0
    })

    // Calculate total points
    const totalPoints = questions.reduce((sum, q) => sum + (q.points || 0), 0)
    const getDefaultPoints = () => Math.floor(100 / (questions.length + 1))

    // OCR mode state
    const [ocrLoading, setOcrLoading] = useState(false)
    const [ocrResults, setOcrResults] = useState<QuizQuestion[]>([])

    // AI Generate mode state
    const [aiMaterial, setAiMaterial] = useState('')
    const [aiCount, setAiCount] = useState(5)
    const [aiType, setAiType] = useState('MIXED')
    const [aiDifficulty, setAiDifficulty] = useState('MEDIUM')
    const [aiLoading, setAiLoading] = useState(false)
    const [aiResults, setAiResults] = useState<QuizQuestion[]>([])

    // Bank Soal mode state
    const [bankQuestions, setBankQuestions] = useState<any[]>([])
    const [bankLoading, setBankLoading] = useState(false)
    const [selectedBankIds, setSelectedBankIds] = useState<Set<string>>(new Set())

    const [showPublishConfirm, setShowPublishConfirm] = useState(false)
    const [publishing, setPublishing] = useState(false)

    const fetchQuiz = useCallback(async () => {
        try {
            const res = await fetch(`/api/quizzes/${quizId}`)
            const data = await res.json()
            setQuiz(data)
            setQuestions(data.questions || [])
        } catch (error) {
            console.error('Error:', error)
        } finally {
            setLoading(false)
        }
    }, [quizId])

    useEffect(() => {
        fetchQuiz()
    }, [fetchQuiz])

    const handlePublishClick = () => {
        if (questions.length === 0) {
            alert('Minimal harus ada 1 soal untuk mempublish kuis!')
            return
        }
        setShowPublishConfirm(true)
    }

    const confirmPublish = async () => {
        setPublishing(true)
        try {
            const res = await fetch(`/api/quizzes/${quizId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_active: true })
            })

            if (res.ok) {
                setShowPublishConfirm(false)
                fetchQuiz()
            }
        } catch (error) {
            console.error('Error publishing:', error)
            alert('Gagal mempublish kuis')
        } finally {
            setPublishing(false)
        }
    }

    const handleAddManualQuestion = async () => {
        if (!manualForm.question_text) return
        setSaving(true)
        try {
            await fetch(`/api/quizzes/${quizId}/questions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...manualForm,
                    order_index: questions.length,
                    options: manualForm.question_type === 'MULTIPLE_CHOICE' ? manualForm.options : null
                })
            })
            setManualForm({
                question_text: '',
                question_type: 'MULTIPLE_CHOICE',
                options: ['', '', '', ''],
                correct_answer: '',
                points: 10,
                order_index: 0
            })
            setMode('list')
            fetchQuiz()
        } finally {
            setSaving(false)
        }
    }

    const handleDeleteQuestion = async (questionId: string) => {
        if (!confirm('Hapus soal ini?')) return
        // Delete individual question by re-fetching and filtering
        const updatedQuestions = questions.filter(q => q.id !== questionId)
        await fetch(`/api/quizzes/${quizId}/questions`, { method: 'DELETE' })
        if (updatedQuestions.length > 0) {
            await fetch(`/api/quizzes/${quizId}/questions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedQuestions.map((q, idx) => ({ ...q, order_index: idx })))
            })
        }
        fetchQuiz()
    }

    const handleOCRUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setOcrLoading(true)
        setOcrResults([])

        try {
            const formData = new FormData()
            formData.append('image', file)

            const res = await fetch('/api/ai/ocr-questions', {
                method: 'POST',
                body: formData
            })

            const data = await res.json()
            if (data.questions) {
                setOcrResults(data.questions.map((q: any, idx: number) => ({
                    ...q,
                    points: 10,
                    order_index: idx
                })))
            } else if (data.error) {
                alert('Error: ' + data.error)
            }
        } catch (error) {
            console.error('OCR Error:', error)
            alert('Gagal mengekstrak soal dari gambar')
        } finally {
            setOcrLoading(false)
        }
    }

    const handleAIGenerate = async () => {
        if (!aiMaterial.trim()) return

        setAiLoading(true)
        setAiResults([])

        try {
            const res = await fetch('/api/ai/generate-questions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    material: aiMaterial,
                    count: aiCount,
                    type: aiType,
                    difficulty: aiDifficulty
                })
            })

            const data = await res.json()
            if (data.questions) {
                setAiResults(data.questions.map((q: any, idx: number) => ({
                    ...q,
                    points: 10,
                    order_index: idx
                })))
            } else if (data.error) {
                alert('Error: ' + data.error)
            }
        } catch (error) {
            console.error('AI Generate Error:', error)
            alert('Gagal generate soal')
        } finally {
            setAiLoading(false)
        }
    }

    const handleSaveAIResults = async (results: QuizQuestion[]) => {
        if (results.length === 0) return
        setSaving(true)
        try {
            const newQuestions = results.map((q, idx) => ({
                ...q,
                order_index: questions.length + idx
            }))

            await fetch(`/api/quizzes/${quizId}/questions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newQuestions)
            })

            setOcrResults([])
            setAiResults([])
            setMode('list')
            fetchQuiz()
        } finally {
            setSaving(false)
        }
    }

    const handleSaveToBank = async (results: QuizQuestion[]) => {
        if (results.length === 0) return
        try {
            await fetch('/api/question-bank', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(results.map(q => ({
                    ...q,
                    subject_id: quiz?.teaching_assignment?.subject?.id
                })))
            })
            alert('Soal berhasil disimpan ke Bank Soal!')
        } catch (error) {
            console.error('Error saving to bank:', error)
        }
    }

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <div className="animate-spin text-3xl text-primary">⏳</div>
            </div>
        )
    }

    if (!quiz) {
        return (
            <EmptyState
                icon="❓"
                title="Kuis tidak ditemukan"
                description="Kuis yang Anda cari tidak tersedia."
            />
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <PageHeader
                title={quiz.title}
                subtitle={`${quiz.teaching_assignment?.class?.name} • ${quiz.teaching_assignment?.subject?.name}`}
                backHref="/dashboard/guru/kuis"
                action={
                    <div className="flex items-center gap-4">
                        {!quiz.is_active && (
                            <Button
                                onClick={handlePublishClick}
                                disabled={questions.length === 0}
                                className="bg-gradient-to-r from-green-500 to-emerald-600 text-white"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Publish Kuis
                            </Button>
                        )}
                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <p className={`text-2xl font-bold ${totalPoints > 100 ? 'text-red-400' : totalPoints === 100 ? 'text-green-400' : 'text-amber-400'}`}>
                                    {totalPoints}
                                </p>
                                <p className="text-xs text-text-secondary dark:text-zinc-400">Total Poin</p>
                            </div>
                            <div className="text-right">
                                <p className="text-2xl font-bold text-primary">{questions.length}</p>
                                <p className="text-xs text-text-secondary dark:text-zinc-400">Soal</p>
                            </div>
                        </div>
                    </div>
                }
            />

            {/* Points Warning */}
            {totalPoints !== 100 && questions.length > 0 && (
                <div className={`px-4 py-3 rounded-xl flex items-center justify-between ${totalPoints > 100 ? 'bg-red-500/20 border border-red-500/30' : 'bg-amber-500/20 border border-amber-500/30'}`}>
                    <div className="flex items-center gap-2">
                        <span>{totalPoints > 100 ? '⚠️' : '💡'}</span>
                        <span className={totalPoints > 100 ? 'text-red-400' : 'text-amber-400'}>
                            {totalPoints > 100
                                ? `Total poin melebihi 100 (${totalPoints}). Kurangi poin beberapa soal.`
                                : `Total poin: ${totalPoints}/100. Disarankan total = 100.`
                            }
                        </span>
                    </div>
                    <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                            const pointPerQuestion = Math.floor(100 / questions.length)
                            const remainder = 100 - (pointPerQuestion * questions.length)
                            const balanced = questions.map((q, idx) => ({
                                ...q,
                                points: pointPerQuestion + (idx < remainder ? 1 : 0)
                            }))
                            setQuestions(balanced)
                            // Update in database
                            balanced.forEach(async (q) => {
                                if (q.id) {
                                    await fetch(`/api/quizzes/${quizId}/questions`, {
                                        method: 'PUT',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ question_id: q.id, points: q.points })
                                    })
                                }
                            })
                        }}
                    >
                        Seimbangkan Poin
                    </Button>
                </div>
            )}

            {/* Mode Tabs */}
            {mode === 'list' && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <button
                        onClick={() => {
                            setManualForm({
                                ...manualForm,
                                points: getDefaultPoints(),
                                question_text: '',
                                correct_answer: '',
                                options: ['', '', '', '']
                            })
                            setMode('manual')
                        }}
                        className="p-4 bg-white dark:bg-surface-dark border-2 border-primary/30 rounded-xl hover:border-primary hover:shadow-lg hover:shadow-primary/10 active:scale-95 transition-all text-center flex flex-col items-center gap-2 group cursor-pointer"
                    >
                        <div className="text-2xl group-hover:scale-110 transition-transform">✏️</div>
                        <div className="text-sm font-bold text-text-main dark:text-white">Manual</div>
                        <span className="text-xs text-text-secondary dark:text-zinc-400">Tulis sendiri</span>
                    </button>
                    <button
                        onClick={() => setMode('ocr')}
                        className="p-4 bg-white dark:bg-surface-dark border-2 border-primary/30 rounded-xl hover:border-primary hover:shadow-lg hover:shadow-primary/10 active:scale-95 transition-all text-center flex flex-col items-center gap-2 group cursor-pointer"
                    >
                        <div className="text-2xl group-hover:scale-110 transition-transform">📷</div>
                        <div className="text-sm font-bold text-text-main dark:text-white">OCR Foto</div>
                        <span className="text-xs text-text-secondary dark:text-zinc-400">Dari gambar</span>
                    </button>
                    <button
                        onClick={() => setMode('ai')}
                        className="p-4 bg-white dark:bg-surface-dark border-2 border-primary/30 rounded-xl hover:border-primary hover:shadow-lg hover:shadow-primary/10 active:scale-95 transition-all text-center flex flex-col items-center gap-2 group cursor-pointer"
                    >
                        <div className="text-2xl group-hover:scale-110 transition-transform">🤖</div>
                        <div className="text-sm font-bold text-text-main dark:text-white">AI Generate</div>
                        <span className="text-xs text-text-secondary dark:text-zinc-400">Dari materi</span>
                    </button>
                    <button
                        onClick={async () => {
                            setMode('bank')
                            setBankLoading(true)
                            try {
                                const res = await fetch(`/api/question-bank?subject_id=${quiz?.teaching_assignment?.subject?.id || ''}`)
                                const data = await res.json()
                                setBankQuestions(Array.isArray(data) ? data : [])
                            } catch (e) {
                                console.error(e)
                            } finally {
                                setBankLoading(false)
                            }
                        }}
                        className="p-4 bg-white dark:bg-surface-dark border-2 border-primary/30 rounded-xl hover:border-primary hover:shadow-lg hover:shadow-primary/10 active:scale-95 transition-all text-center flex flex-col items-center gap-2 group cursor-pointer"
                    >
                        <div className="text-2xl group-hover:scale-110 transition-transform">🗃️</div>
                        <div className="text-sm font-bold text-text-main dark:text-white">Bank Soal</div>
                        <span className="text-xs text-text-secondary dark:text-zinc-400">Dari koleksi</span>
                    </button>
                </div>
            )}

            {/* Question List */}
            {mode === 'list' && (
                <div className="space-y-4">
                    {questions.length === 0 ? (
                        <EmptyState
                            icon="📝"
                            title="Belum ada soal"
                            description="Mulai tambahkan soal menggunakan salah satu menu di atas."
                        />
                    ) : (
                        questions.map((q, idx) => (
                            <Card key={q.id || idx} className="p-4">
                                <div className="flex items-start gap-4">
                                    <div className="w-8 h-8 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-sm shrink-0">
                                        {idx + 1}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className={`px-2 py-0.5 text-xs rounded-full ${q.question_type === 'MULTIPLE_CHOICE' ? 'bg-blue-500/20 text-blue-400' : 'bg-amber-500/20 text-amber-400'}`}>
                                                {q.question_type === 'MULTIPLE_CHOICE' ? 'Pilihan Ganda' : 'Essay'}
                                            </span>
                                        </div>
                                        <p className="text-text-main dark:text-white mb-2">{q.question_text}</p>

                                        {q.image_url && (
                                            <div className="mb-3">
                                                <img src={q.image_url} alt="Gambar soal" className="max-h-40 rounded-lg border border-secondary/30" />
                                            </div>
                                        )}

                                        {q.question_type === 'MULTIPLE_CHOICE' && q.options && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                                {q.options.map((opt, optIdx) => (
                                                    <div key={optIdx} className={`px-3 py-2 rounded-lg border ${q.correct_answer === String.fromCharCode(65 + optIdx) ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 border-green-300 dark:border-green-500/30' : 'bg-secondary/5 text-text-main dark:text-zinc-300 border-secondary/20'}`}>
                                                        <span className="font-bold mr-2">{String.fromCharCode(65 + optIdx)}.</span>
                                                        {opt}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-col gap-2 items-end pl-4 border-l border-white/5">
                                        <div className="flex items-center gap-1">
                                            <input
                                                type="number"
                                                value={q.points}
                                                onChange={(e) => {
                                                    const newPoints = parseInt(e.target.value) || 1
                                                    const updated = questions.map((question, i) =>
                                                        i === idx ? { ...question, points: newPoints } : question
                                                    )
                                                    setQuestions(updated)
                                                }}
                                                onBlur={async () => {
                                                    if (q.id) {
                                                        await fetch(`/api/quizzes/${quizId}/questions`, {
                                                            method: 'PUT',
                                                            headers: { 'Content-Type': 'application/json' },
                                                            body: JSON.stringify({ question_id: q.id, points: q.points })
                                                        })
                                                    }
                                                }}
                                                className="w-14 px-2 py-1 bg-secondary/5 border border-secondary/30 rounded text-text-main dark:text-white text-center text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                                min={1}
                                                max={100}
                                                disabled={quiz?.is_active}
                                            />
                                            <span className="text-xs text-text-secondary dark:text-zinc-500">poin</span>
                                        </div>

                                        <QuestionImageUpload
                                            imageUrl={q.image_url}
                                            onImageChange={async (url) => {
                                                if (q.id) {
                                                    await fetch(`/api/quizzes/${quizId}/questions`, {
                                                        method: 'PUT',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({ question_id: q.id, image_url: url })
                                                    })
                                                    fetchQuiz()
                                                }
                                            }}
                                            disabled={quiz?.is_active}
                                        />

                                        <button
                                            onClick={() => q.id && handleDeleteQuestion(q.id)}
                                            className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                                            disabled={quiz?.is_active}
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </Card>
                        ))
                    )}
                </div>
            )}

            {/* Manual Mode */}
            {mode === 'manual' && (
                <Card className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-text-main dark:text-white">✏️ Tambah Soal Manual</h2>
                        <Button variant="ghost" icon={<>✕</>} onClick={() => setMode('list')} />
                    </div>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-text-main dark:text-white mb-2">Tipe Soal</label>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setManualForm({ ...manualForm, question_type: 'MULTIPLE_CHOICE', options: ['', '', '', ''] })}
                                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${manualForm.question_type === 'MULTIPLE_CHOICE' ? 'bg-blue-500 text-white' : 'bg-secondary/10 text-text-main dark:text-zinc-300 hover:bg-secondary/20'}`}
                                >
                                    Pilihan Ganda
                                </button>
                                <button
                                    onClick={() => setManualForm({ ...manualForm, question_type: 'ESSAY', options: null, correct_answer: null })}
                                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${manualForm.question_type === 'ESSAY' ? 'bg-amber-500 text-white' : 'bg-secondary/10 text-text-main dark:text-zinc-300 hover:bg-secondary/20'}`}
                                >
                                    Essay
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-text-main dark:text-white mb-2">Pertanyaan</label>
                            <textarea
                                value={manualForm.question_text}
                                onChange={(e) => setManualForm({ ...manualForm, question_text: e.target.value })}
                                className="w-full px-4 py-3 bg-secondary/5 border border-secondary/30 rounded-xl text-text-main dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                                rows={3}
                                placeholder="Tulis pertanyaan..."
                            />
                        </div>

                        {manualForm.question_type === 'MULTIPLE_CHOICE' && (
                            <>
                                <div className="grid grid-cols-2 gap-3">
                                    {['A', 'B', 'C', 'D'].map((letter, idx) => (
                                        <div key={letter}>
                                            <label className="block text-sm font-bold text-text-main dark:text-white mb-1">Opsi {letter}</label>
                                            <input
                                                type="text"
                                                value={manualForm.options?.[idx] || ''}
                                                onChange={(e) => {
                                                    const newOptions = [...(manualForm.options || ['', '', '', ''])]
                                                    newOptions[idx] = e.target.value
                                                    setManualForm({ ...manualForm, options: newOptions })
                                                }}
                                                className="w-full px-3 py-2 bg-secondary/5 border border-secondary/30 rounded-lg text-text-main dark:text-white focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                                            />
                                        </div>
                                    ))}
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-text-main dark:text-white mb-2">Kunci Jawaban</label>
                                    <div className="flex gap-2">
                                        {['A', 'B', 'C', 'D'].map((letter) => (
                                            <button
                                                key={letter}
                                                onClick={() => setManualForm({ ...manualForm, correct_answer: letter })}
                                                className={`w-12 h-12 rounded-lg font-bold transition-colors ${manualForm.correct_answer === letter ? 'bg-green-500 text-white' : 'bg-secondary/10 text-text-main dark:text-zinc-300 hover:bg-secondary/20'}`}
                                            >
                                                {letter}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}

                        <div>
                            <label className="block text-sm font-bold text-text-main dark:text-white mb-2">Poin</label>
                            <input
                                type="number"
                                value={manualForm.points}
                                onChange={(e) => setManualForm({ ...manualForm, points: parseInt(e.target.value) || 10 })}
                                className="w-24 px-3 py-2 bg-secondary/5 border border-secondary/30 rounded-lg text-text-main dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                                min={1}
                            />
                        </div>

                        <div className="flex gap-3 pt-4">
                            <Button variant="secondary" onClick={() => setMode('list')} className="flex-1">
                                Batal
                            </Button>
                            <Button
                                onClick={handleAddManualQuestion}
                                disabled={saving || !manualForm.question_text}
                                loading={saving}
                                className="flex-1"
                            >
                                {saving ? 'Menyimpan...' : 'Tambah Soal'}
                            </Button>
                        </div>
                    </div>
                </Card>
            )}

            {/* OCR Mode */}
            {mode === 'ocr' && (
                <Card className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-text-main dark:text-white">📷 Ekstrak Soal dari Foto</h2>
                        <Button variant="ghost" icon={<>✕</>} onClick={() => { setMode('list'); setOcrResults([]) }} />
                    </div>

                    {ocrResults.length === 0 && (
                        <div className="border-2 border-dashed border-secondary/30 rounded-xl p-8 text-center hover:border-primary/50 transition-colors bg-secondary/5">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleOCRUpload}
                                className="hidden"
                                id="ocr-upload"
                                disabled={ocrLoading}
                            />
                            <label htmlFor="ocr-upload" className="cursor-pointer">
                                {ocrLoading ? (
                                    <div className="text-primary">
                                        <div className="text-4xl mb-2 animate-bounce">⏳</div>
                                        <p>Menganalisis gambar dengan AI...</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="text-4xl mb-2">📷</div>
                                        <p className="text-text-secondary dark:text-zinc-400">Klik untuk upload foto soal</p>
                                        <p className="text-xs text-text-secondary dark:text-zinc-500 mt-1">Mendukung JPG, PNG</p>
                                    </>
                                )}
                            </label>
                        </div>
                    )}

                    {ocrResults.length > 0 && (
                        <div className="space-y-3">
                            <p className="text-sm text-text-secondary dark:text-zinc-400">✅ Ditemukan {ocrResults.length} soal. Review sebelum menyimpan:</p>
                            {ocrResults.map((q, idx) => (
                                <div key={idx} className="bg-secondary/10 rounded-lg p-3">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-primary font-bold">{idx + 1}.</span>
                                        <span className={`px-2 py-0.5 text-xs rounded ${q.question_type === 'MULTIPLE_CHOICE' ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400' : 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400'}`}>
                                            {q.question_type === 'MULTIPLE_CHOICE' ? 'PG' : 'Essay'}
                                        </span>
                                    </div>
                                    <p className="text-text-main dark:text-white text-sm">{q.question_text}</p>
                                    {q.options && (
                                        <div className="mt-2 text-xs text-text-secondary dark:text-zinc-400">
                                            {q.options.map((opt, optIdx) => (
                                                <span key={optIdx} className={`mr-3 ${q.correct_answer === String.fromCharCode(65 + optIdx) ? 'text-green-600 dark:text-green-400' : ''}`}>
                                                    {String.fromCharCode(65 + optIdx)}. {opt}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                            <div className="flex gap-3 pt-4">
                                <Button variant="secondary" onClick={() => handleSaveToBank(ocrResults)}>
                                    💾 Simpan ke Bank Soal
                                </Button>
                                <Button
                                    onClick={() => handleSaveAIResults(ocrResults)}
                                    disabled={saving}
                                    loading={saving}
                                    className="flex-1"
                                >
                                    {saving ? 'Menyimpan...' : `Tambahkan ${ocrResults.length} Soal ke Kuis`}
                                </Button>
                            </div>
                        </div>
                    )}
                </Card>
            )
            }

            {/* AI Generate Mode */}
            {mode === 'ai' && (
                <Card className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-text-main dark:text-white">🤖 Generate Soal dari Materi</h2>
                        <Button variant="ghost" icon={<>✕</>} onClick={() => { setMode('list'); setAiResults([]) }} />
                    </div>

                    {aiResults.length === 0 && (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-text-main dark:text-white mb-2">Materi / Teks</label>
                                <textarea
                                    value={aiMaterial}
                                    onChange={(e) => setAiMaterial(e.target.value)}
                                    className="w-full px-4 py-3 bg-secondary/5 border border-secondary/30 rounded-xl text-text-main dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                                    rows={6}
                                    placeholder="Paste materi pembelajaran di sini..."
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-text-main dark:text-white mb-2">Jumlah Soal</label>
                                    <input
                                        type="number"
                                        value={aiCount}
                                        onChange={(e) => setAiCount(parseInt(e.target.value) || 5)}
                                        className="w-full px-3 py-2 bg-secondary/5 border border-secondary/30 rounded-lg text-text-main dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                                        min={1}
                                        max={20}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-text-main dark:text-white mb-2">Tipe Soal</label>
                                    <select
                                        value={aiType}
                                        onChange={(e) => setAiType(e.target.value)}
                                        className="w-full px-3 py-2 bg-secondary/5 border border-secondary/30 rounded-lg text-text-main dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                                    >
                                        <option value="MIXED">Campuran</option>
                                        <option value="MULTIPLE_CHOICE">Pilihan Ganda</option>
                                        <option value="ESSAY">Essay</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-text-main dark:text-white mb-2">Kesulitan</label>
                                    <select
                                        value={aiDifficulty}
                                        onChange={(e) => setAiDifficulty(e.target.value)}
                                        className="w-full px-3 py-2 bg-secondary/5 border border-secondary/30 rounded-lg text-text-main dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                                    >
                                        <option value="EASY">Mudah</option>
                                        <option value="MEDIUM">Sedang</option>
                                        <option value="HARD">Sulit</option>
                                    </select>
                                </div>
                            </div>

                            <Button
                                onClick={handleAIGenerate}
                                disabled={aiLoading || !aiMaterial.trim()}
                                loading={aiLoading}
                                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                            >
                                {aiLoading ? 'Generating...' : '🚀 Generate Soal dengan AI'}
                            </Button>
                        </div>
                    )}

                    {aiResults.length > 0 && (
                        <div className="space-y-3">
                            <p className="text-sm text-text-secondary dark:text-zinc-400">✅ AI menghasilkan {aiResults.length} soal. Review sebelum menyimpan:</p>
                            {aiResults.map((q, idx) => (
                                <div key={idx} className="bg-secondary/10 rounded-lg p-3">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-primary font-bold">{idx + 1}.</span>
                                        <span className={`px-2 py-0.5 text-xs rounded ${q.question_type === 'MULTIPLE_CHOICE' ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400' : 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400'}`}>
                                            {q.question_type === 'MULTIPLE_CHOICE' ? 'PG' : 'Essay'}
                                        </span>
                                    </div>
                                    <p className="text-text-main dark:text-white text-sm">{q.question_text}</p>
                                    {q.options && (
                                        <div className="mt-2 text-xs text-text-secondary dark:text-zinc-400">
                                            {q.options.map((opt, optIdx) => (
                                                <span key={optIdx} className={`mr-3 ${q.correct_answer === String.fromCharCode(65 + optIdx) ? 'text-green-600 dark:text-green-400' : ''}`}>
                                                    {String.fromCharCode(65 + optIdx)}. {opt}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                            <div className="flex gap-3 pt-4">
                                <Button variant="secondary" onClick={() => handleSaveToBank(aiResults)}>
                                    💾 Simpan ke Bank Soal
                                </Button>
                                <Button
                                    onClick={() => handleSaveAIResults(aiResults)}
                                    disabled={saving}
                                    loading={saving}
                                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600"
                                >
                                    {saving ? 'Menyimpan...' : `Tambahkan ${aiResults.length} Soal ke Kuis`}
                                </Button>
                            </div>
                        </div>
                    )}
                </Card>
            )
            }

            {/* Bank Soal Mode */}
            {
                mode === 'bank' && (
                    <Card className="p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-text-main dark:text-white">🗃️ Ambil dari Bank Soal</h2>
                            <Button variant="ghost" icon={<>✕</>} onClick={() => { setMode('list'); setSelectedBankIds(new Set()) }} />
                        </div>

                        {bankLoading ? (
                            <div className="flex justify-center py-12">
                                <div className="animate-spin text-3xl text-primary">⏳</div>
                            </div>
                        ) : bankQuestions.length === 0 ? (
                            <EmptyState
                                icon="🗃️"
                                title="Bank Soal Kosong"
                                description="Belum ada soal tersimpan untuk mata pelajaran ini."
                            />
                        ) : (
                            <>
                                <p className="text-sm text-text-secondary dark:text-zinc-400 mb-4">Pilih soal yang ingin ditambahkan ke kuis ini:</p>
                                <div className="space-y-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                                    {bankQuestions.map((q) => (
                                        <label
                                            key={q.id}
                                            className={`flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-all border ${selectedBankIds.has(q.id)
                                                ? 'bg-primary/10 border-primary'
                                                : 'bg-secondary/5 border-transparent hover:bg-secondary/10'
                                                }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedBankIds.has(q.id)}
                                                onChange={(e) => {
                                                    const newSet = new Set(selectedBankIds)
                                                    if (e.target.checked) {
                                                        newSet.add(q.id)
                                                    } else {
                                                        newSet.delete(q.id)
                                                    }
                                                    setSelectedBankIds(newSet)
                                                }}
                                                className="mt-1 w-5 h-5 rounded bg-secondary/10 border-secondary/30 text-primary focus:ring-primary"
                                            />
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                    <span className={`px-2 py-0.5 text-xs rounded ${q.question_type === 'MULTIPLE_CHOICE' ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400' : 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400'}`}>
                                                        {q.question_type === 'MULTIPLE_CHOICE' ? 'PG' : 'Essay'}
                                                    </span>
                                                    <span className={`px-2 py-0.5 text-xs rounded ${q.difficulty === 'EASY' ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400' :
                                                        q.difficulty === 'HARD' ? 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400' : 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400'
                                                        }`}>
                                                        {q.difficulty === 'EASY' ? 'Mudah' : q.difficulty === 'HARD' ? 'Sulit' : 'Sedang'}
                                                    </span>
                                                </div>
                                                <p className="text-text-main dark:text-white text-sm">{q.question_text}</p>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                                <div className="flex gap-3 pt-4 border-t border-secondary/20 mt-4">
                                    <Button
                                        variant="secondary"
                                        onClick={() => {
                                            if (selectedBankIds.size === bankQuestions.length) {
                                                setSelectedBankIds(new Set())
                                            } else {
                                                setSelectedBankIds(new Set(bankQuestions.map(q => q.id)))
                                            }
                                        }}
                                    >
                                        {selectedBankIds.size === bankQuestions.length ? 'Batal Pilih Semua' : 'Pilih Semua'}
                                    </Button>
                                    <Button
                                        onClick={async () => {
                                            if (selectedBankIds.size === 0) return
                                            setSaving(true)
                                            try {
                                                const selectedQuestions = bankQuestions
                                                    .filter(q => selectedBankIds.has(q.id))
                                                    .map((q, idx) => ({
                                                        question_text: q.question_text,
                                                        question_type: q.question_type,
                                                        options: q.options,
                                                        correct_answer: q.correct_answer,
                                                        points: 10,
                                                        order_index: questions.length + idx
                                                    }))

                                                await fetch(`/api/quizzes/${quizId}/questions`, {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify(selectedQuestions)
                                                })

                                                setSelectedBankIds(new Set())
                                                setMode('list')
                                                fetchQuiz()
                                            } finally {
                                                setSaving(false)
                                            }
                                        }}
                                        disabled={saving || selectedBankIds.size === 0}
                                        loading={saving}
                                        className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600"
                                    >
                                        {saving ? 'Menyimpan...' : `Tambahkan ${selectedBankIds.size} Soal ke Kuis`}
                                    </Button>
                                </div>
                            </>
                        )}
                    </Card>
                )
            }

            {/* Publish Confirmation Modal */}
            <Modal
                open={showPublishConfirm}
                onClose={() => setShowPublishConfirm(false)}
                title="Publish Kuis Ini?"
            >
                <div className="text-center">
                    <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <p className="text-text-secondary mb-6">
                        Setelah dipublish, siswa akan langsung bisa melihat dan mengerjakan kuis ini. Pastikan semua soal sudah benar.
                    </p>
                    <div className="flex gap-3">
                        <Button
                            variant="secondary"
                            onClick={() => setShowPublishConfirm(false)}
                            disabled={publishing}
                            className="flex-1"
                        >
                            Batal
                        </Button>
                        <Button
                            onClick={confirmPublish}
                            disabled={publishing}
                            loading={publishing}
                            className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600"
                        >
                            Ya, Publish
                        </Button>
                    </div>
                </div>
            </Modal>
        </div >
    )
}
