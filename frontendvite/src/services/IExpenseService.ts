// src/services/IExpenseService.ts

import type { Expense } from '@/types'

export type ExpenseScope = 'personal' | 'shared' | 'child'

export interface IExpenseService {
    /** Initialisiert die lokale DB (SQLite/sql.js) */
    initDb(): Promise<void>

    /** Gibt alle Ausgaben zurück, optional gefiltert nach Monat */
    getAllExpenses(filter?: { monthKey?: string }): Promise<Expense[]>

    /** Neue Ausgabe anlegen; groupId nur für shared/child nötig */
    addExpense(e: Expense, groupId?: string): Promise<void>

    /** Bestehende Ausgabe aktualisieren; groupId nur für shared/child nötig */
    updateExpense(e: Expense, groupId?: string): Promise<void>

    /** Ausgabe löschen; groupId nur für shared/child nötig */
    deleteExpense(id: string, groupId?: string): Promise<void>

    /** Gefilterte Ausgaben laden: user, scope, Monat, groupId (shared/child) */
    getExpenses(
        userId: string,
        scope: ExpenseScope,
        monthKey: string,
        groupId?: string
    ): Promise<Expense[]>
}
