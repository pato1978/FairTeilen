"use client"
import { createContext, useContext, useState } from "react"

type MonthContextType = {
    currentDate: Date
    setCurrentDate: (date: Date) => void
}

const MonthContext = createContext<MonthContextType | undefined>(undefined)

function areSameMonth(d1: Date, d2: Date): boolean {
    return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth()
}

export function MonthProvider({ children }: { children: React.ReactNode }) {
    const [currentDate, setCurrentDateState] = useState(new Date())

    const setCurrentDate = (date: Date) => {
        if (areSameMonth(date, currentDate)) return

        setCurrentDateState(date)

        // 🚀 Monat wird hier direkt ans Backend geschickt
        fetch("http://localhost:5289/api/currentmonth", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ month: date.toISOString() }),
        }).catch((error) => {
            console.error("Fehler beim Senden des Monats an das Backend:", error)
        })
    }

    return (
        <MonthContext.Provider value={{ currentDate, setCurrentDate }}>
            {children}
        </MonthContext.Provider>
    )
}

export function useMonth() {
    const context = useContext(MonthContext)
    if (!context) throw new Error("useMonth muss innerhalb von MonthProvider verwendet werden")
    return context
}
