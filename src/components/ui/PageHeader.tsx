'use client'

import Link from 'next/link'
import { ReactNode } from 'react'

interface PageHeaderProps {
    title: string
    subtitle?: string
    backHref?: string
    icon?: ReactNode
    action?: ReactNode
}

export default function PageHeader({ title, subtitle, backHref, icon, action }: PageHeaderProps) {
    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
                {backHref && (
                    <Link
                        href={backHref}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </Link>
                )}
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        {icon && <span>{icon}</span>}
                        {title}
                    </h1>
                    {subtitle && <p className="text-slate-400">{subtitle}</p>}
                </div>
            </div>
            {action && <div>{action}</div>}
        </div>
    )
}
