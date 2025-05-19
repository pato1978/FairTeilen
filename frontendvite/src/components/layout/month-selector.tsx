"use client"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useMonth } from "@/context/month-context"
import { formatMonthYear } from "@/lib/utils"

export function MonthSelector() {
    const { currentDate, setCurrentDate } = useMonth()

    const goToPreviousMonth = () => {
        const newDate = new Date(currentDate)
        newDate.setMonth(currentDate.getMonth() - 1)
        setCurrentDate(newDate) // 💡 wird direkt an Backend gesendet
    }

    const goToNextMonth = () => {
        const newDate = new Date(currentDate)
        newDate.setMonth(currentDate.getMonth() + 1)
        setCurrentDate(newDate)
    }

    return (
        <div className="flex justify-between items-center bg-white shadow-sm rounded-lg p-3 w-[70%] border border-gray-100">
            <button onClick={goToPreviousMonth} aria-label="Vorheriger Monat">
                <ChevronLeft className="h-5 w-5 text-blue-500" />
            </button>
            <div className="font-medium text-gray-700">{formatMonthYear(currentDate)}</div>
            <button onClick={goToNextMonth} aria-label="Nächster Monat">
                <ChevronRight className="h-5 w-5 text-blue-500" />
            </button>
        </div>
    )
}
