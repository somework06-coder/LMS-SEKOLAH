import { ReactNode, HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    children: ReactNode
    className?: string
    padding?: string
}

export default function Card({
    children,
    className = '',
    padding = 'p-6',
    ...props
}: CardProps) {
    return (
        <div className={`
            bg-white dark:bg-surface-dark
            rounded-2xl
            shadow-soft 
            border border-secondary/10 dark:border-white/5
            ${padding}
            ${className}
        `}
            {...props}
        >
            {children}
        </div>
    )
}
