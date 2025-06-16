import type { Expense } from '@/types'
import { sqlJsExpenseService } from '@/services/sqlJsExpenseService'

export type ExpenseScope = 'personal' | 'shared' | 'child' | string

/**
 * 🔁 Lädt Ausgaben für einen bestimmten Bereich (Scope) und Monat.
 * Diese Funktion ist unabhängig von React und erwartet alle nötigen Parameter.
 *
 * @param userId         Der angemeldete Benutzer (wird vom Context oder Provider übergeben)
 * @param scope          Bereich der Ausgaben: "personal", "shared" oder "child"
 * @param group          Gruppen-ID für gemeinsame Ausgaben (optional)
 * @param date           Das gewählte Datum (z. B. aktueller Monat)
 * @returns              Eine Liste von Ausgaben für den angegebenen Scope und Monat
 */
export async function fetchExpenses(
    userId: string | null,
    scope: ExpenseScope,
    group: string | null,
    date: Date
): Promise<Expense[]> {
    const month = date.toISOString().slice(0, 7)

    // 🔐 Kein eingeloggter Benutzer → keine Daten laden
    if (!userId) {
        console.warn(`[fetchExpenses] ⚠️ Kein Nutzer angemeldet – ${scope} wird nicht geladen.`)
        return []
    }

    // 💾 Lokale Abfrage für private Ausgaben
    if (scope === 'personal') {
        const allLocal = await sqlJsExpenseService.getAllExpenses({ monthKey: month })
        return allLocal.filter(e => e.isPersonal && !e.isShared && !e.isChild)
    }

    // 🌐 Zentrale Abfrage für "shared" oder "child"
    const isValidGroup = group && group !== 'null' && group !== 'undefined' && group !== ''

    const params = new URLSearchParams({
        scope,
        ...(isValidGroup ? { group } : {}),
        month,
        userId,
    })

    const url = `/api/expenses?${params.toString()}`
    console.log('[fetchExpenses] URL:', url)

    const res = await fetch(url)
    if (!res.ok) {
        console.error(
            `[fetchExpenses] ❌ Fehler bei scope=${scope}, group=${group}, month=${month}`
        )
        throw new Error('Fehler beim Laden der Ausgaben')
    }

    return await res.json()
}

/**
 * 🗑️ Löscht eine einzelne Ausgabe – entweder lokal oder über die zentrale API.
 *
 * @param id     Die ID der zu löschenden Ausgabe
 * @param flags  Kennzeichnung, ob es sich um eine zentrale Ausgabe handelt
 */
export async function deleteExpense(
    id: string,
    flags: { isShared: boolean; isChild: boolean }
): Promise<void> {
    const { isShared, isChild } = flags

    if (isShared || isChild) {
        // 🌐 Zentrale Ausgabe via API löschen
        const res = await fetch(`/api/expenses/${id}`, { method: 'DELETE' })
        if (!res.ok) {
            console.error(`[deleteExpense] ❌ Fehler beim Löschen zentraler Ausgabe: ${id}`)
            throw new Error('Fehler beim Löschen der zentralen Ausgabe')
        }
    } else {
        // 💾 Lokale Ausgabe löschen
        await sqlJsExpenseService.deleteExpense(id)
    }
}
