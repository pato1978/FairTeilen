'use client'

import { createContext, ReactNode, useContext, useEffect, useState, useRef } from 'react'
import type { ClarificationReaction } from '@/types'
import { ClarificationStatus } from '@/types/monthly-overview'
import { ClarificationReactionService } from '@/services/ClarificationReactionService'
import { useMonth } from '@/context/month-context'

interface ClarificationReactionsContextValue {
    getIsConfirmed: (expenseId: string) => boolean
    getUnconfirmedCount: () => number
    refresh: () => void
    getAllReactions: () => ClarificationReaction[]
    isLoading: boolean
}

const ClarificationReactionsContext = createContext<ClarificationReactionsContextValue | undefined>(
    undefined
)

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
    const [isLoading, setIsLoading] = useState(false)
    const previousMonthIdRef = useRef<string>('')
    const loadingRef = useRef(false)

    const { currentDate } = useMonth()

    // 💡 Schutz vor invalidem Date:
    const monthId =
        currentDate && !isNaN(currentDate.getTime()) ? currentDate.toISOString().slice(0, 7) : ''

    useEffect(() => {
        if (!monthId) {
            console.log('📅 ClarificationContext: Kein gültiger Monat')
            return
        }

        // 🔍 Verhindern von mehrfachen parallelen Loads
        if (loadingRef.current) {
            console.log('⏳ ClarificationContext: Load bereits im Gange, überspringe')
            return
        }

        // 🔍 Nur neu laden, wenn sich der Monat wirklich geändert hat oder manueller Refresh
        if (monthId === previousMonthIdRef.current && version === 0) {
            console.log('📅 ClarificationContext: Monat unverändert, kein Reload nötig')
            return
        }

        // Bei Monatswechsel: Cache leeren
        if (monthId !== previousMonthIdRef.current && previousMonthIdRef.current !== '') {
            console.log('🧹 ClarificationContext: Monatswechsel erkannt, leere Cache')
            ClarificationReactionService.clearCache()
        }

        previousMonthIdRef.current = monthId

        const load = async () => {
            console.log('🔄 ClarificationContext: Starte Laden der Reactions für', monthId)
            loadingRef.current = true
            setIsLoading(true)

            try {
                const all =
                    await ClarificationReactionService.getClarificationReactionsForMonth(monthId)
                setReactions(all)
                console.log(
                    `✅ ClarificationContext: ${all.length} Reactions gesetzt für ${monthId}`
                )
            } catch (error) {
                console.error('❌ ClarificationContext: Fehler beim Laden der Reactions:', error)
                setReactions([]) // Leere Liste bei Fehler
            } finally {
                setIsLoading(false)
                loadingRef.current = false
            }
        }

        // 🕐 Größeres Delay für Navigation von Jahresübersicht
        const delay = version > 0 ? 50 : 300 // Bei manuellem Refresh kurzes Delay, sonst länger

        console.log(`⏱️ ClarificationContext: Warte ${delay}ms vor dem Laden`)
        const timer = setTimeout(() => {
            load()
        }, delay)

        return () => {
            clearTimeout(timer)
            // Wenn Component unmounted wird während des Ladens
            if (loadingRef.current) {
                console.log('🛑 ClarificationContext: Component unmounted während des Ladens')
                loadingRef.current = false
            }
        }
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

    const refresh = () => {
        console.log('🔄 ClarificationContext: Manueller Refresh angefordert')
        // Cache nur für den aktuellen Monat leeren
        if (monthId) {
            ClarificationReactionService.clearCacheForMonth(monthId)
        }
        setVersion(v => v + 1)
    }

    // 🔍 Debug-Helper (kann später entfernt werden)
    if (process.env.NODE_ENV === 'development') {
        ;(window as any).__clarificationDebug = {
            reactions,
            monthId,
            isLoading,
            getReactionsForExpense: (expenseId: string) =>
                reactions.filter(r => r.expenseId === expenseId),
            loadingRef: loadingRef.current,
        }
    }

    return (
        <ClarificationReactionsContext.Provider
            value={{
                getIsConfirmed,
                getUnconfirmedCount,
                refresh,
                getAllReactions,
                isLoading,
            }}
        >
            {children}
        </ClarificationReactionsContext.Provider>
    )
}
