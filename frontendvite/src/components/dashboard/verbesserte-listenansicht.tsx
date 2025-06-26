'use client'

import { useState, useMemo } from 'react'
import { ArrowUpDown, ChevronDown } from 'lucide-react'
import type { Expense } from '@/types'
import { ExpenseItem } from '@/components/dashboard/expense-item'
import { useClarificationReactions } from '@/context/clarificationContext'

// 🔘 Kleiner Kategorie-Button für obere Schnellnavigation
function CategoryChip({ label }: { label: string }) {
    return (
        <button className="whitespace-nowrap text-sm bg-gray-100 px-3 py-1 rounded-full hover:bg-gray-200 transition">
            {label}
        </button>
    )
}

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

    const parseAmount = (amount: string | number): number => {
        if (typeof amount === 'number') return amount
        if (typeof amount === 'string') {
            return parseFloat(amount.replace(/[^\d,-]/g, '').replace(',', '.')) || 0
        }
        return 0
    }

    // 🔄 Erweiterung der Ausgaben mit Bestätigungsstatus
    type ExpenseWithConfirmation = Expense & { isConfirmed: boolean }

    const enrichedExpenses: ExpenseWithConfirmation[] = useMemo(() => {
        return expenses.map(expense => ({
            ...expense,
            isConfirmed: getIsConfirmed?.(expense.id) ?? false,
        }))
    }, [expenses, getIsConfirmed, unconfirmedCount])

    // 🔃 Sortierung anwenden je nach Auswahl
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
                return sortDirection === 'asc'
                    ? parseDate(a.date).getTime() - parseDate(b.date).getTime()
                    : parseDate(b.date).getTime() - parseDate(a.date).getTime()
            }

            if (sortBy === 'amount') {
                return sortDirection === 'asc'
                    ? parseAmount(a.amount) - parseAmount(b.amount)
                    : parseAmount(b.amount) - parseAmount(a.amount)
            }

            if (sortBy === 'confirmed') {
                return sortDirection === 'asc'
                    ? Number(a.isConfirmed) - Number(b.isConfirmed)
                    : Number(b.isConfirmed) - Number(a.isConfirmed)
            }

            return 0
        })
    }, [enrichedExpenses, sortBy, sortDirection])

    const handleSort = (field: string) => {
        if (sortBy === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
        } else {
            setSortBy(field)
            setSortDirection('asc')
        }
    }

    return (
        // 📦 Wichtig: Diese Komponente muss in einem Eltern-Container mit fester Höhe (z. B. h-full oder h-screen) verwendet werden!
        <div className="flex flex-col h-full px-1 pt-1">
            {/* 🔷 Horizontale Schnellnavigation nach Kategorie */}
            <div className="overflow-x-auto no-scrollbar">
                <div className="flex gap-2 w-max">
                    <CategoryChip label="Alle" />
                    <CategoryChip label="Kind" />
                    <CategoryChip label="Lebensmittel" />
                    <CategoryChip label="Fixkosten" />
                    <CategoryChip label="Freizeit" />
                </div>
            </div>

            {/* 🔠 Kopfzeile mit Sortieroptionen */}
            <div className="px-0 py-2 flex items-center text-xs font-medium text-gray-500">
                <div className="w-8 flex justify-center">
                    <ArrowUpDown className="h-3 w-3" />
                </div>

                <div className="flex flex-1 gap-1 items-center">
                    {!scopeFlags?.isPersonal && (
                        <button
                            onClick={() => handleSort('user')}
                            className="flex items-center text-blue-600 font-semibold"
                        >
                            <span>Nutzer</span>
                            <ChevronDown
                                className={`ml-1 w-3 h-3 transition-transform ${
                                    sortBy === 'user' ? '' : 'invisible'
                                } ${sortDirection === 'desc' ? 'rotate-180' : ''}`}
                            />
                        </button>
                    )}

                    <button
                        onClick={() => handleSort('date')}
                        className="flex items-center text-blue-600 font-semibold"
                    >
                        <span>Datum</span>
                        <ChevronDown
                            className={`ml-1 w-3 h-3 transition-transform ${
                                sortBy === 'date' ? '' : 'invisible'
                            } ${sortDirection === 'desc' ? 'rotate-180' : ''}`}
                        />
                    </button>

                    <div className="flex ml-auto">
                        <button
                            onClick={() => handleSort('amount')}
                            className="flex items-center text-blue-600 font-semibold"
                        >
                            <span>Betrag</span>
                            <ChevronDown
                                className={`ml-1 w-3 h-3 transition-transform ${
                                    sortBy === 'amount' ? '' : 'invisible'
                                } ${sortDirection === 'desc' ? 'rotate-180' : ''}`}
                            />
                        </button>

                        {!scopeFlags?.isPersonal && (
                            <button
                                onClick={() => handleSort('confirmed')}
                                className="flex items-center text-blue-600 font-semibold ml-2"
                            >
                                <span>OK</span>
                                <ChevronDown
                                    className={`ml-1 w-3 h-3 transition-transform ${
                                        sortBy === 'confirmed' ? '' : 'invisible'
                                    } ${sortDirection === 'desc' ? 'rotate-180' : ''}`}
                                />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* 📜 Scrollbarer Bereich für die Liste der Items */}
            <div className="flex-1 min-h-0 overflow-y-auto px-0 py-2">
                {sortedExpenses.length === 0 ? (
                    <div className="text-center text-sm text-gray-400 py-8">
                        Keine Ausgaben vorhanden
                    </div>
                ) : (
                    <div className="grid grid-cols-1 auto-rows-auto gap-[0.125rem]">
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
                )}
            </div>
        </div>
    )
}
