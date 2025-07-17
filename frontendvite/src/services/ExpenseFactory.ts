// src/services/ExpenseFactory.ts
import { Capacitor } from '@capacitor/core'
import { capacitorSqliteExpenseService } from './CapacitorSqliteExpenseService'
import { sqlJsExpenseService } from './SqlJsExpenseService'
import { BackendExpenseService } from './BackendExpenseService'
import type { ExpenseScope, IExpenseService } from './IExpenseService'

/**
 * Einmalig: lokale DB initialisieren
 */
;(async () => {
    if (Capacitor.isNativePlatform?.()) {
        await capacitorSqliteExpenseService.initDb?.()
    } else {
        await sqlJsExpenseService.initDb?.()
    }
})()

/**
 * Instanzen anlegen
 */
const backendService = new BackendExpenseService()
const localService = Capacitor.isNativePlatform?.()
    ? capacitorSqliteExpenseService
    : sqlJsExpenseService

const services: Record<ExpenseScope, IExpenseService> = {
    personal: localService,
    shared: backendService,
    child: backendService,
}

/**
 * Liefert synchron das passende Service-Objekt für den angegebenen Scope.
 */
export function getExpenseService(scope: ExpenseScope = 'personal'): IExpenseService {
    return services[scope]
}
