'use client'

import { Trash2, Edit, Repeat, CheckCircle, AlertTriangle, Lock, Scale } from 'lucide-react'
import { useSwipe } from '@/lib/hooks/use-swipe'
import { convertDateToDisplay } from '@/lib/utils'
import { useClarificationReactions } from '@/context/clarificationContext'
import { users } from '@/data/users'
import { userColorMap } from '@/lib/colorMap'
import { v4 as uuidv4 } from 'uuid'
import type { Expense, ClarificationReaction } from '@/types'
import { ClarificationStatus } from '@/types/monthly-overview'
import {
    postClarificationReaction,
    deleteClarificationReaction,
} from '@/lib/api/clarificationReactions'

interface ExpenseItemProps {
    item: Expense
    onDelete: (id: string) => void | Promise<void>
    onEdit: (expense: Expense) => void
    scopeFlags?: {
        isPersonal: boolean
        isShared: boolean
        isChild: boolean
    }
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

export function ExpenseItem({ item, onDelete, onEdit, scopeFlags }: ExpenseItemProps) {
    const Icon = item.icon

    const { getAllReactions, refresh } = useClarificationReactions()
    const reactions = getAllReactions()

    const currentUserId = localStorage.getItem('user_id') ?? 'unknown'
    const createdByUserId = item.createdByUserId
    const isOwnItem = createdByUserId === currentUserId
    const showInitials = scopeFlags?.isShared || scopeFlags?.isChild

    const rawColor = users[createdByUserId]?.color ?? 'gray-400'
    const { text: textClass, border: borderClass } =
        userColorMap[rawColor] ?? userColorMap['gray-400']

    const { ref, touchProps, style, state } = useSwipe(
        -80,
        80,
        isOwnItem
            ? {
                  onSwipeLeft: () => onDelete(item.id),
                  onSwipeRight: () => onEdit(item),
              }
            : {}
    )

    const toggleConfirmationStatus = async (
        e: React.MouseEvent<HTMLButtonElement>,
        item: Expense
    ) => {
        e.stopPropagation()
        const existing = reactions.find(r => r.expenseId === item.id && r.userId === currentUserId)

        if (existing) {
            await deleteClarificationReaction(item.id, currentUserId)
            refresh()
        } else {
            const newReaction: ClarificationReaction = {
                id: uuidv4(),
                expenseId: item.id,
                userId: currentUserId,
                status: ClarificationStatus.Rejected,
                timestamp: new Date().toISOString(),
            }
            await postClarificationReaction(newReaction)
            refresh()
        }
    }

    const isClarifiedByAnyone = reactions.some(
        r => r.expenseId === item.id && r.status === ClarificationStatus.Rejected
    )

    const userHasClarified = reactions.some(
        r =>
            r.expenseId === item.id &&
            r.userId === currentUserId &&
            r.status === ClarificationStatus.Rejected
    )

    const canToggleClarification = !isOwnItem || userHasClarified
    const iconClasses = !canToggleClarification ? 'opacity-60' : ''

    return (
        <div className="relative overflow-visible rounded-lg mb-2">
            {isOwnItem && (
                <>
                    <div
                        className="absolute inset-y-0 right-0 bg-red-500 flex items-center justify-center text-white"
                        style={{ width: '80px', opacity: state.leftOpacity }}
                    >
                        <Trash2 className="h-5 w-5" />
                    </div>
                    <div
                        className="absolute inset-y-0 left-0 bg-blue-600 flex items-center justify-center text-white"
                        style={{ width: '80px', opacity: state.rightOpacity }}
                    >
                        <Edit className="h-5 w-5" />
                    </div>
                </>
            )}

            <div
                ref={ref}
                className={`flex items-center p-2 rounded-lg border border-gray-200 z-10 shadow-sm mb-[0.125rem] text-sm
                ${state.isTouched ? 'bg-blue-50' : 'bg-white'}
                ${state.isDragging ? '' : 'transition-transform duration-300'}`}
                style={style}
                {...touchProps}
            >
                {item.isBalanced ? (
                    <div className="w-6 h-6 flex-shrink-0 rounded-full flex items-center justify-center bg-green-100 text-green-600">
                        <Scale className="h-4 w-4" />
                    </div>
                ) : (
                    showInitials && (
                        <div
                            className={`w-6 h-6 flex-shrink-0 rounded-full flex items-center justify-center
                            bg-white text-xs font-semibold mr-2
                            ${textClass} ${borderClass} border-2 border-solid`}
                        >
                            {users[createdByUserId]?.initials ?? '?'}
                        </div>
                    )
                )}

                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                        <div>
                            <div className="flex items-center gap-1">
                                <span className="text-sm font-medium">{item.name}</span>
                                <span className="flex items-center justify-center bg-blue-100 rounded-full p-0.5">
                                    <Icon className="h-4 w-4 text-blue-600" />
                                </span>
                            </div>
                            <div className="flex items-center justify-start mt-0.5 gap-2">
                                <div className="text-xs text-gray-500">
                                    {convertDateToDisplay(item.date)}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {item.isRecurring && (
                                <span className="bg-gray-100 rounded-full p-0.5">
                                    <Repeat className="h-3 w-3 text-gray-500" />
                                </span>
                            )}
                            {!isOwnItem && (
                                <span className="bg-gray-100 rounded-full p-0.5">
                                    <Lock className="h-3 w-3 text-gray-500" />
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2 ml-2">
                        <div className="text-sm font-medium">{formatEuro(item.amount)}</div>

                        {/* ⚠️ Reaktionssymbol (sichtbar für alle, aber evtl. ausgegraut) */}
                        {showInitials && (
                            <div className="relative group">
                                <button
                                    onClick={e => {
                                        if (canToggleClarification) {
                                            toggleConfirmationStatus(e, item)
                                        }
                                    }}
                                    className={`p-1 rounded-full transition-colors ${
                                        canToggleClarification
                                            ? 'hover:bg-gray-100'
                                            : 'cursor-default opacity-70'
                                    }`}
                                    aria-label={
                                        isClarifiedByAnyone ? 'Needs Clarification' : 'Confirmed'
                                    }
                                >
                                    {isClarifiedByAnyone ? (
                                        <AlertTriangle
                                            className={`h-4 w-4 text-amber-500 ${iconClasses}`}
                                        />
                                    ) : (
                                        <CheckCircle
                                            className={`h-4 w-4 text-green-500 ${iconClasses}`}
                                        />
                                    )}
                                </button>

                                {userHasClarified && (
                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-700 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity z-20 whitespace-nowrap pointer-events-none">
                                        Clarification submitted
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
