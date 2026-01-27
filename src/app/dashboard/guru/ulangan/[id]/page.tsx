'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import QuestionImageUpload from '@/components/QuestionImageUpload'
import { Modal, PageHeader, Button, EmptyState } from '@/components/ui'
import Card from '@/components/ui/Card'

interface ExamQuestion {
    id?: string
    question_text: string
    question_type: 'ESSAY' | 'MULTIPLE_CHOICE'
    options: string[] | null
    correct_answer: string | null
    points: number
    order_index: number
    image_url?: string | null
}

interface Exam {
    id: string
    title: string
    description: string | null
    start_time: string
    duration_minutes: number
    is_active: boolean
    is_randomized: boolean
    max_violations: number
    teaching_assignment: {
        subject: { id: string; name: string }
        class: { name: string }
    }
}

type Mode = 'list' | 'manual' | 'ocr' | 'ai' | 'bank'

export default function EditExamPage() {
    const params = useParams()
    const examId = params.id as string

    const [exam, setExam] = useState<Exam | null>(null)
    const [questions, setQuestions] = useState<ExamQuestion[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [mode, setMode] = useState<Mode>('list')

    // Manual mode state
    const [manualForm, setManualForm] = useState<ExamQuestion>({
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
    const [ocrResults, setOcrResults] = useState<ExamQuestion[]>([])

    // AI Generate mode state
    const [aiMaterial, setAiMaterial] = useState('')
    const [aiCount, setAiCount] = useState(5)
    const [aiType, setAiType] = useState('MIXED')
    const [aiDifficulty, setAiDifficulty] = useState('MEDIUM')
    const [aiLoading, setAiLoading] = useState(false)
    const [aiResults, setAiResults] = useState<ExamQuestion[]>([])

    // Bank Soal mode state
    const [bankQuestions, setBankQuestions] = useState<any[]>([])
    const [bankLoading, setBankLoading] = useState(false)
    const [selectedBankIds, setSelectedBankIds] = useState<Set<string>>(new Set())

    const [showPublishConfirm, setShowPublishConfirm] = useState(false)
    const [publishing, setPublishing] = useState(false)

    // Edit settings state
    const [showEditSettings, setShowEditSettings] = useState(false)
    const [editForm, setEditForm] = useState({
        title: '',
        description: '',
        start_time: '',
        duration_minutes: 60,
        max_violations: 3,
        is_randomized: true
    })
    const [savingSettings, setSavingSettings] = useState(false)

    const fetchExam = useCallback(async () => {
        try {
            const [examRes, questionsRes] = await Promise.all([
                fetch(`/api/exams/${examId}`),
                fetch(`/api/exams/${examId}/questions`)
            ])
            const examData = await examRes.json()
            const questionsData = await questionsRes.json()
            setExam(examData)
            setQuestions(Array.isArray(questionsData) ? questionsData : [])
        } catch (error) {
            console.error('Error:', error)
        } finally {
            setLoading(false)
        }
    }, [examId])

    useEffect(() => {
        fetchExam()
    }, [fetchExam])

    const handlePublishClick = () => {
        if (questions.length === 0) {
            alert('Minimal harus ada 1 soal untuk mempublish ulangan!')
            return
        }
        setShowPublishConfirm(true)
    }

    const confirmPublish = async () => {
        setPublishing(true)
        try {
            const res = await fetch(`/api/exams/${examId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_active: true })
            })
            if (res.ok) {
                setShowPublishConfirm(false)
                fetchExam()
            }
        } catch (error) {
            console.error('Error publishing:', error)
            alert('Gagal mempublish ulangan')
        } finally {
            setPublishing(false)
        }
    }

    const openEditSettings = () => {
        if (exam) {
            // Format datetime for input
            const startTime = new Date(exam.start_time)
            const formattedTime = startTime.toISOString().slice(0, 16)

            setEditForm({
                title: exam.title,
                description: exam.description || '',
                start_time: formattedTime,
                duration_minutes: exam.duration_minutes,
                max_violations: exam.max_violations,
                is_randomized: exam.is_randomized
            })
            setShowEditSettings(true)
        }
    }

    const handleSaveSettings = async () => {
        if (!editForm.title || !editForm.start_time) {
            alert('Judul dan waktu mulai wajib diisi')
            return
        }
        setSavingSettings(true)
        try {
            const res = await fetch(`/api/exams/${examId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: editForm.title,
                    description: editForm.description,
                    start_time: new Date(editForm.start_time).toISOString(),
                    duration_minutes: editForm.duration_minutes,
                    max_violations: editForm.max_violations,
                    is_randomized: editForm.is_randomized
                })
            })
            if (res.ok) {
                setShowEditSettings(false)
                fetchExam()
            } else {
                alert('Gagal menyimpan pengaturan')
            }
        } catch (error) {
            console.error('Error saving settings:', error)
            alert('Gagal menyimpan pengaturan')
        } finally {
            setSavingSettings(false)
        }
    }

    const handleAddManualQuestion = async () => {
        if (!manualForm.question_text) return
        setSaving(true)
        try {
            await fetch(`/api/exams/${examId}/questions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    questions: [{
                        ...manualForm,
                        order_index: questions.length,
                        options: manualForm.question_type === 'MULTIPLE_CHOICE' ? manualForm.options : null
                    }]
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
            fetchExam()
        } finally {
            setSaving(false)
        }
    }

    const handleDeleteQuestion = async (questionId: string) => {
        if (!confirm('Hapus soal ini?')) return
        await fetch(`/api/exams/${examId}/questions?question_id=${questionId}`, { method: 'DELETE' })
        fetchExam()
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

    const handleSaveResults = async (results: ExamQuestion[]) => {
        if (results.length === 0) return
        setSaving(true)
        try {
            const newQuestions = results.map((q, idx) => ({
                ...q,
                order_index: questions.length + idx
            }))

            await fetch(`/api/exams/${examId}/questions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ questions: newQuestions })
            })

            setOcrResults([])
            setAiResults([])
            setMode('list')
            fetchExam()
        } finally {
            setSaving(false)
        }
    }

    const handleSaveToBank = async (results: ExamQuestion[]) => {
        if (results.length === 0) return
        try {
            await fetch('/api/question-bank', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(results.map(q => ({
                    ...q,
                    subject_id: exam?.teaching_assignment?.subject?.id
                })))
            })
            alert('Soal berhasil disimpan ke Bank Soal!')
        } catch (error) {
            console.error('Error saving to bank:', error)
        }
    }

    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleString('id-ID', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        })
    }

    if (loading) {
        return <div className="text-center text-text-secondary py-12 flex justify-center"><div className="animate-spin text-3xl text-primary">⏳</div></div>
    }

    if (!exam) {
        return <div className="text-center text-text-secondary py-8">Ulangan tidak ditemukan</div>
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title={exam.title}
                subtitle={`${exam.teaching_assignment?.class?.name} • ${exam.teaching_assignment?.subject?.name}`}
                backHref="/dashboard/guru/ulangan"
                action={
                    <div className="flex items-center gap-3">
                        <Button variant="secondary" onClick={openEditSettings} icon={
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        }>
                            Pengaturan
                        </Button>
                        {!exam.is_active && (
                            <Button
                                onClick={handlePublishClick}
                                disabled={questions.length === 0}
                                icon={
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                }
                            >
                                Publish Ulangan
                            </Button>
                        )}
                        <div className="flex items-center gap-4 border-l border-secondary/20 pl-4">
                            <div className="text-right">
                                <p className={`text-2xl font-bold ${totalPoints > 100 ? 'text-red-500' : totalPoints === 100 ? 'text-green-500' : 'text-amber-500'}`}>
                                    {totalPoints}
                                </p>
                                <p className="text-xs text-text-secondary">Total Poin</p>
                            </div>
                            <div className="text-right">
                                <p className="text-2xl font-bold text-primary">{questions.length}</p>
                                <p className="text-xs text-text-secondary">Soal</p>
                            </div>
                        </div>
                    </div>
                }
            />

            {/* Points Warning */}
            {totalPoints !== 100 && questions.length > 0 && (
                <div className={`px-4 py-3 rounded-xl flex items-center justify-between ${totalPoints > 100 ? 'bg-red-500/10 border border-red-200 dark:border-red-500/30' : 'bg-amber-500/10 border border-amber-200 dark:border-amber-500/30'}`}>
                    <div className="flex items-center gap-2">
                        <span>{totalPoints > 100 ? '⚠️' : '💡'}</span>
                        <span className={totalPoints > 100 ? 'text-red-600 dark:text-red-400 font-medium' : 'text-amber-600 dark:text-amber-400 font-medium'}>
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
                            balanced.forEach(async (q) => {
                                if (q.id) {
                                    await fetch(`/api/exams/${examId}/questions`, {
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
                <div className="flex gap-4">
                    <button onClick={() => {
                        setManualForm({
                            ...manualForm,
                            points: getDefaultPoints(),
                            question_text: '',
                            correct_answer: '',
                            options: ['', '', '', '']
                        })
                        setMode('manual')
                    }} className="flex-1 p-4 bg-white dark:bg-surface-dark border-2 border-primary/30 rounded-2xl hover:border-primary hover:shadow-lg hover:shadow-primary/10 active:scale-95 transition-all text-center group cursor-pointer">
                        <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">✏️</div>
                        <div className="font-bold text-text-main dark:text-white mb-1">Manual</div>
                        <div className="text-xs text-text-secondary">Tulis sendiri</div>
                    </button>
                    <button onClick={() => setMode('ocr')} className="flex-1 p-4 bg-white dark:bg-surface-dark border-2 border-primary/30 rounded-2xl hover:border-primary hover:shadow-lg hover:shadow-primary/10 active:scale-95 transition-all text-center group cursor-pointer">
                        <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">📷</div>
                        <div className="font-bold text-text-main dark:text-white mb-1">OCR Foto</div>
                        <div className="text-xs text-text-secondary">Dari gambar</div>
                    </button>
                    <button onClick={() => setMode('ai')} className="flex-1 p-4 bg-white dark:bg-surface-dark border-2 border-primary/30 rounded-2xl hover:border-primary hover:shadow-lg hover:shadow-primary/10 active:scale-95 transition-all text-center group cursor-pointer">
                        <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">🤖</div>
                        <div className="font-bold text-text-main dark:text-white mb-1">AI Generate</div>
                        <div className="text-xs text-text-secondary">Dari materi</div>
                    </button>
                    <button
                        onClick={async () => {
                            setMode('bank')
                            setBankLoading(true)
                            try {
                                const res = await fetch(`/api/question-bank?subject_id=${exam?.teaching_assignment?.subject?.id || ''}`)
                                const data = await res.json()
                                setBankQuestions(Array.isArray(data) ? data : [])
                            } catch (e) {
                                console.error(e)
                            } finally {
                                setBankLoading(false)
                            }
                        }}
                        className="flex-1 p-4 bg-white dark:bg-surface-dark border-2 border-primary/30 rounded-2xl hover:border-primary hover:shadow-lg hover:shadow-primary/10 active:scale-95 transition-all text-center group cursor-pointer"
                    >
                        <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">🗃️</div>
                        <div className="font-bold text-text-main dark:text-white mb-1">Bank Soal</div>
                        <div className="text-xs text-text-secondary">Dari koleksi</div>
                    </button>
                </div>
            )}

            {/* Question List */}
            {mode === 'list' && (
                <div className="space-y-4">
                    {questions.length === 0 ? (
                        <EmptyState
                            icon="📄"
                            title="Belum Ada Soal"
                            description="Pilih salah satu metode di atas untuk menambahkan soal."
                        />
                    ) : (
                        questions.map((q, idx) => (
                            <Card key={q.id || idx} className="p-5">
                                <div className="flex items-start gap-5">
                                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-lg flex-shrink-0">
                                        {idx + 1}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${q.question_type === 'MULTIPLE_CHOICE' ? 'bg-blue-500/10 text-blue-600 border-blue-200 dark:border-blue-500/20 dark:text-blue-400' : 'bg-orange-500/10 text-orange-600 border-orange-200 dark:border-orange-500/20 dark:text-orange-400'}`}>
                                                {q.question_type === 'MULTIPLE_CHOICE' ? 'Pilihan Ganda' : 'Essay'}
                                            </span>
                                        </div>
                                        <div className="prose dark:prose-invert max-w-none text-text-main dark:text-white mb-4">
                                            <p>{q.question_text}</p>
                                        </div>
                                        {/* Display question image if exists */}
                                        {q.image_url && (
                                            <div className="mb-4">
                                                <img src={q.image_url} alt="Gambar soal" className="max-h-60 rounded-xl border border-secondary/20" />
                                            </div>
                                        )}
                                        {q.question_type === 'MULTIPLE_CHOICE' && q.options && (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                                {q.options.map((opt, optIdx) => (
                                                    <div key={optIdx} className={`px-4 py-3 rounded-xl border flex items-center gap-3 ${q.correct_answer === String.fromCharCode(65 + optIdx) ? 'bg-green-500/10 border-green-200 text-green-700 dark:border-green-500/30 dark:text-green-400' : 'bg-secondary/5 border-transparent text-text-secondary'}`}>
                                                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${q.correct_answer === String.fromCharCode(65 + optIdx) ? 'bg-green-500 text-white' : 'bg-secondary/20 text-text-secondary'}`}>
                                                            {String.fromCharCode(65 + optIdx)}
                                                        </span>
                                                        {opt}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-col gap-3 items-end border-l border-secondary/10 pl-5">
                                        {/* Points edit input */}
                                        <div className="flex flex-col items-center">
                                            <div className="flex items-center gap-1.5">
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
                                                    onBlur={async (e) => {
                                                        if (q.id) {
                                                            try {
                                                                const currentPoints = parseInt(e.target.value) || 1
                                                                await fetch(`/api/exams/${examId}/questions`, {
                                                                    method: 'PUT',
                                                                    headers: { 'Content-Type': 'application/json' },
                                                                    body: JSON.stringify({ question_id: q.id, points: currentPoints })
                                                                })
                                                            } catch (error) {
                                                                console.error('Failed to update points:', error)
                                                            }
                                                        }
                                                    }}
                                                    className="w-16 px-2 py-1.5 bg-secondary/5 border border-secondary/20 rounded-lg text-text-main dark:text-white text-center font-bold focus:outline-none focus:ring-2 focus:ring-primary"
                                                    min={1}
                                                    max={100}
                                                    disabled={exam?.is_active}
                                                />
                                            </div>
                                            <span className="text-[10px] uppercase font-bold text-text-secondary mt-1">Poin</span>
                                        </div>

                                        <div className="w-full h-px bg-secondary/10 my-1"></div>

                                        {/* Image upload button */}
                                        <QuestionImageUpload
                                            imageUrl={q.image_url}
                                            onImageChange={async (url) => {
                                                if (q.id) {
                                                    await fetch(`/api/exams/${examId}/questions`, {
                                                        method: 'PUT',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({ question_id: q.id, image_url: url })
                                                    })
                                                    fetchExam()
                                                }
                                            }}
                                            disabled={exam?.is_active}
                                        />
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => q.id && handleDeleteQuestion(q.id)}
                                            className="w-full text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 px-2"
                                            disabled={exam?.is_active}
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </Button>
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
                        <Button variant="secondary" onClick={() => setMode('list')} className="!p-2 aspect-square rounded-full">✕</Button>
                    </div>
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-text-main dark:text-white mb-2">Tipe Soal</label>
                            <div className="flex gap-2">
                                <button onClick={() => setManualForm({ ...manualForm, question_type: 'MULTIPLE_CHOICE', options: ['', '', '', ''] })} className={`flex-1 px-4 py-3 rounded-xl text-sm font-bold transition-all ${manualForm.question_type === 'MULTIPLE_CHOICE' ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-secondary/10 text-text-secondary hover:bg-secondary/20'}`}>Pilihan Ganda</button>
                                <button onClick={() => setManualForm({ ...manualForm, question_type: 'ESSAY', options: null, correct_answer: null })} className={`flex-1 px-4 py-3 rounded-xl text-sm font-bold transition-all ${manualForm.question_type === 'ESSAY' ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-secondary/10 text-text-secondary hover:bg-secondary/20'}`}>Essay</button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-text-main dark:text-white mb-2">Pertanyaan</label>
                            <textarea value={manualForm.question_text} onChange={(e) => setManualForm({ ...manualForm, question_text: e.target.value })} className="w-full px-4 py-3 bg-secondary/5 border border-secondary/20 rounded-xl text-text-main dark:text-white focus:outline-none focus:ring-2 focus:ring-primary min-h-[100px]" placeholder="Tulis pertanyaan..." />
                        </div>
                        {manualForm.question_type === 'MULTIPLE_CHOICE' && (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {['A', 'B', 'C', 'D'].map((letter, idx) => (
                                        <div key={letter}>
                                            <label className="block text-sm font-bold text-text-main dark:text-white mb-2">Opsi {letter}</label>
                                            <div className="relative">
                                                <div className="absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-secondary/20 flex items-center justify-center text-xs font-bold text-text-secondary">{letter}</div>
                                                <input type="text" value={manualForm.options?.[idx] || ''} onChange={(e) => { const newOptions = [...(manualForm.options || ['', '', '', ''])]; newOptions[idx] = e.target.value; setManualForm({ ...manualForm, options: newOptions }) }} className="w-full pl-12 pr-4 py-3 bg-secondary/5 border border-secondary/20 rounded-xl text-text-main dark:text-white focus:outline-none focus:ring-2 focus:ring-primary text-sm" placeholder={`Jawaban ${letter}`} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-text-main dark:text-white mb-2">Kunci Jawaban</label>
                                    <div className="flex gap-3">
                                        {['A', 'B', 'C', 'D'].map((letter) => (
                                            <button key={letter} onClick={() => setManualForm({ ...manualForm, correct_answer: letter })} className={`w-12 h-12 rounded-xl font-bold transition-all ${manualForm.correct_answer === letter ? 'bg-green-500 text-white shadow-lg shadow-green-500/30 scale-110' : 'bg-secondary/10 text-text-secondary hover:bg-secondary/20'}`}>{letter}</button>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                        <div>
                            <label className="block text-sm font-bold text-text-main dark:text-white mb-2">Poin</label>
                            <input type="number" value={manualForm.points} onChange={(e) => setManualForm({ ...manualForm, points: parseInt(e.target.value) || 10 })} className="w-24 px-4 py-3 bg-secondary/5 border border-secondary/20 rounded-xl text-text-main dark:text-white focus:outline-none focus:ring-2 focus:ring-primary font-bold text-center" min={1} />
                        </div>
                        <div className="flex gap-3 pt-6 border-t border-secondary/10">
                            <Button variant="secondary" onClick={() => setMode('list')} className="flex-1">Batal</Button>
                            <Button onClick={handleAddManualQuestion} disabled={saving || !manualForm.question_text} loading={saving} className="flex-1">{saving ? 'Menyimpan...' : 'Tambah Soal'}</Button>
                        </div>
                    </div>
                </Card>
            )}

            {/* OCR Mode */}
            {mode === 'ocr' && (
                <Card className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-text-main dark:text-white">📷 Ekstrak Soal dari Foto</h2>
                        <Button variant="secondary" onClick={() => { setMode('list'); setOcrResults([]) }} className="!p-2 aspect-square rounded-full">✕</Button>
                    </div>
                    {ocrResults.length === 0 && (
                        <div className="border-2 border-dashed border-secondary/30 rounded-2xl p-12 text-center hover:border-primary/50 transition-colors bg-secondary/5">
                            <input type="file" accept="image/*" onChange={handleOCRUpload} className="hidden" id="ocr-upload" disabled={ocrLoading} />
                            <label htmlFor="ocr-upload" className="cursor-pointer block">
                                {ocrLoading ? (
                                    <div className="text-primary"><div className="text-5xl mb-4 animate-bounce">⏳</div><p className="font-bold">Menganalisis gambar dengan AI...</p></div>
                                ) : (
                                    <><div className="text-5xl mb-4 text-text-secondary">📷</div><p className="text-lg font-bold text-text-main dark:text-white mb-2">Klik untuk upload foto soal</p><p className="text-sm text-text-secondary">Mendukung JPG, PNG</p></>
                                )}
                            </label>
                        </div>
                    )}
                    {ocrResults.length > 0 && (
                        <div className="space-y-4">
                            <p className="text-sm font-bold text-green-500">✅ Ditemukan {ocrResults.length} soal:</p>
                            {ocrResults.map((q, idx) => (
                                <div key={idx} className="bg-secondary/5 rounded-xl p-4 border border-secondary/20">
                                    <div className="flex items-center gap-2 mb-2"><span className="text-primary font-bold">{idx + 1}.</span><span className={`px-2 py-0.5 text-xs font-bold rounded ${q.question_type === 'MULTIPLE_CHOICE' ? 'bg-blue-500/10 text-blue-600' : 'bg-amber-500/10 text-amber-600'}`}>{q.question_type === 'MULTIPLE_CHOICE' ? 'PG' : 'Essay'}</span></div>
                                    <p className="text-text-main dark:text-white text-sm">{q.question_text}</p>
                                </div>
                            ))}
                            <div className="flex gap-3 pt-6 border-t border-secondary/10">
                                <Button variant="secondary" onClick={() => handleSaveToBank(ocrResults)}>💾 Simpan ke Bank Soal</Button>
                                <Button onClick={() => handleSaveResults(ocrResults)} disabled={saving} loading={saving} className="flex-1">Tambahkan {ocrResults.length} Soal</Button>
                            </div>
                        </div>
                    )}
                </Card>
            )}

            {/* AI Generate Mode */}
            {mode === 'ai' && (
                <Card className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-text-main dark:text-white">🤖 Generate Soal dari Materi</h2>
                        <Button variant="secondary" onClick={() => { setMode('list'); setAiResults([]) }} className="!p-2 aspect-square rounded-full">✕</Button>
                    </div>
                    {aiResults.length === 0 && (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-text-main dark:text-white mb-2">Materi / Teks Pembelajaran</label>
                                <textarea value={aiMaterial} onChange={(e) => setAiMaterial(e.target.value)} className="w-full px-4 py-3 bg-secondary/5 border border-secondary/20 rounded-xl text-text-main dark:text-white focus:outline-none focus:ring-2 focus:ring-primary min-h-[150px]" placeholder="Paste materi pembelajaran di sini, AI akan membuat soal dari materi ini..." />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-text-main dark:text-white mb-2">Jumlah Soal</label>
                                    <input type="number" value={aiCount} onChange={(e) => setAiCount(parseInt(e.target.value) || 5)} className="w-full px-4 py-3 bg-secondary/5 border border-secondary/20 rounded-xl text-text-main dark:text-white focus:outline-none focus:ring-2 focus:ring-primary" min={1} max={20} />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-text-main dark:text-white mb-2">Tipe Soal</label>
                                    <div className="relative">
                                        <select value={aiType} onChange={(e) => setAiType(e.target.value)} className="w-full px-4 py-3 bg-secondary/5 border border-secondary/20 rounded-xl text-text-main dark:text-white focus:outline-none focus:ring-2 focus:ring-primary appearance-none">
                                            <option value="MIXED">Campuran</option>
                                            <option value="MULTIPLE_CHOICE">Pilihan Ganda</option>
                                            <option value="ESSAY">Essay</option>
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-text-secondary">▼</div>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-text-main dark:text-white mb-2">Kesulitan</label>
                                    <div className="relative">
                                        <select value={aiDifficulty} onChange={(e) => setAiDifficulty(e.target.value)} className="w-full px-4 py-3 bg-secondary/5 border border-secondary/20 rounded-xl text-text-main dark:text-white focus:outline-none focus:ring-2 focus:ring-primary appearance-none">
                                            <option value="EASY">Mudah</option>
                                            <option value="MEDIUM">Sedang</option>
                                            <option value="HARD">Sulit</option>
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-text-secondary">▼</div>
                                    </div>
                                </div>
                            </div>
                            <Button onClick={handleAIGenerate} disabled={aiLoading || !aiMaterial.trim()} className="w-full" loading={aiLoading}>
                                {aiLoading ? 'Sedang Menganalisis & Membuat Soal...' : '🚀 Generate Soal dengan AI'}
                            </Button>
                        </div>
                    )}
                    {aiResults.length > 0 && (
                        <div className="space-y-4">
                            <p className="text-sm font-bold text-green-500">✅ AI menghasilkan {aiResults.length} soal:</p>
                            {aiResults.map((q, idx) => (
                                <div key={idx} className="bg-secondary/5 rounded-xl p-4 border border-secondary/20">
                                    <div className="flex items-center gap-2 mb-2"><span className="text-primary font-bold">{idx + 1}.</span><span className={`px-2 py-0.5 text-xs font-bold rounded ${q.question_type === 'MULTIPLE_CHOICE' ? 'bg-blue-500/10 text-blue-600' : 'bg-amber-500/10 text-amber-600'}`}>{q.question_type === 'MULTIPLE_CHOICE' ? 'PG' : 'Essay'}</span></div>
                                    <p className="text-text-main dark:text-white text-sm">{q.question_text}</p>
                                </div>
                            ))}
                            <div className="flex gap-3 pt-6 border-t border-secondary/10">
                                <Button variant="secondary" onClick={() => handleSaveToBank(aiResults)}>💾 Simpan ke Bank Soal</Button>
                                <Button onClick={() => handleSaveResults(aiResults)} disabled={saving} loading={saving} className="flex-1">Tambahkan {aiResults.length} Soal</Button>
                            </div>
                        </div>
                    )}
                </Card>
            )}

            {/* Bank Soal Mode */}
            {mode === 'bank' && (
                <Card className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-text-main dark:text-white">🗃️ Ambil dari Bank Soal</h2>
                        <Button variant="secondary" onClick={() => { setMode('list'); setSelectedBankIds(new Set()) }} className="!p-2 aspect-square rounded-full">✕</Button>
                    </div>
                    {bankLoading ? (
                        <div className="text-center py-12"><div className="animate-spin text-3xl text-primary mx-auto mb-2">⏳</div><p className="text-text-secondary">Memuat bank soal...</p></div>
                    ) : bankQuestions.length === 0 ? (
                        <EmptyState icon="🗃️" title="Bank Soal Kosong" description="Belum ada soal tersimpan untuk mata pelajaran ini." />
                    ) : (
                        <div className="space-y-4">
                            <p className="text-sm font-bold text-text-secondary">Pilih soal yang ingin ditambahkan:</p>
                            <div className="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar p-1">
                                {bankQuestions.map((q) => (
                                    <label key={q.id} className={`flex items-start gap-4 p-4 rounded-xl cursor-pointer transition-all border ${selectedBankIds.has(q.id) ? 'bg-primary/5 border-primary' : 'bg-secondary/5 border-transparent hover:bg-secondary/10'}`}>
                                        <input type="checkbox" checked={selectedBankIds.has(q.id)} onChange={(e) => { const newSet = new Set(selectedBankIds); if (e.target.checked) newSet.add(q.id); else newSet.delete(q.id); setSelectedBankIds(newSet) }} className="mt-1 w-5 h-5 rounded border-secondary/30 text-primary focus:ring-primary bg-secondary/10" />
                                        <div className="flex-1">
                                            <span className={`px-2 py-0.5 text-xs font-bold rounded ${q.question_type === 'MULTIPLE_CHOICE' ? 'bg-blue-500/10 text-blue-600' : 'bg-amber-500/10 text-amber-600'}`}>{q.question_type === 'MULTIPLE_CHOICE' ? 'PG' : 'Essay'}</span>
                                            <p className="text-text-main dark:text-white text-sm mt-2">{q.question_text}</p>
                                        </div>
                                    </label>
                                ))}
                            </div>
                            <div className="flex gap-3 pt-6 border-t border-secondary/10">
                                <Button variant="secondary" onClick={() => setSelectedBankIds(selectedBankIds.size === bankQuestions.length ? new Set() : new Set(bankQuestions.map(q => q.id)))}>{selectedBankIds.size === bankQuestions.length ? 'Batal Pilih Semua' : 'Pilih Semua'}</Button>
                                <Button
                                    onClick={async () => {
                                        if (selectedBankIds.size === 0) return
                                        setSaving(true)
                                        try {
                                            const selectedQuestions = bankQuestions.filter(q => selectedBankIds.has(q.id)).map((q, idx) => ({ question_text: q.question_text, question_type: q.question_type, options: q.options, correct_answer: q.correct_answer, points: 10, order_index: questions.length + idx }))
                                            await fetch(`/api/exams/${examId}/questions`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ questions: selectedQuestions }) })
                                            setSelectedBankIds(new Set())
                                            setMode('list')
                                            fetchExam()
                                        } finally { setSaving(false) }
                                    }}
                                    disabled={saving || selectedBankIds.size === 0}
                                    loading={saving}
                                    className="flex-1"
                                >Tambahkan {selectedBankIds.size} Soal</Button>
                            </div>
                        </div>
                    )}
                </Card>
            )}

            {/* Publish Confirmation Modal */}
            <Modal
                open={showPublishConfirm}
                onClose={() => setShowPublishConfirm(false)}
                title="🚀 Publish Ulangan?"
                maxWidth="sm"
            >
                <div className="text-center py-4">
                    <div className="w-20 h-20 bg-green-500/10 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <p className="text-text-secondary mb-8">Setelah dipublish, siswa bisa melihat ulangan ini dan dapat mulai mengerjakan sesuai jadwal. Pastikan soal sudah benar!</p>
                    <div className="flex gap-3">
                        <Button variant="secondary" onClick={() => setShowPublishConfirm(false)} className="flex-1">Batal</Button>
                        <Button onClick={confirmPublish} loading={publishing} className="flex-1">Ya, Publish</Button>
                    </div>
                </div>
            </Modal>

            {/* Edit Settings Modal */}
            <Modal
                open={showEditSettings}
                onClose={() => setShowEditSettings(false)}
                title="⚙️ Pengaturan Ulangan"
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-text-main dark:text-white mb-2">Judul Ulangan</label>
                        <input
                            type="text"
                            value={editForm.title}
                            onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                            className="w-full px-4 py-3 bg-secondary/5 border border-secondary/20 rounded-xl text-text-main dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-text-main dark:text-white mb-2">Deskripsi</label>
                        <textarea
                            value={editForm.description}
                            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                            className="w-full px-4 py-3 bg-secondary/5 border border-secondary/20 rounded-xl text-text-main dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                            rows={3}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-text-main dark:text-white mb-2">Waktu Mulai</label>
                            <input
                                type="datetime-local"
                                value={editForm.start_time}
                                onChange={(e) => setEditForm({ ...editForm, start_time: e.target.value })}
                                className="w-full px-4 py-3 bg-secondary/5 border border-secondary/20 rounded-xl text-text-main dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-text-main dark:text-white mb-2">Durasi (menit)</label>
                            <input
                                type="number"
                                value={editForm.duration_minutes}
                                onChange={(e) => setEditForm({ ...editForm, duration_minutes: parseInt(e.target.value) || 60 })}
                                className="w-full px-4 py-3 bg-secondary/5 border border-secondary/20 rounded-xl text-text-main dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-text-main dark:text-white mb-2">Max Pelanggaran</label>
                        <input
                            type="number"
                            value={editForm.max_violations}
                            onChange={(e) => setEditForm({ ...editForm, max_violations: parseInt(e.target.value) || 3 })}
                            className="w-full px-4 py-3 bg-secondary/5 border border-secondary/20 rounded-xl text-text-main dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        <p className="text-xs text-text-secondary mt-1">Siswa akan auto-submit jika keluar tab melebihi batas ini</p>
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-secondary/5 rounded-xl border border-secondary/10">
                        <input
                            type="checkbox"
                            id="edit-randomize"
                            checked={editForm.is_randomized}
                            onChange={(e) => setEditForm({ ...editForm, is_randomized: e.target.checked })}
                            className="w-5 h-5 rounded border-secondary/30 text-primary focus:ring-primary"
                        />
                        <label htmlFor="edit-randomize" className="text-sm font-medium text-text-main dark:text-white cursor-pointer select-none">Acak urutan soal per siswa</label>
                    </div>
                    <div className="flex gap-3 pt-6 border-t border-secondary/10 mt-2">
                        <Button variant="secondary" onClick={() => setShowEditSettings(false)} className="flex-1">Batal</Button>
                        <Button onClick={handleSaveSettings} loading={savingSettings} className="flex-1">Simpan Perubahan</Button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}
