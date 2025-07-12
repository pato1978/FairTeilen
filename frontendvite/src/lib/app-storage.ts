// src/lib/app-storage.ts
import { Capacitor } from '@capacitor/core'
import { sqliteConnection } from '@/services/sqliteConnection'
import { SQLiteDBConnection } from '@capacitor-community/sqlite'
import { waitForSQLiteReady } from '@/services/wait-sqlite-ready'

const DB_NAME = 'my_finance' // überall identisch verwenden!

let db: SQLiteDBConnection | null = null

async function getDb(): Promise<SQLiteDBConnection> {
    if (db) return db

    console.log('[app-storage] waitForSQLiteReady …')
    await waitForSQLiteReady() // Echo-Check
    await new Promise(r => setTimeout(r, 150)) // 150 ms Puffer
    console.log('[app-storage] native ready')

    const { result: exists } = await sqliteConnection.isConnection(DB_NAME, false)

    db = exists
        ? await sqliteConnection.retrieveConnection(DB_NAME, false)
        : await sqliteConnection.createConnection(DB_NAME, false, 'no-encryption', 1, false)

    await db.open()

    await db.execute(`
    CREATE TABLE IF NOT EXISTS AppSettings (
      key   TEXT PRIMARY KEY,
      value TEXT
    );
  `)

    console.log('[app-storage] DB ready')
    return db
}

function isNative(): boolean {
    return Capacitor.isNativePlatform?.() ?? false
}

/** Speichert einen String-Wert. */
export async function saveSetting(key: string, value: string): Promise<void> {
    if (isNative()) {
        const db = await getDb()
        await db.run('INSERT OR REPLACE INTO AppSettings (key, value) VALUES (?, ?)', [key, value])
    } else {
        localStorage.setItem(key, value)
    }
}

/** Lädt einen String-Wert. */
export async function loadSetting(key: string): Promise<string | null> {
    if (isNative()) {
        const db = await getDb()
        const { values } = await db.query('SELECT value FROM AppSettings WHERE key = ?', [key])
        return values?.[0]?.value ?? null
    }
    return localStorage.getItem(key)
}
