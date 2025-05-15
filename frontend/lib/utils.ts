import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

// Formatiert Monat und Jahr auf Deutsch
export function formatMonthYear(date: Date): string {
  const monthNames = [
    "Januar",
    "Februar",
    "März",
    "April",
    "Mai",
    "Juni",
    "Juli",
    "August",
    "September",
    "Oktober",
    "November",
    "Dezember",
  ]
  const month = monthNames[date.getMonth()]
  const year = date.getFullYear()
  return `${month} ${year}`
}

// Konvertiert ein Datum von DD.MM.YYYY zu YYYY-MM-DD
export function convertDateToISO(dateStr: string): string {
  if (dateStr === "Heute") {
    return new Date().toISOString().split("T")[0]
  }
  return dateStr.split(".").reverse().join("-")
}

// Konvertiert ein Datum von YYYY-MM-DD zu DD.MM.YYYY oder "Heute"
export function convertDateToDisplay(date: string): string {
  if (!date) return ""

  const inputDate = new Date(date)
  const today = new Date()

  const isSameDay =
      inputDate.getDate() === today.getDate() &&
      inputDate.getMonth() === today.getMonth() &&
      inputDate.getFullYear() === today.getFullYear()

  if (isSameDay) {
    return "Heute"
  }

  return inputDate.toLocaleDateString("de-DE") // z. B. "01.04.2025"
}


export function extractAmountValue(amount: string | number): number {
  if (typeof amount === "number") return amount
  return Number.parseFloat(amount.replace("€", "").replace(",", "."))
}

// Formatiert einen numerischen Wert als Währungsbetrag
export function formatCurrency(amount: number): string {
  return `€${amount.toFixed(2)}`
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

