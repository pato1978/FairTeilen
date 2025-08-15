import { useEffect, useState } from 'react'
import { HelpCircle, ShoppingCart } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { useSaveExpense } from '@/services/expense/ExpenseSaveService'
import { availableIcons } from '@/lib/icon-options'
import { deleteExpense as deleteExpenseApi } from '@/services/expense/ExpenseService'
import { iconMap } from '@/lib/icon-map'
import { useNavigate, useLocation } from 'react-router-dom'
import { calculatePercentageUsed, calculateTotalExpenses } from '@/lib/budget-utils'
import { toDateInputValue } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'
import { saveBudget } from '@/services/budget/BudgetService'
import { useUser } from '@/context/user-context'
import { useMonth } from '@/context/month-context'
import { PageLayout } from '@/components/layout/page-layout'
import { PageHeader } from '@/components/layout/page-header'
import { BudgetSummaryCard } from '@/components/dashboard/budget-summary-card'
import { ExpenseEditorBottomSheet } from '@/components/modals/expense-editor-bottom-sheet'
import BudgetEditorModal from '@/components/modals/budget-editor-modal'
import {
    VerbesserteLitenansicht,
    CategoryChip,
} from '@/components/dashboard/verbesserte-listenansicht'

import { useBudget } from '@/context/budget-context'

import type { Expense } from '@/types/index'
import { ExpenseType } from '@/types/index'

// 🧱 Nur noch `type` statt `scopeFlags`
// Kategorien definieren
const specialCategories = ['wiederkehrend', 'bereits beglichen']
const iconCategories = availableIcons.map(i => i.name)
const allCategories = ['gesamt', ...specialCategories, ...iconCategories]

type Props = {
    title: string
    budgetTitle: string
    type: ExpenseType // 'personal' | 'shared' | 'child'
}

// 💡 Haupt-Komponente
export function BudgetPageInner({ title, budgetTitle, type }: Props) {
    const { budget, setBudget, expenses, isLoading, refreshExpenses } = useBudget()
    const [params] = useSearchParams()
    // States für Modals, aktuelle Kategorie usw.
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
    const [selectedIcon, setSelectedIcon] = useState<LucideIcon>(ShoppingCart)
    const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false)
    const [selectedCategory, setSelectedCategory] = useState<string>('gesamt')

    const saveExpense = useSaveExpense()

    // Prüffunktion: Gibt es Ausgaben für eine Kategorie?
    function hasExpenses(category: string): boolean {
        if (category === 'gesamt') return true
        if (category === 'wiederkehrend') return expenses.some(e => e.isRecurring && e.amount > 0)
        if (category === 'bereits beglichen')
            return expenses.some(e => e.isBalanced && e.amount > 0)
        return expenses.some(e => e.category === category && !e.isRecurring && e.amount > 0)
    }

    // Nur Kategorien anzeigen, für die es Ausgaben gibt
    const visibleCategories = allCategories.filter(hasExpenses)

    // ⏭️ Separate Funktion (optional): Nächste Kategorie (kann z. B. für ein "Weiter"-Button verwendet werden)
    // function chooseNextCategory() {
    //   const idx = allCategories.indexOf(selectedCategory)
    // const rest = [...allCategories.slice(idx + 1), ...allCategories.slice(0, idx + 1)]
    // const next = rest.find(hasExpenses) || 'gesamt'
    // setSelectedCategory(next)
    //}
    const navigate = useNavigate()
    const location = useLocation()
    const { userId } = useUser()
    const { currentDate, setCurrentDate } = useMonth()
    useEffect(() => {
        const monthParam = params.get('month')
        if (monthParam) {
            const parsed = new Date(`${monthParam}-01`)
            if (!isNaN(parsed.getTime())) {
                setCurrentDate(parsed)
                // Nachträgliches Entfernen des Parameters
                navigate(location.pathname, { replace: true })
            }
        }
    }, [])
    // ➕ Neue Ausgabe hinzufügen
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
            groupId: '', // ← muss ggf. ergänzt werden
            createdByUserId: userId ?? '', // ← muss ergänzt werden
        })
        setSelectedIcon(ShoppingCart)
        setIsModalOpen(true)
    }

    // ✏️ Vorhandene Ausgabe bearbeiten
    const handleEdit = (e: Expense) => {
        setEditingExpense({ ...e, date: toDateInputValue(e.date) })
        setSelectedIcon(iconMap[e.category] || HelpCircle)
        setIsModalOpen(true)
    }

    // 💾 Ausgabe speichern
    const handleSave = async (exp: Expense) => {
        await saveExpense(exp, selectedIcon)
        await refreshExpenses()
        setIsModalOpen(false)
        setEditingExpense(null)
    }

    // ❌ Ausgabe löschen
    const handleDelete = async (id: string) => {
        await deleteExpenseApi(id, type)
        await refreshExpenses()
    }

    // 🔎 Filterlogik für sichtbare Ausgaben je Kategorie
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
            {/* Seitenkopf */}
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
                        currentCategory={selectedCategory}
                    />
                </div>

                <div className="flex-1 min-h-0">
                    {isLoading ? (
                        <div className="text-center text-sm text-gray-500 py-8">
                            🔄 Lade Ausgaben…
                        </div>
                    ) : (
                        <>
                            {/* Horizontale Kategorienleiste */}
                            <div className="overflow-x-auto no-scrollbar pb-2">
                                <div className="flex gap-2 w-max py-1">
                                    {visibleCategories.map(cat => (
                                        <CategoryChip
                                            key={cat}
                                            label={cat}
                                            isActive={selectedCategory === cat}
                                            // 👉 Korrekte Kategorieauswahl!
                                            onClick={() => setSelectedCategory(cat)}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Verbesserte Listenansicht */}
                            <VerbesserteLitenansicht
                                expenses={mapped}
                                onDelete={handleDelete}
                                onEdit={handleEdit}
                                type={type}
                                currentCategory={selectedCategory}
                            />
                        </>
                    )}
                </div>
            </div>

            {/* Modal zum Bearbeiten/Hinzufügen */}
            <ExpenseEditorBottomSheet
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                expense={editingExpense}
                onSave={handleSave}
                availableIcons={availableIcons}
                selectedIcon={selectedIcon}
                onIconChange={setSelectedIcon}
            />

            {/* Budget-Editor */}
            <BudgetEditorModal
                isOpen={isBudgetModalOpen}
                onClose={() => setIsBudgetModalOpen(false)}
                currentBudget={budget}
                onSave={async b => {
                    if (!userId) return // Sicherheitscheck
                    await saveBudget(type, currentDate, b, userId)
                    setBudget(b)
                    setIsBudgetModalOpen(false)
                }}
                title={`${budgetTitle} bearbeiten`}
            />
        </PageLayout>
    )
}
