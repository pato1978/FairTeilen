"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { PageLayout } from "@/components/layout/page-layout"
import { PageHeader } from "@/components/layout/page-header"

import { EnhancedMonthCard } from "./enhanced-month-card"
import { StatusModal } from "./status-modal"
import { useNavigate } from "react-router-dom"
import { ArrowDown, ArrowUp } from "lucide-react"
import { getCurrentUserId } from "@/lib/user-storage"
import type { MonthlyOverview, ClarificationReaction } from "@/types/monthly-overview"




export default function JahresUebersicht() {
  const navigate = useNavigate()
  const currentYear = new Date().getFullYear()
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const [monthsData, setMonthsData] = useState<Record<number, MonthlyOverview>>({})
  const [selectedMonth, setSelectedMonth] = useState<MonthlyOverview | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const BASE_URL = "http://localhost:5289"
  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch(`${BASE_URL}/api/yearoverview/${selectedYear}?userId=${getCurrentUserId()}`)
      if (!res.ok) throw new Error("Fehler beim Laden der Daten");

      const data = await res.json(); // z. B. { year: 2025, months: [...] }
      // Daten als Array erwartet – wir wandeln es in ein Record um:
      const recordData: Record<number, MonthlyOverview> = {}
      data.months.forEach((month: MonthlyOverview) => {
        recordData[month.monthId] = month
      })
      setMonthsData(recordData)
    }
    fetchData()
  }, [selectedYear])

  const handleYearChange = (year: number) => {
    setSelectedYear(year)
  }

  const handleMonthClick = (month: MonthlyOverview) => {
    if (month.status !== "completed" && month.status !== "future") {
      navigate(`/statistics?month=${selectedYear}-${month.id.toString().padStart(2, "0")}`)
    }
  }

  const handleStatusClick = (month: MonthlyOverview, e: React.MouseEvent) => {
    e.stopPropagation()
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

  const sortedMonths = Object.values(monthsData).sort((a, b) => {
    return sortOrder === "asc" ? a.monthId - b.monthId : b.monthId - a.monthId
  })

  return (
      <PageLayout showAddButton={false}>
        <div className="page-header-container scale-80 transform-origin-top">
          <PageHeader showMonthSelector={false} title="Jahresübersicht" />
        </div>

        <div className="flex-1 px-4 pb-6 mt-4 overflow-y-auto">
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

          <div className="space-y-4 mb-20">
            {sortedMonths.map((month) => (
                <EnhancedMonthCard
                    key={month.monthId}
                    month={month}
                    onClick={() => handleMonthClick(month)}
                    onStatusClick={(e) => handleStatusClick(month, e)}
                />
            ))}
          </div>
        </div>

        {selectedMonth && <StatusModal isOpen={isModalOpen} onClose={closeModal} month={selectedMonth} />}
      </PageLayout>
  )
}
