'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

interface QuizQuestion {
    id?: string
    question_text: string
    question_type: 'ESSAY' | 'MULTIPLE_CHOICE'
    options: string[] | null
    correct_answer: string | null
    points: number
    order_index: number
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
        return <div className="text-center text-slate-400 py-8">Memuat...</div>
    }

    if (!quiz) {
        return <div className="text-center text-slate-400 py-8">Kuis tidak ditemukan</div>
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/guru/kuis" className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </Link>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-white">{quiz.title}</h1>
                            {!quiz.is_active && (
                                <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-500 text-xs rounded-full border border-yellow-500/20">
                                    DRAFT
                                </span>
                            )}
                            {quiz.is_active && (
                                <span className="px-2 py-0.5 bg-green-500/20 text-green-500 text-xs rounded-full border border-green-500/20">
                                    PUBLISHED
                                </span>
                            )}
                        </div>
                        <p className="text-slate-400">{quiz.teaching_assignment?.class?.name} • {quiz.teaching_assignment?.subject?.name}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    {!quiz.is_active && (
                        <button
                            onClick={handlePublishClick}
                            disabled={questions.length === 0}
                            className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:opacity-90 transition-opacity text-sm font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Publish Kuis
                        </button>
                    )}
                    <div className="text-right">
                        <p className="text-2xl font-bold text-cyan-400">{questions.length}</p>
                        <p className="text-xs text-slate-400">Soal</p>
                    </div>
                </div>
            </div>

            {/* Mode Tabs */}
            {mode === 'list' && (
                <div className="flex gap-2">
                    <button
                        onClick={() => setMode('manual')}
                        className="flex-1 px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl hover:border-green-500/50 transition-all text-center"
                    >
                        <div className="text-2xl mb-1">✏️</div>
                        <div className="text-sm font-medium text-white">Manual</div>
                        <div className="text-xs text-slate-400">Tulis sendiri</div>
                    </button>
                    <button
                        onClick={() => setMode('ocr')}
                        className="flex-1 px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl hover:border-blue-500/50 transition-all text-center"
                    >
                        <div className="text-2xl mb-1">📷</div>
                        <div className="text-sm font-medium text-white">OCR Foto</div>
                        <div className="text-xs text-slate-400">Dari gambar</div>
                    </button>
                    <button
                        onClick={() => setMode('ai')}
                        className="flex-1 px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl hover:border-purple-500/50 transition-all text-center"
                    >
                        <div className="text-2xl mb-1">🤖</div>
                        <div className="text-sm font-medium text-white">AI Generate</div>
                        <div className="text-xs text-slate-400">Dari materi</div>
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
                        className="flex-1 px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl hover:border-indigo-500/50 transition-all text-center"
                    >
                        <div className="text-2xl mb-1">🗃️</div>
                        <div className="text-sm font-medium text-white">Bank Soal</div>
                        <div className="text-xs text-slate-400">Dari koleksi</div>
                    </button>
                </div>
            )}

            {/* Question List */}
            {mode === 'list' && (
                <div className="space-y-3">
                    {questions.length === 0 ? (
                        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-8 text-center text-slate-400">
                            Belum ada soal. Tambahkan dengan mode di atas!
                        </div>
                    ) : (
                        questions.map((q, idx) => (
                            <div key={q.id || idx} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
                                <div className="flex items-start gap-4">
                                    <div className="w-8 h-8 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-sm">
                                        {idx + 1}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className={`px-2 py-0.5 text-xs rounded ${q.question_type === 'MULTIPLE_CHOICE' ? 'bg-blue-500/20 text-blue-400' : 'bg-amber-500/20 text-amber-400'}`}>
                                                {q.question_type === 'MULTIPLE_CHOICE' ? 'Pilihan Ganda' : 'Essay'}
                                            </span>
                                            <span className="text-xs text-slate-500">{q.points} poin</span>
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
                                        onClick={() => q.id && handleDeleteQuestion(q.id)}
                                        className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Manual Mode */}
            {mode === 'manual' && (
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-white">✏️ Tambah Soal Manual</h2>
                        <button onClick={() => setMode('list')} className="text-slate-400 hover:text-white">✕</button>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Tipe Soal</label>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setManualForm({ ...manualForm, question_type: 'MULTIPLE_CHOICE', options: ['', '', '', ''] })}
                                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${manualForm.question_type === 'MULTIPLE_CHOICE' ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-300'}`}
                            >
                                Pilihan Ganda
                            </button>
                            <button
                                onClick={() => setManualForm({ ...manualForm, question_type: 'ESSAY', options: null, correct_answer: null })}
                                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${manualForm.question_type === 'ESSAY' ? 'bg-amber-500 text-white' : 'bg-slate-700 text-slate-300'}`}
                            >
                                Essay
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Pertanyaan</label>
                        <textarea
                            value={manualForm.question_text}
                            onChange={(e) => setManualForm({ ...manualForm, question_text: e.target.value })}
                            className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            rows={3}
                            placeholder="Tulis pertanyaan..."
                        />
                    </div>

                    {manualForm.question_type === 'MULTIPLE_CHOICE' && (
                        <>
                            <div className="grid grid-cols-2 gap-3">
                                {['A', 'B', 'C', 'D'].map((letter, idx) => (
                                    <div key={letter}>
                                        <label className="block text-sm font-medium text-slate-300 mb-1">Opsi {letter}</label>
                                        <input
                                            type="text"
                                            value={manualForm.options?.[idx] || ''}
                                            onChange={(e) => {
                                                const newOptions = [...(manualForm.options || ['', '', '', ''])]
                                                newOptions[idx] = e.target.value
                                                setManualForm({ ...manualForm, options: newOptions })
                                            }}
                                            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
                                        />
                                    </div>
                                ))}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Kunci Jawaban</label>
                                <div className="flex gap-2">
                                    {['A', 'B', 'C', 'D'].map((letter) => (
                                        <button
                                            key={letter}
                                            onClick={() => setManualForm({ ...manualForm, correct_answer: letter })}
                                            className={`w-12 h-12 rounded-lg font-bold transition-colors ${manualForm.correct_answer === letter ? 'bg-green-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                                        >
                                            {letter}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Poin</label>
                        <input
                            type="number"
                            value={manualForm.points}
                            onChange={(e) => setManualForm({ ...manualForm, points: parseInt(e.target.value) || 10 })}
                            className="w-24 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            min={1}
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button onClick={() => setMode('list')} className="flex-1 px-4 py-3 bg-slate-700 text-white rounded-xl hover:bg-slate-600 transition-colors">
                            Batal
                        </button>
                        <button
                            onClick={handleAddManualQuestion}
                            disabled={saving || !manualForm.question_text}
                            className="flex-1 px-4 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                        >
                            {saving ? 'Menyimpan...' : 'Tambah Soal'}
                        </button>
                    </div>
                </div>
            )}

            {/* OCR Mode */}
            {mode === 'ocr' && (
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-white">📷 Ekstrak Soal dari Foto</h2>
                        <button onClick={() => { setMode('list'); setOcrResults([]) }} className="text-slate-400 hover:text-white">✕</button>
                    </div>

                    {ocrResults.length === 0 && (
                        <div className="border-2 border-dashed border-slate-600 rounded-xl p-8 text-center">
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
                                    <div className="text-cyan-400">
                                        <div className="text-4xl mb-2">⏳</div>
                                        <p>Menganalisis gambar dengan AI...</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="text-4xl mb-2">📷</div>
                                        <p className="text-slate-400">Klik untuk upload foto soal</p>
                                        <p className="text-xs text-slate-500 mt-1">Mendukung JPG, PNG</p>
                                    </>
                                )}
                            </label>
                        </div>
                    )}

                    {ocrResults.length > 0 && (
                        <div className="space-y-3">
                            <p className="text-sm text-slate-400">✅ Ditemukan {ocrResults.length} soal. Review sebelum menyimpan:</p>
                            {ocrResults.map((q, idx) => (
                                <div key={idx} className="bg-slate-700/50 rounded-lg p-3">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-cyan-400 font-bold">{idx + 1}.</span>
                                        <span className={`px-2 py-0.5 text-xs rounded ${q.question_type === 'MULTIPLE_CHOICE' ? 'bg-blue-500/20 text-blue-400' : 'bg-amber-500/20 text-amber-400'}`}>
                                            {q.question_type === 'MULTIPLE_CHOICE' ? 'PG' : 'Essay'}
                                        </span>
                                    </div>
                                    <p className="text-white text-sm">{q.question_text}</p>
                                    {q.options && (
                                        <div className="mt-2 text-xs text-slate-400">
                                            {q.options.map((opt, optIdx) => (
                                                <span key={optIdx} className={`mr-3 ${q.correct_answer === String.fromCharCode(65 + optIdx) ? 'text-green-400' : ''}`}>
                                                    {String.fromCharCode(65 + optIdx)}. {opt}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                            <div className="flex gap-3 pt-4">
                                <button onClick={() => handleSaveToBank(ocrResults)} className="px-4 py-2 bg-indigo-500/20 text-indigo-400 rounded-lg hover:bg-indigo-500/30 transition-colors text-sm">
                                    💾 Simpan ke Bank Soal
                                </button>
                                <button
                                    onClick={() => handleSaveAIResults(ocrResults)}
                                    disabled={saving}
                                    className="flex-1 px-4 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                                >
                                    {saving ? 'Menyimpan...' : `Tambahkan ${ocrResults.length} Soal ke Kuis`}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* AI Generate Mode */}
            {mode === 'ai' && (
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-white">🤖 Generate Soal dari Materi</h2>
                        <button onClick={() => { setMode('list'); setAiResults([]) }} className="text-slate-400 hover:text-white">✕</button>
                    </div>

                    {aiResults.length === 0 && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Materi / Teks</label>
                                <textarea
                                    value={aiMaterial}
                                    onChange={(e) => setAiMaterial(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    rows={6}
                                    placeholder="Paste materi pembelajaran di sini..."
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Jumlah Soal</label>
                                    <input
                                        type="number"
                                        value={aiCount}
                                        onChange={(e) => setAiCount(parseInt(e.target.value) || 5)}
                                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        min={1}
                                        max={20}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Tipe Soal</label>
                                    <select
                                        value={aiType}
                                        onChange={(e) => setAiType(e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    >
                                        <option value="MIXED">Campuran</option>
                                        <option value="MULTIPLE_CHOICE">Pilihan Ganda</option>
                                        <option value="ESSAY">Essay</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Kesulitan</label>
                                    <select
                                        value={aiDifficulty}
                                        onChange={(e) => setAiDifficulty(e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    >
                                        <option value="EASY">Mudah</option>
                                        <option value="MEDIUM">Sedang</option>
                                        <option value="HARD">Sulit</option>
                                    </select>
                                </div>
                            </div>

                            <button
                                onClick={handleAIGenerate}
                                disabled={aiLoading || !aiMaterial.trim()}
                                className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {aiLoading ? (
                                    <>⏳ Generating dengan AI...</>
                                ) : (
                                    <>🤖 Generate Soal</>
                                )}
                            </button>
                        </>
                    )}

                    {aiResults.length > 0 && (
                        <div className="space-y-3">
                            <p className="text-sm text-slate-400">✅ AI menghasilkan {aiResults.length} soal. Review sebelum menyimpan:</p>
                            {aiResults.map((q, idx) => (
                                <div key={idx} className="bg-slate-700/50 rounded-lg p-3">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-purple-400 font-bold">{idx + 1}.</span>
                                        <span className={`px-2 py-0.5 text-xs rounded ${q.question_type === 'MULTIPLE_CHOICE' ? 'bg-blue-500/20 text-blue-400' : 'bg-amber-500/20 text-amber-400'}`}>
                                            {q.question_type === 'MULTIPLE_CHOICE' ? 'PG' : 'Essay'}
                                        </span>
                                    </div>
                                    <p className="text-white text-sm">{q.question_text}</p>
                                    {q.options && (
                                        <div className="mt-2 text-xs text-slate-400">
                                            {q.options.map((opt, optIdx) => (
                                                <span key={optIdx} className={`mr-3 ${q.correct_answer === String.fromCharCode(65 + optIdx) ? 'text-green-400' : ''}`}>
                                                    {String.fromCharCode(65 + optIdx)}. {opt}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                            <div className="flex gap-3 pt-4">
                                <button onClick={() => handleSaveToBank(aiResults)} className="px-4 py-2 bg-indigo-500/20 text-indigo-400 rounded-lg hover:bg-indigo-500/30 transition-colors text-sm">
                                    💾 Simpan ke Bank Soal
                                </button>
                                <button
                                    onClick={() => handleSaveAIResults(aiResults)}
                                    disabled={saving}
                                    className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                                >
                                    {saving ? 'Menyimpan...' : `Tambahkan ${aiResults.length} Soal ke Kuis`}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Bank Soal Mode */}
            {mode === 'bank' && (
                <div className="bg-slate-800/50 border border-indigo-500/30 rounded-xl p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-white">🗃️ Ambil dari Bank Soal</h2>
                        <button onClick={() => { setMode('list'); setSelectedBankIds(new Set()) }} className="text-slate-400 hover:text-white">✕</button>
                    </div>

                    {bankLoading ? (
                        <div className="text-center text-slate-400 py-8">Memuat bank soal...</div>
                    ) : bankQuestions.length === 0 ? (
                        <div className="text-center text-slate-400 py-8">
                            <p>Bank soal kosong atau tidak ada soal untuk mata pelajaran ini.</p>
                            <p className="text-xs mt-2">Simpan soal dari mode OCR atau AI Generate untuk mengisi bank soal.</p>
                        </div>
                    ) : (
                        <>
                            <p className="text-sm text-slate-400">Pilih soal yang ingin ditambahkan ke kuis ini:</p>
                            <div className="space-y-3 max-h-96 overflow-y-auto">
                                {bankQuestions.map((q) => (
                                    <label
                                        key={q.id}
                                        className={`flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-all border ${selectedBankIds.has(q.id)
                                                ? 'bg-indigo-500/20 border-indigo-500'
                                                : 'bg-slate-700/30 border-transparent hover:bg-slate-700/50'
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
                                            className="mt-1 w-5 h-5 rounded bg-slate-700 border-slate-600 text-indigo-500 focus:ring-indigo-500"
                                        />
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                <span className={`px-2 py-0.5 text-xs rounded ${q.question_type === 'MULTIPLE_CHOICE' ? 'bg-blue-500/20 text-blue-400' : 'bg-amber-500/20 text-amber-400'}`}>
                                                    {q.question_type === 'MULTIPLE_CHOICE' ? 'PG' : 'Essay'}
                                                </span>
                                                <span className={`px-2 py-0.5 text-xs rounded ${q.difficulty === 'EASY' ? 'bg-green-500/20 text-green-400' :
                                                        q.difficulty === 'HARD' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                                                    }`}>
                                                    {q.difficulty === 'EASY' ? 'Mudah' : q.difficulty === 'HARD' ? 'Sulit' : 'Sedang'}
                                                </span>
                                            </div>
                                            <p className="text-white text-sm">{q.question_text}</p>
                                            {q.options && (
                                                <div className="flex flex-wrap gap-2 mt-2 text-xs">
                                                    {q.options.map((opt: string, idx: number) => (
                                                        <span key={idx} className={`px-2 py-0.5 rounded ${q.correct_answer === String.fromCharCode(65 + idx) ? 'bg-green-500/20 text-green-400' : 'bg-slate-600 text-slate-300'}`}>
                                                            {String.fromCharCode(65 + idx)}. {opt}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </label>
                                ))}
                            </div>
                            <div className="flex gap-3 pt-4 border-t border-slate-700">
                                <button
                                    onClick={() => {
                                        if (selectedBankIds.size === bankQuestions.length) {
                                            setSelectedBankIds(new Set())
                                        } else {
                                            setSelectedBankIds(new Set(bankQuestions.map(q => q.id)))
                                        }
                                    }}
                                    className="px-4 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors text-sm"
                                >
                                    {selectedBankIds.size === bankQuestions.length ? 'Batal Pilih Semua' : 'Pilih Semua'}
                                </button>
                                <button
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
                                    className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                                >
                                    {saving ? 'Menyimpan...' : `Tambahkan ${selectedBankIds.size} Soal ke Kuis`}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Publish Confirmation Modal */}
            {showPublishConfirm && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-sm text-center">
                        <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Publish Kuis Ini?</h3>
                        <p className="text-slate-400 mb-6">
                            Setelah dipublish, siswa akan langsung bisa melihat dan mengerjakan kuis ini. Pastikan semua soal sudah benar.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowPublishConfirm(false)}
                                className="flex-1 px-4 py-3 bg-slate-700 text-white rounded-xl hover:bg-slate-600 transition-colors"
                                disabled={publishing}
                            >
                                Batal
                            </button>
                            <button
                                onClick={confirmPublish}
                                disabled={publishing}
                                className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                            >
                                {publishing ? 'Memproses...' : 'Ya, Publish'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
