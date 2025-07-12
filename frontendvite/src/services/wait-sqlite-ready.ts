// src/services/wait-sqlite-ready.ts
import { CapacitorSQLite } from '@capacitor-community/sqlite'

export async function waitForSQLiteReady(): Promise<void> {
    for (let i = 0; i < 40; i++) {
        try {
            await CapacitorSQLite.echo({ value: 'ping' })
            console.log(`[SQLite] native layer bereit nach Versuch ${i + 1}`)
            await new Promise(r => setTimeout(r, 150)) // <— Puffer
            return
        } catch {
            await new Promise(r => setTimeout(r, 50))
        }
    }
    throw new Error('CapacitorSQLite native layer not ready')
}
