import type { Expense } from '@/types'
import { getCurrentUserId } from '@/lib/user-storage'

const BASE_URL = '/api' // ✅ Jetzt CORS-frei über Vite-Proxy

export type ExpenseScope = 'personal' | 'shared' | 'child' | string

export async function fetchExpenses(
    scope: ExpenseScope,
    group: string | null,
    date: Date
): Promise<Expense[]> {
    const month = date.toISOString().slice(0, 7)

    const isValidGroup = group && group !== 'null' && group !== 'undefined' && group !== ''

    const params = new URLSearchParams({
        scope,
        ...(isValidGroup ? { group } : {}),
        month,
        ...(scope === 'personal' ? { userId: getCurrentUserId() } : {}),
    })

    const url = `${BASE_URL}/expenses?${params.toString()}`

    console.log('[fetchExpenses] URL:', url)

    const res = await fetch(url)

    if (!res.ok) {
        console.error(`[fetchExpenses] Fehler bei scope=${scope}, group=${group}, month=${month}`)
        throw new Error('Fehler beim Laden der Ausgaben')
    }

    return await res.json()
}

// ❌ Löscht eine Ausgabe anhand der ID
export async function deleteExpense(id: string): Promise<void> {
    await fetch(`/api/expenses/${id}`, { method: 'DELETE' })
}
