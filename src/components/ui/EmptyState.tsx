'use client'

import { ReactNode } from 'react'

interface EmptyStateProps {
    icon?: ReactNode
    title: string
    description?: string
    action?: ReactNode
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
    return (
        <div className="
            relative overflow-hidden
            rounded-2xl
            p-12 text-center
            bg-gradient-to-br from-white/90 to-white/50 dark:from-slate-900/80 dark:to-slate-900/40
            backdrop-blur-xl backdrop-saturate-150
            border border-white/60 dark:border-white/10
            shadow-lg shadow-slate-200/50 dark:shadow-black/20
            flex flex-col items-center justify-center
            group transition-all duration-300 hover:shadow-xl hover:scale-[1.01]
        ">
            {/* Glass reflection effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent opacity-50 pointer-events-none" />
            {icon && <div className="text-5xl mb-4 opacity-80">{icon}</div>}
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">{title}</h3>
            {description && <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-sm text-sm">{description}</p>}
            {action && <div className="w-full flex justify-center">{action}</div>}
        </div>
    )
}
