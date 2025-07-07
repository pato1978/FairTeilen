import { BudgetPageInner } from '../budget-page-inner'
import { ExpenseType } from '@/types'

export function PersonalPageInner() {
    return (
        <BudgetPageInner
            title="Persönlich"
            budgetTitle="Monatliche Ausgaben"
            type={ExpenseType.Personal}
        />
    )
}
