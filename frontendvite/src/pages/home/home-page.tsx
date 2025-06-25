'use client'

import { useState, useEffect } from 'react'
import { User, Users, Baby, Info, Wallet, Star, ChevronDown } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { PageLayout } from '@/components/layout/page-layout.tsx'
import { PageHeader } from '@/components/layout/page-header.tsx'
import { users } from '@/data/users'
import { BudgetCard, PeriodBadge } from '@/components/budget/BudgetCard.tsx'
import { ExpenseEditorBottomSheet } from '@/components/modals/expense-editor-bottom-sheet'
import { useTooltip } from '@/lib/hooks/use-tooltip.ts'
import { StarTooltip } from '@/components/ui/star-tooltip'
import { useMultiBudget } from '@/context/multi-budget-context'
import { useUser } from '@/context/user-context.tsx'

export default function HomePage() {
    const [currentDate, setCurrentDate] = useState(new Date())
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingExpense, setEditingExpense] = useState(null)
    const navigate = useNavigate()
    const [showMessages, setShowMessages] = useState(false)
    const { userId, setUserId, isReady } = useUser()
    const currentUser = users[userId]
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
                {/* Personalisierter Begrüßungs-Container */}
                <div className="bg-white shadow-md rounded-lg border border-blue-100 overflow-visible">
                    {/* Header mit Begrüßung */}
                    {!isReady || !userId ? (
                        <div className="p-4 space-y-4 border border-blue-100 bg-white rounded-lg shadow-md">
                            <h2 className="text-lg font-semibold text-gray-800">
                                Wer benutzt die App?
                            </h2>
                            <div className="flex gap-4">
                                {/* Patrizio */}
                                <button
                                    onClick={() =>
                                        setUserId('4dfde3f4-d9c2-4b0b-875f-2e5e41b531f7')
                                    }
                                    className="flex-1 p-4 rounded-lg border border-blue-200 hover:bg-blue-50 transition-colors flex items-center gap-3"
                                >
                                    <div className="h-10 w-10 bg-blue-500 text-white rounded-full flex items-center justify-center font-semibold">
                                        PV
                                    </div>
                                    <div className="text-left">
                                        <p className="font-medium text-gray-800">Patrizio</p>
                                        <p className="text-sm text-gray-500">Hauptnutzer</p>
                                    </div>
                                </button>

                                {/* Martyna */}
                                <button
                                    onClick={() =>
                                        setUserId('9aaf8e82-6d38-4b2b-84ce-9130c6dd98a9')
                                    }
                                    className="flex-1 p-4 rounded-lg border border-green-200 hover:bg-green-50 transition-colors flex items-center gap-3"
                                >
                                    <div className="h-10 w-10 bg-green-500 text-white rounded-full flex items-center justify-center font-semibold">
                                        MS
                                    </div>
                                    <div className="text-left">
                                        <p className="font-medium text-gray-800">Martyna</p>
                                        <p className="text-sm text-gray-500">Partnerin</p>
                                    </div>
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="p-3 border-b border-gray-100">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-semibold text-lg text-gray-800">
                                            Hallo, {currentUser.name}! 👋
                                        </h3>
                                        <p className="text-sm text-gray-600">
                                            Schön, dass du wieder da bist
                                        </p>
                                    </div>
                                    <button
                                        onClick={() =>
                                            setSelectedView(
                                                selectedView === 'all' ? 'personal-shared' : 'all'
                                            )
                                        }
                                        className="p-2 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                                        aria-label="Ansicht wechseln"
                                    >
                                        <User className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Ausklappbarer Nachrichtenbereich */}
                            <div className="border-b border-gray-100">
                                <button
                                    onClick={() => setShowMessages(!showMessages)}
                                    className="w-full p-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex items-center">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                                        <span className="text-sm font-medium text-gray-700">
                                            Neue Nachrichten (2)
                                        </span>
                                    </div>
                                    <ChevronDown
                                        className={`h-4 w-4 text-gray-400 transition-transform ${
                                            showMessages ? 'rotate-180' : ''
                                        }`}
                                    />
                                </button>

                                {showMessages && (
                                    <div className="px-3 pb-3 space-y-2">
                                        <div className="bg-blue-50 p-2 rounded-lg border-l-4 border-blue-400">
                                            <p className="text-xs text-blue-700 font-medium">
                                                Erinnerung
                                            </p>
                                            <p className="text-xs text-blue-600">
                                                Deine Miete für März ist noch nicht eingetragen.
                                            </p>
                                        </div>
                                        <div className="bg-green-50 p-2 rounded-lg border-l-4 border-green-400">
                                            <p className="text-xs text-green-700 font-medium">
                                                Erfolg
                                            </p>
                                            <p className="text-xs text-green-600">
                                                Du hast dein Monatsziel um 15% unterschritten! 🎉
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
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
