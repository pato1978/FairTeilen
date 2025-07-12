// src/services/budgetFactory.ts

import { Capacitor } from '@capacitor/core'
import { ExpenseType } from '@/types'
import type { IBudgetService } from './IBudgetService'
import { backendBudgetService } from './backendBudgetService'
import { capacitorSqliteBudgetService } from './CapacitorSqliteBudgetService'
import { sqlJsBudgetService } from './SqlJsBudgetService'

/**
 * Liefert das passende BudgetService-Singleton:
 * – 'shared' oder 'child' → Backend
 * – personal & native → Capacitor-SQLite
 * – personal & web    → SQL.js
 */
export async function getBudgetService(type?: ExpenseType): Promise<IBudgetService> {
    // shared / child → immer Backend
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
