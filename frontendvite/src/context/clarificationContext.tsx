// frontendvite/src/context/clarificationContext.tsx - KORRIGIERT

'use client'

import { createContext, ReactNode, useContext, useEffect, useState, useRef } from 'react'
import type { ClarificationReaction } from '@/types'
import { ClarificationStatus } from '@/types/monthly-overview'
import { ClarificationReactionService } from '@/services/expense/ClarificationReactionService'
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
        currentDate && !isNaN(currentDate.getTime())
            ? `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}`
            : ''

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

        // ✅ KORREKTUR: Immer laden wenn sich der Monat geändert hat ODER manueller Refresh
        const monthChanged = monthId !== previousMonthIdRef.current
        const shouldLoad = monthChanged || version > 0

        if (!shouldLoad) {
            console.log('📅 ClarificationContext: Kein Reload nötig')
            return
        }

        // ✅ KORREKTUR: Cache bei JEDEM Monatswechsel leeren (auch programmatisch)
        if (monthChanged) {
            console.log('🧹 ClarificationContext: Monatswechsel erkannt, leere Cache')
            ClarificationReactionService.clearCache()
            previousMonthIdRef.current = monthId
        }

        const load = async () => {
            console.log('🔄 ClarificationContext: Starte Laden der Reactions für', monthId)
            loadingRef.current = true
            setIsLoading(true)

            try {
                // ✅ KORREKTUR: Cache vor dem Laden explizit für diesen Monat leeren
                ClarificationReactionService.clearCacheForMonth(monthId)

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

        // ✅ KORREKTUR: Längeres Delay für Navigation, kürzeres für Refresh
        const delay = monthChanged ? 150 : 100 // Mehr Zeit für Monatswechsel

        console.log(`⏱️ ClarificationContext: Warte ${delay}ms vor dem Laden`)
        const timer = setTimeout(() => {
            load()
        }, delay)

        return () => {
            clearTimeout(timer)
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
        // ✅ KORREKTUR: Cache für aktuellen Monat explizit leeren
        if (monthId) {
            ClarificationReactionService.clearCacheForMonth(monthId)
        }
        setVersion(v => v + 1)
    }

    // ✅ NEU: Funktion zum expliziten Cache-Reset (für Navigation)
    const forceReload = () => {
        console.log('🔄 ClarificationContext: Force Reload angefordert')
        if (monthId) {
            ClarificationReactionService.clearCacheForMonth(monthId)
            setReactions([]) // UI sofort zurücksetzen
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
            forceReload, // ✅ NEU: Debug-Funktion
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
