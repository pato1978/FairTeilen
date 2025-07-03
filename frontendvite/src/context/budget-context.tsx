// src/context/budget-context.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { ExpenseType } from '@/types'
import type { Expense } from '@/types'
import { useMultiBudget } from './multi-budget-context'

// 🔢 Struktur für den Context
type BudgetContextType = {
    budget: number
    setBudget: (b: number) => void
    expenses: Expense[]
    setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>
    isLoading: boolean
    refreshExpenses: () => void
}

// 🧱 Context erstellen
const BudgetContext = createContext<BudgetContextType | undefined>(undefined)

// 📦 Provider für einen bestimmten Ausgabentyp (personal / shared / child)
export function BudgetProvider({ children, type }: { children: ReactNode; type: ExpenseType }) {
    const { personal, shared, child } = useMultiBudget()

    // 🧠 Lokaler State für Budget-Daten
    const [budget, setBudget] = useState(0)
    const [expenses, setExpenses] = useState<Expense[]>([])
    const [isLoading, setIsLoading] = useState(true)

    // 🔁 Aktualisiere Daten bei Änderung des globalen MultiBudget-Contexts
    useEffect(() => {
        const currentScope =
            type === ExpenseType.Personal ? personal : type === ExpenseType.Shared ? shared : child

        setBudget(currentScope.budget)
        setExpenses(currentScope.expenses)
        setIsLoading(currentScope.isLoading)
    }, [type, personal, shared, child]) // ← wichtig!

    // 🔄 Manuelles Refresh (z. B. nach Speichern)
    function refreshExpenses() {
        const currentScope =
            type === ExpenseType.Personal ? personal : type === ExpenseType.Shared ? shared : child

        setBudget(currentScope.budget)
        setExpenses(currentScope.expenses)
        setIsLoading(currentScope.isLoading)
    }

    return (
        <BudgetContext.Provider
            value={{
                budget,
                setBudget,
                expenses,
                setExpenses,
                isLoading,
                refreshExpenses,
            }}
        >
            {children}
        </BudgetContext.Provider>
    )
}

// 🎯 Custom Hook für Zugriff
export function useBudget() {
    const ctx = useContext(BudgetContext)
    if (!ctx) {
        throw new Error('useBudget must be used inside a BudgetProvider')
    }
    return ctx
}
