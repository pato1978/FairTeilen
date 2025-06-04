'use client'

import { useState, useMemo } from 'react'
import { ArrowUpDown, ChevronDown } from 'lucide-react'
import type { Expense } from '@/types'
import { ExpenseItem } from '@/components/dashboard/expense-item'
import { useClarificationReactions } from '@/context/clarificationContext'

// 📦 Props für diese Komponente
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
    const [sortBy, setSortBy] = useState<string | null>(null)
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

    const { getIsConfirmed, getUnconfirmedCount } = useClarificationReactions()
    const unconfirmedCount = getUnconfirmedCount()

    // 🔢 Betrag als Zahl interpretieren
    const parseAmount = (amount: string | number): number => {
        if (typeof amount === 'number') return amount
        if (typeof amount === 'string') {
            return parseFloat(amount.replace(/[^\d,-]/g, '').replace(',', '.')) || 0
        }
        return 0
    }

    // ✅ Zusätzliche Info: isConfirmed vom Kontext
    type ExpenseWithConfirmation = Expense & { isConfirmed: boolean }

    const enrichedExpenses: ExpenseWithConfirmation[] = useMemo(() => {
        return expenses.map(expense => {
            const confirmed = getIsConfirmed?.(expense.id) ?? false
            console.log('→', expense.id, confirmed)
            return {
                ...expense,
                isConfirmed: confirmed,
            }
        })
    }, [expenses, getIsConfirmed, unconfirmedCount])

    // 🔃 Sortierung anhand ausgewähltem Kriterium
    const sortedExpenses = useMemo(() => {
        const list = [...enrichedExpenses]
        if (!sortBy) return list

        return list.sort((a, b) => {
            if (sortBy === 'user') {
                const userA = a.createdByUserId ?? ''
                const userB = b.createdByUserId ?? ''
                return sortDirection === 'asc'
                    ? userA.localeCompare(userB)
                    : userB.localeCompare(userA)
            }

            if (sortBy === 'date') {
                const parseDate = (dateStr: string) =>
                    dateStr === 'Heute'
                        ? new Date()
                        : new Date(dateStr.split('.').reverse().join('-'))
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
    }, [enrichedExpenses, sortBy, sortDirection])

    // 🔁 Sortier-Button-Verhalten
    const handleSort = (field: string) => {
        if (sortBy === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
        } else {
            setSortBy(field)
            setSortDirection('asc')
        }
    }

    return (
        <div className="border-t pt-4 mt-4 flex-1 flex flex-col overflow-hidden">
            {/* 🔠 Kopfzeile mit Sortieroptionen */}
            <div className="px-4 py-2 flex items-center text-xs font-medium text-gray-500">
                {/* Symbolspalte ganz links */}
                <div className="w-8 flex justify-center">
                    <ArrowUpDown className="h-3 w-3" />
                </div>

                {/* Flex-Container für Sortierbuttons */}
                <div className="flex flex-1 gap-1 items-center">
                    {/* Nutzer-Sortierung – nur wenn NICHT personal */}
                    {!scopeFlags?.isPersonal && (
                        <button
                            onClick={() => handleSort('user')}
                            className="flex items-center text-blue-600 font-semibold"
                        >
                            <span>Nutzer</span>
                            <span className="ml-1 w-3 h-3 inline-flex items-center justify-center">
                                <ChevronDown
                                    className={`w-3 h-3 transition-transform ${
                                        sortBy === 'user' ? '' : 'invisible'
                                    } ${sortDirection === 'desc' ? 'rotate-180' : ''}`}
                                />
                            </span>
                        </button>
                    )}

                    {/* Datum immer sichtbar */}
                    <button
                        onClick={() => handleSort('date')}
                        className="flex items-center text-blue-600 font-semibold"
                    >
                        <span>Datum</span>
                        <span className="ml-1 w-3 h-3 inline-flex items-center justify-center">
                            <ChevronDown
                                className={`w-3 h-3 transition-transform ${
                                    sortBy === 'date' ? '' : 'invisible'
                                } ${sortDirection === 'desc' ? 'rotate-180' : ''}`}
                            />
                        </span>
                    </button>

                    {/* Betrag + OK-Spalte rechtsbündig */}
                    <div className="flex ml-auto">
                        {/* Betrag immer sichtbar */}
                        <button
                            onClick={() => handleSort('amount')}
                            className="flex items-center text-blue-600 font-semibold"
                        >
                            <span>Betrag</span>
                            <span className="ml-1 w-3 h-3 inline-flex items-center justify-center">
                                <ChevronDown
                                    className={`w-3 h-3 transition-transform ${
                                        sortBy === 'amount' ? '' : 'invisible'
                                    } ${sortDirection === 'desc' ? 'rotate-180' : ''}`}
                                />
                            </span>
                        </button>

                        {/* OK-Sortierung – nur wenn NICHT personal */}
                        {!scopeFlags?.isPersonal && (
                            <button
                                onClick={() => handleSort('confirmed')}
                                className="flex items-center text-blue-600 font-semibold ml-2"
                            >
                                <span>OK</span>
                                <span className="ml-1 w-3 h-3 inline-flex items-center justify-center">
                                    <ChevronDown
                                        className={`w-3 h-3 transition-transform ${
                                            sortBy === 'confirmed' ? '' : 'invisible'
                                        } ${sortDirection === 'desc' ? 'rotate-180' : ''}`}
                                    />
                                </span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* 📜 Scrollbereich für Einträge */}
            <div className="expenses-scroll-area rounded-lg p-4 flex-1 [&>div]:mb-[0.125rem]">
                {sortedExpenses.length === 0 ? (
                    <div className="text-center text-sm text-gray-400 py-8">
                        Keine Ausgaben vorhanden
                    </div>
                ) : (
                    sortedExpenses.map(item => (
                        <ExpenseItem
                            key={item.id}
                            item={item}
                            onDelete={onDelete}
                            onEdit={onEdit}
                            scopeFlags={scopeFlags}
                        />
                    ))
                )}
            </div>
        </div>
    )
}
