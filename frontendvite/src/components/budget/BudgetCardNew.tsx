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

    // 🔒 Nur für die Ring-Darstellung auf 0–100 begrenzen
    const clamped = Math.max(0, Math.min(100, percentage))
    const strokeDashoffset = circumference - (clamped / 100) * circumference

    const getColor = () => {
        if (mode === 'available') {
            if (percentage < 10) return '#dc2626'
            if (percentage < 30) return '#f59e0b'
            return '#4CAF50'
        } else {
            if (percentage < 70) return '#4CAF50'
            if (percentage < 90) return '#f59e0b'
            return '#dc2626'
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

    const currentValue = displayMode === 'available' ? available : totalExpenses
    const currentPercentage = budget ? Math.max(0, Math.round((currentValue / budget) * 100)) : 0

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
        relative cursor-pointer bg-gradient-to-r from-white to-blue-50/30 rounded-2xl
        pt-4 pb-4 px-4
        shadow-sm ring-1 ring-black/5
        border border-blue-200 w-full min-h-[100px]
        active:scale-[0.98] transition-all duration-200
        focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 outline-none
      "
        >
            {/* Zentrierender Wrapper */}
            <div className="flex items-center h-full">
                <div className="grid grid-cols-[auto,1fr,auto,auto] items-center gap-4 w-full">
                    {/* Icon */}
                    <div className="bg-blue-100 w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Icon className="h-5 w-5 text-blue-700 block" />
                    </div>

                    {/* Titel */}
                    <div className="flex-1 min-w-0 text-left">
                        <h3 className="text-lg font-semibold text-slate-800 truncate leading-tight">
                            {title}
                        </h3>
                    </div>

                    {/* Fortschrittsanzeige */}
                    <div className="flex-shrink-0 flex items-center justify-center">
                        <CompactProgress
                            percentage={animatedPercentage}
                            mode={displayMode}
                            size={40}
                        />
                    </div>

                    {/* Summe + Umschalter */}
                    <div className="text-right flex-shrink-0 min-w-[88px] flex flex-col items-end justify-center gap-1">
                        <p className="text-lg font-semibold text-slate-800 leading-none">
                            €{animatedValue.toLocaleString()}
                        </p>
                        <button
                            onClick={handleToggle}
                            className="inline-flex items-center h-6 px-2 rounded-md border border-blue-200 text-[11px] text-blue-700 bg-blue-50"
                        >
                            {displayMode === 'available' ? 'verfügbar' : 'ausgegeben'}
                        </button>
                    </div>
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
