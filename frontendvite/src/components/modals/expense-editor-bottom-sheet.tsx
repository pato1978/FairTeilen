'use client'
import { iconMap } from '@/lib/icon-map'
import { useEffect, useRef, useState } from 'react'
import { Baby, Check, Euro, Repeat, ShoppingCart, User, Users } from 'lucide-react'
import { IconSelector } from './icon-selector'
import { DistributionModal, type Participant } from './distribution-modal'
import { SplitOption } from '@/components/modals/split-option.tsx'
import { Expense, ExpenseType } from '@/types/index'
import type { LucideIcon } from 'lucide-react'

// Optionales Hilfstool für die Verteilung
function getDefaultDistribution(type: ExpenseType): Participant[] {
    return type === ExpenseType.Child
        ? [
              { id: 'user1', name: 'Partner 1', percentage: 33.3, locked: false, amount: 0 },
              { id: 'user2', name: 'Partner 2', percentage: 33.3, locked: false, amount: 0 },
              { id: 'user3', name: 'Kind', percentage: 33.4, locked: false, amount: 0 },
          ]
        : [
              { id: 'user1', name: 'Partner 1', percentage: 50, locked: false, amount: 0 },
              { id: 'user2', name: 'Partner 2', percentage: 50, locked: false, amount: 0 },
          ]
}

function formatDate(dateInput?: string | null): string {
    const d = dateInput ? new Date(dateInput) : new Date()
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset()) // Zeitzonen-Korrektur
    return d.toISOString().slice(0, 10)
}

const defaultExpense: Expense = {
    id: '',
    name: '',
    amount: 0,
    date: formatDate(),
    category: '',
    icon: ShoppingCart,
    isRecurring: false,
    isBalanced: false,
    type: ExpenseType.Personal,
    groupId: '',
    createdByUserId: '',
}

export interface ExpenseEditorBottomSheetProps {
    isOpen: boolean
    onClose: () => void
    expense: Expense | null
    onSave: (expense: Expense) => Promise<void>
    availableIcons?: Array<{ icon: LucideIcon; name: string; defaultLabel: string }>
}

