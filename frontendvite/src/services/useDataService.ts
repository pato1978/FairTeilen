// src/services/useDataService.ts
import { Capacitor } from '@capacitor/core'
import type { IExpenseService } from './IExpenseService'
import { SqlJsExpenseService } from './SqlJsExpenseService'
import { CapacitorSqliteExpenseService } from './CapacitorSqliteExpenseService'

let instance: IExpenseService | null = null
let initialized = false

export async function getExpenseService(): Promise<IExpenseService> {
    if (!instance) {
        instance = Capacitor.isNativePlatform()
            ? new CapacitorSqliteExpenseService()
            : new SqlJsExpenseService()
    }

    if (!initialized) {
        await instance.initDb()
        initialized = true
    }

    return instance
}
