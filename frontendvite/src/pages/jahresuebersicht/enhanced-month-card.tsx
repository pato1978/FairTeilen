"use client"

import { useState } from "react"
import {
  CheckCircle,
  AlertTriangle,
  Clock,
  Info,
  Lock,
  Users,
  Baby,
  ArrowRight,
  UserCheck,
  UserX,
  Star,
  ArrowUpRight, ArrowUp,
} from "lucide-react"
import { useTooltip } from "@/lib/hooks/use-tooltip"
import type { MonthlyOverview } from "@/types/monthly-overview"
import {useNavigate} from "react-router-dom";

interface EnhancedMonthCardProps {
  month: MonthlyOverview
  onClick: () => void
  onStatusClick: (e: React.MouseEvent) => void
}

export function EnhancedMonthCard({ month, onClick, onStatusClick }: EnhancedMonthCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const navigate = useNavigate()
  const toggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsExpanded(!isExpanded)
  }

  const { isVisible: showStarTooltip, showTooltip: displayStarTooltip } = useTooltip({ isGlobal: true })

  const statusInfo = (() => {
    switch (month.status) {
      case "completed":
        return {
          icon: <CheckCircle className="h-5 w-5 text-green-500" />,
          text: "Abgeschlossen",
          statusBgColor: "bg-green-50",
          textColor: "text-green-600",
          borderColor: "border-gray-200",
        }
      case "pending":
        return {
          icon: <Clock className="h-5 w-5 text-amber-500" />,
          text: "Offen",
          statusBgColor: "bg-amber-50",
          textColor: "text-amber-600",
          borderColor: "border-amber-200",
        }
      case "needs-clarification":
        return {
          icon: <AlertTriangle className="h-5 w-5 text-amber-500" />,
          text: "Klärungsbedarf",
          statusBgColor: "bg-amber-50",
          textColor: "text-amber-600",
          borderColor: "border-amber-200",
        }
      case "future":
        return {
          icon: <Lock className="h-5 w-5 text-gray-400" />,
          text: "Nicht verfügbar",
          statusBgColor: "bg-gray-50",
          textColor: "text-gray-400",
          borderColor: "border-gray-200",
        }
      default:
        return {
          icon: <Info className="h-5 w-5 text-gray-500" />,
          text: "Unbekannt",
          statusBgColor: "bg-gray-50",
          textColor: "text-gray-500",
          borderColor: "border-gray-200",
        }
    }
  })()

  const expenses = {
    shared: month.shared,
    child: month.child,
    total: month.total,
    sharedBy: {
      partner1: month.sharedUser1,
      partner2: month.sharedUser2,
    },
    childBy: {
      partner1: month.childUser1,
      partner2: month.childUser2,
    },
    totalBy: {
      partner1: month.sharedUser1 + month.childUser1,
      partner2: month.sharedUser2 + month.childUser2,
    },
  }

  const isPending = month.status === "pending"
  const isCompleted = month.status === "completed"
  const isFuture = month.status === "future"
  const needsClarification = month.status === "needs-clarification"

  return (
      <div className={`bg-white rounded-lg shadow-sm border ${statusInfo.borderColor} overflow-hidden transition-colors ${!isFuture && "cursor-pointer"}`}>
        <div className="flex items-center justify-between p-3 border-b border-gray-100" onClick={toggleExpand}>
          <h3 className="text-lg font-semibold">{month.name}</h3>
          <div className="flex items-center">
            <div className={`flex items-center px-2 py-1 rounded-full ${statusInfo.statusBgColor}`}>
              {statusInfo.icon}
              <span className={`ml-1.5 text-sm font-normal ${statusInfo.textColor}`}>{statusInfo.text}</span>
            </div>
            <div className="relative ml-2">
              <Star
                  className="h-4 w-4 text-yellow-300 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation()
                    displayStarTooltip()
                  }}
              />
              {showStarTooltip && (
                  <div className="absolute top-0 right-6 w-48 p-2 bg-white text-gray-800 rounded-lg shadow-lg text-sm font-normal z-20">
                    <p>Premium-Funktion: Detaillierte Monatsanalyse und Exportmöglichkeiten.</p>
                    <div className="absolute top-2 -right-2 w-3 h-3 bg-white transform rotate-45"></div>
                  </div>
              )}
            </div>
          </div>
        </div>

        {isExpanded && (
            <div className="p-3 space-y-4">

              {/* Ausgaben-Übersicht */}
              <div>
                <h4 className="text-base font-medium text-gray-700 mb-2">Ausgaben</h4>
                <div className="grid grid-cols-2 gap-2">


                  {/* Gemeinsam */}
                  <div className="p-2 rounded bg-blue-50 border border-blue-50 shadow-sm cursor-pointer flex flex-col items-center text-center" onClick={() => setShowDetails(!showDetails)}>
                    <div className="flex items-center mb-1">
                      <Users className="h-5 w-5 text-blue-600 mr-1" />
                      <span className="text-base font-normal text-blue-600">Gemeinsam</span>
                    </div>
                    <div className="text-base font-bold text-black">€{expenses.shared.toFixed(2)}</div>
                    {showDetails && (
                        <div className="mt-2 text-sm text-gray-700">
                          <div>Partner 1: €{expenses.sharedBy.partner1.toFixed(2)}</div>
                          <div>Partner 2: €{expenses.sharedBy.partner2.toFixed(2)}</div>
                          {/* Navigation zur Detailansicht */}
                          <button
                              onClick={(e) => {
                                e.stopPropagation()
                                navigate("/shared") // ggf. dynamisieren
                              }}
                              className="mt-3 flex items-center text-blue-600  text font-medium"
                          >
                            <ArrowUpRight className="h-4 w-4 mr-1" />
                            <span>Ausgaben anzeigen</span>
                          </button>
                        </div>
                    )}
                  </div>

                  {/* Kind */}
                  <div
                      className="p-2 rounded bg-blue-50 border border-blue-50 shadow-sm cursor-pointer flex flex-col items-center text-center"
                      onClick={() => setShowDetails(!showDetails)}
                  >
                    {/* Titelzeile */}
                    <div className="flex items-center mb-1">
                      <Baby className="h-5 w-5 text-blue-600 mr-1" />
                      <span className="text-base font-normal text-blue-600">Kind</span>
                    </div>

                    {/* Betrag */}
                    <div className="text-base font-bold text-black">
                      €{expenses.child.toFixed(2)}
                    </div>

                    {/* Details + Navigation unten */}
                    {showDetails && (
                        <div className="mt-2 text-sm text-gray-700  w-full">
                          <div>Partner 1: €{expenses.childBy.partner1.toFixed(2)}</div>
                          <div>Partner 2: €{expenses.childBy.partner2.toFixed(2)}</div>

                          {/* Navigation zur Detailansicht */}
                          <button
                              onClick={(e) => {
                                e.stopPropagation()
                                navigate("/child") // ggf. dynamisieren
                              }}
                              className="mt-3 flex items-center text-blue-600  text font-medium"
                          >
                            <ArrowUpRight className="h-4 w-4 mr-1" />
                            <span>Ausgaben anzeigen</span>
                          </button>
                        </div>
                    )}
                  </div>


                </div>

                {/* Gesamtausgaben */}
                <div className="bg-gray-50 p-2 rounded text-center cursor-pointer mt-2" onClick={() => setShowDetails(!showDetails)}>
                  <span className="text-base font-normal text-gray-600">Gesamt</span>
                  <div className="text-base font-bold">€{expenses.total.toFixed(2)}</div>
                  {showDetails && (
                      <div className="mt-2 text-sm text-gray-700">
                        <div>Partner 1: €{expenses.totalBy.partner1.toFixed(2)}</div>
                        <div>Partner 2: €{expenses.totalBy.partner2.toFixed(2)}</div>
                      </div>
                  )}
                </div>
              </div>

              {/* Bestätigungen */}
              {!isFuture && (
                  <div>
                    <h4 className="text-base font-medium text-gray-700 mb-2">Bestätigungsstatus</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <span>Partner 1</span>
                        {month.user1Confirmed ? <UserCheck className="text-green-500" /> : <UserX className="text-gray-400" />}
                      </div>
                      <div className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <span>Partner 2</span>
                        {month.user2Confirmed ? <UserCheck className="text-green-500" /> : <UserX className="text-gray-400" />}
                      </div>
                    </div>
                  </div>
              )}

              {/* Ausgleich */}
              {(isPending || isCompleted) && (
                  <div>
                    <h4 className="text-base font-medium text-gray-700 mb-2">Ausgleichszahlung</h4>
                    <div className="p-2 rounded bg-blue-50 border border-blue-50 shadow-sm text-center">
                      <div className="flex justify-center items-center">
                  <span className="text-sm text-blue-600 font-medium">
                    {expenses.totalBy.partner1 > expenses.totalBy.partner2 ? "Partner 2" : "Partner 1"}
                  </span>
                        <ArrowRight className="mx-2 h-3 w-3 text-blue-600" />
                        <span className="text-sm text-blue-600 font-medium">
                    {expenses.totalBy.partner1 > expenses.totalBy.partner2 ? "Partner 1" : "Partner 2"}
                  </span>
                      </div>
                      <div className="text-lg font-bold text-black mt-1">
                        €{Math.abs(expenses.totalBy.partner1 - expenses.totalBy.partner2).toFixed(2)}
                      </div>
                    </div>
                  </div>
              )}

              {/* Hinweis */}
              {needsClarification && month.clarificationReactionsList?.length > 0 && (
                  <div className="bg-amber-100 text-amber-700 p-2 rounded text-sm">
                    Dieser Monat hat offene Klärungspunkte.
                  </div>
              )}
              {/* Zukunfts-Hinweis */}
              {isFuture && (
                  <div className="mt-2 text-xs bg-gray-100 text-gray-500 p-2 rounded">
                    Dieser Monat ist noch nicht verfügbar. Ausgaben können erst nach Monatsende bearbeitet werden.
                  </div>
              )}

              {/* Abgeschlossen-Hinweis */}
              {isCompleted && (
                  <div className="mt-2 text-xs bg-green-100 text-green-700 p-2 rounded">
                    Dieser Monat ist vollständig abgeschlossen und von beiden Partnern bestätigt.
                  </div>
              )}
            </div>
        )}
      </div>
  )
}
