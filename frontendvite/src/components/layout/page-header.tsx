"use client"

import { MonthSelector } from "@/components/layout/month-selector"
import { YearSelector } from "@/components/layout/year-selector"
import { useMonth } from "@/context/month-context"

import { useState } from "react" // für selectedYear

interface PageHeaderProps {
    title: string
    showMonthSelector?: boolean
}

export function PageHeader({
                               title,
                               showMonthSelector = true,
                           }: PageHeaderProps) {
    const { currentDate } = useMonth()

    // Lokaler State für ausgewähltes Jahr – nur bei YearSelector notwendig
    const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear())

    // Handler für YearSelector
    const handleYearChange = (newYear: number) => {
        setSelectedYear(newYear)
        // Optional: Hier könntest du den Kontext aktualisieren oder API neu laden
        console.log("Neues Jahr ausgewählt:", newYear)
    }

    return (
        <div className="relative flex flex-col justify-center items-center px-6 py-3 text-center rounded-xl w-full mb-2 overflow-hidden backdrop-blur-sm shadow-lg -mt-4 min-h-[120px]">
            {/* 🔵 Hintergrundfarbe passend zur Footer-Farbe */}
            <div className="absolute inset-0 bg-blue-600 -z-10" />

            {/* 🌬 Subtile grafische Elemente */}
            <div className="absolute -top-4 -right-6 w-20 h-20 bg-blue-400/30 rounded-full blur-xl" />
            <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-blue-300/60 to-white/60" />

            {/* 🏷️ Titelanzeige */}
            <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>

            {/* 📅 Monats- oder Jahresauswahl */}
            {showMonthSelector ? (
                <MonthSelector />
            ) : (
                <YearSelector selectedYear={selectedYear} onChange={handleYearChange} />
            )}
        </div>
    )
}