export function ExpenseEditorBottomSheet({
    isOpen,
    onClose,
    expense,
    onSave,
    availableIcons = [],
}: ExpenseEditorBottomSheetProps) {
    const [showIconSelector, setShowIconSelector] = useState(false)
    const [selectedIcon, setSelectedIcon] = useState<LucideIcon>(expense?.icon || ShoppingCart)
    const [editingExpense, setEditingExpense] = useState<Expense>(() => ({
        ...defaultExpense,
        ...expense,
        date: formatDate(expense?.date),
        isBalanced: expense?.isBalanced ?? false,
    }))

    const [showDistributionModal, setShowDistributionModal] = useState(false)
    const [distribution, setDistribution] = useState<Participant[]>([])
    const sideSheetRef = useRef<HTMLDivElement>(null)
    const [animation, setAnimation] = useState<'entering' | 'entered' | 'exiting' | 'exited'>(
        isOpen ? 'entering' : 'exited'
    )

    // --------------------
    // LifeCycle & Effekte
    // --------------------

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                !showIconSelector &&
                !showDistributionModal &&
                sideSheetRef.current &&
                !sideSheetRef.current.contains(event.target as Node) &&
                animation === 'entered'
            ) {
                handleClose()
            }
        }
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside)
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [isOpen, animation, showIconSelector, showDistributionModal])

    useEffect(() => {
        let timeout: NodeJS.Timeout
        if (isOpen && animation === 'entering') {
            timeout = setTimeout(() => setAnimation('entered'), 10)
        } else if (!isOpen && animation === 'exiting') {
            timeout = setTimeout(() => setAnimation('exited'), 300)
        }
        return () => clearTimeout(timeout)
    }, [isOpen, animation])

    useEffect(() => {
        if (isOpen) {
            setAnimation('entering')
        } else if (animation !== 'exited' && animation !== 'exiting') {
            setAnimation('exiting')
        }
    }, [isOpen])

    // Expense (neu oder bestehend) setzen und Distribution vorbereiten
    useEffect(() => {
        if (expense && isOpen) {
            const updatedExpense: Expense = {
                ...defaultExpense,
                ...expense,
                date: formatDate(expense.date),
                isBalanced: expense.isBalanced ?? false,
            }
            setEditingExpense(updatedExpense)

            // Symbol bestimmen (bereits gesetzt oder über Kategorie)
            const chosenIcon = expense.icon || iconMap[expense.category] || ShoppingCart
            setSelectedIcon(chosenIcon as LucideIcon)

            // Name automatisch setzen, wenn leer
            const iconEntry = availableIcons.find(i => i.icon === chosenIcon)
            const defaultLabel = iconEntry?.defaultLabel || 'Lebensmittel'
            if (!expense.name || expense.name.trim() === '') {
                setEditingExpense(prev => ({
                    ...prev,
                    name: defaultLabel,
                }))
            }

            // Distribution: Nur wenn Typ Shared oder Child
            if (expense.type !== ExpenseType.Personal) {
                if (expense.distribution) {
                    const updatedDistribution = expense.distribution.map(p => ({
                        ...p,
                        locked: p.locked || false,
                        amount:
                            p.amount ||
                            (p.percentage / 100) *
                                (typeof updatedExpense.amount === 'number'
                                    ? updatedExpense.amount
                                    : parseFloat((updatedExpense.amount as any) || '0')),
                    }))
                    setDistribution(updatedDistribution)
                } else {
                    setDistribution(getDefaultDistribution(expense.type))
                }
            } else {
                setDistribution([]) // Bei Personal immer leeren!
            }
        }
    }, [expense, isOpen, availableIcons])

    useEffect(() => {
        if (editingExpense.type !== ExpenseType.Personal && distribution.length === 0) {
            setDistribution(getDefaultDistribution(editingExpense.type))
        }
        if (editingExpense.type === ExpenseType.Personal) {
            setDistribution([])
        }
    }, [editingExpense.type])

    if (animation === 'exited' && !isOpen) return null

    // --------------------
    // UI & Save-Handler
    // --------------------

    const selectedIconComponent = availableIcons.find(icon => icon.icon === selectedIcon) || {
        icon: ShoppingCart,
        name: 'Lebensmittel',
        defaultLabel: 'Lebensmittel',
    }

    // Betrag-Feld: immer als string an Input
    const amountString =
        typeof editingExpense.amount === 'number'
            ? editingExpense.amount.toString()
            : editingExpense.amount || ''

    const handleSave = () => {
        const selectedIconEntry = availableIcons.find(i => i.icon === selectedIcon)
        const expenseToSave: Expense = {
            ...editingExpense,
            icon: selectedIcon,
            category: selectedIconEntry?.name || 'Lebensmittel',
            amount: Number(editingExpense.amount), // amount als number speichern
            distribution: editingExpense.type !== ExpenseType.Personal ? distribution : undefined,
        }
        onSave(expenseToSave)
    }

    const handleClose = () => {
        setAnimation('exiting')
        setTimeout(() => {
            onClose()
        }, 300)
    }

    const handleSelectIcon = (iconOption: {
        icon: LucideIcon
        name: string
        defaultLabel: string
    }) => {
        const previousIcon = availableIcons.find(i => i.icon === selectedIcon)
        setSelectedIcon(iconOption.icon)
        // Name automatisch setzen, wenn Standardname
        if (
            !editingExpense.name ||
            (previousIcon && editingExpense.name === previousIcon.defaultLabel)
        ) {
            setEditingExpense({
                ...editingExpense,
                name: iconOption.defaultLabel,
            })
        }
        setShowIconSelector(false)
    }

    const handleSaveDistribution = (participants: Participant[]) => {
        setDistribution(participants)
        setShowDistributionModal(false)
    }

    // --------------------
    // UI-Render
    // --------------------

    // Icon als React-Komponente
    const Icon = selectedIconComponent.icon as LucideIcon

    return (
        <>
            {/* Overlay */}
            <div
                className={`fixed inset-0 z-40 bg-black transition-opacity duration-300 ${
                    animation === 'entering' || animation === 'entered'
                        ? 'bg-opacity-50'
                        : 'bg-opacity-0'
                } ${animation === 'exited' ? 'pointer-events-none' : ''}`}
            >
                {/* Hauptfenster */}
                <div
                    ref={sideSheetRef}
                    className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[85%] sm:w-[75%] md:w-[65%] max-w-md bg-white rounded-xl shadow-lg transform transition-all duration-300 ease-out z-50 ${
                        animation === 'entering' || animation === 'entered'
                            ? 'opacity-100'
                            : 'opacity-0'
                    }`}
                    style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="relative px-4 py-4 text-left rounded-t-xl w-full backdrop-blur-sm shadow-inner border-b border-gray-100">
                        <div className="absolute inset-0 bg-white -z-10" />
                        <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-blue-300/60 to-blue-100/60"></div>
                        <div className="flex justify-between items-center">
                            <h3 className="text-2xl font-bold text-gray-700">
                                {editingExpense.id ? 'Ausgabe bearbeiten' : 'Neue Ausgabe'}
                            </h3>
                        </div>
                    </div>
                    {/* Inhalt */}
                    <div className="p-4 space-y-4 flex-grow">
                        {/* Ausgaben-Typ Auswahl */}
                        <div>
                            <div className="flex space-x-2">
                                <button
                                    className={`flex-1 py-3 px-2 rounded-xl flex items-center justify-center text-base font-semibold ${
                                        editingExpense.type === ExpenseType.Personal
                                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                            : 'bg-gray-50 text-gray-700 border-gray-200'
                                    }`}
                                    onClick={() =>
                                        setEditingExpense({
                                            ...editingExpense,
                                            type: ExpenseType.Personal,
                                        })
                                    }
                                >
                                    <User className="h-5 w-5 mr-1.5" />
                                </button>
                                <button
                                    className={`flex-1 py-3 px-2 rounded-xl flex items-center justify-center text-base font-semibold ${
                                        editingExpense.type === ExpenseType.Shared
                                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                            : 'bg-gray-50 text-gray-700 border-gray-200'
                                    }`}
                                    onClick={() =>
                                        setEditingExpense({
                                            ...editingExpense,
                                            type: ExpenseType.Shared,
                                        })
                                    }
                                >
                                    <Users className="h-5 w-5 mr-1.5" />
                                </button>
                                <button
                                    className={`flex-1 py-3 px-2 rounded-xl flex items-center justify-center text-base font-semibold ${
                                        editingExpense.type === ExpenseType.Child
                                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                            : 'bg-gray-50 text-gray-700 border-gray-200'
                                    }`}
                                    onClick={() =>
                                        setEditingExpense({
                                            ...editingExpense,
                                            type: ExpenseType.Child,
                                        })
                                    }
                                >
                                    <Baby className="h-5 w-5 mr-1.5" />
                                </button>
                            </div>
                        </div>

                        {/* Split Option/Verteilung nur für Shared & Child */}
                        {(editingExpense.type === ExpenseType.Shared ||
                            editingExpense.type === ExpenseType.Child) && (
                            <SplitOption
                                editingExpense={editingExpense}
                                onClick={e => {
                                    e.stopPropagation()
                                    setShowDistributionModal(true)
                                }}
                            />
                        )}

                        {/* Symbol, Häufigkeit, Ausgeglichen */}
                        <div className="grid grid-cols-3 gap-4">
                            {/* Symbol */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Symbol
                                </label>
                                <button
                                    onClick={e => {
                                        e.stopPropagation()
                                        setShowIconSelector(true)
                                    }}
                                    className="w-full h-[64px] flex items-center justify-center p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors border border-gray-200"
                                >
                                    <div className="bg-white p-2 rounded-lg shadow-sm">
                                        <Icon className="h-5 w-5 text-blue-600" />
                                    </div>
                                </button>
                            </div>
                            {/* Häufigkeit */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Häufigkeit
                                </label>
                                <button
                                    onClick={() =>
                                        setEditingExpense({
                                            ...editingExpense,
                                            isRecurring: !editingExpense.isRecurring,
                                        })
                                    }
                                    className={`w-full h-[64px] flex items-center justify-center p-3 rounded-xl border transition-colors ${
                                        editingExpense.isRecurring
                                            ? 'bg-blue-50 border-blue-200'
                                            : 'bg-gray-50 border-gray-200'
                                    }`}
                                >
                                    <Repeat
                                        className={`h-5 w-5 ${
                                            editingExpense.isRecurring
                                                ? 'text-blue-600'
                                                : 'text-gray-400'
                                        }`}
                                    />
                                </button>
                            </div>
                            {/* Ausgeglichen */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Ausgeglichen
                                </label>
                                <button
                                    onClick={() =>
                                        setEditingExpense({
                                            ...editingExpense,
                                            isBalanced: !editingExpense.isBalanced,
                                        })
                                    }
                                    className={`w-full h-[64px] flex items-center justify-center p-3 rounded-xl border transition-colors ${
                                        editingExpense.isBalanced
                                            ? 'bg-blue-50 border-blue-200'
                                            : 'bg-gray-50 border-gray-200'
                                    }`}
                                >
                                    <Check
                                        className={`h-5 w-5 ${
                                            editingExpense.isBalanced
                                                ? 'text-blue-600'
                                                : 'text-gray-400'
                                        }`}
                                    />
                                </button>
                            </div>
                        </div>
                        {/* Name */}
                        <div>
                            <label
                                htmlFor="expense-name"
                                className="block text-sm font-medium text-gray-700 mb-2"
                            >
                                Bezeichnung
                            </label>
                            <input
                                id="expense-name"
                                type="text"
                                className="w-full p-3 text-base border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                                value={editingExpense.name || ''}
                                onChange={e =>
                                    setEditingExpense({ ...editingExpense, name: e.target.value })
                                }
                                placeholder="z.B. Supermarkt"
                            />
                        </div>
                        {/* Betrag + Datum */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label
                                    htmlFor="expense-amount"
                                    className="block text-sm font-medium text-gray-700 mb-2"
                                >
                                    Betrag
                                </label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                                        <Euro className="h-4 w-4" />
                                    </span>
                                    <input
                                        id="expense-amount"
                                        type="number"
                                        step="0.01"
                                        inputMode="decimal"
                                        className="w-full p-3 pl-10 text-base border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                                        value={amountString}
                                        onChange={e =>
                                            setEditingExpense({
                                                ...editingExpense,
                                                amount: Number(e.target.value),
                                            })
                                        }
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>
                            <div>
                                <label
                                    htmlFor="expense-date"
                                    className="block text-sm font-medium text-gray-700 mb-2"
                                >
                                    Datum
                                </label>
                                <input
                                    id="expense-date"
                                    type="date"
                                    className="w-full p-3 text-base border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                                    value={editingExpense.date || ''}
                                    onChange={e =>
                                        setEditingExpense({
                                            ...editingExpense,
                                            date: e.target.value,
                                        })
                                    }
                                />
                            </div>
                        </div>
                    </div>
                    {/* Footer */}
                    <div className="px-4 pt-4 pb-4 bg-white rounded-b-xl border-t border-gray-100 flex space-x-3">
                        <button
                            className="flex-1 py-2.5 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-300 rounded-xl hover:bg-blue-100 active:bg-blue-200 transition-colors"
                            onClick={handleClose}
                        >
                            Abbrechen
                        </button>
                        <button
                            className="flex-1 py-2.5 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-300 rounded-xl hover:bg-blue-100 active:bg-blue-200 transition-colors flex items-center justify-center"
                            onClick={handleSave}
                        >
                            <Check className="h-4 w-4 mr-1 text-blue-600" />
                            Speichern
                        </button>
                    </div>
                </div>
            </div>

            {/* Icon Selector Modal */}
            {isOpen && (
                <IconSelector
                    isOpen={showIconSelector}
                    onClose={() => setShowIconSelector(false)}
                    icons={availableIcons}
                    selectedIcon={selectedIcon}
                    onSelectIcon={handleSelectIcon}
                />
            )}

            {/* Distribution Modal */}
            {(editingExpense.type === ExpenseType.Shared ||
                editingExpense.type === ExpenseType.Child) && (
                <DistributionModal
                    isOpen={showDistributionModal}
                    onClose={() => setShowDistributionModal(false)}
                    participants={distribution}
                    onSave={handleSaveDistribution}
                    isChildExpense={editingExpense.type === ExpenseType.Child}
                    expenseAmount={amountString}
                />
            )}
        </>
    )
}
