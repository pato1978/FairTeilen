"use client"

import { useState } from "react"
import { ArrowUpDown, ChevronDown } from "lucide-react"
import type { Expense } from "@/types"
import { ExpenseItem } from "@/components/dashboard/expense-item"

interface VerbesserteLitenansichtProps {
    expenses: Expense[]
    onDelete: (id: string) => void | Promise<void>
    onEdit: (expense: Expense) => void
}

export function VerbesserteLitenansicht({ expenses, onDelete, onEdit }: VerbesserteLitenansichtProps) {
    const [sortBy, setSortBy] = useState<string | null>(null)
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

    const handleSort = (field: string) => {
        if (sortBy === field) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc")
        } else {
            setSortBy(field)
            setSortDirection("asc")
        }
    }

    const sortedExpenses = [...expenses].sort((a, b) => {
        if (!sortBy) return 0

        if (sortBy === "date") {
            const parseDate = (dateStr: string) =>
                dateStr === "Heute"
                    ? new Date()
                    : new Date(dateStr.split(".").reverse().join("-"))

            const dateA = parseDate(a.date).getTime()
            const dateB = parseDate(b.date).getTime()
            return sortDirection === "asc" ? dateA - dateB : dateB - dateA
        }

        if (sortBy === "amount") {
            const parseAmount = (amountStr: string) =>
                parseFloat(amountStr.replace(/[^\d,-]/g, "").replace(",", ".")) || 0

            const amountA = parseAmount(a.amount)
            const amountB = parseAmount(b.amount)
            return sortDirection === "asc" ? amountA - amountB : amountB - amountA
        }

        return 0
    })

    return (
        <div className="border-t pt-4 mt-4 flex-1 flex flex-col overflow-hidden">
            {/* Kopfzeile für die Sortierung */}
            <div className="px-4 py-2 flex items-center text-xs font-medium text-gray-500">
                <div className="w-8 flex justify-center">
                    <div className="flex items-center text-gray-500">
                        <ArrowUpDown className="h-3 w-3" />
                    </div>
                </div>
                <div className="flex-1 flex">
                    <button
                        onClick={() => handleSort("date")}
                        className="flex items-center text-blue-600 font-semibold"
                    >
                        <span className="inline-block w-14">Datum</span>
                        <span className="w-3">
              {sortBy === "date" && (
                  <ChevronDown
                      className={`h-3 w-3 transition-transform ${sortDirection === "desc" ? "rotate-180" : ""}`}
                  />
              )}
            </span>
                    </button>
                </div>
                <div className="w-20 text-right">
                    <button
                        onClick={() => handleSort("amount")}
                        className="flex items-center justify-end ml-auto text-blue-600 font-semibold"
                    >
                        <span className="inline-block w-10">Betrag</span>
                        <span className="w-3">
              {sortBy === "amount" && (
                  <ChevronDown
                      className={`h-3 w-3 transition-transform ${sortDirection === "desc" ? "rotate-180" : ""}`}
                  />
              )}
            </span>
                    </button>
                </div>
            </div>

            <div className="expenses-scroll-area rounded-lg p-4 flex-1 [&>div]:mb-[0.125rem]">
                {sortedExpenses.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center mt-6">Keine Ausgaben für diesen Monat.</p>
                ) : (
                    sortedExpenses.map((item) => (
                        <ExpenseItem key={item.id} item={item} onDelete={onDelete} onEdit={onEdit} />
                    ))
                )}
            </div>
        </div>
    )
}
