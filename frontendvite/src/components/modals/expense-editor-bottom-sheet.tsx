"use client"
import { iconMap } from "@/lib/icon-map"
import { useState, useEffect, useRef } from "react"
import {
  X, Calendar, Check, User, Users, Baby, ShoppingCart,
  ChevronDown, HelpCircle, Euro, Percent, Star,Repeat
} from "lucide-react"
import { ToggleSwitch } from "@/components/ui/toggle-switch"
import { IconSelector } from "./icon-selector"
import { DistributionModal, type Participant } from "./distribution-modal"

export interface Expense {
  id?: string | null
  name: string
  amount: string
  date: string
  category: string
  icon: any
  isPersonal: boolean
  isChild: boolean
  isRecurring: boolean
  isBalanced?: boolean
  distribution?: Participant[]
}

export interface ExpenseEditorBottomSheetProps {
  isOpen: boolean
  onClose: () => void
  expense: Expense
  onSave: (expense: Expense) => void
  availableIcons?: Array<{ icon: any; name: string; defaultLabel: string }>
}

function formatDate(dateInput?: string | null): string {
  if (!dateInput) return new Date().toISOString().split("T")[0]
  const date = new Date(dateInput)
  return date.toISOString().split("T")[0]
}

function getDefaultDistribution(isChild: boolean): Participant[] {
  return isChild
      ? [
        { id: "user1", name: "Partner 1", percentage: 33.3, locked: false, amount: 0 },
        { id: "user2", name: "Partner 2", percentage: 33.3, locked: false, amount: 0 },
        { id: "user3", name: "Kind", percentage: 33.4, locked: false, amount: 0 },
      ]
      : [
        { id: "user1", name: "Partner 1", percentage: 50, locked: false, amount: 0 },
        { id: "user2", name: "Partner 2", percentage: 50, locked: false, amount: 0 },
      ]
}

const defaultExpense: Expense = {
  id: null,
  name: "",
  amount: "",
  date: formatDate(),
  category: "",
  icon: ShoppingCart,
  isPersonal: true,
  isChild: false,
  isRecurring: false,
  isBalanced: false,
}

