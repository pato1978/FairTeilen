"use client"

import { useState } from "react"
import { availableIcons } from "@/lib/icon-options"
import type { Expense } from "@/types"

interface BudgetSummaryCardProps {
    title: string
    budget: number
    totalExpenses?: number
    percentageUsed?: number
    onBudgetClick: () => void
    onTitleClick?: () => void
    onCategoryChange?: (category: string) => void

    // 🆕 Optional: Liste der Ausgaben, damit leere Kategorien übersprungen werden können
    expenses?: Expense[]
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
                                  }: BudgetSummaryCardProps) {
    const [categoryText, setCategoryText] = useState("gesamt")
    const hideBudget = categoryText !== "gesamt"

    // 💡 Fallbacks für Berechnungen
    const safeExpenses = typeof totalExpenses === "number" ? totalExpenses : 0
    const safePercentageUsed =
        typeof percentageUsed === "number"
            ? percentageUsed
            : Math.min(100, Math.round((safeExpenses / budget) * 100))

    // 🧠 Prüft, ob eine Kategorie in den übergebenen Ausgaben vorkommt und > 0 ist
    function hasExpenses(categoryName: string): boolean {
        return expenses.some(e => e.category === categoryName && e.amount > 0)
    }

    /**
     * 🔁 Kategorie wechseln:
     * - bei "gesamt" → erste gültige Kategorie mit Ausgaben
     * - sonst → nächste mit Ausgaben oder zurück zu "gesamt"
     */
    const chooseCategory = (current: string) => {
        let newCategory = "gesamt"

        if (current === "gesamt") {
            const next = availableIcons.find(icon => hasExpenses(icon.name))
            if (next) newCategory = next.name
        } else {
            const index = availableIcons.findIndex(icon => icon.name === current)
            if (index > -1) {
                const rest = availableIcons.slice(index + 1)
                const next = rest.find(icon => hasExpenses(icon.name))
                newCategory = next ? next.name : "gesamt"
            }
        }

        setCategoryText(newCategory)
        onCategoryChange?.(newCategory)
    }

    return (
        <div className={`p-4 rounded-lg bg-gradient-to-r from-blue-50 via-blue-100 to-blue-50 ${hideBudget ? "pb-2" : ""}`}>
            <h4
                className="text-lg font-semibold text-black mb-3 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={onTitleClick || (() => console.log(`${title} Übersicht anzeigen`))}
            >
                <div className="flex justify-between items-center">
                    <span>{title}</span>
                    <span
                        className="text-blue-600 text-base font-semibold cursor-pointer"
                        onClick={(e) => {
                            e.stopPropagation()
                            chooseCategory(categoryText)
                        }}
                    >
            {categoryText}
          </span>
                </div>
            </h4>

            {hideBudget ? (
                // 🔹 Kategorie-spezifische Ansicht (z. B. "Kind", "Lebensmittel")
                <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600 font-normal">Ausgegeben:</span>
                    <span className="font-bold">€{safeExpenses.toFixed(2)}</span>
                </div>
            ) : (
                <>
                    {/* 🔹 Budget-Anzeige */}
                    <div className="flex justify-between items-center mb-1">
                        <button
                            className="flex items-center text-gray-600 hover:text-blue-600 transition-colors font-normal"
                            onClick={onBudgetClick}
                        >
                            <span>Budget:</span>
                            <span className="ml-1 text-xs text-blue-600">(bearbeiten)</span>
                        </button>
                        <span className="font-normal">€{budget}</span>
                    </div>

                    {/* 🔹 Ausgaben */}
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-gray-600 font-normal">Ausgegeben:</span>
                        <span className="font-normal">€{safeExpenses.toFixed(2)}</span>
                    </div>

                    {/* 🔹 Verfügbar */}
                    <div className="flex justify-between items-center mt-2">
                        <span className="text-gray-600">Verfügbar:</span>
                        <span className="font-bold text-green-600">€{(budget - safeExpenses).toFixed(2)}</span>
                    </div>

                    {/* 🔹 Fortschrittsbalken */}
                    <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-600 rounded-full" style={{ width: `${safePercentageUsed}%` }}></div>
                    </div>
                    <div className="text-right text-sm text-gray-500 mt-1">{safePercentageUsed}% verbraucht</div>
                </>
            )}
        </div>
    )
}

export default BudgetSummaryCard
