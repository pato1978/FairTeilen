'use client'

import { useState, useEffect } from 'react'
import { User, Users, Baby, Info, Wallet, Star } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { PageLayout } from '@/components/layout/page-layout.tsx'
import { PageHeader } from '@/components/layout/page-header.tsx'

import { BudgetCard, PeriodBadge } from '@/components/budget/BudgetCard.tsx'
import { ExpenseEditorBottomSheet } from '@/components/modals/expense-editor-bottom-sheet'
import { useTooltip } from '@/lib/hooks/use-tooltip.ts'
import { StarTooltip } from '@/components/ui/star-tooltip'
import { useMultiBudget } from '@/context/multi-budget-context'

export default function HomePage() {
    const [currentDate, setCurrentDate] = useState(new Date())
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingExpense, setEditingExpense] = useState(null)
    const navigate = useNavigate()
    // Remove these lines
    // const [showTooltip, setShowTooltip] = useState(false)
    // const [showFinanceTipTooltip, setShowFinanceTipTooltip] = useState(false)

    // Add these lines
    const {
        isVisible: showTooltip,
        showTooltip: displayTooltip,
        showAllTooltips: displayAllTooltips,
    } = useTooltip()
    const { isVisible: showFinanceTipTooltip, showTooltip: displayFinanceTipTooltip } = useTooltip({
        isGlobal: true,
    })

    // Get budget data from multi-budget context
    const { personal, shared, child } = useMultiBudget()

    // PeriodBadge is now imported from BudgetCard.tsx

    // Öffne Modal für neue Ausgabe
    const handleAddButtonClick = () => {
        setEditingExpense({
            id: null,
            name: '',
            amount: '',
            date: new Date().toISOString().split('T')[0],
            category: '',
            icon: null,
            isPersonal: true,
            isChild: false,
            isRecurring: false,
        })
        setIsModalOpen(true)
    }

    // Speichere Ausgabe (neu oder bearbeitet)
    const handleSaveExpense = expense => {
        console.log('Ausgabe gespeichert:', expense)
        setIsModalOpen(false)

        // Optional: Zur entsprechenden Seite navigieren
        if (expense.isPersonal) {
            navigate('/personal')
        } else if (expense.isChild) {
            navigate('/child')
        } else {
            navigate('/shared')
        }
    }

    // Füge einen neuen State für die ausgewählte Ansicht hinzu
    const [selectedView, setSelectedView] = useState<'all' | 'personal-shared' | 'extended'>('all')

    // Füge einen vierten Container für die erweiterte Ansicht hinzu
    const fourthContainer = {
        name: 'Sparen',
        icon: Wallet,
        route: '/savings',
        budget: {
            spent: 250,
            total: 500,
            percentage: 50,
        },
    }

    // Event-Listener für das Anzeigen aller Stern-Tooltips
    useEffect(() => {
        const handleShowAllTooltips = () => {
            // Only respond to the event if we didn't initiate it
            if (!window.tooltipEventInProgress) {
                displayTooltip()
            }
        }

        window.addEventListener('showAllStarTooltips', handleShowAllTooltips)

        return () => {
            window.removeEventListener('showAllStarTooltips', handleShowAllTooltips)
        }
    }, [displayTooltip])

    // Entferne oder kommentiere diesen useEffect-Hook aus
    // useEffect(() => {
    //   let timer: NodeJS.Timeout
    //
    //   if (showTooltip) {
    //     timer = setTimeout(() => {
    //       setShowTooltip(false)
    //     }, 2000)
    //   }
    //
    //   return () => {
    //     clearTimeout(timer)
    //   }
    // }, [showTooltip])

    return (
        <PageLayout onAddButtonClick={handleAddButtonClick}>
            {/* Header Area */}
            <div className="page-header-container scale-80 transform-origin-top">
                <PageHeader
                    title="Overview"
                    initialDate={currentDate}
                    onMonthChange={setCurrentDate}
                />
            </div>

            {/* Main Content Area */}
            <main className="flex-1 px-4 pb-6 mt-4 flex flex-col gap-4 w-full flex-grow overflow-hidden">
                {/* View Selector */}
                <div className="bg-white shadow-md rounded-lg p-3 border border-blue-100">
                    <h3 className="font-semibold text-base text-blue-600 mb-2">Ansicht wählen</h3>
                    <div className="flex gap-2">
                        <button
                            className={`px-3 py-1.5 text-sm font-medium rounded-md flex-1 transition-colors ${selectedView === 'all' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600'}`}
                            onClick={() => setSelectedView('all')}
                        >
                            Standard
                        </button>
                        <button
                            className={`px-3 py-1.5 text-sm font-medium rounded-md flex-1 transition-colors ${selectedView === 'personal-shared' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600'}`}
                            onClick={() => setSelectedView('personal-shared')}
                        >
                            Ohne Kind
                        </button>
                        <button
                            className={`px-3 py-1.5 text-sm font-medium rounded-md flex-1 transition-colors ${selectedView === 'extended' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600'}`}
                            onClick={() => setSelectedView('extended')}
                        >
                            Erweitert
                        </button>
                    </div>
                </div>

                {/* Expense Containers */}
                <div className={`grid grid-cols-2 gap-4 w-full`}>
                    {/* Personal Expenses - always show */}
                    <BudgetCard
                        icon={User}
                        title="Persönlich"
                        period="monatlich"
                        expenses={personal.expenses}
                        budget={personal.budget}
                        onClick={() => navigate('/personal')}
                        showInfoButton={true}
                        onInfoClick={() => alert('Info zu persönlichen Ausgaben')}
                        isLoading={personal.isLoading}
                    />

                    {/* Shared Expenses - always show */}
                    <BudgetCard
                        icon={Users}
                        title="Gemeinsam"
                        period="monatlich"
                        expenses={shared.expenses}
                        budget={shared.budget}
                        onClick={() => navigate('/shared')}
                        isLoading={shared.isLoading}
                    />

                    {/* Kind Expenses - only show in "all" and "extended" views */}
                    {(selectedView === 'all' || selectedView === 'extended') && (
                        <BudgetCard
                            icon={Baby}
                            title="Kind"
                            period="jährlich"
                            expenses={child.expenses}
                            budget={child.budget}
                            onClick={() => navigate('/child')}
                            isLoading={child.isLoading}
                        />
                    )}

                    {/* Savings Container - show in "personal-shared" and "extended" views */}
                    {(selectedView === 'personal-shared' || selectedView === 'extended') && (
                        <BudgetCard
                            icon={Wallet}
                            title="Sparen"
                            period="jährlich"
                            expenses={[{ amount: 100 }, { amount: 200 }]} // ✅ korrektes Format
                            budget={500}
                            onClick={() => alert('Sparfunktion noch nicht implementiert')}
                        />
                    )}
                    {/* Neuanlegen Container - nicht in der erweiterten Ansicht anzeigen */}
                    {selectedView !== 'extended' && (
                        <button
                            className="bg-gradient-to-br from-blue-50 to-white shadow-md rounded-lg p-2 pt-6 pb-6 active:bg-blue-50/70 transition-colors border border-blue-100 h-[200px] flex flex-col items-center justify-center space-y-4 relative"
                            onClick={() => {
                                displayAllTooltips()
                            }}
                        >
                            {/* Top: Icon and Title */}
                            <div className="flex flex-col items-center w-full">
                                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mb-1 relative">
                                    <span className="text-xl font-bold text-blue-600">+</span>
                                    <Star className="h-4 w-4 text-yellow-300 absolute -top-1 -right-1" />
                                </div>
                                <h3 className="font-semibold text-base text-center">Neuanlegen</h3>
                            </div>

                            {/* Bottom: Description */}
                            <div className="w-full flex justify-center">
                                <p className="text-sm font-normal text-gray-500 text-center">
                                    Neue Ausgabe hinzufügen
                                </p>
                            </div>

                            {/* Tooltip */}
                            {showTooltip && (
                                <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 w-48 p-2 bg-white text-gray-800 rounded-lg shadow-lg text-sm font-normal z-20">
                                    <p>Hier könntest du ein neues Widget anlegen</p>
                                    <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-white rotate-45"></div>
                                </div>
                            )}
                        </button>
                    )}
                </div>

                {/* Information Field */}
                <div
                    className="bg-white shadow-md rounded-lg p-4 border border-blue-100 cursor-pointer relative"
                    onClick={() => {
                        displayFinanceTipTooltip()
                    }}
                >
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-xl font-semibold text-blue-600">
                            Finanz-Tipp des Tages
                        </h3>
                        <div onClick={e => e.stopPropagation()}>
                            <StarTooltip
                                text="Diese Tipps werden täglich aktualisiert und helfen Ihnen, Ihre Finanzen besser zu verwalten."
                                position="top"
                                className="z-30"
                            />
                        </div>
                    </div>
                    <p className="text-base font-medium text-gray-700">
                        Regelmäßige kleine Einsparungen können sich über Zeit zu beträchtlichen
                        Summen addieren. Versuchen Sie, täglich auf einen kleinen Luxus zu
                        verzichten und sparen Sie den Betrag.
                    </p>

                    {/* Show tooltip when container is clicked */}
                    {showFinanceTipTooltip && (
                        <div className="absolute top-0 right-12 w-48 p-2 bg-white text-gray-800 rounded-lg shadow-lg text-sm font-normal z-20">
                            <p>
                                Diese Tipps werden täglich aktualisiert und helfen Ihnen, Ihre
                                Finanzen besser zu verwalten.
                            </p>
                            <div className="absolute top-2 -right-2 w-3 h-3 bg-white transform rotate-45"></div>
                        </div>
                    )}
                </div>
            </main>

            {/* Ausgaben-Editor-Modal */}
            <ExpenseEditorBottomSheet
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                expense={editingExpense}
                onSave={handleSaveExpense}
            />
        </PageLayout>
    )
}
