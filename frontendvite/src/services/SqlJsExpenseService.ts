// src/services/expenses/SqlJsExpenseService.ts

import initSqlJs, { Database, SqlJsStatic } from 'sql.js'
import type { Expense } from '@/types'
import { ExpenseType } from '@/types'
import type { ExpenseScope, IExpenseService } from './IExpenseService'

export class SqlJsExpenseService implements IExpenseService {
    private db: Database | null = null

    /** 🔹 Datenbank initialisieren */
    async initDb(): Promise<void> {
        const SQL = (await initSqlJs()) as SqlJsStatic
        this.db = new SQL.Database()
        const createTable = `
            CREATE TABLE IF NOT EXISTS Expenses
            (
                id
                TEXT
                PRIMARY
                KEY,
                groupId
                TEXT,
                name
                TEXT,
                amount
                REAL,
                date
                TEXT,
                category
                TEXT,
                createdByUserId
                TEXT,
                type
                TEXT,
                isRecurring
                INTEGER,
                isBalanced
                INTEGER
            );
        `
        this.db.run(createTable)
    }

    /** 🔹 Alle Ausgaben laden (optional nach Monat gefiltert) */
    async getAllExpenses(filter?: { monthKey?: string }): Promise<Expense[]> {
        if (!this.db) throw new Error('Database not initialized')

        let query = 'SELECT * FROM Expenses'
        const params: any[] = []

        if (filter?.monthKey) {
            query += ' WHERE substr(date, 1, 7) = ?'
            params.push(filter.monthKey)
        }

        const stmt = this.db.prepare(query, params)
        const rows: Expense[] = []
        while (stmt.step()) {
            const row = stmt.getAsObject() as any
            rows.push({
                ...row,
                amount: Number(row.amount),
                type: row.type as ExpenseType,
                isRecurring: row.isRecurring === 1,
                isBalanced: row.isBalanced === 1,
            })
        }
        stmt.free()
        return rows
    }

    /** 🔹 Neue Ausgabe speichern; groupId wird übernommen */
    async addExpense(expense: Expense, _groupId?: string): Promise<void> {
        if (!this.db) throw new Error('Database not initialized')

        const sql = `
            INSERT INTO Expenses (id, groupId, name, amount, date, category,
                                  createdByUserId, type, isRecurring, isBalanced)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `
        const params = [
            expense.id,
            expense.groupId ?? null,
            expense.name,
            expense.amount,
            expense.date,
            expense.category,
            expense.createdByUserId,
            expense.type,
            expense.isRecurring ? 1 : 0,
            expense.isBalanced ? 1 : 0,
        ]
        this.db.run(sql, params)
    }

    /** 🔹 Ausgabe aktualisieren; groupId bleibt erhalten */
    async updateExpense(expense: Expense, _groupId?: string): Promise<void> {
        if (!this.db) throw new Error('Database not initialized')

        const sql = `
            UPDATE Expenses
            SET groupId         = ?,
                name            = ?,
                amount          = ?,
                date            = ?,
                category        = ?,
                createdByUserId = ?,
                type            = ?,
                isRecurring     = ?,
                isBalanced      = ?
            WHERE id = ?
        `
        const params = [
            expense.groupId ?? null,
            expense.name,
            expense.amount,
            expense.date,
            expense.category,
            expense.createdByUserId,
            expense.type,
            expense.isRecurring ? 1 : 0,
            expense.isBalanced ? 1 : 0,
            expense.id,
        ]
        this.db.run(sql, params)
    }

    /** 🔹 Ausgabe löschen; groupId hier irrelevant */
    async deleteExpense(id: string, _groupId?: string): Promise<void> {
        if (!this.db) throw new Error('Database not initialized')

        const sql = 'DELETE FROM Expenses WHERE id = ?'
        this.db.run(sql, [id])
    }

    /** 🔹 Gefilterte Ausgaben eines Nutzers laden */
    async getExpenses(
        userId: string,
        scope: ExpenseScope,
        monthKey: string,
        _groupId?: string
    ): Promise<Expense[]> {
        if (!this.db) throw new Error('Database not initialized')

        const type =
            scope === 'personal'
                ? ExpenseType.Personal
                : scope === 'shared'
                  ? ExpenseType.Shared
                  : ExpenseType.Child

        const query = `
            SELECT *
            FROM Expenses
            WHERE createdByUserId = ?
              AND type = ?
              AND substr(date, 1, 7) = ?
        `
        const stmt = this.db.prepare(query, [userId, type, monthKey])
        const rows: Expense[] = []
        while (stmt.step()) {
            const row = stmt.getAsObject() as any
            rows.push({
                ...row,
                amount: Number(row.amount),
                type: row.type as ExpenseType,
                isRecurring: row.isRecurring === 1,
                isBalanced: row.isBalanced === 1,
            })
        }
        stmt.free()
        return rows
    }

    /** 🔹 Optional: Datenbank exportieren */
    exportDb(): Uint8Array {
        if (!this.db) throw new Error('Database not initialized')
        return this.db.export()
    }
}
export const sqlJsExpenseService = new SqlJsExpenseService()
