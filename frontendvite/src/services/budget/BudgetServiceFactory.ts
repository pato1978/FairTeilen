// src/services/BudgetServiceFactory.ts

import { Capacitor } from '@capacitor/core'
import { ExpenseType } from '@/types'
import type { IBudgetService } from './BudgetServiceInterface'
import { backendBudgetService } from './BackendBudgetService'
import { capacitorSqliteBudgetService } from './CapacitorSqliteBudgetService'
import { sqlJsBudgetService } from './SqlJsBudgetService'

/**
 * Factory for creating budget service instances
 */
export class BudgetServiceFactory {
    /**
     * Returns the appropriate BudgetService singleton:
     * - 'shared' or 'child' → Backend
     * - personal & native → Capacitor-SQLite
     * - personal & web → SQL.js
     * 
     * @param type Optional expense type
     * @returns The appropriate budget service
     */
    public static async getBudgetService(type?: ExpenseType): Promise<IBudgetService> {
        // shared / child → always Backend
        if (type === ExpenseType.Shared || type === ExpenseType.Child) {
            return backendBudgetService
        }

        // personal & native
        if (Capacitor.isNativePlatform?.()) {
            await capacitorSqliteBudgetService.initDb()
            return capacitorSqliteBudgetService
        }

        // personal & web
        await sqlJsBudgetService.initDb()
        return sqlJsBudgetService
    }
}

// For backward compatibility
export const getBudgetService = BudgetServiceFactory.getBudgetService;