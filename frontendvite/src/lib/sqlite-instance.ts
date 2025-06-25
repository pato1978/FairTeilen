// src/lib/sqlite-instance.ts
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite'

let db: SQLiteDBConnection | null = null

export async function getDb(): Promise<SQLiteDBConnection> {
    if (db) return db

    const sqlite = new SQLiteConnection(CapacitorSQLite)

    db = await sqlite.createConnection('my_finance.db', false, 'no-encryption', 1, false)
    await db.open()

    await db.execute(`
    CREATE TABLE IF NOT EXISTS AppSettings (
      key TEXT PRIMARY KEY,
      value TEXT
    )
  `)

    return db
}
