import { BudgetProvider } from '@/context/budget-context'
import { ChildPageInner } from '@/pages/child/child-page-inner'
import { ExpenseType } from '@/types'

export default function ChildPage() {
    return (
        <BudgetProvider type={ExpenseType.Child}>
            <ChildPageInner />
        </BudgetProvider>
    )
}
