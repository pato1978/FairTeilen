"use client"

import { useState } from "react"
import { User, Users, Baby, Info } from "lucide-react"
import { useRouter } from "next/navigation"
import { PageLayout } from "@/components/layout/page-layout"
import { PageHeader } from "@/components/layout/page-header"
import { MonthSelector } from "@/components/layout/month-selector"
import { CircularProgress } from "@/components/dashboard/circular-progress"
import ExpenseEditorModal from "@/components/modals/expense-editor-modal"
import type { Expense } from "@/types"
import { calculateTotalExpenses, calculatePercentageUsed } from "@/lib/budget-utils"
import { useMonth } from "@/context/month-context"
import { useMultiBudget } from "@/context/multi-budget-context"

export function HomePage() {
    const { currentDate } = useMonth()
    const router = useRouter()
    const { personal, shared, child } = useMultiBudget()

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null)

    const PeriodBadge = ({ period }: { period: string }) => (
        <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full mt-1">
      {period}
    </span>
    )

    const handleAddButtonClick = () => {
        setEditingExpense({
            id: "",
            name: "",
            amount: 0,
            date: new Date().toISOString().split("T")[0],
            category: "",
            icon: null,
            isPersonal: true,
            isChild: false,
            isShared: false,
            isRecurring: false,
            isBalanced: false,
        })
        setIsModalOpen(true)
    }

    const handleSaveExpense = (expense: Expense) => {
        setIsModalOpen(false)

        if (expense.isPersonal) {
            router.push("/personal")
        } else if (expense.isChild) {
            router.push("/child")
        } else {
            router.push("/shared")
        }
    }

    return (
        <PageLayout onAddButtonClick={handleAddButtonClick}>
            {/* Header */}
            <div className="page-header-container scale-80 transform-origin-top">
                <PageHeader title="Overview" />
                <MonthSelector />
            </div>

            {/* Content */}
            <main className="flex-1 px-4 pb-6 mt-7 flex flex-col gap-2 w-full flex-grow overflow-hidden">

                {/* Persönlich */}
                <button
                    className="bg-gradient-to-br from-blue-50 to-white shadow-md rounded-lg p-3 active:bg-blue-50/70 transition-colors w-full flex-1 flex items-center justify-between border border-blue-100"
                    onClick={() => router.push("/personal")}
                >
                    <div className="flex flex-col items-center w-1/3 pl-2">
                        <User className="h-8 w-8 mb-2 text-blue-600" />
                        <h3 className="font-semibold text-lg text-center flex items-center">
                            Persönlich
                            <span
                                onClick={(e) => {
                                    e.stopPropagation()
                                    alert("Info zu persönlichen Ausgaben")
                                }}
                                className="ml-1 text-blue-600 hover:text-blue-700 transition-colors"
                            >
                <Info className="h-3 w-3" />
              </span>
                        </h3>
                        <PeriodBadge period="monatlich" />
                    </div>
                    <div className="w-2/3 flex justify-center pl-12">
                        <CircularProgress
                            percentage={calculatePercentageUsed(calculateTotalExpenses(personal.expenses), personal.budget)}
                            size={90}
                            strokeWidth={8}
                            color="#2563EB"
                        >
                            <span className="text-xl font-bold">€{calculateTotalExpenses(personal.expenses)}</span>
                            <span className="text-xs text-gray-500 mt-1">von €{personal.budget}</span>
                        </CircularProgress>
                    </div>
                </button>

                {/* Gemeinsam */}
                <button
                    className="bg-gradient-to-br from-blue-100/80 to-white shadow-md rounded-lg p-3 active:bg-blue-100/50 transition-colors w-full flex-1 flex items-center justify-between border border-blue-100"
                    onClick={() => router.push("/shared")}
                >
                    <div className="flex flex-col items-center w-1/3 pl-2">
                        <Users className="h-8 w-8 mb-2 text-blue-600" />
                        <h3 className="font-semibold text-lg text-center">Gemeinsam</h3>
                        <PeriodBadge period="monatlich" />
                    </div>
                    <div className="w-2/3 flex justify-center pl-12">
                        <CircularProgress
                            percentage={calculatePercentageUsed(calculateTotalExpenses(shared.expenses), shared.budget)}
                            size={90}
                            strokeWidth={8}
                            color="#2563EB"
                        >
                            <span className="text-xl font-bold">€{calculateTotalExpenses(shared.expenses)}</span>
                            <span className="text-xs text-gray-500 mt-1">von €{shared.budget}</span>
                        </CircularProgress>
                    </div>
                </button>

                {/* Kind */}
                <button
                    className="bg-gradient-to-br from-blue-200/60 to-white shadow-md rounded-lg p-3 active:bg-blue-200/40 transition-colors w-full flex-1 flex items-center justify-between border border-blue-100"
                    onClick={() => router.push("/child")}
                >
                    <div className="flex flex-col items-center w-1/3 pl-2">
                        <Baby className="h-8 w-8 mb-2 text-blue-600" />
                        <h3 className="font-semibold text-lg text-center">Kind</h3>
                        <PeriodBadge period="jährlich" />
                    </div>
                    <div className="w-2/3 flex justify-center pl-12">
                        <CircularProgress
                            percentage={calculatePercentageUsed(calculateTotalExpenses(child.expenses), child.budget)}
                            size={90}
                            strokeWidth={8}
                            color="#2563EB"
                        >
                            <span className="text-xl font-bold">€{calculateTotalExpenses(child.expenses)}</span>
                            <span className="text-xs text-gray-500 mt-1">von €{child.budget}</span>
                        </CircularProgress>
                    </div>
                </button>

            </main>

            <ExpenseEditorModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                expense={editingExpense}
                onSave={handleSaveExpense}
            />
        </PageLayout>
    )
}
