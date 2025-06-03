// ✅ React-Import für State-Management
import { useState } from 'react'

// ✅ Fallback-Icon für neue Ausgaben
import { HelpCircle } from 'lucide-react'

// ✅ Funktion zum Speichern von Ausgaben
import { saveExpense } from '@/lib/expense-actions'

// ✅ Hilfsfunktionen & Daten
import { iconMap } from '@/lib/icon-map'
import { availableIcons } from '@/lib/icon-options'
import { calculateTotalExpenses, calculatePercentageUsed } from '@/lib/budget-utils'
import { convertDateToISO } from '@/lib/utils'
import { toDateInputValue } from '@/lib/utils'

// ✅ Layout-Komponenten und UI-Elemente
import { PageLayout } from '@/components/layout/page-layout'
import { PageHeader } from '@/components/layout/page-header'

import { BudgetSummaryCard } from '@/components/dashboard/budget-summary-card'
import { ExpenseEditorBottomSheet } from '@/components/modals/expense-editor-bottom-sheet'
import BudgetEditorModal from '@/components/modals/budget-editor-modal'
import { VerbesserteLitenansicht } from '@/components/dashboard/verbesserte-listenansicht'

// ✅ Contexts: aktueller Monat + Budgetdaten
import { useMonth } from '@/context/month-context'
import { useBudget } from '@/context/budget-context'

// ✅ Datentyp
import type { Expense } from '@/types'

// -------------------------------------------
// 🔧 1. Komponente bekommt nun Konfigurations-Props
//     Diese ersetzen die Unterschiede aus früher:
//     - title: Was im Header steht
//     - budgetTitle: Überschrift im Budgetbereich
//     - scopeFlags: Steuert, ob die Ausgabe "personal", "shared" oder "child" ist
// -------------------------------------------

type Props = {
    title: string
    budgetTitle: string
    scopeFlags: {
        isPersonal: boolean
        isShared: boolean
        isChild: boolean
    }
}

// -------------------------------------------
// 📦 Hauptkomponente für ALLE Budgetansichten
//     ersetzt früher:
//       - PersonalPageInner
//       - SharedPageInner
//       - ChildPageInner
// -------------------------------------------

export function BudgetPageInner({ title, budgetTitle, scopeFlags }: Props) {
    const { currentDate } = useMonth()

    const { budget, setBudget, expenses, setExpenses, isLoading, refreshExpenses } = useBudget()

    // 🧠 UI-Zustände (Modale, Auswahl etc.)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
    const [selectedIcon, setSelectedIcon] = useState<any>(null)
    const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false)
    const [selectedCategory, setSelectedCategory] = useState('gesamt')

    // -------------------------------------------
    // ➕ Ausgabe hinzufügen
    //     ✅ Jetzt: Flags werden dynamisch gesetzt
    // -------------------------------------------
    const handleAdd = () => {
        setEditingExpense({
            id: '',
            name: '',
            amount: 0,
            date: new Date().toISOString().split('T')[0],
            category: '',
            icon: HelpCircle,
            isPersonal: scopeFlags.isPersonal, // 💡 DYNAMISCH statt fest
            isShared: scopeFlags.isShared,
            isChild: scopeFlags.isChild,
            isRecurring: false,
            isBalanced: false,
        })
        setSelectedIcon(HelpCircle)
        setIsModalOpen(true)
    }

    // ✏️ Bestehende Ausgabe bearbeiten
    const handleEdit = (e: Expense) => {
        //setEditingExpense({ ...e, date: convertDateToISO(e.date) })
        setEditingExpense({ ...e, date: toDateInputValue(e.date) })
        setSelectedIcon(iconMap[e.category] || HelpCircle)
        setIsModalOpen(true)
    }

    // 💾 Speichern (neu oder aktualisiert)
    const handleSave = async (exp: Expense) => {
        await saveExpense(exp, selectedIcon, setExpenses)
        refreshExpenses()
        setIsModalOpen(false)
        setEditingExpense(null)
    }

    // ❌ Löschen einer Ausgabe
    const deleteExpense = async (id: string) => {
        await fetch(`http://localhost:5289/api/expenses/${id}`, { method: 'DELETE' })
        refreshExpenses()
    }

    // 🔎 Ausgaben nach Kategorie filtern

    function getFilteredExpenses(expenses: Expense[], selectedCategory: string): Expense[] {
        if (selectedCategory === 'gesamt') {
            return expenses
        } else if (selectedCategory === 'wiederkehrend') {
            return expenses.filter(e => e.isRecurring)
        } else if (selectedCategory === 'bereits beglichen') {
            return expenses.filter(e => e.isBalanced)
        }

        return expenses.filter(e => e.category === selectedCategory)
    }

    const filteredExpenses = getFilteredExpenses(expenses, selectedCategory)

    // 🎨 Icon zuweisen
    const mapped = filteredExpenses.map(e => ({
        ...e,
        icon: iconMap[e.category] || HelpCircle,
    }))

    // 🧮 Berechnungen für Anzeige
    const totalExpenses = calculateTotalExpenses(filteredExpenses)
    const percentageUsed = calculatePercentageUsed(totalExpenses, budget)

    // -------------------------------------------
    // 🧱 UI-Aufbau der Seite – alles wie früher,
    //     aber gesteuert über Props
    // -------------------------------------------

    return (
        <PageLayout onAddButtonClick={handleAdd}>
            <div className="page-header-container">
                <PageHeader title={title} /> {/* 🏷 Titel: Personal / Shared / Child */}
            </div>

            <div className="flex-1 px-4 pb-6 mt-8 flex flex-col overflow-hidden">
                <div className="bg-white shadow-md rounded-lg p-4 flex-1 flex flex-col overflow-hidden mb-0">
                    <BudgetSummaryCard
                        title={budgetTitle} // 💰 z. B. "Monatliche Ausgaben"
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
                            onDelete={deleteExpense}
                            onEdit={handleEdit}
                            scopeFlags={scopeFlags}
                        />
                    )}
                </div>
            </div>

            {/* ✍ Bottom Sheet für Ausgaben */}
            <ExpenseEditorBottomSheet
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                expense={editingExpense}
                onSave={handleSave}
                availableIcons={availableIcons}
            />

            {/* 💵 Modal fürs Budget */}
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