export function ExpenseEditorBottomSheet({
                                           isOpen,
                                           onClose,
                                           expense,
                                           onSave,
                                           availableIcons = [],
                                         }: ExpenseEditorBottomSheetProps) {
  const [showIconSelector, setShowIconSelector] = useState(false)
  const [selectedIcon, setSelectedIcon] = useState(expense?.icon || ShoppingCart)
  const [editingExpense, setEditingExpense] = useState<Expense>(() => ({
    ...defaultExpense,
    ...expense,
    date: formatDate(expense?.date),
    isBalanced: expense?.isBalanced ?? false,
  }))

  const [showDistributionModal, setShowDistributionModal] = useState(false)
  const [distribution, setDistribution] = useState<Participant[]>([])
  const sideSheetRef = useRef<HTMLDivElement>(null)

  const [animation, setAnimation] = useState<"entering" | "entered" | "exiting" | "exited">(
      isOpen ? "entering" : "exited"
  )

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
          !showIconSelector &&
          !showDistributionModal &&
          sideSheetRef.current &&
          !sideSheetRef.current.contains(event.target as Node) &&
          animation === "entered"
      ) {
        handleClose()
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen, animation, showIconSelector, showDistributionModal])

  useEffect(() => {
    let timeout: NodeJS.Timeout

    if (isOpen && animation === "entering") {
      timeout = setTimeout(() => setAnimation("entered"), 10)
    } else if (!isOpen && animation === "exiting") {
      timeout = setTimeout(() => setAnimation("exited"), 300)
    }

    return () => clearTimeout(timeout)
  }, [isOpen, animation])

  useEffect(() => {
    if (isOpen) {
      setAnimation("entering")
    } else if (animation !== "exited" && animation !== "exiting") {
      setAnimation("exiting")
    }
  }, [isOpen])

  useEffect(() => {
    if (expense && isOpen) {
      const updatedExpense: Expense = {
        ...defaultExpense,
        ...expense,
        date: formatDate(expense.date),
        isBalanced: expense.isBalanced ?? false,
      }

      setEditingExpense(updatedExpense)

      // ✅ Icon korrekt über Kategorie bestimmen
      const selectedFromMap = iconMap[expense.category] || HelpCircle
      setSelectedIcon(selectedFromMap)

      if (!updatedExpense.isPersonal) {
        if (updatedExpense.distribution) {
          const updatedDistribution = updatedExpense.distribution.map((p) => ({
            ...p,
            locked: p.locked || false,
            amount: p.amount || (p.percentage / 100) * Number.parseFloat(updatedExpense.amount || "0"),
          }))
          setDistribution(updatedDistribution)
        } else {
          setDistribution(getDefaultDistribution(updatedExpense.isChild))
        }
      }
    }
  }, [expense, isOpen])


  useEffect(() => {
    if (!editingExpense.isPersonal && distribution.length === 0) {
      setDistribution(getDefaultDistribution(editingExpense.isChild))
    }
  }, [editingExpense.isPersonal, editingExpense.isChild])

  if (animation === "exited" && !isOpen) return null

  const selectedIconComponent =
      availableIcons.find((icon) => icon.icon === selectedIcon) || {
        icon: HelpCircle,
        name: "Sonstiges",
        defaultLabel: "Sonstiges",
      }

  const handleSave = () => {
    const selectedIconEntry = availableIcons.find(i => i.icon === selectedIcon)

    const expenseToSave: Expense = {
      ...editingExpense,
      category: selectedIconEntry?.name || "Sonstiges", // speichert z. B. "Essen"
    }


    if (!editingExpense.isPersonal) {
      expenseToSave.distribution = distribution
    }

    onSave(expenseToSave)
  }

  const handleClose = () => {
    setAnimation("exiting")
    setTimeout(() => {
      onClose()
    }, 300)
  }

  const handleToggleRecurring = () => {
    setEditingExpense({
      ...editingExpense,
      isRecurring: !editingExpense.isRecurring,
    })
  }

  const handleSelectIcon = (iconOption: any) => {
    const previousIcon = availableIcons.find((i) => i.icon === selectedIcon)
    setSelectedIcon(iconOption.icon)

    if (
        !editingExpense.name ||
        (previousIcon && editingExpense.name === previousIcon.defaultLabel)
    ) {
      setEditingExpense({
        ...editingExpense,
        name: iconOption.defaultLabel,
      })
    }

    setShowIconSelector(false)
  }

  const handleSaveDistribution = (participants: Participant[]) => {
    setDistribution(participants)
    setShowDistributionModal(false)
  }

  // return (...) folgt hier



  return (
      <>
        {/* Modal Overlay */}
        <div
            className={`fixed inset-0 z-40 bg-black transition-opacity duration-300 ${
                animation === "entering" || animation === "entered" ? "bg-opacity-50" : "bg-opacity-0"
            } ${animation === "exited" ? "pointer-events-none" : ""}`}
        >
          {/* Hauptfenster */}
          <div
              ref={sideSheetRef}
              className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[85%] sm:w-[75%] md:w-[65%] max-w-md bg-[#f8fafc] rounded-xl shadow-lg transform transition-all duration-300 ease-out z-50 ${
                  animation === "entering" || animation === "entered" ? "opacity-100" : "opacity-0"
              }`}
              style={{ maxHeight: "90vh", display: "flex", flexDirection: "column" }}
              onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-4 py-3 flex justify-between items-center bg-blue-600 text-white rounded-t-xl">
              <h3 className="text-xl font-semibold">
                {editingExpense.id ? "Ausgabe bearbeiten" : "Neue Ausgabe"}
              </h3>
              <button
                  onClick={handleClose}
                  className="p-2 rounded-full hover:bg-blue-500 active:bg-blue-700 transition-colors"
              >
                <X className="h-5 w-5 text-white" />
              </button>
            </div>

            {/* Inhalt */}
            <div className="p-4 space-y-4 flex-grow">
              {/* Art der Ausgabe */}
              <div>
                <div className="flex space-x-2">
                  <button
                      className={`flex-1 py-3 px-2 rounded-xl flex items-center justify-center text-base font-semibold ${
                          editingExpense.isPersonal && !editingExpense.isChild
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : "bg-gray-50 text-gray-700 border border-gray-200"
                      }`}
                      onClick={() => setEditingExpense({ ...editingExpense, isPersonal: true, isChild: false })}
                  >
                    <User className="h-5 w-5 mr-1.5" />
                  </button>
                  <button
                      className={`flex-1 py-3 px-2 rounded-xl flex items-center justify-center text-base font-semibold ${
                          !editingExpense.isPersonal && !editingExpense.isChild
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : "bg-gray-50 text-gray-700 border border-gray-200"
                      }`}
                      onClick={() => setEditingExpense({ ...editingExpense, isPersonal: false, isChild: false })}
                  >
                    <Users className="h-5 w-5 mr-1.5" />
                  </button>
                  <button
                      className={`flex-1 py-3 px-2 rounded-xl flex items-center justify-center text-base font-semibold ${
                          editingExpense.isChild
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : "bg-gray-50 text-gray-700 border border-gray-200"
                      }`}
                      onClick={() => setEditingExpense({ ...editingExpense, isPersonal: false, isChild: true })}
                  >
                    <Baby className="h-5 w-5 mr-1.5" />
                  </button>
                </div>
              </div>

              {/* Verteilung */}
              {!editingExpense.isPersonal && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Verteilung</label>
                    <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setShowDistributionModal(true)
                        }}
                        className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors border border-gray-200"
                    >
                      <div className="flex items-center">
                        <div className="bg-blue-50 p-2 rounded-lg mr-3">
                          <Percent className="h-4 w-4 text-blue-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-700">Gleichmäßig</span>
                        <Star className="h-4 w-4 text-yellow-300 ml-2" />
                      </div>
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    </button>
                  </div>
              )}

              {/* Symbol + Häufigkeit + Ausgeglichen */}
              <div className="grid grid-cols-3 gap-4">
                {/* Symbol */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Symbol</label>
                  <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowIconSelector(true)
                      }}
                      className="w-full h-[64px] flex items-center justify-center p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors border border-gray-200"
                  >
                    <div className="bg-white p-2 rounded-lg shadow-sm">
                      <selectedIconComponent.icon className="h-5 w-5 text-blue-600" />
                    </div>
                  </button>
                </div>

                {/* Häufigkeit (als Icon-Toggle) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Häufigkeit</label>
                  <button
                      onClick={() =>
                          setEditingExpense({
                            ...editingExpense,
                            isRecurring: !editingExpense.isRecurring,
                          })
                      }
                      className={`w-full h-[64px] flex items-center justify-center p-3 rounded-xl border transition-colors ${
                          editingExpense.isRecurring
                              ? "bg-blue-50 border-blue-200"
                              : "bg-gray-50 border-gray-200"
                      }`}
                  >
                    <Repeat
                        className={`h-5 w-5 ${
                            editingExpense.isRecurring ? "text-blue-600" : "text-gray-400"
                        }`}
                    />
                  </button>
                </div>

                {/* Ausgeglichen (als Icon-Toggle) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ausgeglichen</label>
                  <button
                      onClick={() =>
                          setEditingExpense({
                            ...editingExpense,
                            isBalanced: !editingExpense.isBalanced,
                          })
                      }
                      className={`w-full h-[64px] flex items-center justify-center p-3 rounded-xl border transition-colors ${
                          editingExpense.isBalanced
                              ? "bg-blue-50 border-blue-200"
                              : "bg-gray-50 border-gray-200"
                      }`}
                  >
                    <Check
                        className={`h-5 w-5 ${
                            editingExpense.isBalanced ? "text-blue-600" : "text-gray-400"
                        }`}
                    />
                  </button>
                </div>
              </div>


              {/* Name */}
              <div>
                <label htmlFor="expense-name" className="block text-sm font-medium text-gray-700 mb-2">
                  Bezeichnung
                </label>
                <input
                    id="expense-name"
                    type="text"
                    className="w-full p-3 text-base border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                    value={editingExpense.name || ""}
                    onChange={(e) => setEditingExpense({ ...editingExpense, name: e.target.value })}
                    placeholder="z.B. Supermarkt"
                />
              </div>

              {/* Betrag + Datum */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="expense-amount" className="block text-sm font-medium text-gray-700 mb-2">
                    Betrag
                  </label>
                  <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                  <Euro className="h-4 w-4" />
                </span>
                    <input
                        id="expense-amount"
                        type="number"
                        step="0.01"
                        inputMode="decimal"
                        className="w-full p-3 pl-10 text-base border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                        value={editingExpense.amount}
                        onChange={(e) => setEditingExpense({ ...editingExpense, amount: e.target.value })}
                        placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="expense-date" className="block text-sm font-medium text-gray-700 mb-2">
                    Datum
                  </label>
                  <input
                      id="expense-date"
                      type="date"
                      className="w-full p-3 text-base border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                      value={editingExpense.date}
                      onChange={(e) =>
                          setEditingExpense({
                            ...editingExpense,
                            date: e.target.value,
                          })
                      }
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-4 pt-4 pb-4 bg-[#f8fafc] rounded-b-xl border-t border-gray-100 flex space-x-3">
              <button
                  className="flex-1 py-2.5 text-sm font-medium text-blue-600 bg-white rounded-xl active:bg-gray-100 transition-colors"
                  onClick={handleClose}
              >
                Abbrechen
              </button>
              <button
                  className="flex-1 py-2.5 text-sm font-medium text-white bg-blue-500 rounded-xl active:bg-blue-700 transition-colors flex items-center justify-center"
                  onClick={handleSave}
              >
                <Check className="h-4 w-4 mr-1" />
                Speichern
              </button>
            </div>
          </div>
        </div>

        {/* Icon Selector Modal */}
        {isOpen && (
            <IconSelector
                isOpen={showIconSelector}
                onClose={() => setShowIconSelector(false)}
                icons={availableIcons}
                selectedIcon={selectedIcon}
                onSelectIcon={handleSelectIcon}
            />
        )}

        {/* Distribution Modal */}
        <DistributionModal
            isOpen={showDistributionModal}
            onClose={() => setShowDistributionModal(false)}
            participants={distribution}
            onSave={handleSaveDistribution}
            isChildExpense={editingExpense.isChild}
            expenseAmount={editingExpense.amount || "0"}
        />
      </>
  )
}
