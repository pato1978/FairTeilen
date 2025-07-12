// src/services/expenses.ts
import type { Expense } from '@/types'
import { ExpenseType } from '@/types'
import { GROUP_ID } from '@/config/group-config'
import { getExpenseService } from './ExpenseFactory'
import type { ExpenseScope } from './IExpenseService'

/** 🔁 Lädt Ausgaben für Scope und Monat */
export async function fetchExpenses(
    userId: string | null,
    scope: ExpenseScope,
    date: Date
): Promise<Expense[]> {
    if (!userId) return []

    const monthKey = date.toISOString().slice(0, 7)
    const groupId = scope === 'personal' ? undefined : GROUP_ID

    const service = await getExpenseService(scope)
    return service.getExpenses(userId, scope, monthKey, groupId)
}

/** 🗑️ Löscht eine Ausgabe je nach ExpenseType */
export async function deleteExpense(id: string, type: ExpenseType): Promise<void> {
    const scope = mapTypeToScope(type)
    const groupId = scope === 'personal' ? undefined : GROUP_ID
    const service = await getExpenseService(scope)
    await service.deleteExpense(id, groupId)
}

/** ✏️ Aktualisiert eine Ausgabe */
export async function updateExpense(expense: Expense): Promise<void> {
    const scope = mapTypeToScope(expense.type)
    const groupId = scope === 'personal' ? undefined : GROUP_ID
    const service = await getExpenseService(scope)
    await service.updateExpense(expense, groupId)
}

/** Hilfsfunktion zur Zuordnung von ExpenseType zu unserem Scope */
function mapTypeToScope(type: ExpenseType): ExpenseScope {
    if (type === ExpenseType.Personal) return 'personal'
    if (type === ExpenseType.Shared) return 'shared'
    if (type === ExpenseType.Child) return 'child'
    return 'personal'
}
