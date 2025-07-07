// src/context/budget-context.tsx

import { createContext, ReactNode, useContext, useEffect, useState } from 'react'
import type { Expense } from '@/types'
import { ExpenseType } from '@/types'
import { useMultiBudget } from './multi-budget-context'

// 🔢 Struktur des Context-Werts für einen einzelnen Budget-Slice
type BudgetContextType = {
    budget: number
    setBudget: (b: number) => void
    expenses: Expense[]
    setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>
    isLoading: boolean
    refreshExpenses: () => Promise<void>
}

// 🧱 BudgetContext: Kapselt alle States/Methoden für einen einzelnen Budget-Bereich (z. B. personal, shared)
const BudgetContext = createContext<BudgetContextType | undefined>(undefined)

// 📦 Provider für einen bestimmten Ausgaben-Typ (personal/shared/child)
export function BudgetProvider({ children, type }: { children: ReactNode; type: ExpenseType }) {
    // Alle Bereiche und die neue Reload-Methode aus dem MultiBudgetContext holen
    const { personal, shared, child, reloadBudgetState } = useMultiBudget()

    // Lokaler State für das aktuelle Slice (wird aus dem globalen Context gespiegelt)
    const [budget, setBudget] = useState(0)
    const [expenses, setExpenses] = useState<Expense[]>([])
    const [isLoading, setIsLoading] = useState(true)

    // Bei Änderungen im MultiBudgetContext (z. B. nach Refresh, Monatswechsel, Userwechsel) lokalen State updaten
    useEffect(() => {
        const currentScope =
            type === ExpenseType.Personal ? personal : type === ExpenseType.Shared ? shared : child

        setBudget(currentScope.budget)
        setExpenses(currentScope.expenses)
        setIsLoading(currentScope.isLoading)
    }, [type, personal, shared, child])

    // 🔄 NEU: "Offizielles" Refresh, das wirklich die Datenquelle neu abruft!
    async function refreshExpenses() {
        if (reloadBudgetState) {
            await reloadBudgetState(type) // Lädt Daten im globalen Context neu
            // Nach dem Reload updated sich dein lokaler State automatisch per useEffect!
        }
    }

    // Kontextwert für Konsumenten – alle State-Setter sind weiterhin verfügbar
    const contextValue: BudgetContextType = {
        budget,
        setBudget,
        expenses,
        setExpenses,
        isLoading,
        refreshExpenses,
    }

    return <BudgetContext.Provider value={contextValue}>{children}</BudgetContext.Provider>
}

// 🎯 Custom Hook für Zugriff auf den BudgetContext
export function useBudget() {
    const ctx = useContext(BudgetContext)
    if (!ctx) {
        throw new Error('useBudget must be used inside a BudgetProvider')
    }
    return ctx
}
