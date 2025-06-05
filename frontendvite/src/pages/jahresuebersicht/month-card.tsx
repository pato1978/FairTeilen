'use client'

import type React from 'react'

import { CheckCircle, AlertTriangle, Clock, ChevronRight, Info, Lock } from 'lucide-react'

interface MonthCardProps {
    month: {
        id: number
        name: string
        status: 'completed' | 'pending' | 'needs-clarification' | 'future' | 'notTakenIntoAccount'
        shared: number
        child: number
        total: number
        sharedUser1: number
        sharedUser2: number
        childUser1: number
        childUser2: number
        totalUser1: number
        totalUser2: number
        message?: string
    }
    onClick: () => void
    onStatusClick: (e: React.MouseEvent) => void
}

export function MonthCard({ month, onClick, onStatusClick }: MonthCardProps) {
    const isCompleted = month.status === 'completed'
    const isFuture = month.status === 'future'
    const needsClarification = month.status === 'needs-clarification'
    const notTakenIntoAccount = month.status === 'notTakenIntoAccount'
    const isClickable = !isCompleted && !isFuture

    // Status-bezogene Styling und Icons
    const getStatusInfo = () => {
        switch (month.status) {
            case 'completed':
                return {
                    icon: <CheckCircle className="h-5 w-5 text-gray-400" />,
                    text: 'Abgeschlossen',
                    bgColor: 'bg-gray-50',
                    textColor: 'text-gray-400',
                }
            case 'pending':
                return {
                    icon: <Clock className="h-5 w-5 text-blue-500" />,
                    text: 'Offen',
                    bgColor: 'bg-blue-50',
                    textColor: 'text-blue-600',
                }
            case 'needs-clarification':
                return {
                    icon: <AlertTriangle className="h-5 w-5 text-amber-500" />,
                    text: 'Klärungsbedarf',
                    bgColor: 'bg-amber-50',
                    textColor: 'text-amber-600',
                }
            case 'future':
                return {
                    icon: <Lock className="h-5 w-5 text-gray-400" />,
                    text: 'Nicht verfügbar',
                    bgColor: 'bg-gray-50',
                    textColor: 'text-gray-400',
                }
            case 'notTakenIntoAccount':
                return {
                    icon: <Lock className="h-5 w-5 text-gray-200" />,
                    text: 'Nicht berücksichtigt',
                    bgColor: 'bg-gray-50',
                    textColor: 'text-gray-200',
                }

            default:
                return {
                    icon: <Info className="h-5 w-5 text-gray-500" />,
                    text: 'Unbekannt',
                    bgColor: 'bg-gray-50',
                    textColor: 'text-gray-500',
                }
        }
    }

    const statusInfo = getStatusInfo()

    return (
        <div
            className={`${statusInfo.bgColor} rounded-lg shadow-sm border border-gray-100 overflow-hidden transition-colors ${isClickable ? 'active:bg-gray-100 cursor-pointer' : 'opacity-75'}`}
            onClick={isClickable ? onClick : undefined}
        >
            <div className="p-3">
                <h3 className="font-medium text-center mb-2">{month.name}</h3>

                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        {statusInfo.icon}
                        <span className={`ml-1.5 text-sm ${statusInfo.textColor}`}>
                            {statusInfo.text}
                        </span>
                    </div>

                    {isClickable && (
                        <button
                            onClick={onStatusClick}
                            className="p-1.5 rounded-full active:bg-gray-200 transition-colors text-blue-600"
                            aria-label="Status anzeigen"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    )}
                </div>

                {needsClarification && month.message && (
                    <div className="mt-2 text-xs bg-amber-100 text-amber-700 p-1.5 rounded">
                        {month.message}
                    </div>
                )}

                {isFuture && (
                    <div className="mt-2 text-xs bg-gray-100 text-gray-500 p-1.5 rounded">
                        Erst nach Monatsende verfügbar
                    </div>
                )}

                {isCompleted && (
                    <div className="mt-2 text-xs bg-gray-100 text-gray-500 p-1.5 rounded">
                        Monat abgeschlossen
                    </div>
                )}
            </div>
        </div>
    )
}
