import { BudgetPageInner } from '../budget-page-inner'
import { ExpenseType } from '@/types'

export function SharedPageInner() {
    return (
        <BudgetPageInner
            title="Gemeinsam"
            budgetTitle="Monatliche Ausgaben"
            type={ExpenseType.Shared}
        />
    )
}
