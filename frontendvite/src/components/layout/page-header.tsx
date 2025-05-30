"use client"

import { MonthSelector } from "@/components/layout/month-selector"
import { YearSelector } from "@/components/layout/year-selector"
import { useMonth } from "@/context/month-context"
import { useState } from "react"

interface PageHeaderProps {
    title: string
    showMonthSelector?: boolean
}

export function PageHeader({
                               title,
                               showMonthSelector = true,
                           }: PageHeaderProps) {
    const { currentDate } = useMonth()
    const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear())

    const handleYearChange = (newYear: number) => {
        setSelectedYear(newYear)
        console.log("Neues Jahr ausgewählt:", newYear)
    }

    return (
        <div className="relative px-6 py-4 text-left rounded-xl w-full mb-2 overflow-hidden backdrop-blur-sm shadow-lg -mt-4">
            {/* Hintergrund – hell statt blau */}
            <div className="absolute inset-0 bg-white -z-10 pl-3" />

            {/* Dezente Designakzente */}
            <div className="absolute -top-4 -right-6 w-20 h-20 bg-blue-100/50 rounded-full blur-xl"></div>
            <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-blue-300/60 to-blue-100/60"></div>

            {/* Titel und Selector nebeneinander */}
            <div className="flex flex-row items-center justify-between gap-2">
                <h2 className="text-2xl font-bold text-gray-700">{title}</h2>

                {showMonthSelector ? (

                        <MonthSelector />

                ) : (
                    <div className="inline-flex items-center justify-between bg-blue-50 rounded-lg p-2 min-w-fit">
                        <YearSelector selectedYear={selectedYear} onChange={handleYearChange} />
                    </div>
                )}
            </div>
        </div>
    )
}
