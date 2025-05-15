"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { PageLayout } from "@/components/layout/page-layout"
import { PageHeader } from "@/components/layout/page-header"
import { YearSelector } from "./year-selector"
import { EnhancedMonthCard } from "./enhanced-month-card"
import { StatusModal } from "./status-modal"
import { useRouter } from "next/navigation"
import { ArrowDown, ArrowUp } from "lucide-react"

// Typen für unsere Daten
interface MonthData {
  id: number
  name: string
  status: "completed" | "pending" | "needs-clarification" | "future"
  confirmations: {
    user1: boolean
    user2: boolean
  }
  message?: string
  expenses?: {
    total: number
    shared: number
    personal: number
    child: number
  }
  balance?: number
}

// Mock-Daten für die Jahresübersicht mit erweiterten Informationen
const generateMockData = (year: number): Record<number, MonthData> => {
  const currentDate = new Date()
  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth() + 1 // 1-12 für Januar-Dezember

  // Deutsche Monatsnamen
  const monthNames = [
    "Januar",
    "Februar",
    "März",
    "April",
    "Mai",
    "Juni",
    "Juli",
    "August",
    "September",
    "Oktober",
    "November",
    "Dezember",
  ]

  const months: Record<number, MonthData> = {}

  for (let i = 1; i <= 12; i++) {
    let status: "completed" | "pending" | "needs-clarification" | "future"
    let confirmations = { user1: false, user2: false }
    let message: string | undefined = undefined
    let expenses = undefined
    let balance = undefined

    // Prüfe, ob der Monat in der Zukunft oder der aktuelle Monat ist
    const isFutureMonth = year > currentYear || (year === currentYear && i > currentMonth)
    const isCurrentMonth = year === currentYear && i === currentMonth

    if (isFutureMonth) {
      // Zukünftige Monate sind nicht bearbeitbar
      status = "future"
      confirmations = { user1: false, user2: false }
    } else if (isCurrentMonth) {
      // Aktueller Monat ist noch nicht abgeschlossen
      status = "pending"
      confirmations = { user1: false, user2: false }
      expenses = {
        total: 1250 + Math.floor(Math.random() * 300),
        shared: 850 + Math.floor(Math.random() * 150),
        personal: 300 + Math.floor(Math.random() * 100),
        child: 100 + Math.floor(Math.random() * 50),
      }
      balance = -75 + Math.floor(Math.random() * 150)
    } else if (year < currentYear || (year === currentYear && i < currentMonth - 2)) {
      // Monate, die mehr als einen Monat zurückliegen, sind abgeschlossen
      status = "completed"
      confirmations = { user1: true, user2: true }
      expenses = {
        total: 1250 + Math.floor(Math.random() * 300),
        shared: 850 + Math.floor(Math.random() * 150),
        personal: 300 + Math.floor(Math.random() * 100),
        child: 100 + Math.floor(Math.random() * 50),
      }
      balance = 0 // Abgeschlossene Monate haben keinen offenen Saldo
    } else if (year === currentYear && i === currentMonth - 2) {
      // Vorletzter Monat hat Klärungsbedarf
      status = "needs-clarification"
      confirmations = { user1: true, user2: false }
      message = "Unterschiedliche Beträge bei 3 Ausgaben"
      expenses = {
        total: 1250 + Math.floor(Math.random() * 300),
        shared: 850 + Math.floor(Math.random() * 150),
        personal: 300 + Math.floor(Math.random() * 100),
        child: 100 + Math.floor(Math.random() * 50),
      }
      balance = -85 + Math.floor(Math.random() * 170)
    } else if (year === currentYear && i === currentMonth - 1) {
      // Letzter Monat ist noch nicht vollständig bestätigt
      status = "pending"
      confirmations = { user1: true, user2: false }
      expenses = {
        total: 1250 + Math.floor(Math.random() * 300),
        shared: 850 + Math.floor(Math.random() * 150),
        personal: 300 + Math.floor(Math.random() * 100),
        child: 100 + Math.floor(Math.random() * 50),
      }
      balance = -65 + Math.floor(Math.random() * 130)
    } else {
      // Dieser Fall sollte nicht mehr eintreten, aber zur Sicherheit
      status = "pending"
      confirmations = { user1: false, user2: false }
    }

    months[i] = {
      id: i,
      name: monthNames[i - 1],
      status,
      confirmations,
      message,
      expenses,
      balance,
    }
  }

  return months
}

