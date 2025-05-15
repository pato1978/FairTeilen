"use client"

import { BudgetProvider } from "@/context/budget-context"
import { SharedPageInner } from "./shared-page-inner"

export default function SharedPage() {
    return (
        <BudgetProvider scope="shared">
            <SharedPageInner />
        </BudgetProvider>
    )
}
