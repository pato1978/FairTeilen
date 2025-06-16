import type { IExpenseService } from "./IExpenseService"
import initSqlJs, { Database } from 'sql.js'
import type { Expense } from '@/types'

let db: Database | null = null

export const sqlJsExpenseService = {
    // 🔹 Datenbank initialisieren
    async initDb(): Promise<void> {
        const SQL = await initSqlJs()
        db = new SQL.Database()

        const createTable = `CREATE TABLE IF NOT EXISTS Expenses (
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

        db.run(createTable)
    },

    // 🔹 Ausgaben abrufen (optional gefiltert nach Monat)
    async getAllExpenses(filter?: { monthKey?: string }): Promise<Expense[]> {
        if (!db) throw new Error('Database not initialized')

        let query = 'SELECT * FROM Expenses'
        const params: any[] = []
        if (filter?.monthKey) {
            query += ' WHERE substr(date, 1, 7) = ?'
            params.push(filter.monthKey)
        }

        const stmt = db.prepare(query, params)
        const rows: Expense[] = []
        while (stmt.step()) {
            const row = stmt.getAsObject() as any
            rows.push({
                ...row,
                amount: Number(row.amount),
                isPersonal: row.isPersonal === 1,
                isShared: row.isShared === 1,
                isChild: row.isChild === 1,
                isRecurring: row.isRecurring === 1,
                isBalanced: row.isBalanced === 1,
            })
        }
        stmt.free()
        return rows
    },

    // 🔹 Neue Ausgabe speichern
    async addExpense(expense: Expense): Promise<void> {
        if (!db) throw new Error('Database not initialized')

        const sql = `INSERT INTO Expenses (
      id, groupId, name, amount, date, category,
      createdByUserId, isPersonal, isShared, isChild,
      isRecurring, isBalanced
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`

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

        db.run(sql, params)
    },

    // 🔹 Bestehende Ausgabe aktualisieren
    async updateExpense(expense: Expense): Promise<void> {
        if (!db) throw new Error('Database not initialized')

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

        db.run(sql, params)
    },

    // 🔹 Ausgabe löschen
    async deleteExpense(id: string): Promise<void> {
        if (!db) throw new Error('Database not initialized')

        const sql = 'DELETE FROM Expenses WHERE id = ?'
        db.run(sql, [id])
    },

    // 🔹 Optional: Datenbank als Uint8Array exportieren (z. B. für persistente Speicherung)
    exportDb(): Uint8Array {
        if (!db) throw new Error('Database not initialized')
        return db.export()
    },
} satisfies IExpenseService & { exportDb: () => Uint8Array }
