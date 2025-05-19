"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface YearSelectorProps {
  selectedYear: number
  onChange: (year: number) => void
}

export function YearSelector({ selectedYear, onChange }: YearSelectorProps) {
  const [availableYears] = useState(() => {
    const currentYear = new Date().getFullYear()
    return [currentYear - 2, currentYear - 1, currentYear, currentYear + 1]
  })

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
    <div className="flex justify-between items-center bg-white shadow-sm rounded-lg p-3 w-[70%] border border-gray-100">
      <button
        onClick={goToPreviousYear}
        className="p-2 flex items-center justify-center rounded-full active:bg-gray-200 transition-colors"
        aria-label="Vorheriges Jahr"
      >
        <ChevronLeft className="h-5 w-5 text-blue-500" />
      </button>
      <div className="font-medium text-gray-700">{selectedYear}</div>
      <button
        onClick={goToNextYear}
        className="p-2 flex items-center justify-center rounded-full active:bg-gray-200 transition-colors"
        aria-label="Nächstes Jahr"
      >
        <ChevronRight className="h-5 w-5 text-blue-500" />
      </button>
    </div>
  )
}
