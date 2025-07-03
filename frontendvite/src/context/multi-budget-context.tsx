import { createContext, useContext, useEffect, useState } from 'react'
import { fetchExpenses } from '@/services/expenses'
import type { Expense } from '@/types'
import { useMonth } from './month-context'
import { useUser } from './user-context'
import { getBudgetService } from '@/services/budgetFactory'

import { GROUP_ID } from '@/config/group-config'

type BudgetState = { budget: number; expenses: Expense[]; isLoading: boolean }
type MultiBudgetContextType = Record<'personal' | 'shared' | 'child', BudgetState>

const MultiBudgetContext = createContext<MultiBudgetContextType | undefined>(undefined)

export function MultiBudgetProvider({ children }: { children: React.ReactNode }) {
    const { currentDate } = useMonth()
    const { userId } = useUser()
    const scopes = ['personal', 'shared', 'child'] as const

    const [states, setStates] = useState<MultiBudgetContextType>({
        personal: { budget: 0, expenses: [], isLoading: true },
        shared: { budget: 0, expenses: [], isLoading: true },
        child: { budget: 0, expenses: [], isLoading: true },
    })

    useEffect(() => {
        if (!userId) return

        const monthKey = currentDate.toISOString().slice(0, 7)

        Promise.all(
            scopes.map(async scope => {
                const isPersonal = scope === 'personal'
                const groupId = isPersonal ? undefined : GROUP_ID

                try {
                    const budgetService = await getBudgetService()
                    const budget = await budgetService.getBudget(scope, monthKey, userId, groupId)

                    // Nutze überall fetchExpenses
                    const expenses = await fetchExpenses(userId, scope, currentDate)

                    setStates(prev => ({
                        ...prev,
                        [scope]: { budget, expenses, isLoading: false },
                    }))
                } catch (err) {
                    console.error(`[MultiBudgetProvider] ❌ Fehler bei Scope "${scope}"`, err)
                    setStates(prev => ({
                        ...prev,
                        [scope]: { budget: 0, expenses: [], isLoading: false },
                    }))
                }
            })
        )
    }, [currentDate, userId])

    return <MultiBudgetContext.Provider value={states}>{children}</MultiBudgetContext.Provider>
}

export function useMultiBudget() {
    const ctx = useContext(MultiBudgetContext)
    if (!ctx) throw new Error('useMultiBudget must be used inside MultiBudgetProvider')
    return ctx
}
