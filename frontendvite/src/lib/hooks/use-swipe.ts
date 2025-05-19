"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"

interface SwipeHandlers {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
}

interface SwipeState {
  translateX: number
  isDragging: boolean
  isTouched: boolean
  leftOpacity: number
  rightOpacity: number
}

interface SwipeProps {
  ref: React.RefObject<HTMLDivElement>
  touchProps: {
    onTouchStart: (e: React.TouchEvent) => void
    onTouchMove: (e: React.TouchEvent) => void
    onTouchEnd: () => void
    onMouseDown: (e: React.MouseEvent) => void
    onMouseMove: (e: React.MouseEvent) => void
    onMouseUp: () => void
    onMouseLeave: () => void
    onMouseEnter: () => void
  }
  style: {
    transform: string
    touchAction: string
  }
  state: SwipeState
}

export function useSwipe(leftThreshold = -80, rightThreshold = 80, handlers: SwipeHandlers = {}): SwipeProps {
  const [translateX, setTranslateX] = useState(0)
  const [startX, setStartX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [isTouched, setIsTouched] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Berechne Opacity für die Aktionen basierend auf der Swipe-Position
  const leftOpacity = Math.min(1, Math.abs(Math.min(translateX, 0)) / Math.abs(leftThreshold))
  const rightOpacity = Math.min(1, Math.max(translateX, 0) / rightThreshold)

  // Touch-Events für mobile Geräte
  const handleTouchStart = (e: React.TouchEvent) => {
    setStartX(e.touches[0].clientX)
    setIsDragging(true)
    setIsTouched(true)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return

    // Berechne die Verschiebung
    const currentX = e.touches[0].clientX
    const newTranslateX = currentX - startX

    // Erlaube Swipe in beide Richtungen
    setTranslateX(newTranslateX)
  }

  const handleTouchEnd = () => {
    finishSwipe()
    // Touch-Status nach kurzer Verzögerung zurücksetzen
    setTimeout(() => {
      setIsTouched(false)
    }, 150)
  }

  // Maus-Events für Desktop
  const handleMouseDown = (e: React.MouseEvent) => {
    setStartX(e.clientX)
    setIsDragging(true)
    setIsTouched(true)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return

    // Berechne die Verschiebung
    const currentX = e.clientX
    const newTranslateX = currentX - startX

    // Erlaube Swipe in beide Richtungen
    setTranslateX(newTranslateX)
  }

  const handleMouseUp = () => {
    finishSwipe()
    // Touch-Status nach kurzer Verzögerung zurücksetzen
    setTimeout(() => {
      setIsTouched(false)
    }, 150)
  }

  const handleMouseLeave = () => {
    if (isDragging) {
      finishSwipe()
    }
    setIsTouched(false)
  }

  // Gemeinsame Funktion zum Abschließen des Swipes
  const finishSwipe = () => {
    setIsDragging(false)

    // Wenn über dem Schwellenwert nach links, Löschaktion ausführen
    if (translateX < leftThreshold) {
      handlers.onSwipeLeft?.()
    }
    // Wenn über dem Schwellenwert nach rechts, Edit-Modal öffnen
    else if (translateX > rightThreshold) {
      handlers.onSwipeRight?.()
    }

    // Zurück zur Ausgangsposition
    setTranslateX(0)
  }

  // Cleanup-Funktion für globale Event-Listener
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        finishSwipe()
      }
      setIsTouched(false)
    }

    window.addEventListener("mouseup", handleGlobalMouseUp)
    return () => {
      window.removeEventListener("mouseup", handleGlobalMouseUp)
    }
  }, [isDragging])

  return {
    ref,
    touchProps: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
      onMouseDown: handleMouseDown,
      onMouseMove: handleMouseMove,
      onMouseUp: handleMouseUp,
      onMouseLeave: handleMouseLeave,
      onMouseEnter: () => setIsTouched(true),
    },
    style: {
      transform: `translateX(${translateX}px)`,
      touchAction: "pan-y",
    },
    state: {
      translateX,
      isDragging,
      isTouched,
      leftOpacity,
      rightOpacity,
    },
  }
}

