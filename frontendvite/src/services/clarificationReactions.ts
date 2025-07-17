// lib/api/clarificationReactions.ts

import { Capacitor } from '@capacitor/core'
import type { ClarificationReaction } from '@/types'

// 🌍 Plattformabhängige Basis-URL (wie im Budget-Service und YearOverview-Hook)
const API_BASE_URL = Capacitor.isNativePlatform()
    ? `${import.meta.env.VITE_API_URL_NATIVE}/api/reactions`
    : '/api/reactions'

/**
 * 🔄 POST: Neue Clarification-Reaktion anlegen
 */
export async function postClarificationReaction(reaction: ClarificationReaction) {
    console.log('[POST] Sende ClarificationReaction an:', API_BASE_URL)
    console.log('[POST] Payload:', JSON.stringify(reaction, null, 2))

    const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reaction),
    })

    console.log('[POST] HTTP-Status:', response.status, response.statusText)
    const text = await response.text()
    console.log('[POST] Response Body:', text.slice(0, 300))

    if (!response.ok) {
        console.error('[POST] Fehler beim Speichern der Reaktion:', text)
        throw new Error('Failed to save clarification reaction')
    }

    const result = JSON.parse(text)
    console.log('[POST] Erfolgreich gespeichert – Response JSON:', result)
    return result
}

/**
 * ❌ DELETE: Reaktion löschen anhand der Expense- und User-ID
 */
export async function deleteClarificationReaction(expenseId: string, userId: string) {
    const url = `${API_BASE_URL}/${expenseId}/${userId}`
    console.log('[DELETE] URL:', url)

    const response = await fetch(url, { method: 'DELETE' })
    console.log('[DELETE] HTTP-Status:', response.status)

    if (!response.ok) {
        const text = await response.text()
        console.error('[DELETE] Fehler beim Löschen der Reaktion:', text)
        throw new Error('Failed to delete clarification reaction')
    }
}

/**
 * 🔍 GET: Alle Reaktionen zu einer bestimmten Ausgabe
 */
export async function getClarificationReactionsForExpense(expenseId: string) {
    const url = `${API_BASE_URL}/expense/${expenseId}`
    console.log('[GET] Hole Reaktionen für Expense:', url)

    const response = await fetch(url)
    if (!response.ok) {
        const text = await response.text()
        console.error('[GET] Fehler beim Laden der Reaktionen:', text)
        throw new Error('Failed to fetch clarification reactions')
    }

    const data = await response.json()
    console.log('[GET] Gefundene Reaktionen:', data)
    return data as ClarificationReaction[]
}

/**
 * 📅 GET: Alle Reaktionen für einen bestimmten Monat (Format "YYYY-MM")
 */
export async function getClarificationReactionsForMonth(
    monthId: string
): Promise<ClarificationReaction[]> {
    const url = `${API_BASE_URL}/month/${monthId}`
    console.log('[GET] Hole Reaktionen für Monat:', url)

    const response = await fetch(url)
    if (!response.ok) {
        const text = await response.text()
        console.error('[GET] Fehler beim Laden der Monats-Reaktionen:', text)
        throw new Error('Failed to fetch clarification reactions for month')
    }

    const data = await response.json()
    console.log('[GET] Monats-Reaktionen:', data)
    return data as ClarificationReaction[]
}
