import { AlertTriangle, BellDot, CheckCircle, Clock, Info, Lock } from 'lucide-react'

import type { MonthlyOverview } from '@/types/monthly-overview'

export interface StatusInfo {
    icon: JSX.Element
    text: string
    statusBgColor: string
    textColor: string
    borderColor: string
}

export const statusInfoMap: Record<MonthlyOverview['status'], StatusInfo> = {
    past: {
        icon: <BellDot className="h-5 w-5 text-blue-500" />,
        text: 'Warte auf Abschluss',
        statusBgColor: 'bg-blue-50',
        textColor: 'text-blue-600',
        borderColor: 'border-blue-200',
    },
    open: {
        icon: <Clock className="h-5 w-5 text-blue-500" />,
        text: 'Offen',
        statusBgColor: 'bg-blue-50',
        textColor: 'text-blue-600',
        borderColor: 'border-blue-200',
    },
    completed: {
        icon: <CheckCircle className="h-5 w-5 text-green-500" />,
        text: 'Abgeschlossen',
        statusBgColor: 'bg-green-50',
        textColor: 'text-green-600',
        borderColor: 'border-green-200',
    },
    future: {
        icon: <Lock className="h-5 w-5 text-gray-400" />,
        text: 'Zukünftig',
        statusBgColor: 'bg-gray-50',
        textColor: 'text-gray-400',
        borderColor: 'border-gray-200',
    },
    pending: {
        icon: <Clock className="h-5 w-5 text-amber-500" />,
        text: 'Laufend',
        statusBgColor: 'bg-amber-50',
        textColor: 'text-amber-600',
        borderColor: 'border-amber-200',
    },
    notTakenIntoAccount: {
        icon: <Lock className="h-5 w-5 text-gray-400" />,
        text: 'Nicht berücksichtigt',
        statusBgColor: 'bg-gray-50',
        textColor: 'text-gray-400',
        borderColor: 'border-gray-200',
    },
    'needs-clarification': {
        icon: <AlertTriangle className="h-5 w-5 text-red-500" />,
        text: 'Klärungsbedarf',
        statusBgColor: 'bg-red-50',
        textColor: 'text-red-600',
        borderColor: 'border-red-200',
    },
}

export function getStatusInfo(status: MonthlyOverview['status']): StatusInfo {
    return (
        statusInfoMap[status] ?? {
            icon: <Info className="h-5 w-5 text-gray-500" />,
            text: 'Unbekannt',
            statusBgColor: 'bg-gray-50',
            textColor: 'text-gray-500',
            borderColor: 'border-gray-200',
        }
    )
}
