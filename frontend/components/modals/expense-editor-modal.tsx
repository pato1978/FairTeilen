"use client"

import { useState, useEffect } from "react"
import {
  X,
  Calendar,
  Check,
  User,
  Users,
  Baby,
  Shirt,
  GraduationCap,
  Palette,
  Gamepad2,
  Stethoscope,
  Bed,
  Car,
  Cake,
  Wallet,
  HelpCircle, Utensils,

} from "lucide-react"
import { ToggleSwitch } from "@/components/ui/toggle-switch"

// Define types for our component props
export interface ExpenseEditorModalProps {
  isOpen: boolean
  onClose: () => void
  expense: any
  onSave: (expense: any) => void
  availableIcons?: Array<{ icon: any; name: string; defaultLabel: string }>
}

export default function ExpenseEditorModal({
  isOpen,
  onClose,
  expense,
  onSave,
  availableIcons = [
    { icon: Shirt, name: "Kleidung", defaultLabel: "Kleidung" },
    { icon: GraduationCap, name: "Schule", defaultLabel: "Schule" },
    { icon: Utensils, name: "Essen", defaultLabel: "Essen" },
    { icon: Palette, name: "Hobbys", defaultLabel: "Hobbys" },
    { icon: Gamepad2, name: "Spielzeug", defaultLabel: "Spielzeug" },
    { icon: Stethoscope, name: "Gesundheit", defaultLabel: "Gesundheit" },
    { icon: Bed, name: "Kinderzimmer", defaultLabel: "Kinderzimmer" },
    { icon: Car, name: "Transport", defaultLabel: "Transport" },
    { icon: Cake, name: "Geburtstage", defaultLabel: "Geburtstage" },
    { icon: Users, name: "Betreuung", defaultLabel: "Betreuung" },
    { icon: Wallet, name: "Finanzen", defaultLabel: "Finanzen" },
    { icon: HelpCircle, name: "Sonstiges", defaultLabel: "Sonstiges" },
  ],
}: ExpenseEditorModalProps) {
  const [showIconSelector, setShowIconSelector] = useState(false)
  const [selectedIcon, setSelectedIcon] = useState(expense?.icon || HelpCircle)
  const [editingExpense, setEditingExpense] = useState({
    id: null,
    name: "",
    amount: 0,
    date: new Date().toISOString().split("T")[0],
    category: "",
    icon: HelpCircle,
    isPersonal: true,
    isChild: false,
    isRecurring: false,
    ...expense,
  })

  // Update local state when expense prop changes
  useEffect(() => {
    if (expense) {
      setEditingExpense({
        id: null,
        name: "",
        amount: 0,
        date: new Date().toISOString().split("T")[0],
        category: "",
        icon: HelpCircle,
        isPersonal: true,
        isChild: false,
        isRecurring: false,
        ...expense,
      })
      setSelectedIcon(expense.icon || HelpCircle)
    }
  }, [expense, isOpen])

  if (!isOpen) return null

  const selectedIconComponent = availableIcons.find((icon) => icon.icon === selectedIcon) || {
    icon: HelpCircle,
    name: "Sonstiges",
    defaultLabel: "Sonstiges",
  }

  const handleSave = () => {
    onSave({ ...editingExpense, icon: selectedIcon })
  }

  const handleToggleRecurring = () => {
    setEditingExpense({
      ...editingExpense,
      isRecurring: !editingExpense.isRecurring,
    })
  }

  const handleSelectIcon = (iconOption) => {
    setSelectedIcon(iconOption.icon)

    setEditingExpense((prev) => {
      const wasDefaultName = availableIcons.find((i) => i.icon === selectedIcon)?.defaultLabel === prev.name
      const shouldUpdateName = !prev.name || wasDefaultName

      return {
        ...prev,
        category: iconOption.defaultLabel, // 🟦 Immer Kategorie aktualisieren!
        name: shouldUpdateName ? iconOption.defaultLabel : prev.name, // 🟨 Nur Name überschreiben, wenn er leer oder Standard ist
      }
    })

    setShowIconSelector(false)
  }


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-md w-full max-w-sm overflow-hidden">
        {/* Modal Header */}
        <div className="bg-blue-600 text-white px-3 py-2 flex justify-between items-center">
          <h3 className="font-medium text-base">{editingExpense.id ? "Ausgabe bearbeiten" : "Neue Ausgabe"}</h3>
          <button onClick={onClose} className="p-1 rounded-full active:bg-blue-500 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-3">
          {/* Art der Ausgabe */}
          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-700 mb-1">Art der Ausgabe</label>
            <div className="flex space-x-1">
              <button
                className={`flex-1 py-1.5 px-1 rounded-md flex items-center justify-center text-xs ${
                  editingExpense.isPersonal && !editingExpense.isChild
                    ? "bg-blue-100 text-blue-700 border border-blue-300"
                    : "bg-gray-100 text-gray-700 border border-gray-200"
                }`}
                onClick={() => setEditingExpense({ ...editingExpense, isPersonal: true, isChild: false })}
              >
                <User className="h-3 w-3 mr-1" />
                <span>Persönlich</span>
              </button>
              <button
                className={`flex-1 py-1.5 px-1 rounded-md flex items-center justify-center text-xs ${
                  !editingExpense.isPersonal && !editingExpense.isChild
                    ? "bg-blue-100 text-blue-700 border border-blue-300"
                    : "bg-gray-100 text-gray-700 border border-gray-200"
                }`}
                onClick={() => setEditingExpense({ ...editingExpense, isPersonal: false, isChild: false })}
              >
                <Users className="h-3 w-3 mr-1" />
                <span>Gemeinsam</span>
              </button>
              <button
                className={`flex-1 py-1.5 px-1 rounded-md flex items-center justify-center text-xs ${
                  editingExpense.isChild
                    ? "bg-blue-100 text-blue-700 border border-blue-300"
                    : "bg-gray-100 text-gray-700 border border-gray-200"
                }`}
                onClick={() => setEditingExpense({ ...editingExpense, isPersonal: false, isChild: true })}
              >
                <Baby className="h-3 w-3 mr-1" />
                <span>Kind</span>
              </button>
            </div>
          </div>

          {/* Zwei Spalten für Icon und Häufigkeit */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            {/* Icon-Auswahl */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Symbol</label>
              <button
                onClick={() => setShowIconSelector(true)}
                className="w-full flex items-center justify-center p-2 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors border border-blue-200"
              >
                <selectedIconComponent.icon className="h-5 w-5 text-blue-600" />
                <span className="ml-2 text-xs text-blue-600">{selectedIconComponent.name}</span>
              </button>
            </div>

            {/* Häufigkeit */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Häufigkeit</label>
              <div className="h-full flex items-center">
                <ToggleSwitch isChecked={editingExpense.isRecurring} onChange={handleToggleRecurring} />
              </div>
            </div>
          </div>

          {/* Name Input */}
          <div className="mb-3">
            <label htmlFor="expense-name" className="block text-xs font-medium text-gray-700 mb-1">
              Bezeichnung
            </label>
            <input
              id="expense-name"
              type="text"
              className="w-full p-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600"
              value={editingExpense.name || ""}
              onChange={(e) => setEditingExpense({ ...editingExpense, name: e.target.value })}
              placeholder="z.B. Supermarkt"
            />
          </div>

          {/* Zwei Spalten für Betrag und Datum */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            {/* Amount Input */}
            <div>
              <label htmlFor="expense-amount" className="block text-xs font-medium text-gray-700 mb-1">
                Betrag
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-2 text-gray-500">€</span>
                <input
                    id="expense-amount"
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    className="w-full p-2 pl-6 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600"
                    value={editingExpense.amount}
                    onChange={(e) =>
                        setEditingExpense({
                          ...editingExpense,
                          amount: parseFloat(e.target.value) || 0,
                        })
                    }
                    placeholder="0.00"
                />

              </div>
            </div>

            {/* Date Picker */}
            <div>
              <label htmlFor="expense-date" className="block text-xs font-medium text-gray-700 mb-1">
                Datum
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-2 text-gray-500">
                  <Calendar className="h-3 w-3" />
                </span>
                <input
                  id="expense-date"
                  type="date"
                  className="w-full p-2 pl-6 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600"
                  value={editingExpense.date}
                  onChange={(e) => setEditingExpense({ ...editingExpense, date: e.target.value })}
                />
              </div>
            </div>
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

      {/* Icon Selector Modal */}
      {showIconSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-md w-64 p-3">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-sm font-medium">Icon auswählen</h4>
              <button onClick={() => setShowIconSelector(false)} className="p-1 rounded-full active:bg-gray-100">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {availableIcons.map((iconOption, index) => (
                <button
                  key={index}
                  className={`p-2 rounded-lg flex flex-col items-center justify-center ${
                    selectedIcon === iconOption.icon
                      ? "bg-blue-100 border border-blue-500"
                      : "bg-gray-100 border border-transparent"
                  }`}
                  onClick={() => handleSelectIcon(iconOption)}
                >
                  <iconOption.icon className="h-5 w-5 text-blue-600 mb-1" />
                  <span className="text-xs text-gray-700">{iconOption.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
