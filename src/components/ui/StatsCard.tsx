'use client'

import { ReactNode, useEffect, useState } from 'react'

interface StatsCardProps {
    label: string
    value: string | number | null
    icon: ReactNode
    trend?: 'submissions' | 'grades' | 'none'
}

export default function StatsCard({ label, value, icon, trend }: StatsCardProps) {
    const [displayValue, setDisplayValue] = useState(0)
    const numericValue = typeof value === 'number' ? value : (typeof value === 'string' && !isNaN(Number(value))) ? Number(value) : null

    // Animated counter effect
    useEffect(() => {
        if (numericValue === null) return

        const duration = 1500 // 1.5 seconds
        const steps = 60
        const increment = numericValue / steps
        const stepDuration = duration / steps

        let currentStep = 0
        const timer = setInterval(() => {
            currentStep++
            if (currentStep >= steps) {
                setDisplayValue(numericValue)
                clearInterval(timer)
            } else {
                setDisplayValue(Math.floor(increment * currentStep))
            }
        }, stepDuration)

        return () => clearInterval(timer)
    }, [numericValue])

    return (
        <div className="relative p-6 rounded-2xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4 overflow-hidden">
            {/* Icon container */}
            <div className="relative z-10 rounded-xl p-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                {icon}
            </div>

            <div className="relative z-10">
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</p>
                <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
                    {numericValue !== null ? displayValue : (value || '-')}
                </p>
            </div>
        </div>
    )
}
