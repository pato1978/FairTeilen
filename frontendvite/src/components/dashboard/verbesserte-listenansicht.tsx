'use client'

import { useState } from 'react'
import { ArrowUpDown, ChevronDown } from 'lucide-react'
import type { Expense } from '@/types'
import { ExpenseItem } from '@/components/dashboard/expense-item'
import { useClarificationReactions } from '@/context/clarificationContext'

// 🔧 Props-Definition für die Komponente
interface VerbesserteLitenansichtProps {
    expenses: Expense[]
    onDelete: (id: string) => void | Promise<void>
    onEdit: (expense: Expense) => void
    scopeFlags?: {
        isPersonal: boolean
        isShared: boolean
        isChild: boolean
    }
}

export function VerbesserteLitenansicht({
    expenses,
    onDelete,
    onEdit,
    scopeFlags,
}: VerbesserteLitenansichtProps) {
    // 🔁 Sortierkriterien
    const [sortBy, setSortBy] = useState<string | null>(null)
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

    // 🧠 Zugriff auf den Context (liefert isConfirmed für jede Ausgabe)
    const { getIsConfirmed } = useClarificationReactions()

    // 🔁 Sortierfeld aktualisieren
    const handleSort = (field: string) => {
        if (sortBy === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
        } else {
            setSortBy(field)
            setSortDirection('asc')
        }
    }

    // 💶 Betrag konvertieren (z. B. "12,50 €" → 12.5)
    const parseAmount = (amount: string | number): number => {
        if (typeof amount === 'number') return amount
        if (typeof amount === 'string') {
            return parseFloat(amount.replace(/[^\d,-]/g, '').replace(',', '.')) || 0
        }
        console.warn('Unerwarteter Betragstyp:', amount)
        return 0
    }

    // 💡 Erweiterter Typ mit isConfirmed
    type ExpenseWithConfirmation = Expense & { isConfirmed: boolean }

    // 📌 Anreicherung der Ausgaben mit Confirmed-Status
    const enrichedExpenses: ExpenseWithConfirmation[] = expenses.map(expense => ({
        ...expense,
        isConfirmed: getIsConfirmed(expense.id),
    }))

    // 📊 Sortierte Liste
    const sortedExpenses = [...enrichedExpenses].sort((a, b) => {
        if (!sortBy) return 0

        if (sortBy === 'user') {
            const userA = a.createdByUserId ?? ''
            const userB = b.createdByUserId ?? ''
            return sortDirection === 'asc' ? userA.localeCompare(userB) : userB.localeCompare(userA)
        }

        if (sortBy === 'date') {
            const parseDate = (dateStr: string) =>
                dateStr === 'Heute' ? new Date() : new Date(dateStr.split('.').reverse().join('-'))
            const dateA = parseDate(a.date).getTime()
            const dateB = parseDate(b.date).getTime()
            return sortDirection === 'asc' ? dateA - dateB : dateB - dateA
        }

        if (sortBy === 'amount') {
            const amountA = parseAmount(a.amount)
            const amountB = parseAmount(b.amount)
            return sortDirection === 'asc' ? amountA - amountB : amountB - amountA
        }

        if (sortBy === 'confirmed') {
            const confirmedA = a.isConfirmed ? 1 : 0
            const confirmedB = b.isConfirmed ? 1 : 0
            return sortDirection === 'asc' ? confirmedA - confirmedB : confirmedB - confirmedA
        }

        return 0
    })

    return (
        <div className="border-t pt-4 mt-4 flex-1 flex flex-col overflow-hidden">
            {/* 📌 Kopfzeile mit Sortierbuttons */}
            <div className="px-4 py-2 flex items-center text-xs font-medium text-gray-500">
                <div className="w-8 flex justify-center">
                    <div className="flex items-center text-gray-500">
                        <ArrowUpDown className="h-3 w-3" />
                    </div>
                </div>

                {/* 👤 Nutzer + 📅 Datum */}
                <div className="flex flex-[2] gap-1 items-center">
                    <button
                        onClick={() => handleSort('user')}
                        className="flex items-center text-blue-600 font-semibold"
                    >
                        <span className="inline-block">Nutzer</span>
                        <span className="w-3 ml-1">
                            {sortBy === 'user' && (
                                <ChevronDown
                                    className={`h-3 w-3 transition-transform ${
                                        sortDirection === 'desc' ? 'rotate-180' : ''
                                    }`}
                                />
                            )}
                        </span>
                    </button>

                    <button
                        onClick={() => handleSort('date')}
                        className="flex items-center text-blue-600 font-semibold"
                    >
                        <span className="inline-block">Datum</span>
                        <span className="w-3 ml-1">
                            {sortBy === 'date' && (
                                <ChevronDown
                                    className={`h-3 w-3 transition-transform ${
                                        sortDirection === 'desc' ? 'rotate-180' : ''
                                    }`}
                                />
                            )}
                        </span>
                    </button>
                </div>

                {/* 💶 Betrag */}
                <div className="w-24 text-right">
                    <button
                        onClick={() => handleSort('amount')}
                        className="flex items-center justify-end ml-auto text-blue-600 font-semibold"
                    >
                        <span className="inline-block">Betrag</span>
                        <span className="w-3 ml-1">
                            {sortBy === 'amount' && (
                                <ChevronDown
                                    className={`h-3 w-3 transition-transform ${
                                        sortDirection === 'desc' ? 'rotate-180' : ''
                                    }`}
                                />
                            )}
                        </span>
                    </button>
                </div>

                {/* ✅ Bestätigt */}
                <div className="w-12 text-center">
                    <button
                        onClick={() => handleSort('confirmed')}
                        className="flex items-center justify-center text-blue-600 font-semibold"
                    >
                        <span className="inline-block">OK</span>
                        <span className="w-3 ml-1">
                            {sortBy === 'confirmed' && (
                                <ChevronDown
                                    className={`h-3 w-3 transition-transform ${
                                        sortDirection === 'desc' ? 'rotate-180' : ''
                                    }`}
                                />
                            )}
                        </span>
                    </button>
                </div>
            </div>

            {/* 📋 Ausgabe-Liste */}
            <div className="expenses-scroll-area rounded-lg p-4 flex-1 [&>div]:mb-[0.125rem]">
                {sortedExpenses.map(item => (
                    <ExpenseItem
                        key={item.id}
                        item={item}
                        onDelete={onDelete}
                        onEdit={onEdit}
                        scopeFlags={scopeFlags}
                    />
                ))}
            </div>
        </div>
    )
}
