import { useState } from 'react'
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
    expenses?: Expense[]
    currentCategory?: string
}

export function BudgetSummaryCard({
    title,
    budget,

    // percentageUsed,
    onBudgetClick,
    onTitleClick,
    onCategoryChange,
    expenses = [],
    currentCategory = 'gesamt',
}: BudgetSummaryCardProps) {
    const hideBudget = currentCategory !== 'gesamt'

    // 🆕 Toggle-State für Anzeige-Modus
    const [excludeRecurring, setExcludeRecurring] = useState(true)

    const parseAmount = (val: unknown) =>
        typeof val === 'number' ? val : parseFloat(String(val).replace(',', '.')) || 0

    const getFilteredExpenses = () => {
        if (currentCategory === 'gesamt') return expenses
        if (currentCategory === 'wiederkehrend') return expenses.filter(e => e.isRecurring === true)
        return expenses.filter(e => e.category?.toLowerCase() === currentCategory.toLowerCase())
    }

    const filteredExpenses = getFilteredExpenses()

    const expensesByUser = filteredExpenses.reduce(
        (acc, expense) => {
            const userId = expense.createdByUserId || 'unknown'
            if (!acc[userId]) acc[userId] = 0
            acc[userId] += parseAmount(expense.amount)
            return acc
        },
        {} as Record<string, number>
    )

    const sortedUserExpenses = Object.entries(expensesByUser)
        .sort(([, a], [, b]) => b - a)
        .map(([userId, amount]) => ({
            userId,
            amount,
            user: users[userId] || { name: 'Unbekannt', initials: '?', color: 'gray-500' },
        }))

    const getUserColorClasses = (userColor: string) => {
        const [colorName] = userColor.split('-')
        return {
            bg: `bg-${colorName}-50`,
            border: `border-${colorName}-300`,
            text: `text-${colorName}-700`,
        }
    }

    const calculatedTotalExpenses = sortedUserExpenses.reduce((sum, { amount }) => sum + amount, 0)

    const recurringTotal = expenses
        .filter(e => e.isRecurring)
        .reduce((sum, e) => sum + parseAmount(e.amount), 0)

    const nonRecurringTotal = expenses
        .filter(e => !e.isRecurring)
        .reduce((sum, e) => sum + parseAmount(e.amount), 0)

    const displayedTotal =
        currentCategory === 'gesamt'
            ? excludeRecurring
                ? nonRecurringTotal
                : nonRecurringTotal + recurringTotal
            : calculatedTotalExpenses

    return (
        <div
            className={`p-4 rounded-lg bg-gradient-to-r from-blue-50 via-blue-100 to-blue-50 ${
                hideBudget ? 'pb-2' : ''
            }`}
        >
            <h4
                className="text-lg font-semibold text-black mb-3 cursor-pointer hover:opacity-80 transition-opacity min-h-[44px] flex items-center active:scale-[0.98]"
                onClick={onTitleClick || (() => console.log(`${title} Übersicht anzeigen`))}
            >
                <div className="flex justify-between items-center w-full">
                    <span>{title}</span>
                    <button
                        className="text-black text-base font-semibold cursor-pointer px-3 py-2 hover:bg-blue-200/50 rounded-lg transition-colors min-w-[80px] min-h-[44px] active:scale-95"
                        onClick={e => {
                            e.stopPropagation()
                            onCategoryChange?.('gesamt')
                        }}
                    >
                        {currentCategory}
                    </button>
                </div>
            </h4>

            {hideBudget ? (
                <div className="space-y-2">
                    <div className="flex justify-between items-center py-1">
                        <span className="text-base font-medium text-gray-700">Ausgegeben:</span>
                        <span className="text-lg font-bold">€{displayedTotal.toFixed(2)}</span>
                    </div>

                    {sortedUserExpenses.length > 0 ? (
                        <div className="space-y-1.5 pt-2 border-t border-blue-200">
                            {sortedUserExpenses.map(({ userId, amount, user }) => {
                                const { bg, border, text } = getUserColorClasses(user.color)
                                return (
                                    <div key={userId} className="flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <div
                                                className={`w-6 h-6 text-xs font-semibold border flex items-center justify-center rounded-full ${text} ${border} ${bg} transition-transform duration-200 hover:scale-110`}
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
                    <div className="flex justify-between items-center mb-1">
                        <button
                            className="flex items-center text-gray-700 hover:text-blue-600 transition-colors text-base font-medium px-2 py-2 -ml-2 rounded-lg hover:bg-blue-100/50 active:scale-95 min-h-[44px]"
                            onClick={onBudgetClick}
                        >
                            <span>Budget:</span>
                            <span className="ml-1 text-xs font-normal text-blue-600">
                                (bearbeiten)
                            </span>
                        </button>
                        <span className="text-base font-medium">€{budget}</span>
                    </div>

                    {/* 🔄 Toggle + Anzeige */}
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-base font-medium text-gray-700">
                            {excludeRecurring
                                ? 'Ausgegeben (ohne wiederkehrend):'
                                : 'Ausgegeben (inkl. wiederkehrend):'}
                        </span>
                        <div className="flex items-center gap-2">
                            <span className="text-base font-medium">
                                €{displayedTotal.toFixed(2)}
                            </span>
                            <button
                                onClick={() => setExcludeRecurring(prev => !prev)}
                                className="text-xs px-2 py-1 border border-gray-300 rounded hover:bg-gray-100"
                                title="Anzeige umschalten"
                            >
                                {excludeRecurring ? 'inkl.' : 'ohne'}
                            </button>
                        </div>
                    </div>

                    <div className="flex justify-between items-center mb-3">
                        <span className="text-sm text-gray-600">
                            davon wiederkehrend (separat):
                        </span>
                        <span className="text-sm text-gray-600">€{recurringTotal.toFixed(2)}</span>
                    </div>

                    {sortedUserExpenses.length > 0 ? (
                        <div className="space-y-1.5 mt-3 pt-3 border-t border-blue-200">
                            {sortedUserExpenses.map(({ userId, amount, user }) => {
                                const { bg, border, text } = getUserColorClasses(user.color)
                                return (
                                    <div key={userId} className="flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <div
                                                className={`w-6 h-6 text-xs font-semibold border flex items-center justify-center rounded-full ${text} ${border} ${bg} transition-transform duration-200 hover:scale-110`}
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
