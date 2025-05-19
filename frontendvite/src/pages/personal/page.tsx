"use client"

import { BudgetProvider } from "@/context/budget-context"
import { PersonalPageInner } from "./personal-page-inner"

export default function PersonalPage() {
    return (
        <BudgetProvider scope="personal">
            <PersonalPageInner />
        </BudgetProvider>
    )
}
