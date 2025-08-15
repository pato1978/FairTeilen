import { Info, LucideIcon } from 'lucide-react'
import { CircularProgress } from '@/components/dashboard/circular-progress'
import { calculateTotalExpensesWithoutRecurring } from '@/lib/budget-utils.ts'
import { useEffect, useState } from 'react'

interface ExpenseItem {
    amount: string | number
}

interface BudgetCardProps {
    icon: LucideIcon
    title: string
    // ⛔ period gibt es nicht mehr – NICHT mehr übergeben
    expenses: ExpenseItem[]
    budget: number
    onClick: () => void
    showInfoButton?: boolean
    onInfoClick?: () => void
    isLoading?: boolean
}

/**
 * 💳 Budget-Karte (kompakt, mit Umschalter & freundlicher Nachricht anstelle von "monatlich/jährlich")
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
}: BudgetCardProps) {
    const [mode, setMode] = useState<'available' | 'spent'>('available')

    // Zahlenberechnungen
    const total = calculateTotalExpensesWithoutRecurring(expenses)
    const available = Math.max(0, budget - total)
    const displayValue = mode === 'available' ? available : total

    // >100 % zulassen (Text), Visualisierung auf 100 % deckeln
    const rawPct = budget > 0 ? Math.round((displayValue / budget) * 100) : 0
    const visualPct = Math.min(rawPct, 100)

    // Animation
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
            setAnimatedPercentage(Math.round(visualPct * progress))
            if (step >= steps) clearInterval(timer)
        }, interval)
        return () => clearInterval(timer)
    }, [visualPct])

    // Freundliche Nachricht (ersetzt PeriodBadge-Position)
    const friendlyMessage = (mode: 'available' | 'spent', total: number, budget: number) => {
        const spentPercentage = budget ? (total / budget) * 100 : 0
        const availablePercentage = Math.max(0, 100 - spentPercentage)

        if (mode === 'available') {
            if (availablePercentage > 50) return 'Noch viel Spielraum! 😊'
            if (availablePercentage > 25) return 'Alles im grünen Bereich'
            if (availablePercentage > 10) return 'Zeit zum Sparen 💰'
            if (availablePercentage > 0) return 'Fast geschafft!'
            return 'Budget erreicht'
        } else {
            if (spentPercentage < 50) return 'Du machst das super! 👍'
            if (spentPercentage < 75) return 'Läuft richtig gut'
            if (spentPercentage < 90) return 'Gut im Plan'
            if (spentPercentage < 100) return 'Aufpassen lohnt sich'
            return 'Budget überschritten'
        }
    }

    return (
        <button
            className="bg-gradient-to-br from-blue-50 to-white shadow-md rounded-lg p-6 active:bg-blue-50/70 transition-colors border border-blue-100 h-[230px] flex flex-col items-center justify-between"
            onClick={onClick}
            disabled={isLoading}
        >
            {/* Icon, Titel, Info */}
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

                {/* ⬇️ Stets sichtbare Message (ersetzt period/PeriodBadge) */}
                <div className="text-xs bg-blue-100/60 text-blue-700 px-2 py-0.5 rounded-full mt-1 text-center">
                    {friendlyMessage(mode, total, budget)}
                </div>
            </div>

            {/* Circular Progress + Werte */}
            <div className="w-full flex justify-center">
                <CircularProgress
                    percentage={animatedPercentage}
                    size={70}
                    strokeWidth={6}
                    color="#2563EB"
                >
                    <div className="text-center">
                        <span className="text-base font-bold">
                            €{displayValue.toLocaleString()}
                        </span>
                        <div className="text-[11px] text-slate-500">
                            {mode === 'available' ? 'verfügbar' : 'ausgegeben'}
                        </div>
                        {/* Optional: echte Prozentzahl anzeigen (kann >100% sein) */}
                        {/* <div className="text-[11px] text-slate-400">{rawPct}%</div> */}
                    </div>
                </CircularProgress>
            </div>

            {/* Umschalter (unten rechts) */}
            <div className="mt-2 flex items-center justify-end w-full text-xs">
                <button
                    type="button"
                    onClick={e => {
                        e.stopPropagation()
                        setMode(mode === 'available' ? 'spent' : 'available')
                    }}
                    className="text-blue-600 underline decoration-dotted underline-offset-2"
                >
                    {mode === 'available' ? 'auf ausgegeben' : 'auf verfügbar'} wechseln
                </button>
            </div>
        </button>
    )
}
