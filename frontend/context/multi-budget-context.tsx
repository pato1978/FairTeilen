"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { fetchBudget } from "@/lib/api/budget"
import { fetchExpenses } from "@/lib/api/expenses"
import { Expense } from "@/types"
import { useMonth } from "./month-context"

// 🔢 Zustand eines einzelnen Budgetbereichs
type BudgetState = {
    budget: number
    expenses: Expense[]
    isLoading: boolean
}

// 🧠 Struktur für drei getrennte Bereiche gleichzeitig
type MultiBudgetContextType = {
    personal: BudgetState
    shared: BudgetState
    child: BudgetState
}

// 🧱 React-Kontext erstellen
const MultiBudgetContext = createContext<MultiBudgetContextType | undefined>(undefined)

// 📦 Provider für alle Budgetbereiche: personal, shared, child
export function MultiBudgetProvider({ children }: { children: React.ReactNode }) {
    const { currentDate } = useMonth()
    const scopes = ["personal", "shared", "child"] as const

    const [states, setStates] = useState<Record<string, BudgetState>>({
        personal: { budget: 0, expenses: [], isLoading: true },
        shared: { budget: 0, expenses: [], isLoading: true },
        child: { budget: 0, expenses: [], isLoading: true },
    })

    // 📡 Budget + Ausgaben für alle Bereiche laden (bei Monatswechsel)
    useEffect(() => {
        scopes.forEach(async (scope) => {
            try {
                // 🔧 Testweise keine Gruppen-ID – später user?.groupId einsetzen
                const group = scope === "shared" ? null : null

                const [budget, expenses] = await Promise.all([
                    fetchBudget(scope, currentDate),
                    fetchExpenses(scope, group, currentDate),
                ])

                setStates(prev => ({
                    ...prev,
                    [scope]: {
                        budget,
                        expenses,
                        isLoading: false,
                    },
                }))
            } catch {
                // Fehler: Bereich auf leeren Zustand setzen
                setStates(prev => ({
                    ...prev,
                    [scope]: {
                        budget: 0,
                        expenses: [],
                        isLoading: false,
                    },
                }))
            }
        })
    }, [currentDate])

    return (
        <MultiBudgetContext.Provider value={states as MultiBudgetContextType}>
            {children}
        </MultiBudgetContext.Provider>
    )
}

// 🎯 Hook zum Zugriff auf alle drei Bereiche
export function useMultiBudget() {
    const context = useContext(MultiBudgetContext)
    if (!context) throw new Error("useMultiBudget must be used inside MultiBudgetProvider")
    return context
}
