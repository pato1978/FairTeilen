import { Capacitor } from '@capacitor/core'
import type { IExpenseService } from './IExpenseService'
import { sqlJsExpenseService } from './sqljs-expense-service'
import { CapacitorSqliteExpenseService } from './sqlite-expense-service'

export function getExpenseService(): IExpenseService {
  return Capacitor.isNativePlatform() ? new CapacitorSqliteExpenseService() : sqlJsExpenseService
}
