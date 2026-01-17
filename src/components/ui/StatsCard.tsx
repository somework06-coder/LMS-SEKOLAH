'use client'

import { ReactNode } from 'react'

interface StatsCardProps {
    value: string | number
    label: string
    icon?: ReactNode
    color?: 'cyan' | 'green' | 'amber' | 'purple' | 'red' | 'blue'
}

const colorClasses = {
    cyan: 'text-cyan-400',
    green: 'text-green-400',
    amber: 'text-amber-400',
    purple: 'text-purple-400',
    red: 'text-red-400',
    blue: 'text-blue-400'
}

export default function StatsCard({ value, label, icon, color = 'purple' }: StatsCardProps) {
    return (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 text-center">
            {icon && <div className="text-2xl mb-1">{icon}</div>}
            <p className={`text-2xl font-bold ${colorClasses[color]}`}>{value}</p>
            <p className="text-xs text-slate-400">{label}</p>
        </div>
    )
}
