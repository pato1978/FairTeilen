// src/context/multi-budget-context.tsx

import { createContext, useContext, useEffect, useState } from 'react'
import { fetchExpenses } from '@/services/expenses'
import { getBudgetService } from '@/services/budgetFactory'
import { useMonth } from './month-context'
import { useUser } from './user-context'
import { GROUP_ID } from '@/config/group-config'

import type { Expense } from '@/types'
import { ExpenseType } from '@/types'

// 🔢 Zustand eines Budgetsegments
type BudgetState = {
    budget: number
    expenses: Expense[]
    isLoading: boolean
}

// ⬇️ Typ für den Contextwert (enthält alle Slices und die globale Refresh-Methode)
type MultiBudgetContextType = Record<ExpenseType, BudgetState> & {
    reloadBudgetState: (type: ExpenseType) => Promise<void>
}

// 📦 React Context für alle Budgetdaten
const MultiBudgetContext = createContext<MultiBudgetContextType | undefined>(undefined)

export function MultiBudgetProvider({ children }: { children: React.ReactNode }) {
    // ⏱️ Ausgewählter Monat & aktueller Nutzer (aus eigenen Contexts)
    const { currentDate } = useMonth()
    const { userId } = useUser()

    // 🗂️ Alle verfügbaren Budget-Typen
    const types: ExpenseType[] = [ExpenseType.Personal, ExpenseType.Shared, ExpenseType.Child]

    // 🧱 State: Alle Budgets und Ausgaben, initial mit Lade-Status
    const [states, setStates] = useState<Record<ExpenseType, BudgetState>>({
        [ExpenseType.Personal]: { budget: 0, expenses: [], isLoading: true },
        [ExpenseType.Shared]: { budget: 0, expenses: [], isLoading: true },
        [ExpenseType.Child]: { budget: 0, expenses: [], isLoading: true },
    })
    function getMonthKey(date: Date | undefined): string | undefined {
        if (!date || isNaN(date.getTime())) return undefined
        return date.toISOString().slice(0, 7)
    }
    // 🏁 Lädt ALLE Budgettypen neu (z. B. bei Monatswechsel oder Userwechsel)
    useEffect(() => {
        if (!userId) return
        const monthKey = getMonthKey(currentDate)
        if (!monthKey) return

        Promise.all(
            types.map(async type => {
                const isPersonal = type === ExpenseType.Personal
                const groupId = isPersonal ? undefined : GROUP_ID

                try {
                    const budgetService = await getBudgetService(type)
                    const budget = await budgetService.getBudget(type, monthKey, userId, groupId)
                    const expenses = await fetchExpenses(userId, type, currentDate!)
                    setStates(prev => ({
                        ...prev,
                        [type]: { budget, expenses, isLoading: false },
                    }))
                } catch (err) {
                    console.error(`[MultiBudget] ❌ Fehler bei Typ "${type}"`, err)
                    setStates(prev => ({
                        ...prev,
                        [type]: { budget: 0, expenses: [], isLoading: false },
                    }))
                }
            })
        )
    }, [currentDate, userId])

    // 🔄 NEU: Methode zum expliziten Neuladen eines Budget-Typs
    async function reloadBudgetState(type: ExpenseType) {
        if (!userId) return
        const monthKey = getMonthKey(currentDate)
        if (!monthKey) return

        const isPersonal = type === ExpenseType.Personal
        const groupId = isPersonal ? undefined : GROUP_ID

        try {
            const budgetService = await getBudgetService(type)
            const budget = await budgetService.getBudget(type, monthKey, userId, groupId)
            const expenses = await fetchExpenses(userId, type, currentDate!)
            setStates(prev => ({
                ...prev,
                [type]: { budget, expenses, isLoading: false },
            }))
        } catch (err) {
            console.error(`[MultiBudget] ❌ Fehler beim Refresh von "${type}"`, err)
            setStates(prev => ({
                ...prev,
                [type]: { budget: 0, expenses: [], isLoading: false },
            }))
        }
    }

    // 🪝 Kontextwert: Alle States & die globale Refresh-Methode
    const contextValue: MultiBudgetContextType = {
        ...states,
        reloadBudgetState,
    }

    return (
        <MultiBudgetContext.Provider value={contextValue}>{children}</MultiBudgetContext.Provider>
    )
}

// 🔓 Custom Hook für Zugriff auf den MultiBudget-Context
export function useMultiBudget() {
    const ctx = useContext(MultiBudgetContext)
    if (!ctx) throw new Error('useMultiBudget must be used inside MultiBudgetProvider')
    return ctx
}
