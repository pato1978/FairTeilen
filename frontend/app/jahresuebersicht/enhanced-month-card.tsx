"use client"

import type React from "react"
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
} from "lucide-react"
import { useTooltip } from "@/lib/hooks/use-tooltip"

interface MonthCardHeaderProps {
  month: {
    name: string
    status: "completed" | "pending" | "needs-clarification" | "future"
  }
  toggleExpand: (e: React.MouseEvent) => void
  statusInfo: {
    icon: React.ReactNode
    text: string
    statusBgColor: string
    textColor: string
  }
}

function MonthCardHeader({ month, toggleExpand, statusInfo }: MonthCardHeaderProps) {
  // Add this line to define the tooltip hook inside the component
  const { isVisible: showStarTooltip, showTooltip: displayStarTooltip } = useTooltip({ isGlobal: true })

  return (
    <div
      className="flex items-center justify-between p-3 border-b border-gray-100 cursor-pointer"
      onClick={toggleExpand}
    >
      <h3 className="font-semibold text-lg">{month.name}</h3>

      <div className="flex items-center">
        <div className={`flex items-center px-2 py-1 rounded-full ${statusInfo.statusBgColor}`}>
          {statusInfo.icon}
          <span className={`ml-1.5 text-xs ${statusInfo.textColor}`}>{statusInfo.text}</span>
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
            <div className="absolute top-0 right-6 w-48 p-2 bg-white text-gray-800 rounded-lg shadow-lg text-xs z-20">
              <p>Premium-Funktion: Detaillierte Monatsanalyse und Exportmöglichkeiten.</p>
              <div className="absolute top-2 -right-2 w-3 h-3 bg-white transform rotate-45"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

interface EnhancedMonthCardProps {
  month: {
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
  onClick: () => void
  onStatusClick: (e: React.MouseEvent) => void
}

export function EnhancedMonthCard({ month, onClick, onStatusClick }: EnhancedMonthCardProps) {
  const isCompleted = month.status === "completed"
  const isFuture = month.status === "future"
  const needsClarification = month.status === "needs-clarification"
  const isPending = month.status === "pending"
  const isClickable = !isCompleted && !isFuture

  // Neuer State für das Ausklappen/Einklappen
  const [isExpanded, setIsExpanded] = useState(false)

  // Funktion zum Umschalten des Expanded-Status
  const toggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation() // Verhindere, dass der Klick zum onClick-Handler der gesamten Karte weitergeleitet wird
    setIsExpanded(!isExpanded)
  }

  // Status-bezogene Styling und Icons
  const getStatusInfo = () => {
    switch (month.status) {
      case "completed":
        return {
          icon: <CheckCircle className="h-5 w-5 text-green-500" />,
          text: "Abgeschlossen",
          bgColor: "bg-white",
          borderColor: "border-gray-200",
          textColor: "text-green-600",
          statusBgColor: "bg-green-50",
        }
      case "pending":
        return {
          icon: <Clock className="h-5 w-5 text-amber-500" />,
          text: "Offen",
          bgColor: "bg-white",
          borderColor: "border-amber-200",
          textColor: "text-amber-600",
          statusBgColor: "bg-amber-50",
        }
      case "needs-clarification":
        return {
          icon: <AlertTriangle className="h-5 w-5 text-amber-500" />,
          text: "Klärungsbedarf",
          bgColor: "bg-white",
          borderColor: "border-amber-200",
          textColor: "text-amber-600",
          statusBgColor: "bg-amber-50",
        }
      case "future":
        return {
          icon: <Lock className="h-5 w-5 text-gray-400" />,
          text: "Nicht verfügbar",
          bgColor: "bg-white",
          borderColor: "border-gray-200",
          textColor: "text-gray-400",
          statusBgColor: "bg-gray-50",
        }
      default:
        return {
          icon: <Info className="h-5 w-5 text-gray-500" />,
          text: "Unbekannt",
          bgColor: "bg-white",
          borderColor: "border-gray-200",
          textColor: "text-gray-500",
          statusBgColor: "bg-gray-50",
        }
    }
  }

  const statusInfo = getStatusInfo()

  const handleMonthClick = (month: {
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
  }) => {
    // Nur expandieren/kollabieren, wenn der Monat nicht abgeschlossen oder zukünftig ist
    if (month.status !== "completed" && month.status !== "future") {
      setIsExpanded(!isExpanded)
    }
  }

  return (
    <div
      className={`${statusInfo.bgColor} rounded-lg shadow-sm border ${statusInfo.borderColor} overflow-hidden transition-colors ${isClickable ? "active:bg-gray-100 cursor-pointer" : ""}`}
      onClick={isClickable ? () => handleMonthClick(month) : undefined}
    >
      {/* Header mit Monat und Status */}
      <MonthCardHeader month={month} toggleExpand={toggleExpand} statusInfo={statusInfo} />

      {/* Inhalt */}
      {isExpanded && (
        <div className="p-3">
          {/* Ausgaben-Übersicht */}
          {month.expenses && (
            <div className="mb-3">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Ausgaben</h4>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div className="p-2 rounded text-center bg-blue-50 border border-blue-50 shadow-sm">
                  <div className="flex items-center justify-center mb-1">
                    <Users className="h-3 w-3 text-blue-600 mr-1" />
                    <span className="text-xs text-blue-600">Gemeinsam</span>
                  </div>
                  <span className="text-sm font-bold text-black">€{month.expenses.shared}</span>
                </div>

                <div className="p-2 rounded text-center bg-blue-50 border border-blue-50 shadow-sm">
                  <div className="flex items-center justify-center mb-1">
                    <Baby className="h-3 w-3 text-blue-600 mr-1" />
                    <span className="text-xs text-blue-600">Kind</span>
                  </div>
                  <span className="text-sm font-bold text-black">€{month.expenses.child}</span>
                </div>
              </div>

              <div className="bg-gray-50 p-2 rounded text-center">
                <span className="text-xs text-gray-600">Gesamtausgaben</span>
                <div className="text-base font-bold">€{month.expenses.total}</div>
              </div>
            </div>
          )}

          {/* Bestätigungsstatus */}
          {!isFuture && (
            <div className="mb-3">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Bestätigungsstatus</h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center justify-between bg-gray-50 p-2 rounded">
                  <div>
                    <span className="text-xs">Partner 1</span>
                    {month.expenses && (
                      <div className="text-xs text-gray-500 mt-0.5">€{(month.expenses.shared / 2).toFixed(2)}</div>
                    )}
                  </div>
                  <div className="bg-blue-100 rounded-full p-1.5 border border-blue-600">
                    {month.confirmations.user1 ? (
                      <UserCheck className="h-4 w-4 text-green-500" />
                    ) : (
                      <UserX className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between bg-gray-50 p-2 rounded">
                  <div>
                    <span className="text-xs">Partner 2</span>
                    {month.expenses && (
                      <div className="text-xs text-gray-500 mt-0.5">€{(month.expenses.shared / 2).toFixed(2)}</div>
                    )}
                  </div>
                  <div className="bg-blue-100 rounded-full p-1.5 border border-blue-600">
                    {month.confirmations.user2 ? (
                      <UserCheck className="h-4 w-4 text-green-500" />
                    ) : (
                      <UserX className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Ausgleichszahlung */}
          {(isPending || needsClarification) && month.balance !== undefined && (
            <div className="mb-3">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Ausgleichszahlung</h4>
              <div className={`p-2 rounded bg-blue-50 border border-blue-50 shadow-sm`}>
                <div className="flex items-center justify-center">
                  <span className="text-xs font-medium text-blue-600">
                    {month.balance > 0 ? "Partner 2" : "Partner 1"}
                  </span>
                  <ArrowRight className="h-3 w-3 mx-1 text-blue-600" />
                  <span className="text-xs font-medium text-blue-600">
                    {month.balance > 0 ? "Partner 1" : "Partner 2"}
                  </span>
                </div>
                <div className="text-center font-bold mt-1 text-black">€{Math.abs(month.balance).toFixed(2)}</div>
              </div>
            </div>
          )}

          {/* Klärungsbedarf-Nachricht */}
          {needsClarification && month.message && (
            <div className="mt-2 text-xs bg-amber-100 text-amber-700 p-2 rounded">
              <div className="font-medium mb-1">Hinweis:</div>
              {month.message}
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
