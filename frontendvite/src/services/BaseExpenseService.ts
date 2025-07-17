import type { Expense, ExpenseType } from '@/types'
import { GROUP_ID } from '@/config/group-config'
import type { LucideIcon } from 'lucide-react'
import type { ValidationResult } from './IExpenseService'

export abstract class BaseExpenseService {
  protected normalizeDate(date?: string): string {
    return date ? date.split('T')[0] : new Date().toISOString().split('T')[0]
  }

  protected abstract getDefaultType(): ExpenseType

  prepareExpense(
    partial: Partial<Expense>,
    userId: string,
    icon: LucideIcon
  ): Expense {
    return {
      id: partial.id || crypto.randomUUID(),
      name: partial.name ?? '',
      amount: Number(partial.amount) || 0,
      date: this.normalizeDate(partial.date),
      category: partial.category ?? '',
      createdByUserId: userId,
      groupId: partial.groupId ?? GROUP_ID,
      type: partial.type ?? this.getDefaultType(),
      isRecurring: partial.isRecurring ?? false,
      isBalanced: partial.isBalanced ?? false,
      icon,
    }
  }

  validateExpense(exp: Expense): ValidationResult {
    const errors: string[] = []
    if (!exp.name) errors.push('Name ist erforderlich')
    if (exp.amount <= 0) errors.push('Betrag muss positiv sein')
    if (!exp.date) errors.push('Datum ist erforderlich')
    return { isValid: errors.length === 0, errors }
  }
}
