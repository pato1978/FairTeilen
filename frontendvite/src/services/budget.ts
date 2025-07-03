// src/services/budget.ts

import { GROUP_ID } from '@/config/group-config'
import { getBudgetService } from './budgetFactory'
import type { IBudgetService } from './IBudgetService'

/**
 * 🔁 Lädt das Budget für einen bestimmten Bereich (Scope) und Monat.
 *
 * @param scope  'personal' | 'shared' | 'child'
 * @param date   Ein Datum innerhalb des Zielmonats
 * @param userId Die ID des aktuellen Nutzers
 * @returns      Das Budget als Zahl
 */
export async function fetchBudget(
    scope: 'personal' | 'shared' | 'child',
    date: Date,
    userId: string
): Promise<number> {
    const monthKey = date.toISOString().slice(0, 7)
    const service = (await getBudgetService()) as IBudgetService
    const groupId = scope === 'personal' ? undefined : GROUP_ID
    return service.getBudget(scope, monthKey, userId, groupId)
}

/**
 * 💾 Speichert oder aktualisiert das Budget für einen bestimmten Bereich und Monat.
 *
 * @param scope  'personal' | 'shared' | 'child'
 * @param date   Ein Datum innerhalb des Zielmonats
 * @param amount Neuer Budget-Wert
 * @param userId Die ID des aktuellen Nutzers
 */
export async function saveBudget(
    scope: 'personal' | 'shared' | 'child',
    date: Date,
    amount: number,
    userId: string
): Promise<void> {
    const monthKey = date.toISOString().slice(0, 7)
    const service = (await getBudgetService()) as IBudgetService
    const groupId = scope === 'personal' ? undefined : GROUP_ID
    return service.saveBudget(scope, monthKey, amount, userId, groupId)
}
