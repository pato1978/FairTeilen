'use client'

import { BudgetProvider } from '@/context/budget-context'
import { PersonalPageInner } from './personal-page-inner'
import { ExpenseType } from '@/types'

export default function PersonalPage() {
    return (
        <BudgetProvider type={ExpenseType.Personal}>
            <PersonalPageInner />
        </BudgetProvider>
    )
}
