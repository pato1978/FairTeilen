// ✅ React-Import für State-Management
import { useState } from 'react'

// ✅ Standard-Icon, falls keine Kategorie zugeordnet ist
import { HelpCircle } from 'lucide-react'

// ✅ Speichern von Ausgaben (POST)
import { useSaveExpense } from '@/services/useSaveExpenseHook.ts'
import { deleteExpense as deleteExpenseApi } from '@/services/expenses.ts'

// ✅ Hilfsfunktionen und Daten für Icons, Budgetberechnung und Datum
import { iconMap } from '@/lib/icon-map'
import { availableIcons } from '@/lib/icon-options'
import { calculateTotalExpenses, calculatePercentageUsed } from '@/lib/budget-utils'
import { toDateInputValue } from '@/lib/utils'

// ✅ Layout-Komponenten
import { PageLayout } from '@/components/layout/page-layout'
import { PageHeader } from '@/components/layout/page-header'

// ✅ UI-Komponenten (Budgetanzeige, Modale, Ausgabenliste)
import { BudgetSummaryCard } from '@/components/dashboard/budget-summary-card'
import { ExpenseEditorBottomSheet } from '@/components/modals/expense-editor-bottom-sheet'
import BudgetEditorModal from '@/components/modals/budget-editor-modal'
import { VerbesserteLitenansicht } from '@/components/dashboard/verbesserte-listenansicht'

// ✅ Kontexte: Monat und Budgetdaten (globaler Zustand)
import { useMonth } from '@/context/month-context'
import { useBudget } from '@/context/budget-context'

// ✅ Datentyp für einzelne Ausgaben
import type { Expense } from '@/types'

// 🧱 Typisierung der Props für die Komponente
type Props = {
    title: string
    budgetTitle: string
    scopeFlags: {
        isPersonal: boolean
        isShared: boolean
        isChild: boolean
    }
}

// 📦 Hauptkomponente für persönliche, gemeinsame und Kinder-Ausgaben
export function BudgetPageInner({ title, budgetTitle, scopeFlags }: Props) {
    const { currentDate } = useMonth()
    const { budget, setBudget, expenses, setExpenses, isLoading, refreshExpenses } = useBudget()

    // 🎛️ UI-Zustände
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
    const [selectedIcon, setSelectedIcon] = useState<any>(null)
    const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false)
    const [selectedCategory, setSelectedCategory] = useState('gesamt')
    const saveExpense = useSaveExpense()

    // ➕ Neue Ausgabe hinzufügen
    const handleAdd = () => {
        setEditingExpense({
            id: '',
            name: '',
            amount: 0,
            date: new Date().toISOString().split('T')[0],
            category: '',
            icon: HelpCircle,
            isPersonal: scopeFlags.isPersonal,
            isShared: scopeFlags.isShared,
            isChild: scopeFlags.isChild,
            isRecurring: false,
            isBalanced: false,
        })
        setSelectedIcon(HelpCircle)
        setIsModalOpen(true)
    }

    // ✏️ Vorhandene Ausgabe bearbeiten
    const handleEdit = (e: Expense) => {
        setEditingExpense({ ...e, date: toDateInputValue(e.date) })
        setSelectedIcon(iconMap[e.category] || HelpCircle)
        setIsModalOpen(true)
    }

    // 💾 Speichern (neu oder Update)
    const handleSave = async (exp: Expense) => {
        await saveExpense(exp, selectedIcon, setExpenses)
        refreshExpenses()
        setIsModalOpen(false)
        setEditingExpense(null)
    }

    // ❌ Löschen einer Ausgabe
    const handleDelete = async (id: string) => {
        await deleteExpenseApi(id, {
            isShared: scopeFlags.isShared,
            isChild: scopeFlags.isChild,
        })
        refreshExpenses()
    }

    // 🔎 Ausgaben nach Kategorie filtern
    function getFilteredExpenses(expenses: Expense[], selectedCategory: string): Expense[] {
        if (selectedCategory === 'gesamt') return expenses
        if (selectedCategory === 'wiederkehrend') return expenses.filter(e => e.isRecurring)
        if (selectedCategory === 'bereits beglichen') return expenses.filter(e => e.isBalanced)
        return expenses.filter(e => e.category === selectedCategory)
    }

    const filteredExpenses = getFilteredExpenses(expenses, selectedCategory)

    console.log('📊 Alle geladenen Ausgaben:', expenses)
    console.log('📊 Gefilterte Ausgaben:', filteredExpenses)
    console.log('📊 Aktuelle Kategorie:', selectedCategory)

    // 🖼️ Icon anhand Kategorie zuweisen
    const mapped = filteredExpenses.map(e => ({
        ...e,
        icon: iconMap[e.category] || HelpCircle,
    }))

    // 💡 Budgetberechnungen
    const totalExpenses = calculateTotalExpenses(filteredExpenses)
    const percentageUsed = calculatePercentageUsed(totalExpenses, budget)

    // 🖥️ JSX – Seitengestaltung
    return (
        <PageLayout onAddButtonClick={handleAdd}>
            <div className="page-header-container">
                <PageHeader title={title} /> {/* z. B. „Persönlich“ oder „Gemeinsam“ */}
            </div>

            <div className="flex-1 px-4 pb-6 mt-8 flex flex-col overflow-hidden">
                <div className="bg-white shadow-md rounded-lg p-4 flex-1 flex flex-col overflow-hidden mb-0">
                    <BudgetSummaryCard
                        title={budgetTitle}
                        budget={budget}
                        totalExpenses={totalExpenses}
                        expenses={expenses}
                        percentageUsed={percentageUsed}
                        onBudgetClick={() => setIsBudgetModalOpen(true)}
                        onCategoryChange={newCat => setSelectedCategory(newCat)}
                    />

                    {isLoading ? (
                        <div className="text-center text-sm text-gray-500 py-8">
                            🔄 Lade Ausgaben…
                        </div>
                    ) : (
                        <VerbesserteLitenansicht
                            expenses={mapped}
                            onDelete={handleDelete}
                            onEdit={handleEdit}
                            scopeFlags={scopeFlags}
                        />
                    )}
                </div>
            </div>

            {/* 🔽 Modal: Neue oder bearbeitete Ausgabe */}
            <ExpenseEditorBottomSheet
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                expense={editingExpense}
                onSave={handleSave}
                availableIcons={availableIcons}
            />

            {/* 💵 Modal: Budget bearbeiten */}
            <BudgetEditorModal
                isOpen={isBudgetModalOpen}
                onClose={() => setIsBudgetModalOpen(false)}
                currentBudget={budget}
                onSave={b => {
                    setBudget(b)
                    setIsBudgetModalOpen(false)
                }}
                title={`${budgetTitle} bearbeiten`}
            />
        </PageLayout>
    )
}
