// frontendvite/src/services/ClarificationReactionService.ts - TYPESCRIPT FIX

import type { ClarificationReaction } from '@/types'
import { GROUP_ID } from '@/config/group-config'

export class ClarificationReactionService {
    private static cache = new Map<string, ClarificationReaction[]>()

    /**
     * ✅ KORRIGIERT: Cache für spezifischen Monat leeren
     */
    static clearCacheForMonth(monthId: string): void {
        const groupId = GROUP_ID
        const cacheKey = `${monthId}-${groupId}`

        if (this.cache.has(cacheKey)) {
            console.log(`🧹 Cache geleert für Monat: ${cacheKey}`)
            this.cache.delete(cacheKey)
        } else {
            console.log(`🧹 Kein Cache gefunden für Monat: ${cacheKey}`)
        }
    }

    /**
     * ✅ KORRIGIERT: Kompletten Cache leeren
     */
    static clearCache(): void {
        const size = this.cache.size
        this.cache.clear()
        console.log(`🧹 Reactions-Cache komplett geleert (${size} Einträge)`)
    }

    /**
     * ✅ NEU: Cache-Status für Debugging
     */
    static getCacheStatus(): { size: number; keys: string[] } {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys()),
        }
    }

    /**
     * ✅ KORRIGIERT: getClarificationReactionsForMonth mit verbessertem Caching
     */
    static async getClarificationReactionsForMonth(
        monthId: string
    ): Promise<ClarificationReaction[]> {
        const groupId = GROUP_ID
        const cacheKey = `${monthId}-${groupId}`

        console.log('📋 getClarificationReactionsForMonth:', {
            monthId,
            groupId,
            cacheKey,
            cacheSize: this.cache.size,
        })

        // ✅ KORRIGIERT: Cache-Check entfernt für konsistentere Daten
        // Immer vom Backend laden für aktuellste Daten
        console.log('🔄 Lade Reactions vom Backend:', {
            monthId,
            groupId,
            url: `/api/reactions/month/${monthId}?groupId=${groupId}`,
            fullUrl: `${window.location.origin}/api/reactions/month/${monthId}?groupId=${groupId}`,
        })

        try {
            const response = await fetch(`/api/reactions/month/${monthId}?groupId=${groupId}`)

            if (!response.ok) {
                console.error('❌ Fehler beim Laden der Reactions:', {
                    status: response.status,
                    statusText: response.statusText,
                })
                throw new Error(`HTTP ${response.status}: ${response.statusText}`)
            }

            const reactions: ClarificationReaction[] = await response.json()

            // ✅ Cache aktualisieren
            this.cache.set(cacheKey, reactions)

            console.log(
                `✅ ${reactions.length} Reactions geladen und gecacht für ${monthId}, Gruppe ${groupId}`
            )

            if (reactions.length > 0) {
                const expenseIds = reactions.map(r => r.expenseId)
                console.log('📌 Geladene Reaction ExpenseIds:', expenseIds)
            }

            return reactions
        } catch (error) {
            console.error('❌ Fehler beim Laden der Reactions:', error)

            // ✅ KORRIGIERT: Bei Fehler leere Liste zurückgeben statt Cache
            this.cache.delete(cacheKey) // Fehlerhaften Cache entfernen
            return []
        }
    }

    /**
     * Reaktion für eine bestimmte Ausgabe posten
     */
    static async postClarificationReaction(
        reaction: ClarificationReaction,
        monthId: string
    ): Promise<void> {
        const groupId = GROUP_ID

        console.log('💾 Speichere Reaction:', {
            id: reaction.id,
            expenseId: reaction.expenseId,
            userId: reaction.userId,
            status: reaction.status,
            timestamp: reaction.timestamp,
            groupId, // ✅ FIX: Verwende lokale Variable statt reaction.groupId
        })

        // ✅ FIX: Erstelle Payload mit groupId ohne TypeScript Fehler
        const payload = {
            ...reaction,
            groupId, // ✅ Explizit setzen statt aus reaction zu lesen
        }

        try {
            const response = await fetch('/api/reactions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            })

            if (!response.ok) {
                const errorText = await response.text()
                console.error('❌ Fehler beim Speichern der Reaction:', {
                    status: response.status,
                    error: errorText,
                })
                throw new Error(`Fehler beim Speichern: ${response.status} - ${errorText}`)
            }

            console.log('✅ Reaction erfolgreich gespeichert')

            // Cache für korrekten Monat invalidieren
            const cacheKey = `${monthId}-${groupId}`
            console.log('🗑️ Cache invalidiert für korrekten Monat:', cacheKey)
            this.cache.delete(cacheKey)
        } catch (error) {
            console.error('❌ Netzwerkfehler beim Speichern der Reaction:', error)
            throw error
        }
    }

    /**
     * Reaktion für eine Ausgabe löschen
     */
    static async deleteClarificationReaction(
        expenseId: string,
        userId: string,
        monthId: string
    ): Promise<void> {
        const groupId = GROUP_ID

        console.log('🗑️ Lösche Reaction:', {
            expenseId,
            userId,
            groupId,
            monthId,
        })

        try {
            const response = await fetch(
                `/api/reactions/${expenseId}/${userId}?groupId=${groupId}`,
                {
                    method: 'DELETE',
                }
            )

            if (!response.ok) {
                const errorText = await response.text()
                console.error('❌ Fehler beim Löschen der Reaction:', {
                    status: response.status,
                    error: errorText,
                })
                throw new Error(`Fehler beim Löschen: ${response.status} - ${errorText}`)
            }

            console.log('✅ Reaction erfolgreich gelöscht')

            // Cache für korrekten Monat invalidieren
            const cacheKey = `${monthId}-${groupId}`
            console.log('🗑️ Cache invalidiert für korrekten Monat:', cacheKey)
            this.cache.delete(cacheKey)
        } catch (error) {
            console.error('❌ Netzwerkfehler beim Löschen der Reaction:', error)
            throw error
        }
    }

    /**
     * Alle Reaktionen für eine bestimmte Ausgabe laden
     */
    static async getReactionsForExpense(expenseId: string): Promise<ClarificationReaction[]> {
        const groupId = GROUP_ID

        try {
            const response = await fetch(`/api/reactions/expense/${expenseId}?groupId=${groupId}`)

            if (!response.ok) {
                console.error('❌ Fehler beim Laden der Expense-Reactions:', {
                    status: response.status,
                    statusText: response.statusText,
                })
                return []
            }

            const reactions: ClarificationReaction[] = await response.json()
            console.log(`✅ ${reactions.length} Reactions für Expense ${expenseId} geladen`)

            return reactions
        } catch (error) {
            console.error('❌ Netzwerkfehler beim Laden der Expense-Reactions:', error)
            return []
        }
    }

    /**
     * Alle Reaktionen eines Nutzers laden
     */
    static async getReactionsByUser(userId: string): Promise<ClarificationReaction[]> {
        const groupId = GROUP_ID

        try {
            const response = await fetch(`/api/reactions/user/${userId}?groupId=${groupId}`)

            if (!response.ok) {
                console.error('❌ Fehler beim Laden der User-Reactions:', {
                    status: response.status,
                    statusText: response.statusText,
                })
                return []
            }

            const reactions: ClarificationReaction[] = await response.json()
            console.log(`✅ ${reactions.length} Reactions für User ${userId} geladen`)

            return reactions
        } catch (error) {
            console.error('❌ Netzwerkfehler beim Laden der User-Reactions:', error)
            return []
        }
    }
}

// Export der wichtigsten Funktionen für Backward Compatibility
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
