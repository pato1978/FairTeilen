import type { Expense } from '@/types'
import type { Dispatch, SetStateAction } from 'react'
import { getCurrentUserId } from '@/lib/user-storage'
import { sqliteExpenseService } from '@/services/SqliteExpenseService'

export async function saveExpense(
    expense: Expense,
    icon: any,
    setExpenses: Dispatch<SetStateAction<Expense[]>>
): Promise<Expense | null> {
    const normalizedDate = expense.date.split('T')[0]

    const finalExpense: Expense = {
        ...expense,
        date: normalizedDate,
        createdByUserId: getCurrentUserId(),
    }

    if (finalExpense.isShared || finalExpense.isChild) {
        // 🌐 Gemeinsame Ausgabe → ans Backend senden
        const response = await fetch('/api/expenses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(finalExpense),
        })

        if (!response.ok) {
            console.error('❌ Fehler beim Speichern:', response.status, await response.text())
            return null
        }

        const saved: Expense = await response.json()

        setExpenses(prev => {
            const alreadyExists = saved.id && prev.some(e => e.id === saved.id)
            return alreadyExists
                ? prev.map(e => (e.id === saved.id ? { ...saved, icon } : e))
                : [...prev, { ...saved, icon }]
        })

        return saved
    } else {
        // 💾 Private Ausgabe → lokal mit SQLite speichern
        if (!finalExpense.id) {
            finalExpense.id = crypto.randomUUID()
            await sqliteExpenseService.addExpense(finalExpense)
        } else {
            await sqliteExpenseService.updateExpense(finalExpense)
        }

        setExpenses(prev => {
            const alreadyExists = finalExpense.id && prev.some(e => e.id === finalExpense.id)
            return alreadyExists
                ? prev.map(e => (e.id === finalExpense.id ? { ...finalExpense, icon } : e))
                : [...prev, { ...finalExpense, icon }]
        })

        return finalExpense
    }
}
