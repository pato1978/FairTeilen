'use client'

import { BudgetProvider } from '@/context/budget-context'
import { SharedPageInner } from './shared-page-inner'
import { ExpenseType } from '@/types'

export default function SharedPage() {
    return (
        <BudgetProvider type={ExpenseType.Shared}>
            <SharedPageInner />
        </BudgetProvider>
    )
}
