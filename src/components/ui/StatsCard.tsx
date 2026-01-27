'use client'

import { ReactNode } from 'react'
import Card from './Card'

interface StatsCardProps {
    value: string | number
    label: string
    icon?: ReactNode
    trend?: string
}

export default function StatsCard({ value, label, icon, trend }: StatsCardProps) {
    return (
        <Card className="flex flex-col items-center justify-center gap-2 group hover:border-primary/30 transition-colors">
            {icon && (
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary-dark dark:text-primary flex items-center justify-center text-2xl mb-1 group-hover:scale-110 transition-transform">
                    {icon}
                </div>
            )}
            <p className="text-3xl font-bold text-text-main dark:text-white">{value}</p>
            <p className="text-sm text-text-secondary dark:text-[#A8BC9F] font-medium">{label}</p>
            {trend && <span className="text-xs text-primary font-bold bg-primary/10 px-2 py-0.5 rounded-full">{trend}</span>}
        </Card>
    )
}
