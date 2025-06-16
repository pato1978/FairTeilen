// lib/api/clarificationReactions.ts
import type { ClarificationReaction } from '@/types'

const BASE_URL = '/api/reactions' // ✅ Nutzt den Vite-Proxy

export async function postClarificationReaction(reaction: ClarificationReaction) {
    console.log('[POST] Sende ClarificationReaction:', JSON.stringify(reaction, null, 2))

    const response = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reaction),
    })

    console.log('[POST] HTTP-Status:', response.status, response.statusText)
    const text = await response.text()
    console.log('[POST] Response Body:', text)

    if (!response.ok) {
        console.error('[POST] Fehler beim Speichern der Reaktion:', text)
        throw new Error('Failed to save clarification reaction')
    }

    const result = JSON.parse(text)
    console.log('[POST] Erfolgreich gespeichert – Response JSON:', result)
    return result
}

// ✅ DELETE: Reaktion löschen anhand der ID
export async function deleteClarificationReaction(expenseId: string, userId: string) {
    const response = await fetch(`${BASE_URL}/${expenseId}/${userId}`, {
        method: 'DELETE',
    })

    if (!response.ok) throw new Error('Failed to delete clarification reaction')
}

// ✅ GET: Alle Reaktionen zu einer bestimmten Ausgabe
export async function getClarificationReactionsForExpense(expenseId: string) {
    const response = await fetch(`${BASE_URL}/expense/${expenseId}`)

    if (!response.ok) {
        throw new Error('Failed to fetch clarification reactions')
    }

    return await response.json()
}

// ✅ NEU: Alle Reaktionen für einen bestimmten Monat (z. B. "2025-06")
export async function getClarificationReactionsForMonth(
    monthId: string // Format: "YYYY-MM"
): Promise<ClarificationReaction[]> {
    const response = await fetch(`${BASE_URL}/month/${monthId}`)

    if (!response.ok) {
        throw new Error('Failed to fetch clarification reactions for month')
    }

    return await response.json()
}
