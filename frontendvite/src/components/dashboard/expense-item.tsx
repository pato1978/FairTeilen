"use client"
import { Trash2, Edit, Repeat } from "lucide-react"
import type { Expense } from "@/types"
import { useSwipe } from "@/lib/hooks/use-swipe"
import {convertDateToDisplay} from "@/lib/utils";

interface ExpenseItemProps {
  item: Expense
  onDelete: (id: string) => void | Promise<void> // ✅ erlaubt auch async
  onEdit: (expense: Expense) => void
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
export function ExpenseItem({ item, onDelete, onEdit }: ExpenseItemProps) {
  const Icon = item.icon

  const { ref, touchProps, style, state } = useSwipe(
    -80, // leftThreshold
    80, // rightThreshold
    {
      onSwipeLeft: () => onDelete(item.id),
      onSwipeRight: () => onEdit(item),
    },
  )

  return (
    <div className="relative overflow-visible rounded-lg mb-2">
      {/* Lösch-Bereich im Hintergrund (links) */}
      <div
        className="absolute inset-y-0 right-0 bg-red-500 flex items-center justify-center text-white"
        style={{
          width: "80px",
          opacity: state.leftOpacity,
        }}
      >
        <Trash2 className="h-5 w-5" />
      </div>

      {/* Edit-Bereich im Hintergrund (rechts) */}
      <div
        className="absolute inset-y-0 left-0 bg-blue-600 flex items-center justify-center text-white"
        style={{
          width: "80px",
          opacity: state.rightOpacity,
        }}
      >
        <Edit className="h-5 w-5" />
      </div>

      {/* Swipeable Item */}
      <div
        ref={ref}
        className={`flex items-center p-2 rounded-lg transition-all duration-200 border border-gray-200 z-10
${state.isTouched ? "bg-blue-50" : "bg-white"} shadow-sm 
${state.isDragging ? "" : "transition-transform duration-300"} text-sm mb-[0.125rem]`}
        style={style}
        {...touchProps}
      >
        <div className={`p-1.5 rounded-full mr-2 ${state.isTouched ? "bg-blue-200" : "bg-blue-100"}`}>
          <Icon className="h-4 w-4 text-blue-600" />
        </div>
        <div className="flex-1">
          <div className="font-medium flex items-center">
            {item.name}
            {item.isRecurring && (
              <span className="ml-1 flex items-center justify-center bg-blue-100 rounded-full p-0.5">
                <Repeat className="h-2 w-2 text-blue-600" />
              </span>
            )}
          </div>
          <div className="text-xs text-gray-500">{convertDateToDisplay(item.date)}</div>
        </div>
        <div className="font-bold text-right">{formatEuro(item.amount)}</div>
      </div>
    </div>
  )
}

