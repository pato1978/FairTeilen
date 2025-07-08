// src/services/useDataService.ts

import { getExpenseService as factory } from '@/services/ExpenseFactory'
import type { IExpenseService } from './IExpenseService'

/**
 * Liefert den Singleton für den personal-scope
 */
let instancePromise: Promise<IExpenseService> | null = null

export async function getExpenseService(): Promise<IExpenseService> {
    if (!instancePromise) {
        instancePromise = factory('personal') // ⇒ cached singleton aus der Factory
    }
    return instancePromise
}
