'use client'
import isEqual from 'lodash.isequal'
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
    selectedIcon?: LucideIcon
    onIconChange?: React.Dispatch<React.SetStateAction<any>>
}

export function ExpenseEditorBottomSheet({
    isOpen,
    onClose,
    expense,
    onSave,
    availableIcons = [],
    selectedIcon: propSelectedIcon,
    onIconChange,
}: ExpenseEditorBottomSheetProps) {
    const [showIconSelector, setShowIconSelector] = useState(false)
    const [localSelectedIcon, setLocalSelectedIcon] = useState<LucideIcon>(
        expense?.icon || ShoppingCart
    )

    // Use prop if provided, otherwise use local state
    const selectedIcon = propSelectedIcon || localSelectedIcon
    const setSelectedIcon = (icon: LucideIcon) => {
        if (onIconChange) {
            onIconChange(icon)
        } else {
            setLocalSelectedIcon(icon)
        }
    }
    const [editingExpense, setEditingExpense] = useState<Expense>(() => ({
        ...defaultExpense,
        ...expense,
        date: formatDate(expense?.date),
        isBalanced: expense?.isBalanced ?? false,
    }))

    const [showDistributionModal, setShowDistributionModal] = useState(false)
    const [distribution, setDistribution] = useState<Participant[]>([])
    const sideSheetRef = useRef<HTMLDivElement>(null)
    const scrollContainerRef = useRef<HTMLDivElement>(null)
    const [animation, setAnimation] = useState<'entering' | 'entered' | 'exiting' | 'exited'>(
        isOpen ? 'entering' : 'exited'
    )
    const nameInputRef = useRef<HTMLInputElement>(null)
    const amountInputRef = useRef<HTMLInputElement>(null)

    // Verbesserte Scroll-zu-Feld Funktion
    const scrollToField = (ref: React.RefObject<HTMLElement>) => {
        setTimeout(() => {
            if (ref.current && scrollContainerRef.current) {
                const element = ref.current
                const container = scrollContainerRef.current

                const elementRect = element.getBoundingClientRect()
                const containerRect = container.getBoundingClientRect()

                // Berechne die Position relativ zum Container
                const elementTop = elementRect.top - containerRect.top + container.scrollTop

                // Scrolle so, dass das Element weit genug vom unteren Rand entfernt ist
                // 250px Platz für Footer + Tastatur + extra Padding
                const paddingFromBottom = 250
                const targetScrollTop = elementTop - (containerRect.height - paddingFromBottom)

                container.scrollTo({
                    top: Math.max(0, targetScrollTop),
                    behavior: 'smooth',
                })
            }
        }, 100)
    }

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
            // Verhindere Body-Scroll
            document.body.style.overflow = 'hidden'
            document.body.style.position = 'fixed'
            document.body.style.width = '100%'
            document.body.style.top = '0'

            // Setze viewport meta tag für besseres Mobile-Verhalten
            let viewportMeta = document.querySelector('meta[name="viewport"]')
            if (viewportMeta) {
                viewportMeta.setAttribute(
                    'content',
                    'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover'
                )
            }
        } else if (animation !== 'exited' && animation !== 'exiting') {
            setAnimation('exiting')
        }

        return () => {
            // Stelle Body-Scroll wieder her
            document.body.style.overflow = ''
            document.body.style.position = ''
            document.body.style.width = ''
            document.body.style.top = ''

            // Setze viewport zurück
            let viewportMeta = document.querySelector('meta[name="viewport"]')
            if (viewportMeta) {
                viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1.0')
            }
        }
    }, [isOpen])

    // Expense (neu oder bestehend) setzen und Distribution vorbereiten
    useEffect(() => {
        if (!expense || !isOpen) return

        const updatedExpense: Expense = {
            ...defaultExpense,
            ...expense,
            date: formatDate(expense.date),
            isBalanced: expense.isBalanced ?? false,
        }

        // Nur setzen, wenn sich wirklich etwas geändert hat
        if (!isEqual(updatedExpense, editingExpense)) {
            setEditingExpense(updatedExpense)
        }

        // Setze name automatisch, falls leer
        const chosenIcon = expense.icon || iconMap[expense.category] || ShoppingCart
        if (!updatedExpense.name) {
            const iconEntry = availableIcons.find(i => i.icon === chosenIcon)
            if (iconEntry) {
                updatedExpense.name = iconEntry.defaultLabel
            }
        }

        if (!propSelectedIcon) {
            setSelectedIcon(chosenIcon as LucideIcon)
        }

        // Distribution nur initial setzen
        if (expense.type !== ExpenseType.Personal && distribution.length === 0) {
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
        } else if (expense.type === ExpenseType.Personal && distribution.length > 0) {
            setDistribution([]) // Nur wenn nötig leeren
        }
    }, [expense?.id, isOpen])

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
        // Icon umschalten
        const previousIconEntry = availableIcons.find(i => i.icon === selectedIcon)
        setSelectedIcon(iconOption.icon)

        // Falls der aktuelle Name leer ist ODER noch einem alten/Default-Label entspricht,
        // auf den neuen Default setzen (Quickfix inkl. Legacy-Labels)
        const legacyLabels = [
            previousIconEntry?.defaultLabel, // z. B. "Möbiliar" (neu)
            editingExpense.category, // z. B. "Kinderzimmer" (alt in Daten)
        ].filter(Boolean) as string[]

        if (!editingExpense.name || legacyLabels.includes(editingExpense.name)) {
            setEditingExpense({
                ...editingExpense,
                name: iconOption.defaultLabel, // z. B. "Möbiliar"
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
            {/* 🔲 Dunkles Overlay */}
            <div
                className={`fixed inset-0 z-[60] bg-black transition-opacity duration-300 ${
                    animation === 'entering' || animation === 'entered'
                        ? 'bg-opacity-50'
                        : 'bg-opacity-0'
                } ${animation === 'exited' ? 'pointer-events-none' : ''}`}
            >
                {/* 🧾 Hauptdialog als Bottom Sheet */}
                <div
                    ref={sideSheetRef}
                    className={`fixed bottom-0 left-1/2 -translate-x-1/2 w-[85%] sm:w-[75%] md:w-[65%] max-w-md bg-white rounded-t-xl shadow-lg transform transition-all duration-300 ease-out z-[70] ${
                        animation === 'entering' || animation === 'entered'
                            ? 'opacity-100 translate-y-0'
                            : 'opacity-0 translate-y-full'
                    }`}
                    onClick={e => e.stopPropagation()}
                    style={{
                        height: 'calc(100vh - 60px)',
                        maxHeight: 'calc(100vh - 60px)',
                        display: 'flex',
                        flexDirection: 'column',
                    }}
                >
                    {/* 🔷 Header - flex-shrink-0 verhindert Schrumpfung */}
                    <div className="flex-shrink-0 relative px-4 py-4 text-left border-b border-gray-100 rounded-t-xl backdrop-blur-sm shadow-inner">
                        <div className="absolute inset-0 bg-white -z-10 rounded-t-xl" />
                        <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-blue-300/60 to-blue-100/60" />
                        <div className="flex justify-between items-center">
                            <h3 className="text-2xl font-bold text-gray-700">
                                {editingExpense.id ? 'Ausgabe bearbeiten' : 'Neue Ausgabe'}
                            </h3>
                        </div>
                    </div>

                    {/* 📜 Scrollbarer Inhalt - flex-1 nimmt verfügbaren Platz, min-h-0 für Scroll */}
                    <div
                        ref={scrollContainerRef}
                        className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-4"
                        style={{
                            paddingBottom: '300px',
                            scrollBehavior: 'smooth',
                        }}
                    >
                        {/* Typ-Auswahl */}
                        <div>
                            <div className="flex space-x-2">
                                {[ExpenseType.Personal, ExpenseType.Shared, ExpenseType.Child].map(
                                    type => {
                                        const IconComponent =
                                            type === ExpenseType.Personal
                                                ? User
                                                : type === ExpenseType.Shared
                                                  ? Users
                                                  : Baby

                                        return (
                                            <button
                                                key={type}
                                                className={`flex-1 py-3 px-2 rounded-xl flex items-center justify-center text-base font-semibold ${
                                                    editingExpense.type === type
                                                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                                        : 'bg-gray-50 text-gray-700 border-gray-200'
                                                }`}
                                                onClick={() =>
                                                    setEditingExpense({ ...editingExpense, type })
                                                }
                                            >
                                                <IconComponent className="h-5 w-5 mr-1.5" />
                                            </button>
                                        )
                                    }
                                )}
                            </div>
                        </div>

                        {/* Verteilung (nur bei Shared/Child) */}
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

                        {/* Symbol / Wiederkehrend / Ausgeglichen */}
                        <div className="grid grid-cols-3 gap-4">
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

                        {/* Bezeichnung */}
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
                                ref={nameInputRef}
                                onFocus={() => scrollToField(nameInputRef)}
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
                                        ref={amountInputRef}
                                        onFocus={() => scrollToField(amountInputRef)}
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

                    {/* ✅ Footer - flex-shrink-0 verhindert Schrumpfung */}
                    <div className="flex-shrink-0 px-4 pt-4 pb-6 bg-white border-t border-gray-100 flex space-x-3">
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

            {/* 🎨 Icon Selector Modal */}
            {isOpen && (
                <IconSelector
                    isOpen={showIconSelector}
                    onClose={() => setShowIconSelector(false)}
                    icons={availableIcons}
                    selectedIcon={selectedIcon}
                    onSelectIcon={handleSelectIcon}
                />
            )}

            {/* 👥 Distribution Modal */}
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
