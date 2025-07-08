import { useCallback } from 'react'
import { Expense, ExpenseType } from '@/types'
import { getExpenseService } from '@/services/useDataService'
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
                // 🌐 Zentrale Speicherung über API
                const response = await fetch('/api/expenses', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(finalExpense),
                })

                if (!response.ok) {
                    console.error(
                        '❌ Fehler beim Speichern über API:',
                        response.status,
                        await response.text()
                    )
                    return null
                }

                const saved: Expense = await response.json()
                console.log('✅ Erfolgreich über API gespeichert:', saved)

                // Lokal zur Liste hinzufügen oder ersetzen
                setExpenses(prev =>
                    prev.some(e => e.id === saved.id)
                        ? prev.map(e => (e.id === saved.id ? saved : e))
                        : [...prev, saved]
                )

                return saved
            } else {
                // 💾 Lokale Speicherung
                const service = await getExpenseService()

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
