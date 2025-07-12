import { SQLiteDBConnection } from '@capacitor-community/sqlite'
import { sqliteConnection } from './sqliteConnection' // zentrales Singleton
import type { Expense } from '@/types'
import type { ExpenseScope, IExpenseService } from './IExpenseService'
import { DB_NAME } from './dbName'
import { waitForSQLiteReady } from '@/services/wait-sqlite-ready'
export class CapacitorSqliteExpenseService implements IExpenseService {
    private db: SQLiteDBConnection | null = null
    private initialized = false

    constructor() {
        console.log('📀 CapacitorSqliteExpenseService NEW')
    }

    async initDb(): Promise<void> {
        if (this.initialized) {
            console.log('📀 initDb(): bereits initialisiert – überspringe')
            return
        }
        this.initialized = true
        console.log('📀 CapacitorSqliteExpenseService initDb()')
        await waitForSQLiteReady()
        const { result: exists } = await sqliteConnection.isConnection(DB_NAME, false)

        this.db = exists
            ? await sqliteConnection.retrieveConnection(DB_NAME, false)
            : await sqliteConnection.createConnection(DB_NAME, false, 'no-encryption', 1, false)

        await this.db.open()

        const createTable = `
            CREATE TABLE IF NOT EXISTS Expenses (
                                                    id TEXT PRIMARY KEY,
                                                    groupId TEXT,
                                                    name TEXT,
                                                    amount REAL,
                                                    date TEXT,
                                                    category TEXT,
                                                    createdByUserId TEXT,
                                                    type TEXT,
                                                    isRecurring INTEGER,
                                                    isBalanced INTEGER
            );
        `
        await this.db.execute(createTable)
        console.log('📀 SQLite-DB geöffnet und Tabelle angelegt')
    }

    async getExpenses(userId: string, scope: ExpenseScope, monthKey: string): Promise<Expense[]> {
        if (!this.db) throw new Error('Database not initialized')
        const type = scope.charAt(0).toUpperCase() + scope.slice(1)
        const { values } = await this.db.query(
            `SELECT * FROM Expenses
       WHERE createdByUserId = ? AND type = ? AND substr(date, 1, 7) = ?`,
            [userId, type, monthKey]
        )
        return (values as Expense[]) ?? []
    }

    async getAllExpenses(filter?: { monthKey?: string }): Promise<Expense[]> {
        if (!this.db) throw new Error('Database not initialized')
        const query = filter?.monthKey
            ? 'SELECT * FROM Expenses WHERE substr(date, 1, 7) = ?'
            : 'SELECT * FROM Expenses'
        const params = filter?.monthKey ? [filter.monthKey] : []
        const { values } = await this.db.query(query, params)
        return (values as Expense[]) ?? []
    }

    async addExpense(expense: Expense, groupId?: string): Promise<void> {
        if (!this.db) throw new Error('Database not initialized')
        await this.db.run(
            `INSERT INTO Expenses (
                id, groupId, name, amount, date, category,
                createdByUserId, type, isRecurring, isBalanced
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                expense.id,
                groupId ?? expense.groupId ?? null,
                expense.name,
                expense.amount,
                expense.date,
                expense.category,
                expense.createdByUserId,
                expense.type,
                expense.isRecurring ? 1 : 0,
                expense.isBalanced ? 1 : 0,
            ]
        )
    }

    async updateExpense(expense: Expense, groupId?: string): Promise<void> {
        if (!this.db) throw new Error('Database not initialized')
        await this.db.run(
            `UPDATE Expenses SET
                                 groupId = ?, name = ?, amount = ?, date = ?, category = ?,
                                 createdByUserId = ?, type = ?, isRecurring = ?, isBalanced = ?
             WHERE id = ?`,
            [
                groupId ?? expense.groupId ?? null,
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
        )
    }

    async deleteExpense(id: string): Promise<void> {
        if (!this.db) throw new Error('Database not initialized')
        await this.db.run('DELETE FROM Expenses WHERE id = ?', [id])
    }
}

export const capacitorSqliteExpenseService = new CapacitorSqliteExpenseService()
