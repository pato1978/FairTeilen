// src/services/budget.ts

import { GROUP_ID } from '@/config/group-config'
import { getBudgetService } from './budgetFactory'

import type { ExpenseType } from '@/types' // ⬅️ NEU

export async function fetchBudget(type: ExpenseType, date: Date, userId: string): Promise<number> {
    const monthKey = date.toISOString().slice(0, 7)
    const service = await getBudgetService(type)
    const groupId = type === 'personal' ? undefined : GROUP_ID
    return service.getBudget(type, monthKey, userId, groupId)
}

export async function saveBudget(
    type: ExpenseType,
    date: Date,
    amount: number,
    userId: string
): Promise<void> {
    console.log('💾 [saveBudget] Typ:', type, '| Datum:', date.toISOString(), '| Betrag:', amount)
    const monthKey = date.toISOString().slice(0, 7)
    const service = await getBudgetService(type)
    const groupId = type === 'personal' ? undefined : GROUP_ID

    return service.saveBudget(type, monthKey, amount, userId, groupId)
}
