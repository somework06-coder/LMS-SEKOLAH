'use client'

import Link from 'next/link'
import { ReactNode } from 'react'

interface PageHeaderProps {
    title: string
    subtitle?: string
    backHref?: string
    onBack?: () => void
    icon?: ReactNode
    action?: ReactNode
}

export default function PageHeader({ title, subtitle, backHref, onBack, icon, action }: PageHeaderProps) {
    const BackButton = () => (
        <button
            onClick={onBack}
            className="p-3 rounded-xl bg-white dark:bg-surface-dark border border-secondary/20 hover:border-primary text-text-secondary hover:text-primary transition-all shadow-sm"
        >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
        </button>
    )

    const BackLink = () => (
        <Link
            href={backHref!}
            className="p-3 rounded-xl bg-white dark:bg-surface-dark border border-secondary/20 hover:border-primary text-text-secondary hover:text-primary transition-all shadow-sm"
        >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
        </Link>
    )

    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
                {onBack ? <BackButton /> : backHref && <BackLink />}
                <div>
                    <h1 className="text-2xl font-bold text-text-main dark:text-white flex items-center gap-2">
                        {icon && <span>{icon}</span>}
                        {title}
                    </h1>
                    {subtitle && <p className="text-text-secondary dark:text-zinc-400">{subtitle}</p>}
                </div>
            </div>
            {action && <div>{action}</div>}
        </div>
    )
}


