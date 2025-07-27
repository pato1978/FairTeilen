'use client'

import { useState } from 'react'
import { Baby, ChevronDown, ShoppingCart, User, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { PageLayout } from '@/components/layout/page-layout.tsx'
import { PageHeader } from '@/components/layout/page-header.tsx'
import { users } from '@/data/users'
import { BudgetCard } from '@/components/budget/BudgetCardNew.tsx'
import { ExpenseEditorBottomSheet } from '@/components/modals/expense-editor-bottom-sheet'
import { useMultiBudget } from '@/context/multi-budget-context'
import { useUser } from '@/context/user-context.tsx'
import { useNotification } from '@/context/notification-context'
import { Expense, ExpenseType } from '@/types/index'

export default function HomePage() {
    const [currentDate, setCurrentDate] = useState(new Date())
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
    const [showMessages, setShowMessages] = useState(false)

    const navigate = useNavigate()
    const { userId, isReady } = useUser()
    if (!userId) return null
    const currentUser = users[userId]
    const { personal, shared, child } = useMultiBudget()

    let notifications: any[] = []
    let unreadCount = 0
    let markAsRead: (id?: string) => Promise<void> = () => Promise.resolve()

    try {
        const notificationData = useNotification()
        notifications = notificationData.notifications
        unreadCount = notificationData.unreadCount
        markAsRead = notificationData.markAsRead
    } catch (error) {
        console.warn('⚠️ NotificationProvider nicht verfügbar')
        // Fallback für Demo-Zwecke
        notifications = [
            {
                id: '1',
                type: 'Created',
                message: 'Test-Nachricht 1',
                createdAt: new Date().toISOString(),
            },
            {
                id: '2',
                type: 'Updated',
                message: 'Test-Nachricht 2',
                createdAt: new Date().toISOString(),
            },
        ]
        unreadCount = 2
    }

    console.log('🏠 HomePage: Notification state', {
        unreadCount,
        notifications: notifications.length,
    })

    const handleAddButtonClick = () => {
        setEditingExpense({
            id: '',
            groupId: '',
            name: '',
            amount: 0,
            date: new Date().toISOString().split('T')[0],
            category: '',
            icon: ShoppingCart,
            createdByUserId: userId || '',
            type: ExpenseType.Personal,
            isRecurring: false,
            isBalanced: false,
        })
        setIsModalOpen(true)
    }

    const handleSaveExpense = (expense: Expense): Promise<void> => {
        setIsModalOpen(false)

        if (expense.type === ExpenseType.Personal) {
            navigate('/personal')
        } else if (expense.type === ExpenseType.Child) {
            navigate('/child')
        } else {
            navigate('/shared')
        }
        return Promise.resolve()
    }

    const handleDropdownToggle = () => {
        setShowMessages(!showMessages)
        if (!showMessages && unreadCount > 0) {
            markAsRead()
        }
    }

    const navigateToExpense = (type?: ExpenseType, monthKey?: string) => {
        if (!type || !monthKey) return

        const target =
            type === ExpenseType.Personal
                ? '/personal'
                : type === ExpenseType.Child
                  ? '/child'
                  : '/shared'

        navigate(`${target}?month=${monthKey}`)
    }

    return (
        <PageLayout onAddButtonClick={handleAddButtonClick}>
            <div className="page-header-container  transform-origin-top -mb-2">
                <PageHeader
                    title="Overview"
                    initialDate={currentDate}
                    onMonthChange={setCurrentDate}
                />
            </div>

            <main className="flex-1 px-4 mt-2 flex flex-col min-h-[calc(100vh-12rem)] justify-between">
                <div className="flex flex-col gap-6 flex-grow">
                    <div className="bg-white shadow-md rounded-lg border border-blue-100 overflow-visible min-h-[120px] flex items-center">
                        <div className="w-full">
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

                            <div className="border-b border-gray-100">
                                <button
                                    onClick={handleDropdownToggle}
                                    className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors min-h-[60px]"
                                >
                                    <div className="flex items-center">
                                        <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                                        <span className="text-base font-medium text-gray-700">
                                            Neue Nachrichten ({unreadCount})
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
                                        {notifications.slice(0, 3).map(n => (
                                            <div
                                                key={n.id}
                                                className="bg-blue-50 p-3 rounded-lg border-l-4 border-blue-400 cursor-pointer"
                                                onClick={() =>
                                                    navigateToExpense(n.expenseType, n.monthKey)
                                                }
                                            >
                                                <p className="text-sm text-blue-700 font-medium">
                                                    {n.type}
                                                </p>
                                                <p className="text-sm text-blue-600 mt-1">
                                                    {n.message}
                                                </p>
                                            </div>
                                        ))}
                                        {notifications.length === 0 && (
                                            <div className="text-sm text-gray-500">
                                                Keine Nachrichten
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col space-y-5 w-full flex-grow justify-center">
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

                <div className="pb-20"></div>
            </main>

            <ExpenseEditorBottomSheet
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                expense={editingExpense}
                onSave={handleSaveExpense}
            />
        </PageLayout>
    )
}
