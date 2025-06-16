import type { Expense } from "@/types"
export interface IExpenseService {
  initDb(): Promise<void>
  getAllExpenses(filter?: { monthKey?: string }): Promise<Expense[]>
  addExpense(e: Expense): Promise<void>
  updateExpense(e: Expense): Promise<void>
  deleteExpense(id: string): Promise<void>
}
