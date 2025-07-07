'use client'

import { createContext, ReactNode, useContext, useEffect, useState } from 'react'
import type { ClarificationReaction } from '@/types'
import { ClarificationStatus } from '@/types/monthly-overview' // 🎯 Enum mit 'Accepted' | 'Rejected'
import { getClarificationReactionsForMonth } from '@/services/clarificationReactions.ts'
import { useMonth } from '@/context/month-context' // 📅 Liefert den aktuell gewählten Monat aus globalem Context

// 📦 Struktur des Context-Wertes – wird App-weit genutzt
interface ClarificationReactionsContextValue {
    getIsConfirmed: (expenseId: string) => boolean // 🔍 Ist diese Ausgabe für den aktuellen Nutzer bestätigt?
    getUnconfirmedCount: () => number // 🔢 Wie viele Ausgaben haben noch offene Klärungen?
    refresh: () => void // 🔄 Manuelles Neuladen der Reaktionen
    getAllReactions: () => ClarificationReaction[] // 📋 Alle Reaktionen (z. B. für Auswertungen)
}

// 🧱 React Context erstellen
const ClarificationReactionsContext = createContext<ClarificationReactionsContextValue | undefined>(
    undefined
)

// 🔌 Hook für einfachen Zugriff auf den Context
export function useClarificationReactions() {
    const ctx = useContext(ClarificationReactionsContext)
    if (!ctx) {
        throw new Error(
            'useClarificationReactions must be used inside ClarificationReactionsProvider'
        )
    }
    return ctx
}
export function ClarificationReactionsProvider({ children }: { children: ReactNode }) {
    const [reactions, setReactions] = useState<ClarificationReaction[]>([])
    const [version, setVersion] = useState(0)

    const { currentDate } = useMonth()
    // 💡 Schutz vor invalidem Date:
    const monthId =
        currentDate && !isNaN(currentDate.getTime()) ? currentDate.toISOString().slice(0, 7) : ''

    useEffect(() => {
        if (!monthId) return
        const load = async () => {
            const all = await getClarificationReactionsForMonth(monthId)
            setReactions(all)
        }
        load()
    }, [monthId, version])

    const getIsConfirmed = (expenseId: string) => {
        const hasClarification = reactions.some(
            r => r.expenseId === expenseId && r.status === ClarificationStatus.Rejected
        )
        return !hasClarification
    }

    const getUnconfirmedCount = () => {
        const uniqueExpenseIds = new Set(
            reactions.filter(r => r.status === ClarificationStatus.Rejected).map(r => r.expenseId)
        )
        return uniqueExpenseIds.size
    }

    const getAllReactions = () => reactions
    const refresh = () => setVersion(v => v + 1)

    return (
        <ClarificationReactionsContext.Provider
            value={{
                getIsConfirmed,
                getUnconfirmedCount,
                refresh,
                getAllReactions,
            }}
        >
            {children}
        </ClarificationReactionsContext.Provider>
    )
}
