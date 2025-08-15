// src/services/expense/ExpenseService.ts - ERWEITERT mit Clarification-Bereinigung
import type { Expense } from '@/types'
import { ExpenseType } from '@/types'
import { GROUP_ID } from '@/config/group-config'
import { getExpenseService } from './ExpenseServiceFactory'
import { ClarificationReactionService } from './ClarificationReactionService' // ✅ NEU
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
     * ✅ KORRIGIERT: Deletes an expense and cleans up related clarification reactions
     * Personal expenses: No clarifications (deleted normally)
     * Shared/Child expenses: Clarifications cleaned up automatically by BackendService
     *
     * @param id The expense ID
     * @param type The expense type
     * @param expenseDate Optional: Expense date for monthKey calculation (format: "YYYY-MM-DD")
     */
    public static async deleteExpense(
        id: string,
        type: ExpenseType,
        expenseDate?: string
    ): Promise<void> {
        const scope = ExpenseService.mapTypeToScope(type)
        const groupId = scope === 'personal' ? undefined : GROUP_ID

        console.log('🗑️ ExpenseService.deleteExpense:', {
            id,
            type,
            scope,
            expenseDate,
            groupId,
            hasClarifications: scope !== 'personal',
        })

        try {
            const service = await getExpenseService(scope)

            if (scope === 'personal') {
                // ✅ Personal expenses: Normale Löschung ohne Clarification-Bereinigung
                console.log('🗑️ Lösche personal expense (keine Clarifications)...')
                await service.deleteExpense(id, groupId)
            } else {
                // ✅ Shared/Child expenses: Mit Clarification-Bereinigung über BackendService
                console.log('🗑️ Lösche shared/child expense (mit Clarification-Bereinigung)...')

                // BackendService erwartet expenseDate als dritten Parameter
                if ('deleteExpense' in service && typeof service.deleteExpense === 'function') {
                    // Cast to any to access the enhanced deleteExpense signature
                    await (service as any).deleteExpense(id, groupId, expenseDate)
                } else {
                    // Fallback for services that don't support the enhanced signature
                    await service.deleteExpense(id, groupId)
                }
            }

            // ✅ Cache invalidieren (nur wenn Clarifications möglich sind)
            if (scope !== 'personal') {
                ClarificationReactionService.clearCache()
            }

            console.log(`✅ ${scope} expense erfolgreich gelöscht`)
        } catch (error) {
            console.error('❌ Fehler beim Löschen der Expense:', error)
            throw error
        }
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
     * ✅ NEU: Helper method to get monthKey from expense date
     *
     * @param expense The expense
     * @returns Month key in format "YYYY-MM"
     */
    public static getMonthKeyFromExpense(expense: Expense): string {
        return expense.date.slice(0, 7) // "2025-01-15" -> "2025-01"
    }

    /**
     * ✅ KORRIGIERT: Delete expense with automatic expense date detection
     *
     * @param expense The expense to delete
     */
    public static async deleteExpenseWithCleanup(expense: Expense): Promise<void> {
        // ✅ Expense-Datum direkt übergeben für korrekte monthKey-Ableitung
        await ExpenseService.deleteExpense(expense.id, expense.type, expense.date)
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
export const fetchExpenses = ExpenseService.fetchExpenses
export const deleteExpense = ExpenseService.deleteExpense
export const updateExpense = ExpenseService.updateExpense

// ✅ NEU: Enhanced delete functions
export const deleteExpenseWithCleanup = ExpenseService.deleteExpenseWithCleanup
export const getMonthKeyFromExpense = ExpenseService.getMonthKeyFromExpense
