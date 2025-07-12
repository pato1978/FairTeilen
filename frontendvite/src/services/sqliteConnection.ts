// src/services/sqliteConnection.ts
import { CapacitorSQLite, SQLiteConnection } from '@capacitor-community/sqlite'

/** Einzige Instanz, die alle Services teilen */
export const sqliteConnection = new SQLiteConnection(CapacitorSQLite)
