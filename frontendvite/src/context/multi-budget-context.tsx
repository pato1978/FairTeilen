// src/context/multi-budget-context.tsx

import { createContext, useContext, useEffect, useState } from 'react'
import { getExpenseService } from '@/services/ExpenseFactory'
import { getBudgetService } from '@/services/budgetFactory'
import { useMonth } from './month-context'
import { useUser } from './user-context'
import { GROUP_ID } from '@/config/group-config'

import type { Expense } from '@/types'
import { ExpenseType } from '@/types'

// --- Zustand für jedes Budget-Segment ---
type BudgetState = {
    budget: number
    expenses: Expense[]
    isLoading: boolean
}

// --- Gesamter Kontext-Typ ---
type MultiBudgetContextType = Record<ExpenseType, BudgetState> & {
    reloadBudgetState: (type: ExpenseType) => Promise<void>
}

const MultiBudgetContext = createContext<MultiBudgetContextType | undefined>(undefined)

export function MultiBudgetProvider({ children }: { children: React.ReactNode }) {
    const { currentDate } = useMonth()
    const { userId } = useUser()

    const types: ExpenseType[] = [ExpenseType.Personal, ExpenseType.Shared, ExpenseType.Child]

    const [states, setStates] = useState<Record<ExpenseType, BudgetState>>({
        [ExpenseType.Personal]: { budget: 0, expenses: [], isLoading: true },
        [ExpenseType.Shared]: { budget: 0, expenses: [], isLoading: true },
        [ExpenseType.Child]: { budget: 0, expenses: [], isLoading: true },
    })

    // Extrahiere "YYYY-MM" aus Date
    function getMonthKey(date: Date | undefined): string | undefined {
        if (!date || isNaN(date.getTime())) return undefined
        return date.toISOString().slice(0, 7)
    }

    /**
     * Lädt Ausgaben für einen Typ.
     * Immer über einheitliche Signatur: getExpenses(userId, type, monthKey)
     */
    async function loadExpensesFor(
        type: ExpenseType,
        userId: string,
        date: Date
    ): Promise<Expense[]> {
        const monthKey = getMonthKey(date)
        console.log('[loadExpensesFor] start', { type, userId, date, monthKey })

        if (!monthKey) return []

        const service = await getExpenseService(type)
        const expenses = await service.getExpenses(userId, type, monthKey)

        console.log('[loadExpensesFor] loaded', { type, expenses })
        return expenses
    }

    // Initial Load bei Änderung von Monat oder User
    useEffect(() => {
        if (!userId) return
        const monthKey = getMonthKey(currentDate)
        if (!monthKey) return

        Promise.all(
            types.map(async type => {
                try {
                    // Budget laden
                    const budgetService = await getBudgetService(type)
                    const budget = await budgetService.getBudget(
                        type,
                        monthKey,
                        userId,
                        type === ExpenseType.Personal ? undefined : GROUP_ID
                    )

                    // Ausgaben laden
                    const expenses = await loadExpensesFor(type, userId, currentDate!)

                    console.log(`[✔️ InitialLoad][${type}]`, { budget, expenses })

                    setStates(prev => ({
                        ...prev,
                        [type]: { budget, expenses, isLoading: false },
                    }))
                } catch (err) {
                    console.error(`[InitialLoad][${type}] Fehler`, err)
                    setStates(prev => ({
                        ...prev,
                        [type]: { budget: 0, expenses: [], isLoading: false },
                    }))
                }
            })
        )
    }, [currentDate, userId])

    // Manuelles Refresh (z.B. nach Save)
    async function reloadBudgetState(type: ExpenseType) {
        if (!userId) return
        const monthKey = getMonthKey(currentDate)
        if (!monthKey) return

        try {
            const budgetService = await getBudgetService(type)
            const budget = await budgetService.getBudget(
                type,
                monthKey,
                userId,
                type === ExpenseType.Personal ? undefined : GROUP_ID
            )

            const expenses = await loadExpensesFor(type, userId, currentDate!)

            console.log(`[✔️ reloadBudgetState][${type}]`, { budget, expenses })

            setStates(prev => ({
                ...prev,
                [type]: { budget, expenses, isLoading: false },
            }))
        } catch (err) {
            console.error(`[reloadBudgetState][${type}] Fehler`, err)
            setStates(prev => ({
                ...prev,
                [type]: { budget: 0, expenses: [], isLoading: false },
            }))
        }
    }

    return (
        <MultiBudgetContext.Provider value={{ ...states, reloadBudgetState }}>
            {children}
        </MultiBudgetContext.Provider>
    )
}

export function useMultiBudget() {
    const ctx = useContext(MultiBudgetContext)
    if (!ctx) throw new Error('useMultiBudget must be inside MultiBudgetProvider')
    return ctx
}
