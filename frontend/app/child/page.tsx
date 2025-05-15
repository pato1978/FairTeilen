"use client"

import { BudgetProvider } from "@/context/budget-context"
import { ChildPageInner } from "./child-page-inner"

export default function ChildPage() {
    return (
        <BudgetProvider scope="child">
            <ChildPageInner />
        </BudgetProvider>
    )
}
