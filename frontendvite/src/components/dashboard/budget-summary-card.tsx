import type { Expense } from '@/types'

interface BudgetSummaryCardProps {
    title: string
    budget: number
    totalExpenses?: number
    percentageUsed?: number
    onBudgetClick: () => void
    onTitleClick?: () => void
    onCategoryChange?: (category: string) => void
    expenses?: Expense[] // Optional: Liste der Ausgaben
    currentCategory?: string // Aktuelle Kategorie
}

export function BudgetSummaryCard({
    title,
    budget,
    totalExpenses = 0,
    percentageUsed,
    onBudgetClick,
    onTitleClick,
    onCategoryChange,

    currentCategory = 'gesamt',
}: BudgetSummaryCardProps) {
    // Kategorie-Auswahl wurde nach BudgetPageInner verschoben
    const hideBudget = currentCategory !== 'gesamt' // Nur im Modus „gesamt" wird das Budget angezeigt

    // 💡 Sichere Fallbacks für Berechnungen
    const safeExpenses = typeof totalExpenses === 'number' ? totalExpenses : 0
    const safePercentageUsed =
        typeof percentageUsed === 'number'
            ? percentageUsed
            : Math.min(100, Math.round((safeExpenses / budget) * 100))

    return (
        <div
            className={`p-4 rounded-lg bg-gradient-to-r from-blue-50 via-blue-100 to-blue-50 ${hideBudget ? 'pb-2' : ''}`}
        >
            <h4
                className="text-lg font-semibold text-black mb-3 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={onTitleClick || (() => console.log(`${title} Übersicht anzeigen`))}
            >
                <div className="flex justify-between items-center">
                    <span>{title}</span>
                    <span
                        className="text-blue-600 text-base font-semibold cursor-pointer"
                        onClick={e => {
                            e.stopPropagation() // Verhindert, dass onTitleClick ausgelöst wird
                            onCategoryChange?.('gesamt') // Ruft die Callback-Funktion auf
                        }}
                    >
                        {currentCategory}
                    </span>
                </div>
            </h4>

            {/* 🔁 Kategorie-Spezifische Ansicht */}
            {hideBudget ? (
                <div className="flex justify-between items-center py-2">
                    <span className="text-base font-medium text-gray-700">Ausgegeben:</span>
                    <span className="text-lg font-bold">€{safeExpenses.toFixed(2)}</span>
                </div>
            ) : (
                <>
                    {/* 🔹 Budget-Anzeige */}
                    <div className="flex justify-between items-center mb-1">
                        <button
                            className="flex items-center text-gray-700 hover:text-blue-600 transition-colors text-base font-medium"
                            onClick={onBudgetClick}
                        >
                            <span>Budget:</span>
                            <span className="ml-1 text-xs font-normal text-blue-600">
                                (bearbeiten)
                            </span>
                        </button>
                        <span className="text-base font-medium">€{budget}</span>
                    </div>

                    {/* 🔹 Ausgaben-Anzeige */}
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-base font-medium text-gray-700">Ausgegeben:</span>
                        <span className="text-base font-medium">€{safeExpenses.toFixed(2)}</span>
                    </div>

                    {/* 🔹 Verfügbarer Betrag */}
                    <div className="flex justify-between items-center mt-2">
                        <span className="text-base font-medium text-gray-700">Verfügbar:</span>
                        <span className="text-base font-bold text-green-600">
                            €{(budget - safeExpenses).toFixed(2)}
                        </span>
                    </div>

                    {/* 🔹 Fortschrittsbalken */}
                    <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-blue-600 rounded-full"
                            style={{ width: `${safePercentageUsed}%` }}
                        ></div>
                    </div>
                    <div className="text-right text-sm font-normal text-gray-500 mt-1">
                        {safePercentageUsed}% verbraucht
                    </div>
                </>
            )}
        </div>
    )
}

export default BudgetSummaryCard