export default function JahresUebersicht() {
  const router = useRouter()
  const currentYear = new Date().getFullYear()
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const [monthsData, setMonthsData] = useState<Record<number, MonthData>>({})
  const [selectedMonth, setSelectedMonth] = useState<MonthData | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")

  // Lade Daten beim ersten Rendern und wenn sich das Jahr ändert
  useEffect(() => {
    // Simuliere API-Aufruf mit einer kleinen Verzögerung
    const fetchData = async () => {
      // Hier würde normalerweise ein API-Aufruf stattfinden
      // z.B. fetch(`/api/annual-overview/${selectedYear}`)
      const data = generateMockData(selectedYear)
      setMonthsData(data)
    }

    fetchData()
  }, [selectedYear])

  const handleYearChange = (year: number) => {
    setSelectedYear(year)
  }

  const handleMonthClick = (month: MonthData) => {
    if (month.status !== "completed" && month.status !== "future") {
      // Navigiere zur Statistik-Seite mit dem ausgewählten Monat
      router.push(`/statistics?month=${selectedYear}-${month.id.toString().padStart(2, "0")}`)
    }
  }

  const handleStatusClick = (month: MonthData, e: React.MouseEvent) => {
    e.stopPropagation() // Verhindere, dass der Klick zur Statistik-Seite führt
    if (month.status !== "future") {
      setSelectedMonth(month)
      setIsModalOpen(true)
    }
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedMonth(null)
  }

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc")
  }

  // Sortiere die Monate nach ID (Monatsnummer)
  const sortedMonths = Object.values(monthsData).sort((a, b) => {
    return sortOrder === "asc" ? a.id - b.id : b.id - a.id
  })

  // Berechne Zusammenfassungsdaten
  // const completedMonths = Object.values(monthsData).filter((m) => m.status === "completed").length
  // const pendingMonths = Object.values(monthsData).filter((m) => m.status === "pending").length
  // const clarificationMonths = Object.values(monthsData).filter((m) => m.status === "needs-clarification").length

  // Aktuelles Datum für die Anzeige in der UI
  // const currentDate = new Date()
  // const currentMonthName = monthNames[currentDate.getMonth()]

  return (
    <PageLayout showAddButton={false}>
      {/* Header Area */}
      <div className="page-header-container">
        <PageHeader title="Jahresübersicht" />
        <YearSelector selectedYear={selectedYear} onChange={handleYearChange} />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 px-4 pb-6 mt-4 overflow-y-auto">
        {/* Zusammenfassung */}
        {/* Sortieroptionen */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold">Monate</h3>
          <button
            onClick={toggleSortOrder}
            className="flex items-center text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-md"
          >
            {sortOrder === "asc" ? (
              <>
                <span>Jan → Dez</span>
                <ArrowDown className="h-3 w-3 ml-1" />
              </>
            ) : (
              <>
                <span>Dez → Jan</span>
                <ArrowUp className="h-3 w-3 ml-1" />
              </>
            )}
          </button>
        </div>

        {/* Monatsliste */}
        <div className="space-y-4 mb-20">
          {sortedMonths.map((month) => (
            <EnhancedMonthCard
              key={month.id}
              month={month}
              onClick={() => handleMonthClick(month)}
              onStatusClick={(e) => handleStatusClick(month, e)}
            />
          ))}
        </div>
      </div>

      {/* Status Modal */}
      {selectedMonth && <StatusModal isOpen={isModalOpen} onClose={closeModal} month={selectedMonth} />}
    </PageLayout>
  )
}

// Deutsche Monatsnamen für die Anzeige
const monthNames = [
  "Januar",
  "Februar",
  "März",
  "April",
  "Mai",
  "Juni",
  "Juli",
  "August",
  "September",
  "Oktober",
  "November",
  "Dezember",
]
