

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
        if (sortBy === "confirmed") {
            // Wir nehmen an, dass jedes Expense-Item einen isConfirmed-Status hat
            // Wenn nicht vorhanden, nehmen wir an, dass es bestätigt ist (true)
            const confirmedA = a.isConfirmed !== undefined ? a.isConfirmed : true
            const confirmedB = b.isConfirmed !== undefined ? b.isConfirmed : true

            // Sortiere bestätigte Items (grünes Häkchen) zuerst (wenn aufsteigend)
            // oder unbestätigte Items (orangenes Ausrufezeichen) zuerst (wenn absteigend)
            if (confirmedA === confirmedB) return 0
            if (sortDirection === "asc") {
                return confirmedA ? -1 : 1 // Bestätigte zuerst bei aufsteigender Sortierung
            } else {
                return confirmedA ? 1 : -1 // Unbestätigte zuerst bei absteigender Sortierung
            }
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
                <div className="flex-1">
                    <button onClick={() => handleSort("date")} className={`flex items-center text-blue-600 font-semibold`}>
                        <span className="inline-block">Datum</span>
                        <span className="w-3 ml-1">
              {sortBy === "date" && (
                  <ChevronDown
                      className={`h-3 w-3 transition-transform ${sortDirection === "desc" ? "transform rotate-180" : ""}`}
                  />
              )}
            </span>
                    </button>
                </div>
                <div className="w-24 text-right">
                    <button
                        onClick={() => handleSort("amount")}
                        className={`flex items-center justify-end ml-auto text-blue-600 font-semibold`}
                    >
                        <span className="inline-block">Betrag</span>
                        <span className="w-3 ml-1">
              {sortBy === "amount" && (
                  <ChevronDown
                      className={`h-3 w-3 transition-transform ${sortDirection === "desc" ? "transform rotate-180" : ""}`}
                  />
              )}
            </span>
                    </button>
                </div>
                <div className="w-12 text-center">
                    <button
                        onClick={() => handleSort("confirmed")}
                        className={`flex items-center justify-center text-blue-600 font-semibold`}
                    >
                        <span className="inline-block">OK</span>
                        <span className="w-3 ml-1">
              {sortBy === "confirmed" && (
                  <ChevronDown
                      className={`h-3 w-3 transition-transform ${sortDirection === "desc" ? "transform rotate-180" : ""}`}
                  />
              )}
            </span>
                    </button>
                </div>
            </div>

            <div className="expenses-scroll-area rounded-lg p-4 flex-1 [&>div]:mb-[0.125rem]">
                {sortedExpenses.map((item) => (
                    <ExpenseItem key={item.id} item={item} onDelete={onDelete} onEdit={onEdit} />
                ))}
            </div>
        </div>
    )
}
