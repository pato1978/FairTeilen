"use client"

import { useState, useEffect } from "react"
import { Filter, Calendar, TrendingUp, TrendingDown } from "lucide-react"
import { PageLayout } from "@/components/layout/page-layout"
import { PageHeader } from "@/components/layout/page-header"
import { LineChartComponent } from "@/components/charts/line-chart"
import { CategoryFilter } from "@/components/filters/category-filter"
import { useNavigate } from "react-router-dom"
import { useMonth } from "@/context/month-context"

// Beispieldaten für die Ausgaben über Zeit
const monthlyExpenses = [
  {
    month: "Jan",
    total: 1450,
    categories: {
      Lebensmittel: 280,
      Wohnen: 850,
      Transport: 120,
      Unterhaltung: 150,
      Sonstiges: 50,
    },
  },
  {
    month: "Feb",
    total: 1380,
    categories: {
      Lebensmittel: 260,
      Wohnen: 850,
      Transport: 100,
      Unterhaltung: 120,
      Sonstiges: 50,
    },
  },
  {
    month: "Mär",
    total: 1520,
    categories: {
      Lebensmittel: 320,
      Wohnen: 850,
      Transport: 150,
      Unterhaltung: 150,
      Sonstiges: 50,
    },
  },
  {
    month: "Apr",
    total: 1490,
    categories: {
      Lebensmittel: 300,
      Wohnen: 850,
      Transport: 140,
      Unterhaltung: 150,
      Sonstiges: 50,
    },
  },
  {
    month: "Mai",
    total: 1550,
    categories: {
      Lebensmittel: 330,
      Wohnen: 850,
      Transport: 170,
      Unterhaltung: 150,
      Sonstiges: 50,
    },
  },
  {
    month: "Jun",
    total: 1620,
    categories: {
      Lebensmittel: 350,
      Wohnen: 850,
      Transport: 180,
      Unterhaltung: 190,
      Sonstiges: 50,
    },
  },
]

// Farbzuordnung für Kategorien
const categoryColors = {
  Lebensmittel: "#3B82F6", // blue-500
  Wohnen: "#10B981", // emerald-500
  Transport: "#F59E0B", // amber-500
  Unterhaltung: "#EC4899", // pink-500
  Sonstiges: "#9CA3AF", // gray-400
}

