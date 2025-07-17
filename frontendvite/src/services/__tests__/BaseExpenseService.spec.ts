import { describe, expect, test } from 'vitest'
import { BaseExpenseService } from '../BaseExpenseService'
import type { ExpenseType, Expense } from '@/types'
import type { LucideIcon } from 'lucide-react'

class TestService extends BaseExpenseService {
  protected getDefaultType(): ExpenseType {
    return 'personal'
  }

  async initDb() {}
}

describe('BaseExpenseService', () => {
  const service = new TestService() as any
  const icon = {} as LucideIcon

  test('assigns default type', () => {
    const exp = service.prepareExpense({}, 'uid', icon)
    expect(exp.type).toBe('personal')
  })

  test('validateExpense fails for non positive amount', () => {
    const exp: Expense = service.prepareExpense({ amount: 0 }, 'u', icon)
    const res = service.validateExpense(exp)
    expect(res.isValid).toBe(false)
  })
})
