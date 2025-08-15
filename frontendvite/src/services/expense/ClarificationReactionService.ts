// frontendvite/src/services/ClarificationReactionService.ts - APP-MODUS FIX

import { Capacitor } from '@capacitor/core'
import type { ClarificationReaction } from '@/types'
import { GROUP_ID } from '@/config/group-config'

// ✅ FIX: Plattform-abhängige API-URL wie in anderen Services
const API_BASE_URL = Capacitor.isNativePlatform?.()
    ? `${import.meta.env.VITE_API_URL_NATIVE}/api` // App: volle Server-URL
    : '/api' // Web: relative URL (Vite Proxy)

export class ClarificationReactionService {
    private static cache = new Map<string, ClarificationReaction[]>()

    static clearCacheForMonth(monthId: string): void {
        const groupId = GROUP_ID
        const cacheKey = `${monthId}-${groupId}`

        if (this.cache.has(cacheKey)) {
            console.log(`🧹 Cache geleert für Monat: ${cacheKey}`)
            this.cache.delete(cacheKey)
        }
    }

    static clearCache(): void {
        const size = this.cache.size
        this.cache.clear()
        console.log(`🧹 Reactions-Cache komplett geleert (${size} Einträge)`)
    }

    static async getClarificationReactionsForMonth(
        monthId: string
    ): Promise<ClarificationReaction[]> {
        const groupId = GROUP_ID
        const cacheKey = `${monthId}-${groupId}`

        // ✅ FIX: Verwende API_BASE_URL statt relative URL
        const url = `${API_BASE_URL}/reactions/month/${monthId}?groupId=${groupId}`

        console.log('🔄 Lade Reactions vom Backend:', {
            monthId,
            groupId,
            url,
            isNative: Capacitor.isNativePlatform?.(),
            API_BASE_URL,
        })

        try {
            const response = await fetch(url)

            if (!response.ok) {
                console.error('❌ Fehler beim Laden der Reactions:', {
                    status: response.status,
                    statusText: response.statusText,
                    url,
                })

                if (response.status === 404) {
                    console.log('📋 Kein Reactions gefunden für Monat:', monthId)
                    return []
                }

                throw new Error(`HTTP ${response.status}: ${response.statusText}`)
            }

            const reactions: ClarificationReaction[] = await response.json()
            this.cache.set(cacheKey, reactions)

            console.log(`✅ ${reactions.length} Reactions geladen für ${monthId}`)
            return reactions
        } catch (error) {
            console.error('❌ Fehler beim Laden der Reactions:', error)

            // Debug-Info für App-Modus
            if (Capacitor.isNativePlatform?.()) {
                console.error(
                    '🚨 App-Modus: Prüfe VITE_API_URL_NATIVE in .env:',
                    import.meta.env.VITE_API_URL_NATIVE
                )
            }

            this.cache.delete(cacheKey)
            return []
        }
    }

    static async postClarificationReaction(
        reaction: ClarificationReaction,
        monthId: string
    ): Promise<void> {
        const groupId = GROUP_ID
        const payload = { ...reaction, groupId }

        // ✅ FIX: API_BASE_URL verwenden
        const url = `${API_BASE_URL}/reactions`

        console.log('💾 Speichere Reaction:', { payload, url })

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })

            if (!response.ok) {
                const errorText = await response.text()
                throw new Error(`Fehler beim Speichern: ${response.status} - ${errorText}`)
            }

            console.log('✅ Reaction erfolgreich gespeichert')

            // Cache invalidieren
            const cacheKey = `${monthId}-${groupId}`
            this.cache.delete(cacheKey)
        } catch (error) {
            console.error('❌ Fehler beim Speichern der Reaction:', error)
            throw error
        }
    }

    static async deleteClarificationReaction(
        expenseId: string,
        userId: string,
        monthId: string
    ): Promise<void> {
        const groupId = GROUP_ID

        // ✅ FIX: API_BASE_URL verwenden
        const url = `${API_BASE_URL}/reactions/${expenseId}/${userId}?groupId=${groupId}`

        console.log('🗑️ Lösche Reaction:', { expenseId, userId, url })

        try {
            const response = await fetch(url, { method: 'DELETE' })

            if (!response.ok) {
                const errorText = await response.text()
                throw new Error(`Fehler beim Löschen: ${response.status} - ${errorText}`)
            }

            console.log('✅ Reaction erfolgreich gelöscht')

            // Cache invalidieren
            const cacheKey = `${monthId}-${groupId}`
            this.cache.delete(cacheKey)
        } catch (error) {
            console.error('❌ Fehler beim Löschen der Reaction:', error)
            throw error
        }
    }

    static async getReactionsForExpense(expenseId: string): Promise<ClarificationReaction[]> {
        const groupId = GROUP_ID

        // ✅ FIX: API_BASE_URL verwenden
        const url = `${API_BASE_URL}/reactions/expense/${expenseId}?groupId=${groupId}`

        try {
            const response = await fetch(url)

            if (!response.ok) {
                console.error('❌ Fehler beim Laden der Expense-Reactions:', response.status)
                return []
            }

            const reactions: ClarificationReaction[] = await response.json()
            console.log(`✅ ${reactions.length} Reactions für Expense ${expenseId} geladen`)
            return reactions
        } catch (error) {
            console.error('❌ Fehler beim Laden der Expense-Reactions:', error)
            return []
        }
    }

    static async getReactionsByUser(userId: string): Promise<ClarificationReaction[]> {
        const groupId = GROUP_ID

        // ✅ FIX: API_BASE_URL verwenden
        const url = `${API_BASE_URL}/reactions/user/${userId}?groupId=${groupId}`

        try {
            const response = await fetch(url)

            if (!response.ok) {
                console.error('❌ Fehler beim Laden der User-Reactions:', response.status)
                return []
            }

            const reactions: ClarificationReaction[] = await response.json()
            console.log(`✅ ${reactions.length} Reactions für User ${userId} geladen`)
            return reactions
        } catch (error) {
            console.error('❌ Fehler beim Laden der User-Reactions:', error)
            return []
        }
    }
}

// Export für Backward Compatibility
export const getClarificationReactionsForMonth =
    ClarificationReactionService.getClarificationReactionsForMonth.bind(
        ClarificationReactionService
    )
export const postClarificationReaction =
    ClarificationReactionService.postClarificationReaction.bind(ClarificationReactionService)
export const deleteClarificationReaction =
    ClarificationReactionService.deleteClarificationReaction.bind(ClarificationReactionService)
export const getReactionsForExpense = ClarificationReactionService.getReactionsForExpense.bind(
    ClarificationReactionService
)
export const getReactionsByUser = ClarificationReactionService.getReactionsByUser.bind(
    ClarificationReactionService
)
