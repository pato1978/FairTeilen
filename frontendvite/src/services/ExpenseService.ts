// src/services/ExpenseService.ts
import type { Expense } from '@/types'
import { ExpenseType } from '@/types'
import { GROUP_ID } from '@/config/group-config'
import { getExpenseService } from './ExpenseServiceFactory'
import type { ExpenseScope } from './ExpenseServiceInterface'

/**
 * Service for managing expenses
 */
export class ExpenseService {
    /**
     * Loads expenses for a specific user, scope, and date
     * 
     * @param userId The user ID
     * @param scope The expense scope
     * @param date The date
     * @returns The expenses
     */
    public static async fetchExpenses(
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

    /**
     * Deletes an expense
     * 
     * @param id The expense ID
     * @param type The expense type
     */
    public static async deleteExpense(id: string, type: ExpenseType): Promise<void> {
        const scope = ExpenseService.mapTypeToScope(type)
        const groupId = scope === 'personal' ? undefined : GROUP_ID
        const service = await getExpenseService(scope)
        await service.deleteExpense(id, groupId)
    }

    /**
     * Updates an expense
     * 
     * @param expense The expense to update
     */
    public static async updateExpense(expense: Expense): Promise<void> {
        const scope = ExpenseService.mapTypeToScope(expense.type)
        const groupId = scope === 'personal' ? undefined : GROUP_ID
        const service = await getExpenseService(scope)
        await service.updateExpense(expense, groupId)
    }

    /**
     * Maps an expense type to a scope
     * 
     * @param type The expense type
     * @returns The corresponding scope
     */
    private static mapTypeToScope(type: ExpenseType): ExpenseScope {
        if (type === ExpenseType.Personal) return 'personal'
        if (type === ExpenseType.Shared) return 'shared'
        if (type === ExpenseType.Child) return 'child'
        return 'personal'
    }
}

// For backward compatibility
export const fetchExpenses = ExpenseService.fetchExpenses;
export const deleteExpense = ExpenseService.deleteExpense;
export const updateExpense = ExpenseService.updateExpense;