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
        <div className="relative p-6 rounded-2xl bg-white/40 backdrop-blur-xl border border-white/50 shadow-xl shadow-primary/10 flex items-center gap-4 overflow-hidden">
            {/* Glassmorphism subtle gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-white/10 pointer-events-none"></div>

            {/* Icon container with glass effect */}
            <div className="relative z-10 rounded-xl p-3 bg-white/50 backdrop-blur-sm border border-white/60 shadow-lg">
                {icon}
            </div>

            <div className="relative z-10">
                <p className="text-sm font-bold text-text-secondary/80 uppercase tracking-wider">{label}</p>
                <p className="text-2xl font-extrabold text-text-main">
                    {numericValue !== null ? displayValue : (value || '-')}
                </p>
            </div>
        </div>
    )
}
