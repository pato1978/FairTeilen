// frontendvite/src/context/multi-budget-context.tsx - GEMEINSAME BUDGETS

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
    saveBudget: (type: ExpenseType, amount: number) => Promise<void> // ✅ NEU
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

    function getMonthKey(date: Date | undefined): string | undefined {
        if (!date || isNaN(date.getTime())) return undefined

        const year = date.getFullYear()
        const month = (date.getMonth() + 1).toString().padStart(2, '0')
        const monthKey = `${year}-${month}`

        console.log('📅 getMonthKey:', {
            input: date.toISOString(),
            localDate: date.toLocaleDateString(),
            output: monthKey,
            month: date.getMonth() + 1,
        })

        return monthKey
    }

    /**
     * ✅ KORRIGIERT: Budget-Loading mit korrekter Shared/Child-Logik
     */
    async function loadBudgetFor(
        type: ExpenseType,
        userId: string,
        monthKey: string
    ): Promise<number> {
        try {
            const budgetService = await getBudgetService(type)
            const groupId = type === ExpenseType.Personal ? undefined : GROUP_ID

            console.log(`[loadBudgetFor] ${type}:`, {
                userId,
                monthKey,
                groupId,
                isSharedBudget: type === ExpenseType.Shared || type === ExpenseType.Child,
            })

            // ✅ Das Budget-Service behandelt bereits shared/child als gemeinsame Budgets
            const budget = await budgetService.getBudget(type, monthKey, userId, groupId)

            console.log(
                `[✔️ loadBudgetFor] ${type}: ${budget} ${type === ExpenseType.Shared || type === ExpenseType.Child ? '(gemeinsam)' : '(persönlich)'}`
            )
            return budget
        } catch (error) {
            console.error(`[loadBudgetFor] ${type} Fehler:`, error)
            return 0
        }
    }

    /**
     * ✅ NEU: Budget speichern mit korrekter Shared/Child-Logik
     */
    async function saveBudget(type: ExpenseType, amount: number): Promise<void> {
        if (!userId) {
            throw new Error('Kein User angemeldet')
        }

        const monthKey = getMonthKey(currentDate)
        if (!monthKey) {
            throw new Error('Kein gültiger Monat')
        }

        try {
            const budgetService = await getBudgetService(type)
            const groupId = type === ExpenseType.Personal ? undefined : GROUP_ID

            console.log(`[saveBudget] ${type}:`, {
                amount,
                userId,
                monthKey,
                groupId,
                isSharedBudget: type === ExpenseType.Shared || type === ExpenseType.Child,
            })

            // ✅ Das Budget-Service behandelt bereits shared/child als gemeinsame Budgets
            await budgetService.saveBudget(type, monthKey, amount, userId, groupId)

            // ✅ Lokalen State sofort aktualisieren
            setStates(prev => ({
                ...prev,
                [type]: { ...prev[type], budget: amount },
            }))

            console.log(
                `[✔️ saveBudget] ${type}: ${amount} erfolgreich gespeichert ${type === ExpenseType.Shared || type === ExpenseType.Child ? '(gemeinsam)' : '(persönlich)'}`
            )
        } catch (error) {
            console.error(`[saveBudget] ${type} Fehler:`, error)
            throw error
        }
    }

    /**
     * Lädt Ausgaben für einen Typ.
     */
    async function loadExpensesFor(
        type: ExpenseType,
        userId: string,
        date: Date
    ): Promise<Expense[]> {
        const monthKey = getMonthKey(date)
        console.log('[loadExpensesFor] start', { type, userId, date, monthKey })

        if (!monthKey) return []

        try {
            const service = await getExpenseService(type)
            const expenses = await service.getExpenses(userId, type, monthKey)

            console.log('[loadExpensesFor] loaded', { type, expenses: expenses.length })
            return expenses
        } catch (error) {
            console.error(`[loadExpensesFor] ${type} Fehler:`, error)
            return []
        }
    }

    // ✅ Lade Daten neu, wenn sich Monat ODER User ändert
    useEffect(() => {
        if (!userId) {
            console.log('🔄 MultiBudget: Kein User, überspringe Laden')
            return
        }

        const monthKey = getMonthKey(currentDate)
        if (!monthKey) {
            console.log('🔄 MultiBudget: Kein gültiger Monat, überspringe Laden')
            return
        }

        console.log('🔄 MultiBudget: Loading data for', { userId, monthKey, currentDate })

        // Setze Loading-State für alle Types
        setStates(prev => ({
            [ExpenseType.Personal]: { ...prev[ExpenseType.Personal], isLoading: true },
            [ExpenseType.Shared]: { ...prev[ExpenseType.Shared], isLoading: true },
            [ExpenseType.Child]: { ...prev[ExpenseType.Child], isLoading: true },
        }))

        // Lade Budget und Expenses parallel für jeden Type
        Promise.all(
            types.map(async type => {
                try {
                    console.log(`[InitialLoad] ${type}: Start loading...`)

                    const [budget, expenses] = await Promise.all([
                        loadBudgetFor(type, userId, monthKey),
                        loadExpensesFor(type, userId, currentDate!),
                    ])

                    console.log(`[✔️ InitialLoad][${type}]`, {
                        budget,
                        expenses: expenses.length,
                        budgetType: type === ExpenseType.Personal ? 'persönlich' : 'gemeinsam',
                    })

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
    }, [currentDate, userId])

    // Manuelles Refresh
    async function reloadBudgetState(type: ExpenseType) {
        if (!userId) {
            console.warn(`[reloadBudgetState] ${type}: Kein User`)
            return
        }

        const monthKey = getMonthKey(currentDate)
        if (!monthKey) {
            console.warn(`[reloadBudgetState] ${type}: Kein gültiger Monat`)
            return
        }

        console.log(`🔄 MultiBudget: Manual reload for ${type}`, { userId, monthKey })

        setStates(prev => ({
            ...prev,
            [type]: { ...prev[type], isLoading: true },
        }))

        try {
            const [budget, expenses] = await Promise.all([
                loadBudgetFor(type, userId, monthKey),
                loadExpensesFor(type, userId, currentDate!),
            ])

            console.log(`[✔️ reloadBudgetState][${type}]`, {
                budget,
                expenses: expenses.length,
            })

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
                saveBudget, // ✅ NEU: Budget-Speichern-Funktion verfügbar machen
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
