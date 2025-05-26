"use client"

import { Trash2, Edit, Repeat, CheckCircle, AlertTriangle } from "lucide-react"
import type { Expense } from "@/types"
import { useSwipe } from "@/lib/hooks/use-swipe"
import { convertDateToDisplay } from "@/lib/utils"
import { useState } from "react"
import { users } from "@/data/users" // ✅ zentrale User-Map

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
    const parsed = typeof amount === "string" ? parseFloat(amount.replace(",", ".")) : amount
    if (isNaN(parsed)) return "–"
    return new Intl.NumberFormat("de-DE", {
        style: "currency",
        currency: "EUR",
        minimumFractionDigits: 2,
    }).format(parsed)
}

export function ExpenseItem({ item, onDelete, onEdit, scopeFlags }: ExpenseItemProps) {
    const Icon = item.icon
    const [isConfirmed, setIsConfirmed] = useState(true)

    const currentUserId = localStorage.getItem("user_id")

    const { ref, touchProps, style, state } = useSwipe(
        -80,
        80,
        {
            onSwipeLeft: () => onDelete(item.id),
            onSwipeRight: () => onEdit(item),
        },
    )

    // 🔹 Hintergrundfarbe je nach User-Zugehörigkeit
    const userId = item.createdByUserId

    let iconBgColor: string
    if (userId === currentUserId) {
        iconBgColor = state.isTouched ? "bg-blue-200" : "bg-blue-100"
    } else if (users[userId]) {
        iconBgColor = users[userId].color
    } else {
        iconBgColor = "bg-gray-200"
    }


    const toggleConfirmationStatus = (e: React.MouseEvent) => {
        e.stopPropagation()
        setIsConfirmed(!isConfirmed)
    }

    return (
        <div className="relative overflow-visible rounded-lg mb-2">
            {/* Löschen (links) */}
            <div
                className="absolute inset-y-0 right-0 bg-red-500 flex items-center justify-center text-white"
                style={{ width: "80px", opacity: state.leftOpacity }}
            >
                <Trash2 className="h-5 w-5" />
            </div>

            {/* Bearbeiten (rechts) */}
            <div
                className="absolute inset-y-0 left-0 bg-blue-600 flex items-center justify-center text-white"
                style={{ width: "80px", opacity: state.rightOpacity }}
            >
                <Edit className="h-5 w-5" />
            </div>

            {/* Swipebarer Bereich */}
            <div
                ref={ref}
                className={`flex items-center p-2 rounded-lg transition-all duration-200 border border-gray-200 z-10
        ${state.isTouched ? "bg-blue-50" : "bg-white"} shadow-sm
        ${state.isDragging ? "" : "transition-transform duration-300"} text-sm mb-[0.125rem]`}
                style={style}
                {...touchProps}
            >
                <div className={`p-1.5 rounded-full mr-2 ${iconBgColor}`}>
                    <Icon className="h-4 w-4 text-white" />
                </div>

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
                    <div className="text-xs font-normal text-gray-500">{convertDateToDisplay(item.date)}</div>
                </div>

                <div className="text-sm font-medium text-right">{formatEuro(item.amount)}</div>

                {/* Bestätigungs- oder Klärungsstatus */}
                <button
                    onClick={toggleConfirmationStatus}
                    className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                    aria-label={isConfirmed ? "Bestätigt" : "Klärungsbedarf"}
                >
                    {isConfirmed ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                    )}
                </button>
            </div>
        </div>
    )
}
