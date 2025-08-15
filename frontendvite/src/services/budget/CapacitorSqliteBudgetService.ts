// src/services/budget/CapacitorSqliteBudgetService.ts
import { SQLiteDBConnection } from '@capacitor-community/sqlite'
import { sqliteConnection } from '@/services/common/SqliteConnectionService'
import { DB_NAME } from '@/services/common/DatabaseConfigService'
import type { IBudgetService } from './BudgetServiceInterface'
import { waitForSQLiteReady } from '@/services/common/SqliteReadinessService'

export class CapacitorSqliteBudgetService implements IBudgetService {
    private db: SQLiteDBConnection | null = null
    private initPromise?: Promise<void>

    /**
     * Initialisiert die lokale SQLite-Datenbank einmalig.
     * Promise-Caching verhindert parallele createConnection-Aufrufe.
     */
    async initDb(): Promise<void> {
        if (this.initPromise) {
            return this.initPromise
        }

        this.initPromise = (async () => {
            console.log('[budget] waitForSQLiteReady …')
            await waitForSQLiteReady()
            await new Promise(r => setTimeout(r, 150))
            console.log('[budget] native ready')

            // Prüfen, ob Connection schon existiert
            const { result: exists } = await sqliteConnection.isConnection(DB_NAME, false)
            if (exists) {
                this.db = await sqliteConnection.retrieveConnection(DB_NAME, false)
                console.log('[budget] vorhandene Connection wiederverwendet')
            } else {
                this.db = await sqliteConnection.createConnection(
                    DB_NAME,
                    false, // encrypted?
                    'no-encryption', // encryption mode
                    1, // version
                    false // readonly?
                )
                console.log('[budget] neue Connection erstellt')
            }

            // Connection öffnen
            await this.db.open()

            // Tabelle anlegen, falls nicht vorhanden
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
            console.log('[budget] Tabelle "Budgets" bereit')
        })()

        return this.initPromise
    }

    /** Gibt das Budget für den gegebenen Scope/Monat/Nutzer zurück */
    async getBudget(
        scope: string,
        monthKey: string,
        userId: string,
        groupId?: string
    ): Promise<number> {
        if (!this.db) {
            throw new Error('Database not initialized')
        }
        const gid = groupId ?? ''
        const { values } = await this.db.query(
            `SELECT amount FROM Budgets
             WHERE scope = ? AND monthKey = ? AND userId = ? AND groupId = ?`,
            [scope, monthKey, userId, gid]
        )
        return values?.[0]?.amount ?? 0
    }

    /** Speichert oder ersetzt das Budget für Scope/Monat/Nutzer */
    async saveBudget(
        scope: string,
        monthKey: string,
        amount: number,
        userId: string,
        groupId?: string
    ): Promise<void> {
        if (!this.db) {
            throw new Error('Database not initialized')
        }
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
