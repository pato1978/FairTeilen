"use client"

import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    type Dispatch,
    type SetStateAction,
} from "react"
import { useMonth } from "@/context/month-context"
import { fetchBudget, saveBudget as saveBudgetApi } from "@/lib/api/budget"
import { fetchExpenses } from "@/lib/api/expenses"
import type { Expense } from "@/types"

// 💡 Kontextstruktur für Budgetinformationen
type BudgetContextType = {
    budget: number
    setBudget: (b: number) => void
    expenses: Expense[]
    setExpenses: Dispatch<SetStateAction<Expense[]>>
    isLoading: boolean
    refreshExpenses: () => void
}

// 🧱 Budget-Kontext erstellen
const BudgetContext = createContext<BudgetContextType | undefined>(undefined)

type Props = {
    children: React.ReactNode
    scope: string // z. B. "personal", "shared"
}

// 📦 Provider-Komponente für den gewählten Budgetbereich
export function BudgetProvider({ children, scope }: Props) {
    const [budget, setBudget] = useState(0)
    const [expenses, setExpenses] = useState<Expense[]>([])
    const [isLoadingBudget, setIsLoadingBudget] = useState(false)
    const [isLoadingExpenses, setIsLoadingExpenses] = useState(false)
    const [refreshCounter, setRefreshCounter] = useState(0)

    const { currentDate } = useMonth()
    const isLoading = isLoadingBudget || isLoadingExpenses

    // 📥 Budget laden, wenn Monat oder Bereich (Scope) wechselt
    useEffect(() => {
        setIsLoadingBudget(true)
        fetchBudget(scope, currentDate)
            .then(setBudget)
            .catch(() => setBudget(0))
            .finally(() => setIsLoadingBudget(false))
    }, [currentDate, scope])

    // 📥 Ausgaben laden, wenn Monat oder Bereich wechselt oder manuell neu geladen wird
    useEffect(() => {
        const group = scope === "shared" ? null : null // später ggf. user?.groupId
        setIsLoadingExpenses(true)
        fetchExpenses(scope, group, currentDate)
            .then(setExpenses)
            .catch(() => setExpenses([]))
            .finally(() => setIsLoadingExpenses(false))
    }, [currentDate, refreshCounter, scope])

    // 💾 Budget speichern
    function saveBudget(newBudget: number) {
        setBudget(newBudget)
        saveBudgetApi(scope, currentDate, newBudget).catch(console.error)
    }

    // 🔁 Manuelles Neuladen der Ausgaben
    function refreshExpenses() {
        setRefreshCounter(c => c + 1)
    }

    return (
        <BudgetContext.Provider
            value={{
                budget,
                setBudget: saveBudget,
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

// 🎯 Hook zur Nutzung im UI
export function useBudget() {
    const ctx = useContext(BudgetContext)
    if (!ctx) throw new Error("useBudget must be used inside BudgetProvider")
    return ctx
}
