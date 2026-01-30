import React from 'react'
import { LucideIcon } from 'lucide-react'

type IconSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl'
type IconVariant = 'primary' | 'blue' | 'amber' | 'red' | 'purple' | 'green' | 'slate' | 'cyan' | 'info'

interface IconProps {
    icon: LucideIcon
    variant?: IconVariant
    size?: IconSize
    className?: string
    duotone?: boolean
}

const sizeMap: Record<IconSize, string> = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8',
    '2xl': 'w-10 h-10',
}

const variantMap: Record<IconVariant, { text: string; bg: string }> = {
    primary: { text: 'text-primary', bg: 'bg-primary/10' },
    blue: { text: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30' },
    amber: { text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/30' },
    red: { text: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30' },
    purple: { text: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-900/30' },
    green: { text: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30' },
    slate: { text: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-100 dark:bg-slate-900/30' },
    cyan: { text: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-100 dark:bg-cyan-900/30' },
    info: { text: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30' },
}

/**
 * Icon component with duotone styling support
 * Uses Lucide React icons with consistent 2px stroke and rounded corners
 * 
 * @example
 * // Simple usage
 * <Icon icon={BookOpen} variant="blue" size="lg" />
 * 
 * // With duotone container
 * <Icon icon={Calendar} variant="amber" size="md" duotone />
 */
export default function Icon({ icon: LucideIconComponent, variant = 'primary', size = 'md', className = '', duotone = false }: IconProps) {
    const colors = variantMap[variant]
    const sizeClass = sizeMap[size]

    if (duotone) {
        // Render with duotone background container
        const containerSizeMap: Record<IconSize, string> = {
            sm: 'w-8 h-8',
            md: 'w-10 h-10',
            lg: 'w-12 h-12',
            xl: 'w-14 h-14',
            '2xl': 'w-16 h-16',
        }

        return (
            <div className={`${containerSizeMap[size]} rounded-xl ${colors.bg} flex items-center justify-center ${className}`}>
                <LucideIconComponent
                    className={`${sizeClass} ${colors.text}`}
                    strokeWidth={2}
                />
            </div>
        )
    }

    // Render icon only
    return (
        <LucideIconComponent
            className={`${sizeClass} ${colors.text} ${className}`}
            strokeWidth={2}
        />
    )
}
