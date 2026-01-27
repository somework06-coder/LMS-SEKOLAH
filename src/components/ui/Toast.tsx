import { useEffect, useState } from 'react'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface ToastProps {
    message: string
    type?: ToastType
    duration?: number
    onClose: () => void
}

export function Toast({ message, type = 'info', duration = 3000, onClose }: ToastProps) {
    const [visible, setVisible] = useState(true)

    useEffect(() => {
        const timer = setTimeout(() => {
            setVisible(false)
            setTimeout(onClose, 300) // Allow animation to finish
        }, duration)

        return () => clearTimeout(timer)
    }, [duration, onClose])

    const getColors = () => {
        switch (type) {
            case 'success': return 'bg-green-500 text-white'
            case 'error': return 'bg-red-500 text-white'
            case 'warning': return 'bg-yellow-500 text-white'
            default: return 'bg-blue-500 text-white'
        }
    }

    const getIcon = () => {
        switch (type) {
            case 'success': return '✅'
            case 'error': return '❌'
            case 'warning': return '⚠️'
            default: return 'ℹ️'
        }
    }

    if (!visible) return null

    return (
        <div className={`fixed top-4 right-4 z-[9999] flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl transform transition-all duration-300 animate-slide-in ${getColors()}`}>
            <span className="text-xl">{getIcon()}</span>
            <p className="font-medium whitespace-pre-wrap">{message}</p>
            <button onClick={() => setVisible(false)} className="ml-4 opacity-70 hover:opacity-100">
                ✕
            </button>
        </div>
    )
}
