"use client"

import { useState } from "react"
import { X, Check } from "lucide-react"

// Define types for our component props
export interface BudgetEditorModalProps {
  isOpen: boolean
  onClose: () => void
  currentBudget: number
  onSave: (newBudget: number) => void
  title?: string
}

export default function BudgetEditorModal({
  isOpen,
  onClose,
  currentBudget,
  onSave,
  title = "Budget bearbeiten",
}: BudgetEditorModalProps) {
  const [budgetValue, setBudgetValue] = useState(currentBudget.toString())

  if (!isOpen) return null

  const handleSave = () => {
    const newBudget = Number.parseFloat(budgetValue)
    if (!isNaN(newBudget) && newBudget >= 0) {
      onSave(newBudget)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-md w-full max-w-[16.8rem] overflow-hidden">
        {/* Modal Header */}
        <div className="bg-blue-600 text-white px-3 py-2 flex justify-between items-center">
          <h3 className="font-medium text-base">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-full active:bg-blue-500 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4">
          <label htmlFor="budget-amount" className="block text-sm font-medium text-gray-700 mb-2">
            Monatliches Budget
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-2 text-gray-500">€</span>
            <input
              id="budget-amount"
              type="text"
              className="w-full p-2 pl-6 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600"
              value={budgetValue}
              onChange={(e) => setBudgetValue(e.target.value)}
              placeholder="0.00"
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-gray-50 px-3 py-2 flex justify-end">
          <button
            className="mr-2 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 active:bg-gray-200 focus:outline-none"
            onClick={onClose}
          >
            Abbrechen
          </button>
          <button
            className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 active:bg-blue-700 focus:outline-none flex items-center"
            onClick={handleSave}
          >
            <Check className="h-3 w-3 mr-1" />
            Speichern
          </button>
        </div>
      </div>
    </div>
  )
}

