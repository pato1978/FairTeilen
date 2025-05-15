"use client"

import { useState, useEffect } from "react"
import { Filter, ArrowDown, ArrowUp, PieChart, BarChart3 } from "lucide-react"
import { PageLayout } from "@/components/layout/page-layout"
import { PageHeader } from "@/components/layout/page-header"
import { PieChartComponent } from "@/components/charts/pie-chart"
import { BarChartComponent } from "@/components/charts/bar-chart"
import { CategoryFilter } from "@/components/filters/category-filter"
import { useRouter } from "next/navigation"

// Beispieldaten für die Ausgaben nach Kategorien
const expensesByCategory = [
  { category: "Lebensmittel", amount: 320, color: "#3B82F6" }, // blue-500
  { category: "Wohnen", amount: 850, color: "#10B981" }, // emerald-500
  { category: "Transport", amount: 150, color: "#F59E0B" }, // amber-500
  { category: "Unterhaltung", amount: 200, color: "#EC4899" }, // pink-500
  { category: "Gesundheit", amount: 80, color: "#8B5CF6" }, // violet-500
  { category: "Bildung", amount: 50, color: "#6366F1" }, // indigo-500
  { category: "Sonstiges", amount: 120, color: "#9CA3AF" }, // gray-400
]

export default function AnalysePage() {
  const router = useRouter()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [chartType, setChartType] = useState<"pie" | "bar">("pie")
  const [sortBy, setSortBy] = useState<"amount" | "name">("amount")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [filteredData, setFilteredData] = useState(expensesByCategory)

  // Filtern und Sortieren der Daten basierend auf den ausgewählten Kategorien und Sortieroptionen
  useEffect(() => {
    let data = [...expensesByCategory]

    // Filtern nach ausgewählten Kategorien
    if (selectedCategories.length > 0) {
      data = data.filter((item) => selectedCategories.includes(item.category))
    }

    // Sortieren nach Betrag oder Name
    data.sort((a, b) => {
      if (sortBy === "amount") {
        return sortDirection === "asc" ? a.amount - b.amount : b.amount - a.amount
      } else {
        return sortDirection === "asc" ? a.category.localeCompare(b.category) : b.category.localeCompare(a.category)
      }
    })

    setFilteredData(data)
  }, [selectedCategories, sortBy, sortDirection])

  // Gesamtbetrag der gefilterten Daten berechnen
  const totalAmount = filteredData.reduce((sum, item) => sum + item.amount, 0)

  // Umschalten der Sortierrichtung
  const toggleSortDirection = () => {
    setSortDirection(sortDirection === "asc" ? "desc" : "asc")
  }

  // Umschalten des Diagrammtyps
  const toggleChartType = () => {
    setChartType(chartType === "pie" ? "bar" : "pie")
  }

  return (
    <PageLayout showAddButton={false}>
      {/* Header Area */}
      <div className="page-header-container">
        <PageHeader title="Ausgabenanalyse" initialDate={currentDate} onMonthChange={setCurrentDate} />
      </div>

      {/* Seitenauswahl Container */}
      <div className="px-4 mt-4">
        <div className="bg-white shadow-md rounded-lg p-3 flex justify-between items-center">
          <h3 className="text-sm font-medium text-gray-700">Ansicht wählen</h3>
          <div className="flex space-x-2">
            <button className="px-3 py-1.5 text-sm rounded-md bg-blue-600 text-white" onClick={() => {}}>
              Ausgabenanalyse
            </button>
            <button
              className="px-3 py-1.5 text-sm rounded-md bg-blue-50 text-blue-600"
              onClick={() => router.push("/trends")}
            >
              Ausgabentrends
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 px-4 pb-6 mt-4 flex flex-col overflow-hidden">
        <div className="bg-white shadow-md rounded-lg p-4 flex-1 flex flex-col overflow-hidden mb-4">
          {/* Filter und Sortieroptionen */}
          <div className="flex justify-between items-center mb-4">
            <CategoryFilter
              categories={expensesByCategory.map((item) => item.category)}
              selectedCategories={selectedCategories}
              onChange={setSelectedCategories}
            />

            <div className="flex space-x-2">
              <button
                onClick={toggleChartType}
                className="p-2 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center"
                aria-label={`Wechseln zu ${chartType === "pie" ? "Balkendiagramm" : "Kreisdiagramm"}`}
              >
                {chartType === "pie" ? <BarChart3 className="h-4 w-4" /> : <PieChart className="h-4 w-4" />}
              </button>

              <button
                onClick={() => setSortBy(sortBy === "amount" ? "name" : "amount")}
                className="p-2 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center"
                aria-label={`Sortieren nach ${sortBy === "amount" ? "Name" : "Betrag"}`}
              >
                <Filter className="h-4 w-4" />
              </button>

              <button
                onClick={toggleSortDirection}
                className="p-2 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center"
                aria-label={`Sortierrichtung ${sortDirection === "asc" ? "absteigend" : "aufsteigend"}`}
              >
                {sortDirection === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Gesamtbetrag */}
          <div className="bg-blue-50 p-3 rounded-lg mb-4">
            <div className="text-sm text-gray-600">Gesamtausgaben</div>
            <div className="text-xl font-bold text-blue-700">€{totalAmount.toFixed(2)}</div>
          </div>

          {/* Diagrammbereich */}
          <div className="flex-1 flex flex-col items-center justify-center p-2 min-h-[300px]">
            {chartType === "pie" ? (
              <PieChartComponent data={filteredData} />
            ) : (
              <BarChartComponent data={filteredData} />
            )}
          </div>

          {/* Legende */}
          <div className="mt-4 grid grid-cols-1 gap-2">
            {filteredData.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.color }}></div>
                  <span className="text-sm">{item.category}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm font-medium">€{item.amount.toFixed(2)}</span>
                  <span className="text-xs text-gray-500 ml-1">({Math.round((item.amount / totalAmount) * 100)}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageLayout>
  )
}
