'use client'

import { ReactNode } from 'react'

interface ModalProps {
    open: boolean
    onClose: () => void
    title: string
    subtitle?: string
    children: ReactNode
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
}

const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl'
}

export default function Modal({
    open,
    onClose,
    title,
    subtitle,
    children,
    maxWidth = 'md'
}: ModalProps) {
    if (!open) return null

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className={`bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full ${maxWidthClasses[maxWidth]} max-h-[90vh] overflow-y-auto`}>
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-xl font-bold text-white">{title}</h2>
                        {subtitle && <p className="text-slate-400 text-sm">{subtitle}</p>}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-400 hover:text-white transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                {children}
            </div>
        </div>
    )
}
