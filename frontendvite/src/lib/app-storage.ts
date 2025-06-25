// src/lib/app-storage.ts
import { Capacitor } from '@capacitor/core'
import { getDb } from '@/lib/sqlite-instance'

function isNativeApp(): boolean {
    return Capacitor.isNativePlatform?.() ?? false
}

/**
 * Speichert einen String-Wert – in SQLite (App) oder localStorage (Web)
 */
export async function saveSetting(key: string, value: string): Promise<void> {
    if (isNativeApp()) {
        const db = await getDb()
        await db.run('INSERT OR REPLACE INTO AppSettings (key, value) VALUES (?, ?)', [key, value])
    } else {
        localStorage.setItem(key, value)
    }
}

/**
 * Lädt einen String-Wert – aus SQLite (App) oder localStorage (Web)
 */
export async function loadSetting(key: string): Promise<string | null> {
    if (isNativeApp()) {
        const db = await getDb()
        const result = await db.get('SELECT value FROM AppSettings WHERE key = ?', [key])
        return result?.value ?? null
    } else {
        return localStorage.getItem(key)
    }
}
