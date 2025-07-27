// src/context/multi-budget-context.tsx – GEMEINSAME BUDGETS mit "isReady"-Fix

import { createContext, useContext, useEffect, useState } from 'react'
import { getExpenseService } from '@/services/ExpenseServiceFactory'
import { getBudgetService } from '@/services/BudgetServiceFactory'
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
    saveBudget: (type: ExpenseType, amount: number) => Promise<void>
}

const MultiBudgetContext = createContext<MultiBudgetContextType | undefined>(undefined)

export function MultiBudgetProvider({ children }: { children: React.ReactNode }) {
    const { currentDate } = useMonth()
    const { userId, isReady } = useUser() // ✅ isReady ergänzt

    const types: ExpenseType[] = [ExpenseType.Personal, ExpenseType.Shared, ExpenseType.Child]

    const [states, setStates] = useState<Record<ExpenseType, BudgetState>>({
        [ExpenseType.Personal]: { budget: 0, expenses: [], isLoading: true },
        [ExpenseType.Shared]: { budget: 0, expenses: [], isLoading: true },
        [ExpenseType.Child]: { budget: 0, expenses: [], isLoading: true },
    })

    function getMonthKey(date: Date | undefined): string | undefined {
        if (!date || isNaN(date.getTime())) return undefined
        const year = date.getFullYear()
        const month = (date.getMonth() + 1).toString().padStart(2, '0')
        return `${year}-${month}`
    }

    async function loadBudgetFor(
        type: ExpenseType,
        userId: string,
        monthKey: string
    ): Promise<number> {
        try {
            const budgetService = await getBudgetService(type)
            const groupId = type === ExpenseType.Personal ? undefined : GROUP_ID

            return await budgetService.getBudget(type, monthKey, userId, groupId)
        } catch (error) {
            console.error(`[loadBudgetFor] ${type} Fehler:`, error)
            return 0
        }
    }

    async function saveBudget(type: ExpenseType, amount: number): Promise<void> {
        if (!userId) throw new Error('Kein User angemeldet')
        const monthKey = getMonthKey(currentDate)
        if (!monthKey) throw new Error('Kein gültiger Monat')

        try {
            const budgetService = await getBudgetService(type)
            const groupId = type === ExpenseType.Personal ? undefined : GROUP_ID
            await budgetService.saveBudget(type, monthKey, amount, userId, groupId)

            setStates(prev => ({
                ...prev,
                [type]: { ...prev[type], budget: amount },
            }))
        } catch (error) {
            console.error(`[saveBudget] ${type} Fehler:`, error)
            throw error
        }
    }

    async function loadExpensesFor(
        type: ExpenseType,
        userId: string,
        date: Date
    ): Promise<Expense[]> {
        const monthKey = getMonthKey(date)
        if (!monthKey) return []

        try {
            const service = await getExpenseService(type)
            return await service.getExpenses(userId, type, monthKey)
        } catch (error) {
            console.error(`[loadExpensesFor] ${type} Fehler:`, error)
            return []
        }
    }

    /**
     * ✅ Haupt-Effekt: Lädt Budget + Ausgaben
     * Jetzt mit `isReady`, damit keine Daten zu früh geladen werden
     */
    useEffect(() => {
        console.log('🧠 MultiBudget useEffect triggered', { isReady, userId, currentDate })

        if (!isReady || !userId) {
            console.log('⏳ MultiBudget: UserContext noch nicht bereit')
            return
        }

        const monthKey = getMonthKey(currentDate)
        if (!monthKey) {
            console.log('📆 MultiBudget: Ungültiger Monat')
            return
        }

        console.log('🔄 MultiBudget: Lade Daten für', { userId, monthKey })

        setStates(prev => ({
            [ExpenseType.Personal]: { ...prev[ExpenseType.Personal], isLoading: true },
            [ExpenseType.Shared]: { ...prev[ExpenseType.Shared], isLoading: true },
            [ExpenseType.Child]: { ...prev[ExpenseType.Child], isLoading: true },
        }))

        Promise.all(
            types.map(async type => {
                try {
                    const [budget, expenses] = await Promise.all([
                        loadBudgetFor(type, userId, monthKey),
                        loadExpensesFor(type, userId, currentDate!),
                    ])
                    setStates(prev => ({
                        ...prev,
                        [type]: { budget, expenses, isLoading: false },
                    }))
                } catch (err) {
                    console.error(`[InitialLoad][${type}] Fehler:`, err)
                    setStates(prev => ({
                        ...prev,
                        [type]: { budget: 0, expenses: [], isLoading: false },
                    }))
                }
            })
        )
    }, [currentDate, userId, isReady]) // ✅ Effekt wird erst bei isReady ausgelöst

    async function reloadBudgetState(type: ExpenseType) {
        if (!userId) return
        const monthKey = getMonthKey(currentDate)
        if (!monthKey) return

        setStates(prev => ({
            ...prev,
            [type]: { ...prev[type], isLoading: true },
        }))

        try {
            const [budget, expenses] = await Promise.all([
                loadBudgetFor(type, userId, monthKey),
                loadExpensesFor(type, userId, currentDate!),
            ])

            setStates(prev => ({
                ...prev,
                [type]: { budget, expenses, isLoading: false },
            }))
        } catch (err) {
            console.error(`[reloadBudgetState][${type}] Fehler:`, err)
            setStates(prev => ({
                ...prev,
                [type]: { budget: 0, expenses: [], isLoading: false },
            }))
        }
    }

    return (
        <MultiBudgetContext.Provider
            value={{
                ...states,
                reloadBudgetState,
                saveBudget,
            }}
        >
            {children}
        </MultiBudgetContext.Provider>
    )
}

export function useMultiBudget() {
    const ctx = useContext(MultiBudgetContext)
    if (!ctx) throw new Error('useMultiBudget must be inside MultiBudgetProvider')
    return ctx
}
