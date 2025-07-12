// src/services/ExpenseService.ts
import type { Expense } from '@/types'

export type ExpenseScope = 'personal' | 'shared' | 'child'

export interface ExpenseService {
    getExpenses(
        userId: string,
        scope: ExpenseScope,
        monthKey: string,
        groupId?: string
    ): Promise<Expense[]>

    deleteExpense(id: string, groupId?: string): Promise<void>

    updateExpense(expense: Expense): Promise<void>
}
