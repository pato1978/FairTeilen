// src/services/DatabaseConfigService.ts

/**
 * Service for database configuration settings
 */
export class DatabaseConfigService {
    /**
     * The name of the SQLite database
     * Note: Plugin automatically appends "SQLite.db" to this name
     */
    public static readonly DB_NAME = 'my_finance';
}

// For backward compatibility
export const DB_NAME = DatabaseConfigService.DB_NAME;