'use client'

import { createContext, ReactNode, useContext, useEffect, useState, useRef } from 'react'
import type { ClarificationReaction } from '@/types'
import { ClarificationStatus } from '@/types/monthly-overview'
import { getClarificationReactionsForMonth } from '@/services/ClarificationReactionService'
import { useMonth } from '@/context/month-context'

interface ClarificationReactionsContextValue {
    getIsConfirmed: (expenseId: string) => boolean
    getUnconfirmedCount: () => number
    refresh: () => void
    getAllReactions: () => ClarificationReaction[]
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

    const { currentDate } = useMonth()

    // 💡 Schutz vor invalidem Date:
    const monthId =
        currentDate && !isNaN(currentDate.getTime()) ? currentDate.toISOString().slice(0, 7) : ''

    useEffect(() => {
        if (!monthId) return

        // 🔍 Nur neu laden, wenn sich der Monat wirklich geändert hat
        if (monthId === previousMonthIdRef.current && version === 0) {
            console.log('📅 ClarificationContext: Monat unverändert, kein Reload nötig')
            return
        }

        previousMonthIdRef.current = monthId

        const load = async () => {
            console.log('🔄 ClarificationContext: Lade Reactions für', monthId)
            setIsLoading(true)

            try {
                const all = await getClarificationReactionsForMonth(monthId)
                setReactions(all)
                console.log(
                    `✅ ClarificationContext: ${all.length} Reactions geladen für ${monthId}`
                )
            } catch (error) {
                console.error('❌ ClarificationContext: Fehler beim Laden der Reactions:', error)
                setReactions([]) // Leere Liste bei Fehler
            } finally {
                setIsLoading(false)
            }
        }

        // 🕐 Kleines Delay, um sicherzustellen, dass der MonthContext vollständig aktualisiert ist
        const timer = setTimeout(() => {
            load()
        }, 50)

        return () => clearTimeout(timer)
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
        }
    }

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
