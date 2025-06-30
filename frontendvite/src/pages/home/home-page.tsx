'use client'

import { useState, useEffect } from 'react'
import { User, Users, Baby, ChevronDown } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { PageLayout } from '@/components/layout/page-layout.tsx'
import { PageHeader } from '@/components/layout/page-header.tsx'
import { users } from '@/data/users'
import { BudgetCard } from '@/components/budget/BudgetCardNew.tsx'
import { ExpenseEditorBottomSheet } from '@/components/modals/expense-editor-bottom-sheet'
import { useMultiBudget } from '@/context/multi-budget-context'
import { useUser } from '@/context/user-context.tsx'

export default function HomePage() {
    const [currentDate, setCurrentDate] = useState(new Date())
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingExpense, setEditingExpense] = useState(null)
    const [showMessages, setShowMessages] = useState(false)

    const navigate = useNavigate()
    const { userId, setUserId, isReady } = useUser()
    const currentUser = users[userId]
    const { personal, shared, child } = useMultiBudget()

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

    const handleSaveExpense = expense => {
        setIsModalOpen(false)

        if (expense.isPersonal) {
            navigate('/personal')
        } else if (expense.isChild) {
            navigate('/child')
        } else {
            navigate('/shared')
        }
    }

    return (
        <PageLayout onAddButtonClick={handleAddButtonClick}>
            {/* Header - Kompakterer Stil mit reduzierter Skalierung */}
            <div className="page-header-container  transform-origin-top -mb-2">
                <PageHeader
                    title="Overview"
                    initialDate={currentDate}
                    onMonthChange={setCurrentDate}
                />
            </div>

            {/*
                HAUPTVERBESSERUNG: Flexbox-Layout für optimale Raumnutzung
                - min-h-[calc(100vh-12rem)]: Nutzt vollen verfügbaren Raum (100vh minus Header/Footer)
                - flex flex-col: Vertikales Layout
                - justify-between: Verteilt Content optimal zwischen Header und Footer
            */}
            <main className="flex-1 px-4 mt-2 flex flex-col min-h-[calc(100vh-12rem)] justify-between">
                {/* Content Container - Wächst mit verfügbarem Platz */}
                <div className="flex flex-col gap-6 flex-grow">
                    {/* Begrüßung + Nutzerwahl - Erhöhte min-height für bessere Proportionen */}
                    <div className="bg-white shadow-md rounded-lg border border-blue-100 overflow-visible min-h-[120px] flex items-center">
                        {!isReady || !userId ? (
                            <div className="p-6 space-y-6 w-full">
                                <h2 className="text-xl font-semibold text-gray-800">
                                    Wer benutzt die App?
                                </h2>
                                <div className="flex gap-4">
                                    {/* Patrizio - Erweiterte Padding für bessere Touch-Targets */}
                                    <button
                                        onClick={() =>
                                            setUserId('4dfde3f4-d9c2-4b0b-875f-2e5e41b531f7')
                                        }
                                        className="flex-1 p-5 rounded-lg border border-blue-200 hover:bg-blue-50 transition-colors flex items-center gap-3 min-h-[80px]"
                                    >
                                        <div className="h-12 w-12 bg-blue-500 text-white rounded-full flex items-center justify-center font-semibold text-lg">
                                            PV
                                        </div>
                                        <div className="text-left">
                                            <p className="font-medium text-gray-800 text-lg">
                                                Patrizio
                                            </p>
                                            <p className="text-sm text-gray-500">Hauptnutzer</p>
                                        </div>
                                    </button>

                                    {/* Martyna - Konsistente Vergrößerung */}
                                    <button
                                        onClick={() =>
                                            setUserId('9aaf8e82-6d38-4b2b-84ce-9130c6dd98a9')
                                        }
                                        className="flex-1 p-5 rounded-lg border border-green-200 hover:bg-green-50 transition-colors flex items-center gap-3 min-h-[80px]"
                                    >
                                        <div className="h-12 w-12 bg-green-500 text-white rounded-full flex items-center justify-center font-semibold text-lg">
                                            MS
                                        </div>
                                        <div className="text-left">
                                            <p className="font-medium text-gray-800 text-lg">
                                                Martyna
                                            </p>
                                            <p className="text-sm text-gray-500">Partnerin</p>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="w-full">
                                {/* Begrüßungsbereich - Mehr Padding für bessere Proportionen */}
                                <div className="p-4 border-b border-gray-100">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="font-semibold text-xl text-gray-800">
                                                Hallo, {currentUser.name}! 👋
                                            </h3>
                                            <p className="text-base text-gray-600 mt-1">
                                                Schön, dass du wieder da bist
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Nachrichtenbereich - Erweiterte Touch-Targets */}
                                <div className="border-b border-gray-100">
                                    <button
                                        onClick={() => setShowMessages(!showMessages)}
                                        className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors min-h-[60px]"
                                    >
                                        <div className="flex items-center">
                                            <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                                            <span className="text-base font-medium text-gray-700">
                                                Neue Nachrichten (2)
                                            </span>
                                        </div>
                                        <ChevronDown
                                            className={`h-5 w-5 text-gray-400 transition-transform ${
                                                showMessages ? 'rotate-180' : ''
                                            }`}
                                        />
                                    </button>

                                    {showMessages && (
                                        <div className="px-4 pb-4 space-y-3">
                                            <div className="bg-blue-50 p-3 rounded-lg border-l-4 border-blue-400">
                                                <p className="text-sm text-blue-700 font-medium">
                                                    Erinnerung
                                                </p>
                                                <p className="text-sm text-blue-600 mt-1">
                                                    Deine Miete für März ist noch nicht eingetragen.
                                                </p>
                                            </div>
                                            <div className="bg-green-50 p-3 rounded-lg border-l-4 border-green-400">
                                                <p className="text-sm text-green-700 font-medium">
                                                    Erfolg
                                                </p>
                                                <p className="text-sm text-green-600 mt-1">
                                                    Du hast dein Monatsziel um 15% unterschritten!
                                                    🎉
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/*
                        BUDGET CARDS CONTAINER - Optimiert für verschiedene Screen-Größen
                        - flex-grow: Nutzt verfügbaren Raum zwischen User-Card und Footer
                        - space-y-5: Mehr Abstand zwischen Cards für bessere visuelle Trennung
                        - justify-center: Zentriert Cards wenn nicht genug Content vorhanden
                    */}
                    <div className="flex flex-col space-y-5 w-full flex-grow justify-center">
                        {/*
                            Nur Budget-Cards anzeigen wenn Nutzer ausgewählt ist
                            Cards bekommen mehr Höhe durch erhöhte min-h Werte in BudgetCard
                        */}
                        {isReady && userId && (
                            <>
                                <BudgetCard
                                    icon={User}
                                    title="Persönlich"
                                    period="monatlich"
                                    expenses={personal.expenses}
                                    budget={personal.budget}
                                    onClick={() => navigate('/personal')}
                                    isLoading={personal.isLoading}
                                />

                                <BudgetCard
                                    icon={Users}
                                    title="Gemeinsam"
                                    period="monatlich"
                                    expenses={shared.expenses}
                                    budget={shared.budget}
                                    onClick={() => navigate('/shared')}
                                    isLoading={shared.isLoading}
                                />

                                <BudgetCard
                                    icon={Baby}
                                    title="Kind"
                                    period="jährlich"
                                    expenses={child.expenses}
                                    budget={child.budget}
                                    onClick={() => navigate('/child')}
                                    isLoading={child.isLoading}
                                />
                            </>
                        )}
                    </div>
                </div>

                {/*
                    ZUSÄTZLICHER QUICK ACTIONS BEREICH (Optional)
                    Nutzt den Whitespace für nützliche Quick-Actions wenn Nutzer eingeloggt ist
                */}
                {isReady && userId && (
                    <div className="mt-6 mb-4">
                        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-100">
                            <h4 className="font-semibold text-gray-800 mb-3">Schnellzugriff</h4>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => navigate('/analyse')}
                                    className="p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-colors text-left"
                                >
                                    <div className="text-sm font-medium text-gray-800">
                                        📊 Analyse
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                        Ausgaben-Übersicht
                                    </div>
                                </button>
                                <button
                                    onClick={() => navigate('/jahresuebersicht')}
                                    className="p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-colors text-left"
                                >
                                    <div className="text-sm font-medium text-gray-800">
                                        📅 Jahresview
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                        Langzeit-Trends
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/*
                    SPACER für Footer
                    pb-20: Verhindert dass Content unter dem Footer verschwindet
                */}
                <div className="pb-20"></div>
            </main>

            {/* Modal für neue oder bearbeitete Ausgaben */}
            <ExpenseEditorBottomSheet
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                expense={editingExpense}
                onSave={handleSaveExpense}
            />
        </PageLayout>
    )
}
