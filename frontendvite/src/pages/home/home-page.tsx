'use client'

import { useState } from 'react'
import { Baby, Bell, ChevronDown, ShoppingCart, User, Users, CheckCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { PageLayout } from '@/components/layout/page-layout.tsx'
import { PageHeader } from '@/components/layout/page-header.tsx'
import { NotificationItem } from '@/pages/home/notificationItem'
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

    // Notification handling mit getrennten Listen
    const {
        unreadNotifications,
        readNotifications,
        unreadCount,
        showOnlyUnread,
        setShowOnlyUnread,
        markAsRead,
        markAllAsRead,
    } = useNotification()

    // Entscheide welche Notifications angezeigt werden
    const displayedNotifications = showOnlyUnread
        ? unreadNotifications
        : [...unreadNotifications, ...readNotifications]

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
    }

    const navigateToExpense = (type?: ExpenseType | string, monthKey?: string) => {
        if (!type || !monthKey) return

        // Map Backend string to route
        const typeMapping: Record<string, string> = {
            Personal: '/personal',
            Shared: '/shared',
            Child: '/child',
        }

        const target = typeMapping[type as string] || '/shared'
        navigate(`${target}?month=${monthKey}`)
    }

    const handleDismissNotification = async (id: string) => {
        // Bei Swipe: Als gelesen markieren (nicht löschen)
        await markAsRead(id)
    }

    const handleClearAllNotifications = async () => {
        // Nur noch als gelesen markieren, kein Löschen mehr
        await markAllAsRead()
        setShowMessages(false)
    }

    return (
        <PageLayout onAddButtonClick={handleAddButtonClick}>
            <div className="page-header-container transform-origin-top -mb-2">
                <PageHeader
                    title="Overview"
                    initialDate={currentDate}
                    onMonthChange={setCurrentDate}
                />
            </div>

            <main className="flex-1 px-4 mt-2 flex flex-col min-h-[calc(100vh-12rem)] justify-between">
                <div className="flex flex-col gap-6 flex-grow">
                    {/* Welcome Card mit Notifications */}
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

                            {/* Notification Toggle */}
                            <div className="border-b border-gray-100">
                                <button
                                    onClick={handleDropdownToggle}
                                    className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors min-h-[60px]"
                                >
                                    <div className="flex items-center">
                                        {unreadCount > 0 ? (
                                            <>
                                                <div className="w-3 h-3 bg-blue-500 rounded-full mr-3 animate-pulse"></div>
                                                <span className="text-base font-medium text-gray-700">
                                                    {unreadCount} neue Nachricht
                                                    {unreadCount !== 1 ? 'en' : ''}
                                                </span>
                                            </>
                                        ) : (
                                            <>
                                                <Bell className="h-4 w-4 text-gray-400 mr-3" />
                                                <span className="text-base text-gray-500">
                                                    Keine neuen Nachrichten
                                                </span>
                                            </>
                                        )}
                                    </div>
                                    <ChevronDown
                                        className={`h-5 w-5 text-gray-400 transition-transform ${
                                            showMessages ? 'rotate-180' : ''
                                        }`}
                                    />
                                </button>

                                {/* Notification List */}
                                {showMessages && (
                                    <div className="border-t border-gray-100">
                                        {/* Header mit Tabs und Aktionen */}
                                        <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-100">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex gap-1 bg-white rounded-lg p-0.5 shadow-sm">
                                                        <button
                                                            onClick={() => setShowOnlyUnread(true)}
                                                            className={`text-xs px-3 py-1.5 rounded-md transition-all ${
                                                                showOnlyUnread
                                                                    ? 'bg-blue-500 text-white shadow-sm'
                                                                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                                                            }`}
                                                        >
                                                            Neu{' '}
                                                            {unreadCount > 0 && `(${unreadCount})`}
                                                        </button>
                                                        <button
                                                            onClick={() => setShowOnlyUnread(false)}
                                                            className={`text-xs px-3 py-1.5 rounded-md transition-all ${
                                                                !showOnlyUnread
                                                                    ? 'bg-blue-500 text-white shadow-sm'
                                                                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                                                            }`}
                                                        >
                                                            Alle (
                                                            {unreadNotifications.length +
                                                                readNotifications.length}
                                                            )
                                                        </button>
                                                    </div>
                                                </div>
                                                {unreadCount > 0 && showOnlyUnread && (
                                                    <button
                                                        onClick={handleClearAllNotifications}
                                                        className="flex items-center gap-1.5 text-xs bg-white text-blue-600 hover:text-blue-800 font-medium px-3 py-1.5 rounded-lg border border-blue-200 hover:border-blue-300 transition-all shadow-sm hover:shadow"
                                                    >
                                                        <CheckCheck className="h-3.5 w-3.5" />
                                                        Alle als gelesen
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Scrollable notification list */}
                                        <div className="max-h-96 overflow-y-auto bg-gray-50">
                                            {displayedNotifications.length > 0 ? (
                                                <div className="divide-y divide-gray-100">
                                                    {displayedNotifications.map(n => (
                                                        <NotificationItem
                                                            key={n.id}
                                                            notification={n}
                                                            onDismiss={handleDismissNotification}
                                                            onClick={() => {
                                                                if (!n.isRead) markAsRead(n.id)
                                                                navigateToExpense(
                                                                    n.expenseType,
                                                                    n.monthKey
                                                                )
                                                                setShowMessages(false)
                                                            }}
                                                        />
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="p-8 text-center">
                                                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-3">
                                                        <Bell className="h-6 w-6 text-gray-400" />
                                                    </div>
                                                    <p className="text-sm text-gray-500">
                                                        {showOnlyUnread
                                                            ? 'Keine neuen Nachrichten'
                                                            : 'Keine Nachrichten vorhanden'}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Budget Cards */}
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

                {/* Quick Access */}
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
