"use client"

import { useState } from "react"
import { Plus } from "lucide-react"

// Types for our button props
interface EnhancedPlusButtonProps {
  variant: "outline"
  onClick: () => void
}

export function EnhancedPlusButton({ variant, onClick }: EnhancedPlusButtonProps) {
  const [isPressed, setIsPressed] = useState(false)

  // Vereinfachte Event-Handler
  const handleMouseLeave = () => setIsPressed(false)
  const handleMouseDown = () => setIsPressed(true)
  const handleMouseUp = () => setIsPressed(false)

  const handleClick = () => {
    onClick()
    // Reset states after click
    setTimeout(() => {
      setIsPressed(false)
    }, 200)
  }

  return (
    <button
      className={`relative flex items-center justify-center w-[4.2rem] h-[4.2rem] rounded-full bg-white border-4 border-blue-600 text-blue-600 transition-all duration-300 ring-2 ring-blue-800 ${
        isPressed ? "shadow-inner scale-95" : "shadow-md"
      }`}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onClick={handleClick}
      aria-label="Neue Ausgabe hinzufügen"
    >
      <Plus className="h-8 w-8 transition-all duration-300" />
    </button>
  )
}

