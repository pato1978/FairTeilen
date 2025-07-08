'use client'

//import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface YearSelectorProps {
    selectedYear: number
    onChange: (year: number) => void
}

export function YearSelector({ selectedYear, onChange }: YearSelectorProps) {
    // const [availableYears] = useState(() => {
    //   const currentYear = new Date().getFullYear()
    // return [currentYear - 2, currentYear - 1, currentYear, currentYear + 1]
    // })

    // Functions to navigate between years
    const goToPreviousYear = () => {
        const newYear = selectedYear - 1
        onChange(newYear)
    }

    const goToNextYear = () => {
        const newYear = selectedYear + 1
        onChange(newYear)
    }

    return (
        <div className="inline-flex justify-between items-center bg-blue-50 rounded-md px-2 py-1 min-w-fit h-8">
            <button
                onClick={goToPreviousYear}
                className="p-1.5 flex items-center justify-center rounded-full active:bg-gray-200 transition-colors"
                aria-label="Vorheriges Jahr"
            >
                <ChevronLeft className="h-4 w-4 text-blue-500" />
            </button>
            <div className="text-base font-medium text-blue-600">{selectedYear}</div>
            <button
                onClick={goToNextYear}
                className="p-1.5 flex items-center justify-center rounded-full active:bg-gray-200 transition-colors"
                aria-label="Nächstes Jahr"
            >
                <ChevronRight className="h-4 w-4 text-blue-500" />
            </button>
        </div>
    )
}
