// src/services/ExpenseServiceInterface.ts

import type { Expense } from '@/types'
import type { LucideIcon } from 'lucide-react'

export type ExpenseScope = 'personal' | 'shared' | 'child'
/** Das fachliche Modell einer Ausgabe */

export interface ValidationResult {
    isValid: boolean
    errors: string[]
}

export interface ExpenseServiceInterface {
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

    prepareExpense(
        partial: Partial<Expense>,
        userId: string,
        icon: LucideIcon
    ): Expense

    validateExpense(expense: Expense): ValidationResult
}

// For backward compatibility
export interface IExpenseService extends ExpenseServiceInterface {}