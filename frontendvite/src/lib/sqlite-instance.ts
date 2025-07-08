// src/lib/sqlite-instance.ts

import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite'

let db: SQLiteDBConnection | null = null
let initPromise: Promise<SQLiteDBConnection> | null = null

/**
 * Gibt eine Singleton-Instanz der SQLite-Datenbank zurück.
 * Verhindert Mehrfach-Initialisierung bei gleichzeitigen Zugriffen.
 */
export async function getDb(): Promise<SQLiteDBConnection> {
    if (db) return db
    if (initPromise) return await initPromise

    initPromise = (async () => {
        const sqlite = new SQLiteConnection(CapacitorSQLite)

        db = await sqlite.createConnection('my_finance.db', false, 'no-encryption', 1, false)
        await db.open()

        await db.execute(`
      CREATE TABLE IF NOT EXISTS AppSettings (
        key TEXT PRIMARY KEY,
        value TEXT
      );
    `)

        return db
    })()

    return await initPromise
}
