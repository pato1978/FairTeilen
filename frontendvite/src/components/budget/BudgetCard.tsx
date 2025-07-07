import { Info, LucideIcon } from 'lucide-react'
import { CircularProgress } from '@/components/dashboard/circular-progress'
import { calculatePercentageUsed, calculateTotalExpenses } from '@/lib/budget-utils.ts'
import { useEffect, useState } from 'react'

export const PeriodBadge = ({ period }: { period: string }) => (
    <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full mt-1">
        {period}
    </span>
)

interface ExpenseItem {
    amount: string | number
}

interface BudgetCardProps {
    icon: LucideIcon
    title: string
    period: string
    expenses: ExpenseItem[]
    budget: number
    onClick: () => void
    showInfoButton?: boolean
    onInfoClick?: () => void
    isLoading?: boolean
}

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
}: BudgetCardProps) {
    const totalExpenses = calculateTotalExpenses(expenses)
    const percentage = calculatePercentageUsed(totalExpenses, budget)

    const [animatedPercentage, setAnimatedPercentage] = useState(0)

    useEffect(() => {
        setAnimatedPercentage(0)
        const duration = 1000
        const steps = 60
        const interval = duration / steps
        let step = 0

        const timer = setInterval(() => {
            step++
            const progress = Math.min(1, step / steps)
            setAnimatedPercentage(Math.round(percentage * progress))
            if (step >= steps) clearInterval(timer)
        }, interval)

        return () => clearInterval(timer)
    }, [percentage])

    return (
        <button
            className="bg-gradient-to-br from-blue-50 to-white shadow-md rounded-lg p-6 pt-6 pb-6 active:bg-blue-50/70 transition-colors border border-blue-100 h-[200px] flex flex-col items-center justify-center space-y-4"
            onClick={onClick}
            disabled={isLoading}
        >
            {/* Icon, Titel, Info, Period */}
            <div className="flex flex-col items-center w-full">
                <Icon className="h-6 w-6 mb-1 text-blue-600" />
                <h3 className="text-base font-bold text-center flex items-center">
                    {title}
                    {showInfoButton && (
                        <span
                            onClick={e => {
                                e.stopPropagation()
                                onInfoClick?.()
                            }}
                            className="ml-1 text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
                            aria-label="Mehr Informationen"
                            role="button"
                            tabIndex={0}
                        >
                            <Info className="h-3 w-3" />
                        </span>
                    )}
                </h3>
                <PeriodBadge period={period} />
            </div>

            {/* Circular Progress */}
            <div className="w-full flex justify-center">
                <CircularProgress
                    percentage={animatedPercentage}
                    size={70}
                    strokeWidth={6}
                    color="#2563EB"
                >
                    <div className="text-center">
                        <span className="text-base font-bold">€{totalExpenses}</span>
                    </div>
                </CircularProgress>
            </div>
        </button>
    )
}
