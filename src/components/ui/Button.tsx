'use client'

import { ReactNode, ButtonHTMLAttributes } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'warning'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant
    size?: ButtonSize
    icon?: ReactNode
    loading?: boolean
    children: ReactNode
}

const variantClasses: Record<ButtonVariant, string> = {
    primary: 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:opacity-90',
    secondary: 'bg-slate-700 text-white hover:bg-slate-600',
    danger: 'bg-red-500/20 text-red-400 hover:bg-red-500/30',
    success: 'bg-green-500/20 text-green-400 hover:bg-green-500/30',
    warning: 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
}

const sizeClasses: Record<ButtonSize, string> = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg'
}

export default function Button({
    variant = 'primary',
    size = 'md',
    icon,
    loading,
    disabled,
    children,
    className = '',
    ...props
}: ButtonProps) {
    return (
        <button
            className={`
                ${variantClasses[variant]}
                ${sizeClasses[size]}
                rounded-xl font-medium transition-all
                flex items-center justify-center gap-2
                disabled:opacity-50 disabled:cursor-not-allowed
                ${className}
            `}
            disabled={disabled || loading}
            {...props}
        >
            {loading ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
            ) : icon}
            {children}
        </button>
    )
}
