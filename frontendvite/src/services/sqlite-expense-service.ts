import type { IExpenseService } from './IExpenseService'
import { CapacitorSQLite, SQLiteDBConnection, SQLiteConnection } from '@capacitor-community/sqlite'
import type { Expense } from '@/types'

export class CapacitorSqliteExpenseService implements IExpenseService {
    private db: SQLiteDBConnection | null = null

    async initDb(): Promise<void> {
        const sqlite = new SQLiteConnection(CapacitorSQLite)

        this.db = await sqlite.createConnection('my_finance.db', false, 'no-encryption', 1, false)

        await this.db.open()

        const createTable = `CREATE TABLE IF NOT EXISTS Expenses(
      id TEXT PRIMARY KEY,
      groupId TEXT,
      name TEXT,
      amount REAL,
      date TEXT,
      category TEXT,
      createdByUserId TEXT,
      isPersonal INTEGER,
      isShared INTEGER,
      isChild INTEGER,
      isRecurring INTEGER,
      isBalanced INTEGER
    );`
        await this.db.execute(createTable)
    }

    async getAllExpenses(filter?: { monthKey?: string }): Promise<Expense[]> {
        try {
            if (!this.db) throw new Error('Database not initialized')
            let query = 'SELECT * FROM Expenses'
            const params: any[] = []
            if (filter?.monthKey) {
                query += ' WHERE substr(date, 1, 7) = ?'
                params.push(filter.monthKey)
            }
            const res = await this.db.query(query, params)
            return (res.values as Expense[]) || []
        } catch (err) {
            throw err
        }
    }

    async addExpense(expense: Expense): Promise<void> {
        try {
            if (!this.db) throw new Error('Database not initialized')
            const sql = `INSERT INTO Expenses(
                id, groupId, name, amount, date, category,
                createdByUserId, isPersonal, isShared, isChild,
                isRecurring, isBalanced
            ) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
            const params = [
                expense.id,
                expense.groupId,
                expense.name,
                expense.amount,
                expense.date,
                expense.category,
                expense.createdByUserId,
                expense.isPersonal ? 1 : 0,
                expense.isShared ? 1 : 0,
                expense.isChild ? 1 : 0,
                expense.isRecurring ? 1 : 0,
                expense.isBalanced ? 1 : 0,
            ]
            await this.db.run(sql, params)
        } catch (err) {
            throw err
        }
    }

    async updateExpense(expense: Expense): Promise<void> {
        try {
            if (!this.db) throw new Error('Database not initialized')
            const sql = `UPDATE Expenses SET
                groupId = ?,
                name = ?,
                amount = ?,
                date = ?,
                category = ?,
                createdByUserId = ?,
                isPersonal = ?,
                isShared = ?,
                isChild = ?,
                isRecurring = ?,
                isBalanced = ?
             WHERE id = ?`
            const params = [
                expense.groupId,
                expense.name,
                expense.amount,
                expense.date,
                expense.category,
                expense.createdByUserId,
                expense.isPersonal ? 1 : 0,
                expense.isShared ? 1 : 0,
                expense.isChild ? 1 : 0,
                expense.isRecurring ? 1 : 0,
                expense.isBalanced ? 1 : 0,
                expense.id,
            ]
            await this.db.run(sql, params)
        } catch (err) {
            throw err
        }
    }

    async deleteExpense(id: string): Promise<void> {
        try {
            if (!this.db) throw new Error('Database not initialized')
            const sql = 'DELETE FROM Expenses WHERE id = ?'
            await this.db.run(sql, [id])
        } catch (err) {
            throw err
        }
    }
}

export const sqliteExpenseService = new CapacitorSqliteExpenseService()
