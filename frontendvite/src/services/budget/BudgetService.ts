// src/services/BudgetService.ts

import { GROUP_ID } from '@/config/group-config'
import { getBudgetService } from './BudgetServiceFactory'
import type { ExpenseType } from '@/types'

/**
 * Service for managing budget operations
 */
export class BudgetService {
    /**
     * Fetches the budget for a specific expense type, date, and user
     * 
     * @param type The expense type
     * @param date The date for which to fetch the budget
     * @param userId The user ID
     * @returns The budget amount
     */
    public static async fetchBudget(type: ExpenseType, date: Date, userId: string): Promise<number> {
        const monthKey = date.toISOString().slice(0, 7)
        const service = await getBudgetService(type)
        const groupId = type === 'personal' ? undefined : GROUP_ID
        return service.getBudget(type, monthKey, userId, groupId)
    }

    /**
     * Saves the budget for a specific expense type, date, amount, and user
     * 
     * @param type The expense type
     * @param date The date for which to save the budget
     * @param amount The budget amount
     * @param userId The user ID
     */
    public static async saveBudget(
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
}

// For backward compatibility
export const fetchBudget = BudgetService.fetchBudget;
export const saveBudget = BudgetService.saveBudget;
