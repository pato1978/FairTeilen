import type { LucideIcon } from 'lucide-react'
import { ClarificationReaction } from '@/types/monthly-overview.ts'
import { type Participant } from '@/components/modals/distribution-modal'
export enum ExpenseType {
    Personal = 'personal',
    Shared = 'shared',
    Child = 'child',
}
export enum SplitMode {
    Global = 'global',
    Custom = 'custom',
}

export interface Expense {
    id: string
    groupId: string
    name: string
    amount: number
    date: string
    icon: LucideIcon
    category: string
    createdByUserId: string
    type: ExpenseType // ✅ NEU
    isRecurring: boolean
    isBalanced: boolean
    distribution?: Participant[] // ✅ optional hinzugefügt
    // NEU
    splitMode?: SplitMode // ✅ enum statt string
    customSplit?: { [userId: string]: number }
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
export type Budget = {
    scope: string
    month: string
    amount: number
    userId: string
    groupId?: string
}
export interface IconOption {
    icon: LucideIcon
    name: string
    defaultLabel?: string
}

export type { ClarificationReaction }
