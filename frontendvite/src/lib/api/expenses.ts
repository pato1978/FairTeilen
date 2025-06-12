import type { Expense } from '@/types'
import { getCurrentUserId } from '@/lib/user-storage'
import { sqliteExpenseService } from '@/services/SqliteExpenseService'

const BASE_URL = '/api' // ✅ Jetzt CORS-frei über Vite-Proxy

export type ExpenseScope = 'personal' | 'shared' | 'child' | string

export async function fetchExpenses(
    scope: ExpenseScope,
    group: string | null,
    date: Date
): Promise<Expense[]> {
    const month = date.toISOString().slice(0, 7)

    // 💾 Lokale Abfrage für private Ausgaben
    if (scope === 'personal') {
        const allLocal = await sqliteExpenseService.getAllExpenses({ monthKey: month })
        return allLocal.filter(e => e.isPersonal && !e.isShared && !e.isChild)
    }

    // 🌐 Abfrage zentraler Ausgaben via API
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

//X löscht eine Ausgabe
export async function deleteExpense(expense: Expense): Promise<void> {
    if (expense.isShared || expense.isChild) {
        // 🔄 zentrale Ausgabe → über API löschen
        await fetch(`/api/expenses/${expense.id}`, { method: 'DELETE' })
    } else {
        // 💾 private Ausgabe → lokal in SQLite löschen
        await sqliteExpenseService.deleteExpense(expense.id)
    }
}
