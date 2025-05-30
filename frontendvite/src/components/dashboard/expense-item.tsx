"use client"

import {
    Trash2,
    Edit,
    Repeat,
    CheckCircle,
    AlertTriangle,
} from "lucide-react"
import { useSwipe } from "@/lib/hooks/use-swipe"
import { convertDateToDisplay } from "@/lib/utils"
import { useEffect, useState } from "react"
import { users } from "@/data/users"
import { v4 as uuidv4 } from "uuid"
import type { Expense, ClarificationReaction } from "@/types"
import {
    postClarificationReaction,
    deleteClarificationReaction,
    getClarificationReactionsForExpense,
} from "@/lib/api/clarificationReactions"

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
    const parsed =
        typeof amount === "string" ? parseFloat(amount.replace(",", ".")) : amount
    if (isNaN(parsed)) return "–"
    return new Intl.NumberFormat("de-DE", {
        style: "currency",
        currency: "EUR",
        minimumFractionDigits: 2,
    }).format(parsed)
}

export function ExpenseItem({ item, onDelete, onEdit }: ExpenseItemProps) {
    const Icon = item.icon
    const [isConfirmed, setIsConfirmed] = useState(true)
    const [reactions, setReactions] = useState<ClarificationReaction[]>([])
    const currentUserId = localStorage.getItem("user_id") ?? "unknown"

    // 🔄 Lade vorhandene Reaktionen vom Server bei Komponentenerstellung
    useEffect(() => {
        const loadReactions = async () => {
            const result = await getClarificationReactionsForExpense(item.id)
            setReactions(result)
            // Falls aktuelle Reaktion dieses Users vorhanden ist → ist nicht bestätigt
            const hasRejected = result.some(
                (r) => r.userId === currentUserId && r.status === 1
            )
            setIsConfirmed(!hasRejected)
        }
        loadReactions()
    }, [item.id, currentUserId])

    const { ref, touchProps, style, state } = useSwipe(
        -80,
        80,
        {
            onSwipeLeft: () => onDelete(item.id),
            onSwipeRight: () => onEdit(item),
        },
    )

    // Icon-Hintergrundfarbe dynamisch
    const createdByUserId = item.createdByUserId
    const iconBgColor =
        createdByUserId === currentUserId
            ? state.isTouched
                ? "bg-blue-200"
                : "bg-blue-100"
            : users[createdByUserId]?.color ?? "bg-gray-200"

    // ✅ Reaktion toggeln (Zustimmung ↔︎ Klärungsbedarf)
    const toggleConfirmationStatus = async (
        e: React.MouseEvent<HTMLButtonElement>,
        item: Expense
    ) => {
        e.stopPropagation()

        const newConfirmed = !isConfirmed
        setIsConfirmed(newConfirmed)

        if (newConfirmed) {
            // ✅ Zustimmung → entferne Reaktion dieses Users
            const existing = reactions.find(
                (r) => r.expenseId === item.id && r.userId === currentUserId
            )
            if (existing) {
                await deleteClarificationReaction(item.id, currentUserId)
                setReactions(reactions.filter((r) => r.id !== existing.id))
            }
        } else {
            // ❗ Ablehnung → Reaktion speichern
            const newReaction: ClarificationReaction = {
                id: uuidv4(),
                expenseId: item.id,
                userId: currentUserId,
                status: 1, // Rejected
                timestamp: new Date().toISOString(),
            }

            await postClarificationReaction(newReaction)

            // Alte Reaktion ersetzen
            const filtered = reactions.filter(
                (r) => r.expenseId !== item.id || r.userId !== currentUserId
            )
            setReactions([...filtered, newReaction])
        }
    }

    // Tooltip anzeigen, wenn der aktuelle User eine Ablehnung gespeichert hat
    const userHasClarified = reactions.some(
        (r) =>
            r.expenseId === item.id &&
            r.userId === currentUserId &&
            r.status === 1
    )

    return (
        <div className="relative overflow-visible rounded-lg mb-2">
            {/* Löschen (Links-Swipe) */}
            <div
                className="absolute inset-y-0 right-0 bg-red-500 flex items-center justify-center text-white"
                style={{ width: "80px", opacity: state.leftOpacity }}
            >
                <Trash2 className="h-5 w-5" />
            </div>

            {/* Bearbeiten (Rechts-Swipe) */}
            <div
                className="absolute inset-y-0 left-0 bg-blue-600 flex items-center justify-center text-white"
                style={{ width: "80px", opacity: state.rightOpacity }}
            >
                <Edit className="h-5 w-5" />
            </div>

            {/* Haupt-Inhalt (Swipebar) */}
            <div
                ref={ref}
                className={`flex items-center p-2 rounded-lg border border-gray-200 z-10 shadow-sm mb-[0.125rem] text-sm
          ${state.isTouched ? "bg-blue-50" : "bg-white"} 
          ${state.isDragging ? "" : "transition-transform duration-300"}`}
                style={style}
                {...touchProps}
            >
                {/* Icon */}
                <div className={`p-1.5 rounded-full mr-2 ${iconBgColor}`}>
                    <Icon className="h-4 w-4 text-white" />
                </div>

                {/* Textinhalt */}
                <div className="flex-1">
                    <div className="text-sm font-medium flex items-center">
                        {item.name}
                        {item.isRecurring && (
                            <span className="ml-1 flex items-center justify-center bg-blue-100 rounded-full p-0.5">
                <Repeat className="h-2 w-2 text-blue-600" />
              </span>
                        )}
                        {item.isBalanced && (
                            <span className="ml-1 flex items-center justify-center bg-blue-100 rounded-full p-0.5">
                <Repeat className="h-2 w-2 text-blue-600" />
              </span>
                        )}
                    </div>
                    <div className="text-xs text-gray-500">
                        {convertDateToDisplay(item.date)}
                    </div>
                </div>

                {/* Betrag */}
                <div className="text-sm font-medium text-right">
                    {formatEuro(item.amount)}
                </div>

                {/* Klärungsstatus-Button */}
                <div className="relative group ml-2">
                    <button
                        onClick={(e) => toggleConfirmationStatus(e, item)}
                        className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                        aria-label={isConfirmed ? "Confirmed" : "Needs Clarification"}
                    >
                        {isConfirmed ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                        )}
                    </button>

                    {/* Tooltip anzeigen, wenn Reaktion gesetzt */}
                    {userHasClarified && (
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-700 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity z-20 whitespace-nowrap pointer-events-none">
                            Clarification submitted
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
