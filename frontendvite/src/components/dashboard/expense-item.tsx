'use client'

import { AlertTriangle, CheckCircle, Edit, Repeat, Scale, Trash2 } from 'lucide-react'

import { useSwipe } from '@/lib/hooks/use-swipe'
import { convertDateToDisplay } from '@/lib/utils'
import { useClarificationReactions } from '@/context/clarificationContext'
import { useUser } from '@/context/user-context' // 🆕 Zugriff auf den eingeloggten User
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
    const { getAllReactions, refresh } = useClarificationReactions()
    const reactions = getAllReactions()

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

        const existing = reactions.find(r => r.expenseId === item.id && r.userId === currentUserId)

        if (existing) {
            await deleteClarificationReaction(item.id, currentUserId)
        } else {
            const newReaction: ClarificationReaction = {
                id: uuidv4(),
                expenseId: item.id,
                userId: currentUserId,
                status: ClarificationStatus.Rejected,
                timestamp: new Date().toISOString(),
            }
            await postClarificationReaction(newReaction)
        }

        refresh()
    }

    // 🔍 Eigene Reaktion zu dieser Ausgabe abrufen
    const myReaction = reactions.find(r => r.expenseId === item.id && r.userId === currentUserId)
    const hasRejected = myReaction?.status === ClarificationStatus.Rejected

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

                        {/* ✅ Reaktionssymbol (Bestätigung / Klärungsbedarf) */}
                        {showInitials && (
                            <div className="flex flex-col items-center justify-center w-7">
                                {isOwnItem ? (
                                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                                ) : (
                                    <button
                                        onClick={e => toggleConfirmationStatus(e, item)}
                                        className="hover:bg-gray-50 rounded-full p-1 transition-colors"
                                        aria-label={hasRejected ? 'Beanstandet' : 'Bestätigt'}
                                    >
                                        {hasRejected ? (
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
