import { ExpenseType } from '@/types/index'
import type { Expense } from '@/types/index'
import { getExpenseService } from '@/services/useDataService'

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
        const service = getExpenseService()
        const allLocal = await service.getAllExpenses({ monthKey: month })
        return allLocal.filter(e => e.type === ExpenseType.Personal)
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
 * @param type   Der Typ der Ausgabe (personal, shared, child)
 */
export async function deleteExpense(id: string, type: ExpenseType): Promise<void> {
    if (type === ExpenseType.Shared || type === ExpenseType.Child) {
        // 🌐 Zentrale Ausgabe via API löschen
        const res = await fetch(`/api/expenses/${id}`, { method: 'DELETE' })
        if (!res.ok) {
            console.error(`[deleteExpense] ❌ Fehler beim Löschen zentraler Ausgabe: ${id}`)
            throw new Error('Fehler beim Löschen der zentralen Ausgabe')
        }
    } else {
        // 💾 Lokale Ausgabe löschen
        const service = getExpenseService()
        await service.deleteExpense(id)
    }
}
