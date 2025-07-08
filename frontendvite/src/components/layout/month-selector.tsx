'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { formatMonthYear } from '@/lib/utils'
import { useMonth } from '@/context/month-context'

export interface MonthSelectorProps {
    currentDate?: Date
    setCurrentDate?: (date: Date) => void
}

export function MonthSelector({ currentDate: propCurrentDate, setCurrentDate: propSetCurrentDate }: MonthSelectorProps): React.JSX.Element {
    const monthContext = useMonth()
    const currentDate = propCurrentDate || monthContext.currentDate
    const setCurrentDate = propSetCurrentDate || monthContext.setCurrentDate

    const navigateMonth = (offset: number) => {
        const newDate = new Date(currentDate)
        newDate.setDate(1) //
        newDate.setMonth(newDate.getMonth() + offset)
        setCurrentDate(newDate)
    }

    return (
        <div className="inline-flex justify-between items-center bg-blue-50 rounded-md px-2 py-1 min-w-fit h-8">
            <button
                onClick={() => navigateMonth(-1)}
                className="h-6 w-6 flex items-center justify-center rounded-full text-blue-600 hover:bg-blue-100 transition-colors"
                aria-label="Vorheriger Monat"
            >
                <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="text-sm font-medium text-blue-600 px-2 whitespace-nowrap">
                {formatMonthYear(currentDate)}
            </div>
            <button
                onClick={() => navigateMonth(1)}
                className="h-6 w-6 flex items-center justify-center rounded-full text-blue-600 hover:bg-blue-100 transition-colors"
                aria-label="Nächster Monat"
            >
                <ChevronRight className="h-4 w-4" />
            </button>
        </div>
    )
}
