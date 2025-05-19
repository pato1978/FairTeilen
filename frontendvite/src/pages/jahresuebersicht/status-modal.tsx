"use client"

import { X, UserCheck, UserX, AlertCircle } from "lucide-react"

interface StatusModalProps {
  isOpen: boolean
  onClose: () => void
  month: {
    id: number
    name: string
    status: "completed" | "pending" | "needs-clarification" | "future"
    confirmations: {
      user1: boolean
      user2: boolean
    }
    message?: string
  }
}

export function StatusModal({ isOpen, onClose, month }: StatusModalProps) {
  if (!isOpen) return null

  // Status-bezogene Styling und Icons
  const getStatusInfo = () => {
    switch (month.status) {
      case "pending":
        return {
          icon: <AlertCircle className="h-5 w-5 text-blue-500" />,
          text: "Nicht alle bestätigt",
          bgColor: "bg-blue-600",
          textColor: "text-white",
        }
      case "needs-clarification":
        return {
          icon: <AlertCircle className="h-5 w-5 text-amber-500" />,
          text: "Klärungsbedarf",
          bgColor: "bg-amber-500",
          textColor: "text-white",
        }
      default:
        return {
          icon: <AlertCircle className="h-5 w-5 text-gray-500" />,
          text: month.name,
          bgColor: "bg-blue-600",
          textColor: "text-white",
        }
    }
  }

  const statusInfo = getStatusInfo()

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-md w-full max-w-sm overflow-hidden">
        {/* Modal Header */}
        <div className={`${statusInfo.bgColor} ${statusInfo.textColor} px-3 py-2 flex justify-between items-center`}>
          <h3 className="font-medium text-base flex items-center">
            {statusInfo.icon}
            <span className="ml-2">
              {month.name} - {statusInfo.text}
            </span>
          </h3>
          <button onClick={onClose} className="p-1 rounded-full active:bg-blue-500 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4">
          <h4 className="font-medium mb-3">Bestätigungsstatus</h4>

          <div className="space-y-3">
            <div className="flex justify-between items-center p-2 rounded-md bg-gray-50">
              <div className="flex items-center">
                <span className="font-medium">Partner 1</span>
              </div>
              {month.confirmations.user1 ? (
                <div className="flex items-center text-green-600">
                  <UserCheck className="h-4 w-4 mr-1" />
                  <span className="text-sm">Bestätigt</span>
                </div>
              ) : (
                <div className="flex items-center text-gray-500">
                  <UserX className="h-4 w-4 mr-1" />
                  <span className="text-sm">Ausstehend</span>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center p-2 rounded-md bg-gray-50">
              <div className="flex items-center">
                <span className="font-medium">Partner 2</span>
              </div>
              {month.confirmations.user2 ? (
                <div className="flex items-center text-green-600">
                  <UserCheck className="h-4 w-4 mr-1" />
                  <span className="text-sm">Bestätigt</span>
                </div>
              ) : (
                <div className="flex items-center text-gray-500">
                  <UserX className="h-4 w-4 mr-1" />
                  <span className="text-sm">Ausstehend</span>
                </div>
              )}
            </div>
          </div>

          {month.status === "needs-clarification" && month.message && (
            <div className="mt-4 p-3 bg-amber-50 text-amber-700 rounded-md border border-amber-200">
              <h5 className="font-medium mb-1 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                Hinweis
              </h5>
              <p className="text-sm">{month.message}</p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-gray-50 px-4 py-3 flex justify-end">
          <button
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none active:bg-blue-800"
            onClick={onClose}
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  )
}
