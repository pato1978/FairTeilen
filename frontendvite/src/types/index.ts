import type { LucideIcon } from 'lucide-react'
import { ClarificationReaction } from '@/types/monthly-overview.ts'

export interface Expense {
    id: string
    name: string
    amount: number
    date: string
    category: string
    createdByUserId: string
    isPersonal: boolean
    isShared: boolean
    isChild: boolean
    isRecurring: boolean
    isBalanced: boolean
    clarificationReactionsList: ClarificationReaction[]
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
export type { ClarificationReaction }