export default function TrendsPage() {
  const { currentDate } = useMonth()
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [timeRange, setTimeRange] = useState<"3m" | "6m" | "1y">("6m")
  const [viewType, setViewType] = useState<"total" | "categories">("total")
  const [chartData, setChartData] = useState(monthlyExpenses)
  const navigate = useNavigate()

  // Alle verfügbaren Kategorien aus den Daten extrahieren
  const allCategories = Object.keys(monthlyExpenses[0].categories)

  // Filtern der Daten basierend auf dem ausgewählten Zeitraum
  useEffect(() => {
    let filteredData = [...monthlyExpenses]

    // Zeitraum filtern
    if (timeRange === "3m") {
      filteredData = filteredData.slice(-3)
    } else if (timeRange === "6m") {
      filteredData = filteredData.slice(-6)
    }
    // Bei 1y alle Daten anzeigen (in diesem Beispiel nur 6 Monate)

    setChartData(filteredData)
  }, [timeRange])

  // Berechnung der Trends
  const calculateTrend = () => {
    if (chartData.length < 2) return { value: 0, isPositive: false }

    const firstValue = chartData[0].total
    const lastValue = chartData[chartData.length - 1].total
    const difference = lastValue - firstValue
    const percentageChange = (difference / firstValue) * 100

    return {
      value: Math.abs(percentageChange).toFixed(1),
      isPositive: percentageChange > 0,
    }
  }

  const trend = calculateTrend()

  return (
    <PageLayout showAddButton={false}>
      {/* Header Area */}
      <div className="page-header-container">
        <PageHeader title="Ausgabentrends" />
      </div>

      {/* Seitenauswahl Container */}
      <div className="px-4 mt-4">
        <div className="bg-white shadow-md rounded-lg p-3 flex justify-between items-center">
          <h3 className="text-sm font-medium text-gray-700">Ansicht wählen</h3>
          <div className="flex space-x-2">
            <button
              className="px-3 py-1.5 text-sm rounded-md bg-blue-50 text-blue-600"
              onClick={() => navigate("/analyse")}
            >
              Ausgabenanalyse
            </button>
            <button className="px-3 py-1.5 text-sm rounded-md bg-blue-600 text-white" onClick={() => {}}>
              Ausgabentrends
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 px-4 pb-6 mt-4 flex flex-col overflow-hidden">
        <div className="bg-white shadow-md rounded-lg p-4 flex-1 flex flex-col overflow-hidden mb-4">
          {/* Filter und Zeitraumoptionen */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex space-x-2">
              <button
                onClick={() => setTimeRange("3m")}
                className={`px-3 py-1 rounded-md text-sm ${
                  timeRange === "3m" ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-600"
                }`}
              >
                3M
              </button>
              <button
                onClick={() => setTimeRange("6m")}
                className={`px-3 py-1 rounded-md text-sm ${
                  timeRange === "6m" ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-600"
                }`}
              >
                6M
              </button>
              <button
                onClick={() => setTimeRange("1y")}
                className={`px-3 py-1 rounded-md text-sm ${
                  timeRange === "1y" ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-600"
                }`}
              >
                1J
              </button>
            </div>

            <button
              onClick={() => setViewType(viewType === "total" ? "categories" : "total")}
              className="p-2 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center"
              aria-label={`Ansicht wechseln zu ${viewType === "total" ? "Kategorien" : "Gesamt"}`}
            >
              <Filter className="h-4 w-4" />
            </button>
          </div>

          {/* Trend-Anzeige */}
          <div
            className={`p-3 rounded-lg mb-4 flex items-center justify-between ${
              trend.isPositive ? "bg-red-50" : "bg-green-50"
            }`}
          >
            <div>
              <div className="text-sm text-gray-600">
                Trend über {timeRange === "3m" ? "3 Monate" : timeRange === "6m" ? "6 Monate" : "1 Jahr"}
              </div>
              <div className={`text-xl font-bold ${trend.isPositive ? "text-red-600" : "text-green-600"}`}>
                {trend.isPositive ? "+" : "-"}
                {trend.value}%
              </div>
            </div>
            <div className={`p-2 rounded-full ${trend.isPositive ? "bg-red-100" : "bg-green-100"}`}>
              {trend.isPositive ? (
                <TrendingUp className="h-6 w-6 text-red-600" />
              ) : (
                <TrendingDown className="h-6 w-6 text-green-600" />
              )}
            </div>
          </div>

          {/* Kategorie-Filter (nur anzeigen, wenn Kategorieansicht aktiv ist) */}
          {viewType === "categories" && (
            <div className="mb-4">
              <CategoryFilter
                categories={allCategories}
                selectedCategories={selectedCategories}
                onChange={setSelectedCategories}
              />
            </div>
          )}

          {/* Diagrammbereich */}
          <div className="flex-1 flex flex-col items-center justify-center p-2 min-h-[300px]">
            <LineChartComponent
              data={chartData}
              viewType={viewType}
              selectedCategories={selectedCategories.length > 0 ? selectedCategories : allCategories}
              categoryColors={categoryColors}
            />
          </div>

          {/* Monatliche Übersicht */}
          <div className="mt-4">
            <h3 className="text-base font-medium mb-2">Monatliche Übersicht</h3>
            <div className="space-y-2">
              {chartData.map((month, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50 border border-gray-100"
                >
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 text-blue-600 mr-2" />
                    <span className="text-sm">{month.month}</span>
                  </div>
                  <div className="text-sm font-medium">€{month.total.toFixed(2)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  )
}
