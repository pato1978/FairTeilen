import { BudgetProvider } from "@/context/budget-context"
import { ChildPageInner } from "@/pages/child/child-page-inner"

export default function ChildPage() {
    return (
        <BudgetProvider scope="child">
            <ChildPageInner />
        </BudgetProvider>
    )
}
