import { useCallback } from 'react'
import { Expense, ExpenseType } from '@/types'
import { getExpenseService } from '@/services/ExpenseFactory'
import { useUser } from '@/context/user-context'
import { useBudget } from '@/context/budget-context'
import { GROUP_ID } from '@/config/group-config'
import type { LucideIcon } from 'lucide-react'

export function useSaveExpense() {
    const { userId } = useUser()
    const { expenses, setExpenses } = useBudget()

    return useCallback(
        async (expense: Expense, icon: LucideIcon): Promise<Expense | null> => {
            if (!userId) {
                console.error('⚠️ Kein Nutzer angemeldet – Speichern wird abgebrochen.')
                return null
            }

            // Datum normalisieren (nur yyyy-MM-dd)
            const normalizedDate = expense.date.split('T')[0]

            const finalExpense: Expense = {
                id: expense.id || crypto.randomUUID(),
                name: expense.name || '',
                amount: Number(expense.amount) || 0,
                date: normalizedDate,
                category: expense.category || '',
                createdByUserId: userId,
                groupId: expense.groupId || GROUP_ID,
                type: expense.type ?? ExpenseType.Personal,
                isRecurring: expense.isRecurring ?? false,
                isBalanced: expense.isBalanced ?? false,
                icon,
            }

            if (
                finalExpense.type === ExpenseType.Shared ||
                finalExpense.type === ExpenseType.Child
            ) {
                // Variante B: Hook-Workaround, addExpense liefert void
                const service = await getExpenseService(finalExpense.type)
                console.log('🧩 [useSaveExpense] POST API:', finalExpense)

                // Speichern auf dem Backend
                await service.addExpense(finalExpense)

                // State mit finalExpense aktualisieren
                setExpenses(prev =>
                    prev.some(e => e.id === finalExpense.id)
                        ? prev.map(e => (e.id === finalExpense.id ? finalExpense : e))
                        : [...prev, finalExpense]
                )
                console.log('✅ [useSaveExpense] Erfolgreich gespeichert:', finalExpense)

                return finalExpense
            } else {
                // Lokale Speicherung (SQLite / SQL.js)
                const service = await getExpenseService(finalExpense.type)

                if (!expense.id) {
                    await service.addExpense(finalExpense)
                    setExpenses(prev => [...prev, finalExpense])
                    console.log('✅ Lokal gespeichert (neu):', finalExpense)
                } else {
                    await service.updateExpense(finalExpense)
                    setExpenses(prev =>
                        prev.map(e => (e.id === finalExpense.id ? finalExpense : e))
                    )
                    console.log('✅ Lokal aktualisiert:', finalExpense)
                }

                return finalExpense
            }
        },
        [userId, expenses, setExpenses]
    )
}
