"use client"

import { useState, useEffect } from "react"

// Add TypeScript declaration for window property
declare global {
  interface Window {
    tooltipEventInProgress?: boolean
  }
}

interface UseTooltipOptions {
  duration?: number
  isGlobal?: boolean
}

export function useTooltip({ duration = 2000, isGlobal = false }: UseTooltipOptions = {}) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Listen for the global event if this tooltip should respond to it
    if (isGlobal) {
      const handleGlobalTooltipEvent = () => {
        setIsVisible(true)

        // Auto-hide after duration
        setTimeout(() => {
          setIsVisible(false)
        }, duration)
      }

      window.addEventListener("showAllStarTooltips", handleGlobalTooltipEvent)

      return () => {
        window.removeEventListener("showAllStarTooltips", handleGlobalTooltipEvent)
      }
    }
  }, [isGlobal, duration])

  const showTooltip = () => {
    setIsVisible(true)

    // Auto-hide after duration
    setTimeout(() => {
      setIsVisible(false)
    }, duration)
  }

  const hideTooltip = () => {
    setIsVisible(false)
  }

  // For footer star - shows this tooltip and broadcasts to all others
  const showAllTooltips = () => {
    // Show this tooltip
    setIsVisible(true)

    // Only broadcast if this is the initiator (prevents infinite recursion)
    if (!window.tooltipEventInProgress) {
      window.tooltipEventInProgress = true

      // Broadcast to all other tooltips
      const event = new CustomEvent("showAllStarTooltips")
      window.dispatchEvent(event)

      // Reset the flag after a short delay
      setTimeout(() => {
        window.tooltipEventInProgress = false
      }, 100)
    }

    // Auto-hide after duration
    setTimeout(() => {
      setIsVisible(false)
    }, duration)
  }

  return {
    isVisible,
    showTooltip,
    hideTooltip,
    showAllTooltips,
  }
}
