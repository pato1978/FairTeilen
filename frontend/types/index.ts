import type { LucideIcon } from "lucide-react"

export interface Expense {
  id: string
  name: string
  amount: number
  date: string
  category: string
  icon: LucideIcon
  isPersonal: boolean
  isShared: boolean
  isChild: boolean
  isRecurring: boolean
  isBalanced: boolean

}

export interface BudgetSummary {
  budget: number
  expenses: number
  percentageUsed: number
}

export interface UserAllocation {
  name: string
  total: number
  sharedContribution: number
  balance: number
}

export interface FinancialData {
  totalSharedExpenses: number
  userAllocation: {
    user1: UserAllocation
    user2: UserAllocation
  }
}

export interface IconOption {
  icon: LucideIcon
  name: string
  defaultLabel?: string
}
