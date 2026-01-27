'use client'

import { ReactNode, ButtonHTMLAttributes } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'ghost' | 'outline'
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant
    size?: ButtonSize
    icon?: ReactNode
    loading?: boolean
    children?: ReactNode
}

const variantClasses: Record<ButtonVariant, string> = {
    primary: 'bg-primary hover:bg-primary-dark text-white shadow-soft hover:shadow-lg',
    secondary: 'bg-secondary/20 text-primary-dark hover:bg-secondary/30',
    danger: 'bg-red-500/10 text-red-600 hover:bg-red-500/20',
    success: 'bg-green-500/10 text-green-600 hover:bg-green-500/20',
    warning: 'bg-amber-500/10 text-amber-600 hover:bg-amber-500/20',
    ghost: 'bg-transparent hover:bg-secondary/10 text-text-secondary dark:text-[#A8BC9F]',
    outline: 'bg-transparent border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
}

const sizeClasses: Record<ButtonSize, string> = {
    sm: 'px-4 py-1.5 text-sm',
    md: 'px-6 py-2.5 text-base',
    lg: 'px-8 py-3.5 text-lg',
    icon: 'p-2 aspect-square'
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
                rounded-full font-semibold transition-all duration-300
                flex items-center justify-center gap-2
                active:scale-95
                disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
                ${className}
            `}
            disabled={disabled || loading}
            {...props}
        >
            {loading ? (
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
            ) : icon}
            {children}
        </button>
    )
}
