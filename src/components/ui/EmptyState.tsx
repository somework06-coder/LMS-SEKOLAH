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
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-8 text-center">
            {icon && <div className="text-6xl mb-4">{icon}</div>}
            <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
            {description && <p className="text-slate-400 mb-4">{description}</p>}
            {action && <div>{action}</div>}
        </div>
    )
}
