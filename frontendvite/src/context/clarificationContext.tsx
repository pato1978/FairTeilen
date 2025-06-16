'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
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

// 🎁 Provider-Komponente für den App-Umfang
export function ClarificationReactionsProvider({ children }: { children: ReactNode }) {
    // 🧠 State für Reaktionen und Versionsnummer (für Refresh-Trigger)
    const [reactions, setReactions] = useState<ClarificationReaction[]>([])
    const [version, setVersion] = useState(0)

    // 📅 Aktuelles Datum vom MonthContext, z. B. "2025-06"
    const { currentDate } = useMonth()
    const monthId = currentDate.toISOString().slice(0, 7)

    // 📥 Reaktionen für den aktuellen Monat bei Mount oder Refresh laden
    useEffect(() => {
        const load = async () => {
            const all = await getClarificationReactionsForMonth(monthId)
            setReactions(all)
        }
        load()
    }, [monthId, version])

    // ✅ Gibt zurück, ob die Ausgabe **bestätigt** ist (d.h. keine Rejected-Reaktion)
    const getIsConfirmed = (expenseId: string) => {
        // 🔍 Suche nach einer Ablehnung durch einen beliebigen Nutzer
        const hasClarification = reactions.some(
            r => r.expenseId === expenseId && r.status === ClarificationStatus.Rejected
        )
        // 🚦 Ausgabe ist bestätigt, wenn **keine** Ablehnung existiert
        return !hasClarification
    }

    // 🔢 Gibt die Anzahl **einzigartiger Ausgaben** zurück, die **abgelehnt wurden**
    const getUnconfirmedCount = () => {
        const uniqueExpenseIds = new Set(
            reactions.filter(r => r.status === ClarificationStatus.Rejected).map(r => r.expenseId)
        )
        return uniqueExpenseIds.size
    }

    // 📋 Gibt alle geladenen Reaktionen zurück (z. B. für eigene Filterung)
    const getAllReactions = () => reactions

    // 🔄 Erhöht eine "Version" → löst useEffect erneut aus und lädt neue Daten
    const refresh = () => setVersion(v => v + 1)

    // 📤 Context-Werte bereitstellen
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
