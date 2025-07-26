'use client'

import { AlertTriangle, CheckCircle, Edit, Repeat, Scale, Trash2 } from 'lucide-react'

import { useSwipe } from '@/lib/hooks/use-swipe'
import { convertDateToDisplay } from '@/lib/utils'
import { useClarificationReactions } from '@/context/clarificationContext'
import { useUser } from '@/context/user-context'
import { users } from '@/data/users'
import { v4 as uuidv4 } from 'uuid'
import type { ClarificationReaction, Expense } from '@/types'
import { ExpenseType } from '@/types'
import { ClarificationStatus } from '@/types/monthly-overview'
import {
    deleteClarificationReaction,
    postClarificationReaction,
} from '@/services/ClarificationReactionService'

interface ExpenseItemProps {
    item: Expense
    onDelete: (id: string) => void | Promise<void>
    onEdit: (expense: Expense) => void
}

const formatEuro = (amount: string | number) => {
    const parsed = typeof amount === 'string' ? parseFloat(amount.replace(',', '.')) : amount
    if (isNaN(parsed)) return '–'
    return new Intl.NumberFormat('de-DE', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 2,
    }).format(parsed)
}

export function ExpenseItem({ item, onDelete, onEdit }: ExpenseItemProps) {
    const Icon = item.icon

    // 📦 Zugriff auf den aktuellen Benutzer über den zentralen UserContext
    const { userId: currentUserId, isReady } = useUser()

    // ⛔ Sicherheitsprüfung: solange der Benutzer noch nicht geladen ist, nichts rendern
    if (!isReady || !currentUserId) return null

    // 💬 Zugriff auf Reaktionen (z. B. Klärungsbedarf) und Aktualisierung
    const { getAllReactions, refresh, isLoading: isLoadingReactions } = useClarificationReactions()
    const reactions = getAllReactions() || [] // Fallback auf leeres Array

    // ✅ Feststellen, ob es sich um die eigene Ausgabe handelt
    const createdByUserId = item.createdByUserId
    const isOwnItem = createdByUserId === currentUserId

    // 👥 Zeige Initialen bei gemeinsamen oder Kinder-Ausgaben
    const showInitials = item.type === ExpenseType.Shared || item.type === ExpenseType.Child

    // 🎨 Dynamische Farbzuordnung für den Ersteller-Avatar (Initialen rechts)
    const getUserColorClasses = (userColor: string) => {
        // 'blue-500' → ['blue', '500']
        const [colorName] = userColor.split('-')

        return {
            bg: `bg-${colorName}-50`, // sehr hell für Hintergrund
            border: `border-${colorName}-300`, // mittel für Ring
            text: `text-${colorName}-700`, // dunkel für Initialen
        }
    }

    const rawColor = users[createdByUserId]?.color ?? 'gray-500'
    const { bg: bgClass, border: borderClass, text: textClass } = getUserColorClasses(rawColor)

    // 👉 Swipe-Funktionalität (nur bei eigenen Ausgaben und balanced items aktiv)
    const { ref, touchProps, style, state } = useSwipe(
        -80,
        80,
        isOwnItem || item.isBalanced
            ? {
                  onSwipeLeft: () => onDelete(item.id),
                  onSwipeRight: () => onEdit(item),
              }
            : {} // Kein Swipe bei fremden Ausgaben
    )

    // 🔁 Reaktionsstatus setzen oder entfernen
    const toggleConfirmationStatus = async (
        e: React.MouseEvent<HTMLButtonElement>,
        item: Expense
    ) => {
        e.stopPropagation()

        try {
            const existing = reactions.find(
                r => r.expenseId === item.id && r.userId === currentUserId
            )

            // Extrahiere den Monat aus dem Expense-Datum
            const expenseMonth = item.date.slice(0, 7) // Annahme: date ist im Format YYYY-MM-DD

            if (existing) {
                await deleteClarificationReaction(item.id, currentUserId, expenseMonth)
            } else {
                const newReaction: ClarificationReaction = {
                    id: uuidv4(),
                    expenseId: item.id,
                    userId: currentUserId,
                    status: ClarificationStatus.Rejected,
                    timestamp: new Date().toISOString(),
                }
                await postClarificationReaction(newReaction, expenseMonth)
            }

            // Kurzes Delay vor Refresh, um sicherzustellen, dass Backend-Änderung durchgeführt wurde
            setTimeout(() => {
                refresh()
            }, 100)
        } catch (error) {
            console.error('❌ Fehler beim Togglen des Bestätigungsstatus:', error)
            // Trotzdem refresh versuchen, um UI zu synchronisieren
            refresh()
        }
    }

    // 🔍 WICHTIG: Prüfe ob IRGENDWER (nicht nur ich) diese Ausgabe beanstandet hat
    const allReactionsForThisExpense = reactions.filter(r => r.expenseId === item.id)
    const hasAnyRejection = allReactionsForThisExpense.some(
        r => r.status === ClarificationStatus.Rejected
    )

    // 🔍 Meine eigene Reaktion
    const myReaction = reactions.find(r => r.expenseId === item.id && r.userId === currentUserId)
    const hasIRejected = myReaction?.status === ClarificationStatus.Rejected

    return (
        <div className="relative overflow-visible">
            {/* 🔄 Swipe-Aktionen - nur bei eigenen Ausgaben und balanced items */}
            {(isOwnItem || item.isBalanced) && (
                <>
                    <div
                        className="absolute inset-y-0 right-0 bg-rose-400 flex items-center justify-center text-white"
                        style={{ width: '80px', opacity: state.leftOpacity }}
                    >
                        <Trash2 className="h-5 w-5" />
                    </div>
                    <div
                        className="absolute inset-y-0 left-0 bg-emerald-500 flex items-center justify-center text-white"
                        style={{ width: '80px', opacity: state.rightOpacity }}
                    >
                        <Edit className="h-5 w-5" />
                    </div>
                </>
            )}

            <div
                ref={ref}
                className={`
          h-[72px] min-h-[72px] max-h-[72px] flex items-center p-4 rounded-xl border shadow-sm bg-white transition-colors relative
          ${state.isTouched ? 'bg-slate-50' : ''}
          ${state.isDragging ? '' : 'transition-transform duration-300'}
        `}
                style={style}
                {...(isOwnItem || item.isBalanced ? touchProps : {})}
            >
                {/* 🧍 Kategorie-Icon oder Ausgleichs-Icon - jetzt links und prominent */}
                <div className="w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center mr-3">
                    {item.isBalanced ? (
                        <div className="bg-emerald-50 text-emerald-600 w-full h-full rounded-full flex items-center justify-center">
                            <Scale className="w-4 h-4" />
                        </div>
                    ) : (
                        <div className="bg-slate-50 text-slate-600 p-2 rounded-lg">
                            <Icon className="w-5 h-5" />
                        </div>
                    )}
                </div>

                {/* 🧾 Hauptinhalt: Titel, Betrag, Datum, Reaktionen */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                        <div className="flex items-center gap-2 min-w-0">
                            <h3 className="font-semibold text-base text-gray-900 truncate overflow-hidden whitespace-nowrap">
                                {item.name}
                            </h3>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                            <div className="font-semibold text-base text-gray-900">
                                {formatEuro(item.amount)}
                            </div>
                            {/* 👤 Initialen rechts - nur bei gemeinsamen/Kinder-Ausgaben */}
                            {showInitials && (
                                <div className="flex flex-col items-center justify-center w-7">
                                    <div
                                        className={`w-7 h-7 text-xs font-semibold border flex items-center justify-center rounded-full ${textClass} ${borderClass} ${bgClass}`}
                                    >
                                        {users[createdByUserId]?.initials ?? '?'}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center gap-3">
                            <span>{convertDateToDisplay(item.date)}</span>
                            {item.isRecurring && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium">
                                    <Repeat className="w-3 h-3" />
                                    Wiederkehrend
                                </span>
                            )}
                        </div>

                        {/* ✅ Reaktionssymbol (Bestätigung / Klärungsbedarf) mit Loading-State */}
                        {showInitials && (
                            <div className="flex flex-col items-center justify-center w-7">
                                {isLoadingReactions ? (
                                    // Loading-State während Reactions geladen werden
                                    <div className="w-5 h-5 rounded-full border-2 border-gray-300 border-t-blue-500 animate-spin" />
                                ) : isOwnItem ? (
                                    // 🏠 Bei eigenen Ausgaben: Zeige Status, aber nicht klickbar
                                    hasAnyRejection ? (
                                        // WICHTIG: Wenn IRGENDWER beanstandet hat, zeige Warndreieck
                                        <AlertTriangle className="w-5 h-5 text-amber-500 opacity-60" />
                                    ) : (
                                        // Ansonsten zeige bestätigt
                                        <CheckCircle className="w-5 h-5 text-emerald-400 opacity-60" />
                                    )
                                ) : (
                                    // 🤝 Bei fremden Ausgaben: Klickbar zum Ändern des eigenen Status
                                    <button
                                        onClick={e => toggleConfirmationStatus(e, item)}
                                        className="hover:bg-gray-50 rounded-full p-1 transition-colors relative"
                                        aria-label={hasIRejected ? 'Beanstandet' : 'Bestätigt'}
                                        disabled={isLoadingReactions}
                                    >
                                        {hasIRejected ? (
                                            <AlertTriangle className="w-5 h-5 text-amber-500" />
                                        ) : (
                                            <CheckCircle className="w-5 h-5 text-emerald-500" />
                                        )}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
