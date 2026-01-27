'use client'

import { useState, useRef } from 'react'

interface QuestionImageUploadProps {
    imageUrl?: string | null
    onImageChange: (url: string | null) => void
    disabled?: boolean
}

export default function QuestionImageUpload({ imageUrl, onImageChange, disabled }: QuestionImageUploadProps) {
    const [uploading, setUploading] = useState(false)
    const [showModal, setShowModal] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploading(true)
        try {
            const formData = new FormData()
            formData.append('file', file)

            const res = await fetch('/api/questions/upload-image', {
                method: 'POST',
                body: formData
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || 'Upload gagal')
            }

            const data = await res.json()
            onImageChange(data.url)
            setShowModal(false)
        } catch (error: any) {
            alert(error.message || 'Gagal upload gambar')
        } finally {
            setUploading(false)
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
        }
    }

    const handleRemove = () => {
        onImageChange(null)
        setShowModal(false)
    }

    return (
        <>
            {/* Image Preview or Add Button */}
            {imageUrl ? (
                <div className="relative group">
                    <img
                        src={imageUrl}
                        alt="Question image"
                        className="max-h-40 rounded-lg border border-slate-600 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => !disabled && setShowModal(true)}
                    />
                    {!disabled && (
                        <button
                            onClick={() => setShowModal(true)}
                            className="absolute top-1 right-1 p-1 bg-slate-900/80 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                        </button>
                    )}
                </div>
            ) : (
                <button
                    onClick={() => !disabled && setShowModal(true)}
                    disabled={disabled}
                    className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-primary/30"
                    title="Tambah gambar"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                </button>
            )}

            {/* Upload Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-md">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-white">📷 Gambar Soal</h3>
                            <button onClick={() => setShowModal(false)} className="p-1 text-slate-400 hover:text-white">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {imageUrl && (
                            <div className="mb-4">
                                <img src={imageUrl} alt="Current image" className="max-h-48 mx-auto rounded-lg border border-slate-600" />
                            </div>
                        )}

                        <div className="space-y-3">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/gif,image/webp"
                                onChange={handleUpload}
                                className="hidden"
                                id="question-image-upload"
                                disabled={uploading}
                            />

                            <label
                                htmlFor="question-image-upload"
                                className={`flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium cursor-pointer hover:opacity-90 transition-opacity ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {uploading ? (
                                    <>⏳ Mengupload...</>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                        </svg>
                                        {imageUrl ? 'Ganti Gambar' : 'Upload Gambar'}
                                    </>
                                )}
                            </label>

                            {imageUrl && (
                                <button
                                    onClick={handleRemove}
                                    className="w-full px-4 py-3 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/30 transition-colors"
                                >
                                    🗑️ Hapus Gambar
                                </button>
                            )}

                            <p className="text-xs text-slate-500 text-center">
                                Format: JPG, PNG, GIF, WebP • Max 5MB
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
