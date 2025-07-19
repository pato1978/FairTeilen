import { useState } from 'react'
import { HelpCircle, ShoppingCart } from 'lucide-react'

import { useSaveExpense } from '@/services/ExpenseSaveService'
import { deleteExpense as deleteExpenseApi } from '@/services/ExpenseService'
import { iconMap } from '@/lib/icon-map'
import { availableIcons } from '@/lib/icon-options'
import { calculatePercentageUsed, calculateTotalExpenses } from '@/lib/budget-utils'
import { toDateInputValue } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'
import { saveBudget } from '@/services/BudgetService'
import { useUser } from '@/context/user-context'
import { useMonth } from '@/context/month-context'
import { PageLayout } from '@/components/layout/page-layout'
import { PageHeader } from '@/components/layout/page-header'
import { BudgetSummaryCard } from '@/components/dashboard/budget-summary-card'
import { ExpenseEditorBottomSheet } from '@/components/modals/expense-editor-bottom-sheet'
import BudgetEditorModal from '@/components/modals/budget-editor-modal'
import { VerbesserteLitenansicht } from '@/components/dashboard/verbesserte-listenansicht'

import { useBudget } from '@/context/budget-context'

import type { Expense } from '@/types/index'
import { ExpenseType } from '@/types/index'

// 🧱 Nur noch `type` statt `scopeFlags`
type Props = {
    title: string
    budgetTitle: string
    type: ExpenseType // 'personal' | 'shared' | 'child'
}

export function BudgetPageInner({ title, budgetTitle, type }: Props) {
    const { budget, setBudget, expenses, isLoading, refreshExpenses } = useBudget()

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
    const [selectedIcon, setSelectedIcon] = useState<LucideIcon>(ShoppingCart)
    const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false)
    const [selectedCategory, setSelectedCategory] = useState('gesamt')

    const saveExpense = useSaveExpense()

    const { userId } = useUser()
    const { currentDate } = useMonth()

    // ➕ Neue Ausgabe
    const handleAdd = () => {
        setEditingExpense({
            id: '',
            name: '',
            amount: 0,
            date: new Date().toISOString().split('T')[0],
            category: '',
            icon: ShoppingCart,
            type: type, // 'personal' | 'shared' | 'child'
            isRecurring: false,
            isBalanced: false,
            groupId: '', // ← muss ergänzt werden
            createdByUserId: userId ?? '', // ← muss ergänzt werden
        })
        setSelectedIcon(ShoppingCart)
        setIsModalOpen(true)
    }
    console.log('🔎 Alle geladenen Ausgaben:', expenses)
    // ✏️ Vorhandene Ausgabe bearbeiten
    const handleEdit = (e: Expense) => {
        setEditingExpense({ ...e, date: toDateInputValue(e.date) })
        setSelectedIcon(iconMap[e.category] || HelpCircle)
        setIsModalOpen(true)
    }

    // 💾 Speichern
    const handleSave = async (exp: Expense) => {
        console.log('💾 Speichern mit Typ:', exp.type)
        await saveExpense(exp, selectedIcon)

        refreshExpenses() // Holt die echten Daten aus der Quelle

        setIsModalOpen(false)
        setEditingExpense(null)
    }

    // ❌ Löschen
    // ✅ Löscht lokal aus der Liste, kein unnötiger API-Aufruf
    const handleDelete = async (id: string) => {
        await deleteExpenseApi(id, type)
        refreshExpenses() // Holt die echten Daten aus der Quelle
    }

    // 🔎 Filterlogik
    function getFilteredExpenses(expenses: Expense[], selectedCategory: string): Expense[] {
        if (selectedCategory === 'gesamt') return expenses
        if (selectedCategory === 'wiederkehrend') return expenses.filter(e => e.isRecurring)
        if (selectedCategory === 'bereits beglichen') return expenses.filter(e => e.isBalanced)
        return expenses.filter(e => e.category === selectedCategory)
    }

    const filteredExpenses = getFilteredExpenses(expenses, selectedCategory)

    // 🖼️ Icons zuweisen
    const mapped = filteredExpenses.map(e => ({
        ...e,
        icon: iconMap[e.category] || HelpCircle,
    }))

    // 💡 Budgetberechnung
    const totalExpenses = calculateTotalExpenses(filteredExpenses)
    const percentageUsed = calculatePercentageUsed(totalExpenses, budget)

    return (
        <PageLayout onAddButtonClick={handleAdd}>
            <div className="page-header-container">
                <PageHeader title={title} />
            </div>

            <div className="bg-white shadow-md rounded-lg p-4 flex flex-col h-full min-h-0 overflow-hidden">
                <div className="pb-4">
                    <BudgetSummaryCard
                        title={budgetTitle}
                        budget={budget}
                        totalExpenses={totalExpenses}
                        expenses={expenses}
                        percentageUsed={percentageUsed}
                        onBudgetClick={() => setIsBudgetModalOpen(true)}
                        onCategoryChange={setSelectedCategory}
                    />
                </div>

                <div className="flex-1 min-h-0">
                    {isLoading ? (
                        <div className="text-center text-sm text-gray-500 py-8">
                            🔄 Lade Ausgaben…
                        </div>
                    ) : (
                        <VerbesserteLitenansicht
                            expenses={mapped}
                            onDelete={handleDelete}
                            onEdit={handleEdit}
                            type={type} // ✅ Statt scopeFlags
                        />
                    )}
                </div>
            </div>

            <ExpenseEditorBottomSheet
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                expense={editingExpense}
                onSave={handleSave}
                availableIcons={availableIcons}
                selectedIcon={selectedIcon}
                onIconChange={setSelectedIcon}
            />

            <BudgetEditorModal
                isOpen={isBudgetModalOpen}
                onClose={() => setIsBudgetModalOpen(false)}
                currentBudget={budget}
                onSave={async b => {
                    if (!userId) return // Sicherheitscheck
                    await saveBudget(type, currentDate, b, userId) // 💾 dauerhaft speichern
                    setBudget(b) // 🧠 lokal aktualisieren
                    setIsBudgetModalOpen(false)
                }}
                title={`${budgetTitle} bearbeiten`}
            />
        </PageLayout>
    )
}
