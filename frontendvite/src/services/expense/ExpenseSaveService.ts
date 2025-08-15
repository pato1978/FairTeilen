// src/services/expense/ExpenseSaveService.ts
import { useCallback } from 'react'
import type { Expense } from '@/types'
import { getExpenseService } from '@/services/expense/ExpenseServiceFactory'
import { useUser } from '@/context/user-context'
import { useBudget } from '@/context/budget-context'
import type { LucideIcon } from 'lucide-react'

/**
 * Service for saving expenses
 */
export class ExpenseSaveService {
    /**
     * Hook for saving expenses
     * 
     * @returns A function to save expenses
     */
    public static useSaveExpense() {
        const { userId } = useUser()
        const { expenses, setExpenses } = useBudget()

        return useCallback(
            async (expense: Expense, icon: LucideIcon): Promise<Expense | null> => {
                if (!userId) {
                    console.error('⚠️ Kein Nutzer angemeldet – Speichern wird abgebrochen.')
                    return null
                }

                const service = await getExpenseService(expense.type ?? 'personal')
                const prepared = service.prepareExpense(expense, userId, icon)
                const result = service.validateExpense(prepared)

                if (!result.isValid) {
                    console.error('❌ Ungültige Ausgabe:', result.errors.join(', '))
                    return null
                }

                if (!expense.id) {
                    await service.addExpense(prepared)
                    setExpenses(prev => [...prev, prepared])
                    console.log('✅ Lokal gespeichert (neu):', prepared)
                } else {
                    await service.updateExpense(prepared)
                    setExpenses(prev =>
                        prev.map(e => (e.id === prepared.id ? prepared : e))
                    )
                    console.log('✅ Lokal aktualisiert:', prepared)
                }

                return prepared
            },
            [userId, expenses, setExpenses]
        )
    }
}

// For backward compatibility
export const useSaveExpense = ExpenseSaveService.useSaveExpense;
