"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { formatMonthYear } from "@/lib/utils"
import { useMonth } from "@/context/month-context"

export interface MonthSelectorProps {
    initialDate?: Date
}

export function MonthSelector(): React.JSX.Element {
    const { currentDate, setCurrentDate } = useMonth()

    const navigateMonth = (offset: number) => {
        const newDate = new Date(currentDate)
        newDate.setMonth(newDate.getMonth() + offset)
        setCurrentDate(newDate)
    }

    return (
        <div className="flex justify-between items-center bg-blue-50 rounded-lg p-2 mt-2 mx-auto w-[80%]">
            <button
                onClick={() => navigateMonth(-1)}
                className="p-1.5 flex items-center justify-center rounded-full text-blue-600 hover:bg-blue-50 active:bg-blue-100 transition-colors"
                aria-label="Vorheriger Monat"
            >
                <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="text-base font-medium text-blue-600">
                {formatMonthYear(currentDate)}
            </div>
            <button
                onClick={() => navigateMonth(1)}
                className="p-1.5 flex items-center justify-center rounded-full text-blue-600 hover:bg-blue-50 active:bg-blue-100 transition-colors"
                aria-label="Nächster Monat"
            >
                <ChevronRight className="h-4 w-4" />
            </button>
        </div>
    )
}
