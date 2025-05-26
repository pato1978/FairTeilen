"use client"

import { Star } from "lucide-react"
import { useTooltip } from "@/lib/hooks/use-tooltip"

interface StarTooltipProps {
  text: string
  position?: "top" | "right" | "bottom" | "left"
  isGlobal?: boolean
  className?: string
}

export function StarTooltip({ text, position = "top", isGlobal = true, className = "" }: StarTooltipProps) {
  const { isVisible, showTooltip } = useTooltip({ isGlobal })

  // Position styles for the tooltip
  const positionStyles = {
    top: "bottom-full right-0 mb-2",
    right: "left-full top-0 ml-2",
    bottom: "top-full right-0 mt-2",
    left: "right-full top-0 mr-2",
  }

  // Arrow position styles
  const arrowStyles = {
    top: "-bottom-2 right-3 rotate-45",
    right: "top-2 -left-2 rotate-45",
    bottom: "-top-2 right-3 rotate-45",
    left: "top-2 -right-2 rotate-45",
  }

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        onClick={(e) => {
          e.stopPropagation()
          showTooltip()
        }}
        className="p-1 rounded-full hover:bg-blue-50 transition-colors"
      >
        <Star className="h-4 w-4 text-yellow-300" />
      </button>

      {isVisible && (
        <div
          className={`absolute ${positionStyles[position]} w-48 p-2 bg-white text-gray-800 rounded-lg shadow-lg text-xs z-20`}
        >
          <p>{text}</p>
          <div className={`absolute ${arrowStyles[position]} w-3 h-3 bg-white transform`}></div>
        </div>
      )}
    </div>
  )
}
