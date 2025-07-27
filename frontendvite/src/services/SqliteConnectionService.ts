// src/services/SqliteConnectionService.ts
import { CapacitorSQLite, SQLiteConnection } from '@capacitor-community/sqlite'

/**
 * Service for SQLite database connections
 */
export class SqliteConnectionService {
    /**
     * Singleton instance of SQLiteConnection that all services share
     */
    public static readonly connection = new SQLiteConnection(CapacitorSQLite);
}

// For backward compatibility
export const sqliteConnection = SqliteConnectionService.connection;