// status-info.ts
// Zentrale Quelle für Status-UI (Icons, Texte, Farben, linke Statusleiste)

import { AlertTriangle, BellDot, CheckCircle, Clock, Info, Lock } from 'lucide-react'
import type { MonthlyOverview } from '@/types/monthly-overview'

/**
 * StatusInfo beschreibt alle UI-Aspekte eines Monatsstatus.
 * - icon:        Das Icon-Element für den Status
 * - text:        Kurzer Status-Text
 * - statusBgColor: Hintergrundfarbe für Status-Badges/Infoboxen
 * - textColor:   Textfarbe für Status-Badges/Infoboxen
 * - borderColor: Dünne Rahmenfarbe (z.B. um Karten/Boxen)
 * - borderLeftClass: Dicke farbige linke Leiste (z.B. 'border-l-4 border-l-green-500')
 *
 * Hinweis:
 * - Wenn du KEINE linke Leiste willst, setze borderLeftClass: '' (leer).
 */
export interface StatusInfo {
    icon: JSX.Element
    text: string
    statusBgColor: string
    textColor: string
    borderColor: string
    borderLeftClass: string
}

/**
 * Zentrales Mapping: Jeder Monatsstatus -> seine UI-Darstellung
 * Anpassungen hier wirken sofort überall, wo getStatusInfo(...) genutzt wird.
 */
export const statusInfoMap: Record<MonthlyOverview['status'], StatusInfo> = {
    past: {
        icon: <BellDot className="h-5 w-5 text-blue-500" />,
        text: 'Warte auf Abschluss',
        statusBgColor: 'bg-blue-50',
        textColor: 'text-blue-600',
        borderColor: 'border-blue-200',
        borderLeftClass: 'border-l-4 border-l-blue-500',
    },
    open: {
        icon: <Clock className="h-5 w-5 text-blue-500" />,
        text: 'Offen',
        statusBgColor: 'bg-blue-50',
        textColor: 'text-blue-600',
        borderColor: 'border-blue-200',
        borderLeftClass: 'border-l-4 border-l-blue-500',
    },
    completed: {
        icon: <CheckCircle className="h-5 w-5 text-green-500" />,
        text: 'Abgeschlossen',
        statusBgColor: 'bg-green-50',
        textColor: 'text-green-600',
        borderColor: 'border-green-200',
        borderLeftClass: 'border-l-4 border-l-green-500',
    },
    future: {
        icon: <Lock className="h-5 w-5 text-gray-400" />,
        text: 'Zukünftig',
        statusBgColor: 'bg-gray-50',
        textColor: 'text-gray-400',
        borderColor: 'border-gray-200',
        borderLeftClass: 'border-l-4 border-l-gray-300',
    },
    pending: {
        icon: <Clock className="h-5 w-5 text-amber-500" />,
        text: 'Laufend',
        statusBgColor: 'bg-amber-50',
        textColor: 'text-amber-600',
        borderColor: 'border-amber-200',
        borderLeftClass: 'border-l-4 border-l-amber-500',
    },
    notTakenIntoAccount: {
        icon: <Lock className="h-5 w-5 text-gray-400" />,
        text: 'Nicht berücksichtigt',
        statusBgColor: 'bg-gray-50',
        textColor: 'text-gray-400',
        borderColor: 'border-gray-200',
        borderLeftClass: 'border-l-4 border-l-gray-300',
    },
    'needs-clarification': {
        icon: <AlertTriangle className="h-5 w-5 text-red-500" />,
        text: 'Klärungsbedarf',
        statusBgColor: 'bg-red-50',
        textColor: 'text-red-600',
        borderColor: 'border-red-200',
        borderLeftClass: 'border-l-4 border-l-red-500',
    },
}

/**
 * Liefert die UI-Definition für einen Status.
 * Fallback: "Unbekannt" (neutral grau), falls ein Status fehlt/neu ist.
 */
export function getStatusInfo(status: MonthlyOverview['status']): StatusInfo {
    return (
        statusInfoMap[status] ?? {
            icon: <Info className="h-5 w-5 text-gray-500" />,
            text: 'Unbekannt',
            statusBgColor: 'bg-gray-50',
            textColor: 'text-gray-500',
            borderColor: 'border-gray-200',
            borderLeftClass: 'border-l-4 border-l-gray-300',
        }
    )
}
