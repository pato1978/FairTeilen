// src/services/CapacitorSqliteBudgetService.ts
import { SQLiteDBConnection } from '@capacitor-community/sqlite'
import { sqliteConnection } from './sqliteConnection'
import { DB_NAME } from './dbName'
import type { IBudgetService } from './IBudgetService'
import { waitForSQLiteReady } from '@/services/wait-sqlite-ready'

export class CapacitorSqliteBudgetService implements IBudgetService {
    private db: SQLiteDBConnection | null = null
    private initialized = false

    async initDb(): Promise<void> {
        if (this.initialized) return
        this.initialized = true

        console.log('[budget] waitForSQLiteReady …')
        await waitForSQLiteReady() // Echo-Check
        await new Promise(r => setTimeout(r, 150)) // 150 ms Puffer
        console.log('[budget] native ready')

        const { result: exists } = await sqliteConnection.isConnection(DB_NAME, false)

        this.db = exists
            ? await sqliteConnection.retrieveConnection(DB_NAME, false)
            : await sqliteConnection.createConnection(DB_NAME, false, 'no-encryption', 1, false)

        await this.db.open()

        await this.db.execute(`
      CREATE TABLE IF NOT EXISTS Budgets (
        id       TEXT PRIMARY KEY,
        scope    TEXT,
        monthKey TEXT,
        amount   REAL,
        userId   TEXT,
        groupId  TEXT
      );
    `)
        console.log('[budget] Tabelle Budgets bereit')
    }

    async getBudget(
        scope: string,
        monthKey: string,
        userId: string,
        groupId?: string
    ): Promise<number> {
        if (!this.db) throw new Error('Database not initialized')
        const gid = groupId ?? ''
        const { values } = await this.db.query(
            `SELECT amount FROM Budgets
             WHERE scope = ? AND monthKey = ? AND userId = ? AND groupId = ?`,
            [scope, monthKey, userId, gid]
        )
        return values?.[0]?.amount ?? 0
    }

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
        await this.db.run(
            `INSERT OR REPLACE INTO Budgets
       (id, scope, monthKey, amount, userId, groupId)
       VALUES (?, ?, ?, ?, ?, ?)`,
            [id, scope, monthKey, amount, userId, gid]
        )
    }
}

export const capacitorSqliteBudgetService = new CapacitorSqliteBudgetService()
