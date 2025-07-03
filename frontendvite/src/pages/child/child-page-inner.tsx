import { BudgetPageInner } from '@/pages/budget-page-inner'
import { ExpenseType } from '@/types'
export function ChildPageInner() {
    return (
        <BudgetPageInner title="Kind" budgetTitle="Jährliche Ausgaben" type={ExpenseType.Child} />
    )
}
