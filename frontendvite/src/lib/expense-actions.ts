import type { Expense } from '@/types'
import type { Dispatch, SetStateAction } from 'react'
import { sqlJsExpenseService } from '@/services/sqlJsExpenseService'
import { useUser } from '@/context/user-context'
import { useCallback } from 'react'

/**
 * React Hook: Speichert eine neue oder bestehende Ausgabe (lokal oder zentral)
 */
export function useSaveExpense() {
    const { userId } = useUser()

    return useCallback(
        async (
            expense: Expense,
            icon: React.ReactNode,
            setExpenses: Dispatch<SetStateAction<Expense[]>>
        ): Promise<Expense | null> => {
            const normalizedDate = expense.date.split('T')[0]

            if (!userId) {
                console.error('⚠️ Kein Nutzer angemeldet – Speichern wird abgebrochen.')
                return null
            }

            const finalExpense: Expense = {
                id: expense.id || crypto.randomUUID(),
                name: expense.name || '',
                amount: Number(expense.amount) || 0,
                date: normalizedDate,
                category: expense.category || '',
                createdByUserId: userId,
                groupId: expense.groupId || '',
                isPersonal: expense.isPersonal ?? true,
                isShared: expense.isShared ?? false,
                isChild: expense.isChild ?? false,
                isRecurring: expense.isRecurring ?? false,
                isBalanced: expense.isBalanced ?? false,
            }

            const updateState = (newExpense: Expense) => {
                setExpenses(prev => {
                    const exists = prev.some(e => e.id === newExpense.id)
                    return exists
                        ? prev.map(e => (e.id === newExpense.id ? { ...newExpense, icon } : e))
                        : [...prev, { ...newExpense, icon }]
                })
            }

            if (finalExpense.isShared || finalExpense.isChild) {
                // 🌐 Zentrale Speicherung via API
                console.log('🌐 Gemeinsame Ausgabe erkannt – wird an API gesendet:', finalExpense)

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
                updateState(saved)
                return saved
            } else {
                // 💾 Lokale Speicherung mit SQLite
                if (!expense.id) {
                    console.log('💾 Neue private Ausgabe – wird lokal gespeichert:', finalExpense)
                    await sqlJsExpenseService.addExpense(finalExpense)
                    console.log('✅ Gespeichert (addExpense):', finalExpense)
                } else {
                    console.log('✏️ Bestehende private Ausgabe – wird aktualisiert:', finalExpense)
                    await sqlJsExpenseService.updateExpense(finalExpense)
                    console.log('✅ Aktualisiert (updateExpense):', finalExpense)
                }

                updateState(finalExpense)
                return finalExpense
            }
        },
        [userId]
    )
}
