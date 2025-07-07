// src/services/expenses.ts

import type { Expense } from '@/types'
import { ExpenseType } from '@/types'
import { GROUP_ID } from '@/config/group-config'
import { getExpenseService } from './ExpenseFactory'
import type { ExpenseScope, IExpenseService } from './IExpenseService'

/**
 * 🔁 Lädt Ausgaben für einen bestimmten Bereich (Scope) und Monat.
 * Entscheidet intern automatisch, ob lokal oder zentral gespeichert wird.
 */
export async function fetchExpenses(
    userId: string | null,
    scope: ExpenseScope,
    date: Date
): Promise<Expense[]> {
    console.log('[fetchExpenses] Aufruf gestartet', { userId, scope, date })

    if (!userId) {
        console.warn(`[fetchExpenses] ⚠️ Kein Nutzer – ${scope} wird nicht geladen.`)
        return []
    }

    const monthKey = date.toISOString().slice(0, 7)
    const groupId = scope === 'personal' ? undefined : GROUP_ID

    console.log('[fetchExpenses] Params', { monthKey, groupId })

    const service = (await getExpenseService(scope)) as IExpenseService
    const result = await service.getExpenses(userId, scope, monthKey, groupId)

    console.log('[fetchExpenses] Ergebnis von service.getExpenses:', result)
    return result
}

/**
 * 🗑️ Löscht eine einzelne Ausgabe – lokal oder zentral.
 * Intern wird automatisch die richtige groupId gesetzt.
 */
export async function deleteExpense(id: string, type: ExpenseType): Promise<void> {
    const scope: ExpenseScope =
        type === ExpenseType.Personal
            ? 'personal'
            : type === ExpenseType.Shared
              ? 'shared'
              : type === ExpenseType.Child
                ? 'child'
                : 'personal'

    const groupId = scope === 'personal' ? undefined : GROUP_ID

    const service = (await getExpenseService(scope)) as IExpenseService
    await service.deleteExpense(id, groupId)
}

/**
 * ✏️ Aktualisiert eine einzelne Ausgabe – lokal oder zentral.
 * Intern wird automatisch die richtige groupId gesetzt.
 */
export async function updateExpense(expense: Expense): Promise<void> {
    const scope: ExpenseScope =
        expense.type === ExpenseType.Personal
            ? 'personal'
            : expense.type === ExpenseType.Shared
              ? 'shared'
              : expense.type === ExpenseType.Child
                ? 'child'
                : 'personal'

    const groupId = scope === 'personal' ? undefined : GROUP_ID

    const service = (await getExpenseService(scope)) as IExpenseService
    await service.updateExpense(expense, groupId)
}
