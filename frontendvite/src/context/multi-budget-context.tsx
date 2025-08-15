// ==============================
// src/contexts/multi-budget-context.tsx
// Vollständige Fassung – mit Fixes für groupId, Enum-Consistency und Auto-Transfer-Optionen
// ==============================

import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { getExpenseService } from '@/services/expense/ExpenseServiceFactory'
import { getBudgetService } from '@/services/budget/BudgetServiceFactory'
import { RecurringTransferService } from '@/services/common/RecurringTransferService'
import { useMonth } from './month-context'
import { useUser } from './user-context'
import { GROUP_ID } from '@/config/group-config'

import type { Expense } from '@/types'
import { ExpenseType } from '@/types'

// ===== Types =====

type BudgetState = {
    budget: number
    expenses: Expense[]
    isLoading: boolean
}

type MultiBudgetContextType = Record<ExpenseType, BudgetState> & {
    reloadBudgetState: (type: ExpenseType) => Promise<void>
    saveBudget: (type: ExpenseType, amount: number) => Promise<void>
}

const MultiBudgetContext = createContext<MultiBudgetContextType | undefined>(undefined)

export function MultiBudgetProvider({ children }: { children: React.ReactNode }) {
    const { currentDate } = useMonth()
    const { userId, isReady } = useUser()

    const types: ExpenseType[] = [ExpenseType.Personal, ExpenseType.Shared, ExpenseType.Child]

    const [states, setStates] = useState<Record<ExpenseType, BudgetState>>({
        [ExpenseType.Personal]: { budget: 0, expenses: [], isLoading: true },
        [ExpenseType.Shared]: { budget: 0, expenses: [], isLoading: true },
        [ExpenseType.Child]: { budget: 0, expenses: [], isLoading: true },
    })

    const autoTransferExecuted = useRef<Set<string>>(new Set())

    function getMonthKey(date: Date | undefined): string | undefined {
        if (!date || isNaN(date.getTime())) return undefined
        const year = date.getFullYear()
        const month = (date.getMonth() + 1).toString().padStart(2, '0')
        return `${year}-${month}`
    }

    // 🔄 Vollautomatischer Transfer bei jedem Monats-Load
    useEffect(() => {
        if (!isReady || !userId) return

        const monthKey = getMonthKey(currentDate)
        if (!monthKey) return

        const transferKey = `${userId}-${monthKey}`

        // Verhindere mehrfache Ausführung für denselben User/Monat (auch gegen StrictMode doppelt)
        if (autoTransferExecuted.current.has(transferKey)) {
            console.log('✅ Auto-Transfer für diesen Monat bereits ausgeführt')
            loadAllDataNormally()
            return
        }

        console.log('🧠 MultiBudget useEffect - prüfe Auto-Transfer:', { userId, monthKey })

        const loadWithAutoTransfer = async () => {
            setStates(prev => ({
                [ExpenseType.Personal]: { ...prev[ExpenseType.Personal], isLoading: true },
                [ExpenseType.Shared]: { ...prev[ExpenseType.Shared], isLoading: true },
                [ExpenseType.Child]: { ...prev[ExpenseType.Child], isLoading: true },
            }))

            try {
                // 🔄 Automatischer Transfer (läuft im Hintergrund)
                console.log('🔄 Starte automatischen Transfer-Check...')

                // 👉 Wenn gewünscht: nur persönliche wiederkehrende Ausgaben/Budgets automatisch übertragen
                const transferResult = await RecurringTransferService.autoTransferForCurrentMonth(
                    userId,
                    monthKey,
                    {
                        expenseTypes: [ExpenseType.Personal],
                    }
                )

                if (transferResult) {
                    console.log('✅ Auto-Transfer erfolgreich:', transferResult)
                } else {
                    console.log('ℹ️ Kein Auto-Transfer nötig')
                }

                // Markiere als ausgeführt
                autoTransferExecuted.current.add(transferKey)
            } catch (error) {
                console.error('❌ Auto-Transfer Fehler:', error)
                // Auch bei Fehler markieren, um Endlosschleifen zu vermeiden
                autoTransferExecuted.current.add(transferKey)
            }

            // Danach: normale Daten laden
            await loadAllDataNormally()
        }

        loadWithAutoTransfer()
    }, [currentDate, userId, isReady])

    // 📊 Normale Daten-Lade-Logik (ohne Transfer)
    const loadAllDataNormally = async () => {
        const monthKey = getMonthKey(currentDate)
        if (!monthKey || !userId) return

        await Promise.all(
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
                    console.error(`[Load][${type}] Fehler:`, err)
                    setStates(prev => ({
                        ...prev,
                        [type]: { budget: 0, expenses: [], isLoading: false },
                    }))
                }
            })
        )
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

    async function loadExpensesFor(
        type: ExpenseType,
        userId: string,
        date: Date
    ): Promise<Expense[]> {
        const monthKey = getMonthKey(date)
        if (!monthKey) return []

        try {
            const service = await getExpenseService(type)
            const groupId = type === ExpenseType.Personal ? undefined : GROUP_ID // ✅ Fix: groupId setzen
            return await service.getExpenses(userId, type, monthKey, groupId) // ✅ Fix: groupId übergeben
        } catch (error) {
            console.error(`[loadExpensesFor] ${type} Fehler:`, error)
            return []
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
