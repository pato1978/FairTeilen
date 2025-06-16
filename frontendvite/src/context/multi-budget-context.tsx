import { createContext, useContext, useEffect, useState } from 'react'
import { fetchBudget } from '@/lib/api/budget'
import { fetchExpenses } from '@/lib/api/expenses'
import { Expense } from '@/types'
import { useMonth } from './month-context'
import { useUser } from './user-context'

// 🔢 Zustand eines einzelnen Budgetbereichs (z. B. personal, shared, child)
type BudgetState = {
    budget: number
    expenses: Expense[]
    isLoading: boolean
}

// 🧠 Gesamtstruktur für mehrere Budgetbereiche
type MultiBudgetContextType = {
    personal: BudgetState
    shared: BudgetState
    child: BudgetState
}

// 🧱 React-Kontext für den Zugriff von überall
const MultiBudgetContext = createContext<MultiBudgetContextType | undefined>(undefined)

/**
 * 📦 Provider-Komponente, die alle Budgetdaten verwaltet.
 * Lädt Budget und Ausgaben getrennt für personal, shared und child,
 * abhängig vom aktuellen Monat und Benutzer.
 */
export function MultiBudgetProvider({ children }: { children: React.ReactNode }) {
    const { currentDate } = useMonth() // 📆 Aktuell ausgewählter Monat
    const { userId } = useUser() // 👤 Aktuell eingeloggter Benutzer

    const scopes = ['personal', 'shared', 'child'] as const

    const [states, setStates] = useState<Record<string, BudgetState>>({
        personal: { budget: 0, expenses: [], isLoading: true },
        shared: { budget: 0, expenses: [], isLoading: true },
        child: { budget: 0, expenses: [], isLoading: true },
    })

    useEffect(() => {
        if (!userId) {
            console.warn(
                '[MultiBudgetProvider] ⚠️ Kein Benutzer angemeldet – Budgetdaten werden nicht geladen.'
            )
            return
        }

        scopes.forEach(async scope => {
            try {
                const group = null // 🔧 Gruppenlogik noch nicht implementiert

                const [budget, expenses] = await Promise.all([
                    fetchBudget(scope, currentDate, userId),
                    fetchExpenses(userId, scope, group, currentDate),
                ])

                setStates(prev => ({
                    ...prev,
                    [scope]: {
                        budget,
                        expenses,
                        isLoading: false,
                    },
                }))
            } catch (err) {
                console.error(
                    `[MultiBudgetProvider] ❌ Fehler beim Laden von Scope "${scope}"`,
                    err
                )

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
    }, [currentDate, userId, fetchExpenses]) // 🧠 fetchExpenses gehört in die Dependency-List

    return (
        <MultiBudgetContext.Provider value={states as MultiBudgetContextType}>
            {children}
        </MultiBudgetContext.Provider>
    )
}

/**
 * 🎯 Hook zum Zugriff auf alle Budgetbereiche (z. B. in Komponenten)
 */
export function useMultiBudget() {
    const context = useContext(MultiBudgetContext)
    if (!context) {
        throw new Error('useMultiBudget must be used inside MultiBudgetProvider')
    }
    return context
}
