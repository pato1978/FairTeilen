import type { Expense } from '@/types'
import { users } from '@/data/users'

interface BudgetSummaryCardProps {
    title: string
    budget: number
    totalExpenses?: number
    percentageUsed?: number
    onBudgetClick: () => void
    onTitleClick?: () => void
    onCategoryChange?: (category: string) => void
    expenses?: Expense[] // Liste der Ausgaben für User-Aufschlüsselung
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
    expenses = [],
    currentCategory = 'gesamt',
}: BudgetSummaryCardProps) {
    const hideBudget = currentCategory !== 'gesamt' // Nur im Modus „gesamt" wird das Budget angezeigt

    // 💡 Sichere Fallbacks für Berechnungen
    const safeExpenses = typeof totalExpenses === 'number' ? totalExpenses : 0

    // 🔍 Filtere Ausgaben basierend auf der aktuellen Kategorie
    const getFilteredExpenses = () => {
        if (currentCategory === 'gesamt') {
            return expenses
        }

        // Filtere nach Kategorie
        return expenses.filter(expense => {
            // Für wiederkehrende Ausgaben
            if (currentCategory === 'wiederkehrend') {
                return expense.isRecurring === true
            }

            // Für normale Kategorien (z.B. 'lebensmittel', 'transport', etc.)
            // Annahme: expense.category enthält den Kategorienamen
            // Falls die Kategorie anders gespeichert ist, bitte anpassen
            return expense.category?.toLowerCase() === currentCategory.toLowerCase()
        })
    }

    const filteredExpenses = getFilteredExpenses()

    // 👥 Berechne Ausgaben pro User basierend auf gefilterten Ausgaben
    const expensesByUser = filteredExpenses.reduce(
        (acc, expense) => {
            const userId = expense.createdByUserId || 'unknown'
            if (!acc[userId]) {
                acc[userId] = 0
            }
            // Parse den Betrag sicher
            const amount =
                typeof expense.amount === 'number'
                    ? expense.amount
                    : parseFloat(String(expense.amount).replace(',', '.')) || 0
            acc[userId] += amount
            return acc
        },
        {} as Record<string, number>
    )

    // Sortiere User nach Ausgaben (höchste zuerst)
    const sortedUserExpenses = Object.entries(expensesByUser)
        .sort(([, a], [, b]) => b - a)
        .map(([userId, amount]) => ({
            userId,
            amount,
            user: users[userId] || { name: 'Unbekannt', initials: '?', color: 'gray-500' },
        }))

    // 🎨 Farbklassen für User-Badges
    const getUserColorClasses = (userColor: string) => {
        const [colorName] = userColor.split('-')
        return {
            bg: `bg-${colorName}-50`,
            border: `border-${colorName}-300`,
            text: `text-${colorName}-700`,
        }
    }

    // 📊 Berechne die tatsächliche Summe der gefilterten Ausgaben
    const calculatedTotalExpenses = sortedUserExpenses.reduce((sum, { amount }) => sum + amount, 0)

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
                        className="text-black text-base font-semibold cursor-pointer"
                        onClick={e => {
                            e.stopPropagation()
                            onCategoryChange?.('gesamt')
                        }}
                    >
                        {currentCategory}
                    </span>
                </div>
            </h4>

            {/* 🔁 Kategorie-Spezifische Ansicht */}
            {hideBudget ? (
                <div className="space-y-2">
                    {/* Gesamtausgaben für die aktuelle Kategorie */}
                    <div className="flex justify-between items-center py-1">
                        <span className="text-base font-medium text-gray-700">Ausgegeben:</span>
                        <span className="text-lg font-bold">
                            €{calculatedTotalExpenses.toFixed(2)}
                        </span>
                    </div>

                    {/* 👥 User-Aufschlüsselung für die aktuelle Kategorie */}
                    {sortedUserExpenses.length > 0 ? (
                        <div className="space-y-1.5 pt-2 border-t border-blue-200">
                            {sortedUserExpenses.map(({ userId, amount, user }) => {
                                const { bg, border, text } = getUserColorClasses(user.color)
                                return (
                                    <div key={userId} className="flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <div
                                                className={`w-6 h-6 text-xs font-semibold border flex items-center justify-center rounded-full ${text} ${border} ${bg}`}
                                            >
                                                {user.initials}
                                            </div>
                                            <span className="text-sm text-gray-600">
                                                {user.name}:
                                            </span>
                                        </div>
                                        <span className="text-sm font-medium">
                                            €{amount.toFixed(2)}
                                        </span>
                                    </div>
                                )
                            })}
                        </div>
                    ) : (
                        <div className="text-sm text-gray-500 italic pt-2">
                            Keine Ausgaben in dieser Kategorie
                        </div>
                    )}
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

                    {/* 🔹 Ausgaben-Anzeige (Gesamt) */}
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-base font-medium text-gray-700">Ausgegeben:</span>
                        <span className="text-base font-medium">€{safeExpenses.toFixed(2)}</span>
                    </div>

                    {/* 👥 User-Aufschlüsselung für ALLE Ausgaben */}
                    {sortedUserExpenses.length > 0 ? (
                        <div className="space-y-1.5 mt-3 pt-3 border-t border-blue-200">
                            {sortedUserExpenses.map(({ userId, amount, user }) => {
                                const { bg, border, text } = getUserColorClasses(user.color)
                                return (
                                    <div key={userId} className="flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <div
                                                className={`w-6 h-6 text-xs font-semibold border flex items-center justify-center rounded-full ${text} ${border} ${bg}`}
                                            >
                                                {user.initials}
                                            </div>
                                            <span className="text-sm text-gray-600">
                                                {user.name}:
                                            </span>
                                        </div>
                                        <span className="text-sm font-medium">
                                            €{amount.toFixed(2)}
                                        </span>
                                    </div>
                                )
                            })}
                        </div>
                    ) : (
                        <div className="text-sm text-gray-500 italic mt-3 pt-3 border-t border-blue-200">
                            Noch keine Ausgaben vorhanden
                        </div>
                    )}
                </>
            )}
        </div>
    )
}

export default BudgetSummaryCard
