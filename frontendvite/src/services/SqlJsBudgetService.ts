// src/services/SqlJsBudgetService.ts

import initSqlJs, { Database, SqlJsStatic } from 'sql.js'
import type { IBudgetService } from './BudgetServiceInterface'

export class SqlJsBudgetService implements IBudgetService {
    private db: Database | null = null

    /** 🔹 Initialisiert die SQL.js-Datenbank und legt die Tabelle an */
    async initDb(): Promise<void> {
        const SQL = (await initSqlJs()) as SqlJsStatic
        this.db = new SQL.Database()
        const createTable = `
            CREATE TABLE IF NOT EXISTS Budgets
            (
                id
                TEXT
                PRIMARY
                KEY,
                scope
                TEXT,
                monthKey
                TEXT,
                amount
                REAL,
                userId
                TEXT,
                groupId
                TEXT
            );
        `
        this.db.run(createTable)
    }

    /**
     * 🔹 Liefert das Budget für einen Bereich und Monat.
     * @param scope    'personal' | 'shared' | 'child'
     * @param monthKey 'YYYY-MM'
     * @param userId
     * @param groupId  optional, nur für shared/child benötigt
     */
    async getBudget(
        scope: string,
        monthKey: string,
        userId: string,
        groupId?: string
    ): Promise<number> {
        if (!this.db) throw new Error('Database not initialized')

        const gid = groupId ?? ''
        const stmt = this.db.prepare(
            `SELECT amount
             FROM Budgets
             WHERE scope = ?
               AND monthKey = ?
               AND userId = ?
               AND groupId = ?`,
            [scope, monthKey, userId, gid]
        )

        let amount = 0
        if (stmt.step()) {
            const row = stmt.getAsObject() as any
            amount = Number(row.amount ?? 0)
        }
        stmt.free()
        return amount
    }

    /**
     * 🔹 Speichert oder ersetzt das Budget für einen Bereich und Monat.
     * @param scope
     * @param monthKey
     * @param amount
     * @param userId
     * @param groupId  optional, nur für shared/child benötigt
     */
    async saveBudget(
        scope: string,
        monthKey: string,
        amount: number,
        userId: string,
        groupId?: string
    ): Promise<void> {
        if (!this.db) throw new Error('Database not initialized')

        const gid = groupId ?? ''
        const id = `${scope}_${monthKey}_${userId}_${gid}`
        this.db.run(
            `INSERT
            OR REPLACE INTO Budgets 
         (id, scope, monthKey, amount, userId, groupId)
       VALUES (?, ?, ?, ?, ?, ?)`,
            [id, scope, monthKey, amount, userId, gid]
        )
    }
}
export const sqlJsBudgetService = new SqlJsBudgetService()
