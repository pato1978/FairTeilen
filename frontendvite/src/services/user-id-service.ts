import { Capacitor } from '@capacitor/core'
import { getDb } from '@/lib/sqlite-instance' // Pfad ggf. anpassen

const USER_ID_KEY = 'userId'

function isNativeApp(): boolean {
    return Capacitor.isNativePlatform?.() ?? false
}

/**
 * Lädt die userId – aus SQLite (App) oder localStorage (Browser)
 */
export async function loadUserId(): Promise<string | null> {
    if (isNativeApp()) {
        try {
            const db = await getDb()
            const result = await db.get('SELECT value FROM AppSettings WHERE key = ?', [
                USER_ID_KEY,
            ])
            return result?.value ?? null
        } catch (err) {
            console.error('[UserIdService] Fehler beim Laden aus SQLite:', err)
            return null
        }
    } else {
        return localStorage.getItem(USER_ID_KEY)
    }
}

/**
 * Speichert die userId – in SQLite (App) oder localStorage (Browser)
 */
export async function saveUserId(id: string): Promise<void> {
    if (isNativeApp()) {
        try {
            const db = await getDb()
            await db.run('INSERT OR REPLACE INTO AppSettings (key, value) VALUES (?, ?)', [
                USER_ID_KEY,
                id,
            ])
        } catch (err) {
            console.error('[UserIdService] Fehler beim Speichern in SQLite:', err)
        }
    } else {
        localStorage.setItem(USER_ID_KEY, id)
    }
}
