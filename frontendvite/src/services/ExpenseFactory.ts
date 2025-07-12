// src/services/ExpenseFactory.ts
import { Capacitor } from '@capacitor/core'
import { capacitorSqliteExpenseService } from './CapacitorSqliteExpenseService'
import { sqlJsExpenseService } from './SqlJsExpenseService'
import { BackendExpenseService } from './BackendExpenseService'
import type { ExpenseScope, IExpenseService } from './IExpenseService'

const cache: Partial<Record<ExpenseScope, Promise<IExpenseService>>> = {}

/**
 * Liefert für den gegebenen scope das jeweils korrekte IExpenseService-Objekt.
 * – personal: native → SQLite, web → SQL.js
 * – shared/child: → Backend
 *
 * Cacht jede Instanz einmalig.
 */
export function getExpenseService(scope: ExpenseScope = 'personal'): Promise<IExpenseService> {
    if (cache[scope]) {
        return cache[scope]!
    }

    cache[scope] = (async () => {
        if (scope !== 'personal') {
            // shared oder child → zentraler Backend-Service
            return new BackendExpenseService()
        }

        // personal → native oder web
        const service = Capacitor.isNativePlatform?.()
            ? capacitorSqliteExpenseService
            : sqlJsExpenseService

        // wenn vorhanden, initDb einmalig aufrufen
        if (typeof (service as any).initDb === 'function') {
            await (service as any).initDb()
        }

        return service
    })()

    return cache[scope]!
}
