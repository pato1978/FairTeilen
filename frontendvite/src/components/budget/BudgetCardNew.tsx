'use client'
import React, { useEffect, useState } from 'react'
import { ChevronRight } from 'lucide-react'

/**
 * 🎯 Kompakter Fortschrittskreis mit dynamischer Farbe
 */
const CompactProgress = ({
    percentage,
    size = 50,
    strokeWidth = 4,
    mode = 'spent', // spent = je mehr → schlechter, available = je mehr → besser
}: {
    percentage: number
    size?: number
    strokeWidth?: number
    mode?: 'spent' | 'available'
}) => {
    const radius = (size - strokeWidth) / 2
    const circumference = radius * 2 * Math.PI
    const strokeDasharray = circumference
    const strokeDashoffset = circumference - (percentage / 100) * circumference

    const getColor = () => {
        if (mode === 'available') {
            if (percentage < 10) return '#dc2626' // 🔴 Wenig verfügbar
            if (percentage < 30) return '#f59e0b' // 🟠 Mittel
            return '#4CAF50' // 🟢 Viel verfügbar
        } else {
            // mode === 'spent'
            if (percentage < 70) return '#4CAF50' // 🟢 Wenig ausgegeben
            if (percentage < 90) return '#f59e0b' // 🟠 Mittel
            return '#dc2626' // 🔴 Viel ausgegeben
        }
    }

    return (
        <div className="relative inline-flex items-center justify-center">
            <svg width={size} height={size} className="transform -rotate-90">
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="#f1f5f9"
                    strokeWidth={strokeWidth}
                    fill="none"
                />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={getColor()}
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    className="transition-all duration-800 ease-out"
                    strokeLinecap="round"
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-bold text-slate-700">{percentage}%</span>
            </div>
        </div>
    )
}

/**
 * 💳 Hauptkomponente für Budgetanzeige
 */
export function BudgetCard({
    icon: Icon,
    title,
    period,
    expenses,
    budget,
    onClick,
    showInfoButton,
    onInfoClick,
    isLoading,
}: {
    icon: React.ElementType
    title: string
    period?: string
    expenses: { amount: number }[]
    budget: number
    onClick: () => void
    showInfoButton?: boolean
    onInfoClick?: () => void
    isLoading?: boolean
}) {
    const [displayMode, setDisplayMode] = useState<'available' | 'spent'>('available')

    const totalExpenses = expenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0)
    const available = Math.max(0, budget - totalExpenses)

    // 🔁 Dynamische Werte je nach Modus
    const currentValue = displayMode === 'available' ? available : totalExpenses
    const currentPercentage = budget ? Math.min(100, Math.round((currentValue / budget) * 100)) : 0

    const [animatedPercentage, setAnimatedPercentage] = useState(0)
    const [animatedValue, setAnimatedValue] = useState(0)

    useEffect(() => {
        if (isLoading) return
        const duration = 500
        const steps = 25
        const interval = duration / steps
        let step = 0

        const timer = setInterval(() => {
            step++
            const progress = Math.min(1, step / steps)
            setAnimatedPercentage(Math.round(currentPercentage * progress))
            setAnimatedValue(Math.round(currentValue * progress))

            if (step >= steps) clearInterval(timer)
        }, interval)

        return () => clearInterval(timer)
    }, [currentPercentage, currentValue, displayMode, isLoading])

    const handleToggle = (e: React.MouseEvent) => {
        e.stopPropagation()
        setDisplayMode(displayMode === 'available' ? 'spent' : 'available')
    }

    return (
        <div
            role="button"
            onClick={onClick}
            tabIndex={0}
            onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onClick()
                }
            }}
            className="
        relative
        cursor-pointer
        bg-gradient-to-r from-white to-blue-50/30 rounded-2xl p-4 shadow-md
        border border-blue-200 w-full min-h-[100px]
        active:scale-[0.98] transition-all duration-200
        focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50
        outline-none
      "
        >
            <div className="flex items-center space-x-4">
                {/* Icon mit Hintergrund */}
                <div className="bg-blue-100 p-2.5 rounded-xl flex-shrink-0">
                    <Icon className="h-5 w-5 text-blue-700" />
                </div>

                {/* Titel und Zeitraum */}
                <div className="flex-1 min-w-0 text-left">
                    <h3 className="text-lg font-semibold text-slate-800 truncate">{title}</h3>
                    {period && <p className="text-xs text-slate-500">{period}</p>}
                </div>

                {/* Fortschrittsanzeige */}
                <div className="flex-shrink-0">
                    <CompactProgress percentage={animatedPercentage} mode={displayMode} />
                </div>

                {/* Summe + Umschalter */}
                <div className="text-right flex-shrink-0 min-w-[80px]">
                    <p className="text-lg font-semibold text-slate-800 mb-1">
                        €{animatedValue.toLocaleString()}
                    </p>
                    <button
                        onClick={handleToggle}
                        className="text-xs text-blue-600 font-medium transition-colors underline decoration-dotted underline-offset-2"
                    >
                        {displayMode === 'available' ? 'verfügbar' : 'ausgegeben'}
                    </button>
                </div>
            </div>

            {/* Optionaler Info-Button */}
            {showInfoButton && (
                <button
                    onClick={e => {
                        e.stopPropagation()
                        onInfoClick?.()
                    }}
                    className="absolute top-2 right-2 text-blue-500"
                >
                    <ChevronRight className="h-4 w-4" />
                </button>
            )}
        </div>
    )
}
