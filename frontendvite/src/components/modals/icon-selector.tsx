"use client"

import { useState, useEffect, useRef } from "react"
import { X, Check } from "lucide-react"

interface IconSelectorProps {
  isOpen: boolean
  onClose: () => void
  icons: Array<{ icon: any; name: string; defaultLabel: string }>
  selectedIcon: any
  onSelectIcon: (iconOption: any) => void
}

export function IconSelector({ isOpen, onClose, icons, selectedIcon, onSelectIcon }: IconSelectorProps) {
  // Ref for the side sheet
  const sideSheetRef = useRef<HTMLDivElement>(null)

  // Animation state
  const [animation, setAnimation] = useState<"entering" | "entered" | "exiting" | "exited">(
    isOpen ? "entering" : "exited",
  )

  // Handle outside clicks
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sideSheetRef.current && !sideSheetRef.current.contains(event.target as Node) && animation === "entered") {
        handleClose()
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen, animation])

  // Handle animation states
  useEffect(() => {
    let timeout: NodeJS.Timeout

    if (isOpen && animation === "entering") {
      // Start enter animation
      timeout = setTimeout(() => setAnimation("entered"), 10)
    } else if (!isOpen && animation === "exiting") {
      // Start exit animation
      timeout = setTimeout(() => setAnimation("exited"), 300)
    }

    return () => clearTimeout(timeout)
  }, [isOpen, animation])

  // Update animation state when isOpen changes
  useEffect(() => {
    if (isOpen) {
      setAnimation("entering")
    } else if (animation !== "exited" && animation !== "exiting") {
      setAnimation("exiting")
    }
  }, [isOpen])

  // Don't render anything if not open and animation is exited
  if (animation === "exited" && !isOpen) return null

  const handleClose = () => {
    setAnimation("exiting")
    setTimeout(() => {
      onClose()
    }, 300)
  }

  return (
    <div
      className={`fixed inset-0 z-[100] bg-black transition-opacity duration-300 ${
        animation === "entering" || animation === "entered" ? "bg-opacity-50" : "bg-opacity-0"
      } ${animation === "exited" ? "pointer-events-none" : ""}`}
      onClick={(e) => {
        e.stopPropagation() // Verhindert Event-Bubbling zum darunter liegenden Expense-Modal
        handleClose()
      }}
    >
      <div
        ref={sideSheetRef}
        className={`fixed top-1/2 left-1/2 -translate-y-1/2 h-auto max-h-[85%] w-[85%] sm:w-[75%] md:w-[65%] max-w-md bg-[#f8fafc] rounded-xl shadow-lg transform transition-all duration-300 ease-out z-[101] ${
          animation === "entering" || animation === "entered"
            ? "translate-x-[-50%] opacity-100"
            : "translate-x-[50%] opacity-0"
        }`}
        onClick={(e) => e.stopPropagation()} // Verhindert, dass Klicks im Modal zum Hintergrund durchgereicht werden
      >
        {/* Modern Header ohne blauen Balken */}
        <div className="sticky top-0 px-4 py-3 flex justify-between items-center z-10 border-b border-gray-100">
          <h3 className="font-medium text-lg text-gray-800">Icon auswählen</h3>
          <button
            onClick={(e) => {
              e.stopPropagation() // Verhindert Event-Bubbling
              handleClose()
            }}
            className="p-2 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 pb-safe overflow-y-auto max-h-[400px]">
          <div className="grid grid-cols-4 gap-2">
            {icons.map((iconOption, index) => (
              <button
                key={index}
                className={`p-2 rounded-lg flex flex-col items-center justify-center transition-all ${
                  selectedIcon === iconOption.icon
                    ? "bg-blue-50 border border-blue-200 shadow-sm"
                    : "bg-gray-50 border border-gray-200 hover:bg-gray-100"
                }`}
                onClick={(e) => {
                  e.stopPropagation() // Verhindert Event-Bubbling
                  onSelectIcon(iconOption)
                }}
              >
                <div className="relative mb-1">
                  <iconOption.icon className="h-5 w-5 text-blue-600" />
                  {selectedIcon === iconOption.icon && (
                    <div className="absolute -top-1 -right-1 bg-blue-600 rounded-full p-0.5">
                      <Check className="h-2 w-2 text-white" />
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-gray-700 truncate w-full text-center">{iconOption.name}</span>
              </button>
            ))}
          </div>

          <div className="mt-4 flex justify-end">
            <button
              className="px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg active:bg-blue-700 transition-colors"
              onClick={(e) => {
                e.stopPropagation() // Verhindert Event-Bubbling
                handleClose()
              }}
            >
              Schließen
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
