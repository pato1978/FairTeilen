// Vollständige korrigierte EnhancedMonthCard.tsx
'use client'

import React, { useState } from 'react'
import { saveSnapshot } from '@/services/SnapshotService'
import { MonthlyConfirmationService } from '@/services/MonthlyConfirmationService' // ✅ NEU: Service Import
import { useUser } from '@/context/user-context.tsx'
import type { MonthlyOverview } from '@/types/monthly-overview'
import { useNavigate } from 'react-router-dom'
import { useMonth } from '@/context/month-context.tsx'
import { getStatusInfo } from '@/pages/jahresuebersicht/status-info'
import {
    AlertTriangle,
    ArrowUpRight,
    Baby,
    Calendar,
    CheckCircle,
    ChevronDown,
    ChevronUp,
    Eye,
    Lock,
    UserCheck,
    Users,
    UserX,
} from 'lucide-react'
import { users } from '@/data/users'
import { useClarificationReactions } from '@/context/clarificationContext'

interface EnhancedMonthCardProps {
    month: MonthlyOverview
    onClick?: (e?: React.MouseEvent) => void
    onStatusClick?: (e: React.MouseEvent) => void
}

/**
 * Clickable wrapper, um ganze Kartenbereiche klickbar/unclickable zu machen.
 */
function ClickableCard({
    children,
    onClick,
    className = '',
    disabled = false,
}: React.PropsWithChildren<{
    onClick?: (e?: React.MouseEvent) => void
    className?: string
    disabled?: boolean
}>) {
    return (
        <div
            className={`${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'} ${className}`}
            onClick={disabled ? undefined : onClick}
        >
            {children}
        </div>
    )
}

type ActionButtonVariant =
    | 'primary'
    | 'secondary'
    | 'success'
    | 'warning'
    | 'confirmed'
    | 'unconfirmed'
    | 'disabled'
type ActionButtonSize = 'sm' | 'md' | 'lg'

function ActionButton({
    children,
    onClick,
    variant = 'primary',
    size = 'sm',
    className = '',
    disabled = false,
}: React.PropsWithChildren<{
    onClick?: (e: React.MouseEvent) => void
    variant?: ActionButtonVariant
    size?: ActionButtonSize
    className?: string
    disabled?: boolean
}>) {
    const base =
        'inline-flex items-center font-medium focus:outline-none focus:ring-2 focus:ring-offset-2'
    const variants: Record<ActionButtonVariant, string> = {
        primary: 'text-blue-600 hover:text-blue-800 hover:bg-blue-50 focus:ring-blue-500',
        secondary: 'text-gray-600 hover:text-gray-800 hover:bg-gray-50 focus:ring-gray-500',
        success: 'text-green-600 hover:text-green-800 hover:bg-green-50 focus:ring-green-500',
        warning: 'text-amber-600 hover:text-amber-800 hover:bg-amber-50 focus:ring-amber-500',
        confirmed: 'text-white bg-green-600 border-2 border-green-600',
        unconfirmed: 'text-gray-700 bg-gray-100 border-2 border-gray-300',
        disabled: 'text-gray-400 bg-gray-50 border-2 border-gray-200 cursor-not-allowed',
    }
    const sizes: Record<ActionButtonSize, string> = {
        sm: 'px-2 py-1 text-xs sm:text-sm rounded h-8',
        md: 'px-3 py-1 text-sm sm:text-base rounded-md h-8',
        lg: 'px-4 py-2 text-base sm:text-lg rounded-lg h-10',
    }

    return (
        <button
            onClick={disabled ? undefined : onClick}
            disabled={disabled}
            className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
        >
            {children}
        </button>
    )
}

// -----------------------------------------------------------
//  EnhancedMonthCard
//  - Enthält Toggle-Logik für Bestätigungen (confirm/unconfirm)
//  - Re-Render erfolgt über lokalen State `confirmations`
//  - ✅ AKTUALISIERT: Korrekte Abschluss-Logik und Service-Integration
// -----------------------------------------------------------
export function EnhancedMonthCard({ month, onClick }: EnhancedMonthCardProps) {
    const [isExpanded, setIsExpanded] = useState(false)
    const [showExpenseDetails, setShowExpenseDetails] = useState(false)
    const { refresh: refreshClarifications } = useClarificationReactions()
    // Reaktionen (Ablehnungen) kommen initial aus den Month-Daten
    const [reactions] = useState<Record<string, boolean | null>>(month.rejectionsByUser ?? {})

    // Status als lokaler State, falls sich etwas ändert (z. B. nach Snapshot)
    const [localStatus, setLocalStatus] = useState(month.status)

    // ✅ Lokale Bestätigungen, damit UI direkt reagiert ohne Reload
    const [confirmations, setConfirmations] = useState<Record<string, boolean>>(
        month.confirmationsByUser ?? {}
    )

    // ✅ NEU: Loading State für bessere UX
    const [isConfirming, setIsConfirming] = useState(false)

    const { setCurrentDate } = useMonth()
    const navigate = useNavigate()
    const { userId } = useUser()

    if (!userId) return null

    const statusInfo = getStatusInfo(localStatus)
    const allUserIds = Object.keys(month.totalByUser ?? {})
    const partnerIds = allUserIds.filter(id => id !== userId)
    const me = users[userId]

    const isCompleted = localStatus === 'completed'
    const isFuture = localStatus === 'future'
    const needsClarification = localStatus === 'needs-clarification'
    const notTakenIntoAccount = localStatus === 'notTakenIntoAccount'
    const isPast = localStatus === 'past'
    const hasOpenReactions = Object.values(reactions ?? {}).some(val => val === true)

    // ✅ NEU: Korrekte Abschluss-Logik - alle User müssen bestätigt haben
    const allUsersConfirmed = Object.keys(month.totalByUser ?? {}).every(
        userId => confirmations?.[userId] === true
    )

    const canCompleteMonth = isPast && !hasOpenReactions && allUsersConfirmed && !isCompleted

    /**
     * Navigiert zu einem Scope (/shared, /child, …) und setzt vorher den Monat im Context.
     */
    const redirectTo = async (scope: string) => {
        const [yearStr, monthStr] = month.monthKey.split('-')
        const year = parseInt(yearStr, 10)
        const monthIndex = parseInt(monthStr, 10) - 1

        console.log(
            `🎯 Navigiere zu ${scope} für Monat: ${month.monthKey} monthIndex: ${monthIndex}`,
            {
                year,
                monthIndex,
                monthName: month.name,
            }
        )

        try {
            // 1. Monat setzen
            const newDate = new Date(year, monthIndex, 1)
            setCurrentDate(newDate)

            // 2. ✅ KORRIGIERT: Längeres Delay für alle Context-Updates
            console.log('⏳ Warte auf Context-Updates...')
            await new Promise(resolve => setTimeout(resolve, 100)) // Erhöht von 400ms

            // 3. ✅ NEU: Clarification Context explizit refreshen
            console.log('🔄 Force-Refresh Clarification Context...')
            refreshClarifications()

            // 4. ✅ NEU: Zusätzliches Mini-Delay nach Refresh
            await new Promise(resolve => setTimeout(resolve, 100))

            // 5. Navigation
            console.log(`🚀 Navigiere zu ${scope}`)
            navigate(scope)
        } catch (error) {
            console.error('❌ Fehler bei Navigation:', error)
            // Fallback: Trotzdem navigieren
            navigate(scope)
        }
    }

    const handleHeaderClick = (e?: React.MouseEvent) => {
        e?.stopPropagation()
        setIsExpanded(prev => !prev)
        if (onClick) onClick(e)
    }

    /**
     * ✅ AKTUALISIERT: Toggle-Handler für die eigene Bestätigung mit Service-Integration.
     * Schickt confirmed=true/false an die API und aktualisiert den lokalen State.
     */
    const toggleMyConfirmation = async (e: React.MouseEvent, newConfirmed: boolean) => {
        e.stopPropagation()
        setIsConfirming(true) // Loading State aktivieren

        try {
            // ✅ Service verwenden statt inline fetch
            await MonthlyConfirmationService.setConfirmation(
                userId,
                month.groupId,
                month.monthKey,
                newConfirmed
            )

            // Lokal updaten → sofortiger Re-Render
            setConfirmations(prev => ({
                ...prev,
                [userId]: newConfirmed,
            }))

            console.log(
                `✅ Bestätigung ${newConfirmed ? 'gesetzt' : 'zurückgenommen'} für ${month.monthKey}`
            )
        } catch (err) {
            console.error('❌ Bestätigung fehlgeschlagen:', err)
            // TODO: Hier könnte man einen Toast/User-Notification zeigen
        } finally {
            setIsConfirming(false) // Loading State deaktivieren
        }
    }

    return (
        <div
            className={`group relative rounded-lg shadow-sm border-2 overflow-hidden ${
                isCompleted
                    ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200'
                    : `bg-white ${statusInfo.borderColor}`
            }`}
        >
            <ClickableCard onClick={handleHeaderClick} className="relative">
                <div
                    className={`flex items-center justify-between p-4 border-b ${
                        isCompleted ? 'border-green-100' : 'border-gray-100'
                    }`}
                >
                    <div className="flex items-center space-x-3">
                        <h3
                            className={`text-lg font-semibold ${
                                isCompleted ? 'text-green-900' : 'text-gray-900'
                            }`}
                        >
                            {month.name}
                        </h3>

                        {/* FIXME: Dieses Datum ist momentan hardcodiert.
                           Wenn verfügbar: month.completedAt anzeigen. */}
                        {isCompleted && (
                            <div className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                                Abgeschlossen am 15.07.2024
                            </div>
                        )}
                    </div>
                    <div className="flex items-center space-x-2">
                        <div
                            className={`flex items-center px-3 py-1 rounded-full ${
                                isCompleted ? 'bg-green-100' : statusInfo.statusBgColor
                            }`}
                        >
                            {statusInfo.icon}
                            <span
                                className={`ml-1.5 text-sm font-medium ${
                                    isCompleted ? 'text-green-700' : statusInfo.textColor
                                }`}
                            >
                                {statusInfo.text}
                            </span>
                        </div>
                        {isExpanded ? (
                            <ChevronUp className="h-5 w-5 text-gray-400" />
                        ) : (
                            <ChevronDown className="h-5 w-5 text-gray-400" />
                        )}
                    </div>
                </div>
            </ClickableCard>

            {isExpanded && (
                <div
                    className={`p-4 space-y-6 ${
                        isCompleted
                            ? 'bg-gradient-to-br from-green-50/50 to-emerald-50/50'
                            : 'bg-gray-50'
                    }`}
                >
                    {/* 🎯 COMPLETED: Read-only Ansicht */}
                    {isCompleted && (
                        <>
                            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 shadow-sm border border-green-100">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-lg font-semibold text-green-900">
                                        Finanzübersicht
                                    </h4>
                                    <ActionButton
                                        variant="primary"
                                        onClick={e => {
                                            e.stopPropagation()
                                            setShowExpenseDetails(s => !s)
                                        }}
                                    >
                                        <Eye className="h-4 w-4 mr-1" />
                                        {showExpenseDetails
                                            ? 'Weniger Details'
                                            : 'Details anzeigen'}
                                    </ActionButton>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {/* Shared - Read-only */}
                                    <div className="bg-green-100 border-2 border-green-200 rounded-lg p-4 text-center">
                                        <div className="flex items-center justify-center mb-2">
                                            <Users className="h-5 w-5 mr-2 text-green-700" />
                                            <span className="text-base text-green-900 font-medium">
                                                Gemeinsam
                                            </span>
                                        </div>
                                        <div className="text-lg font-bold text-green-900 mb-2">
                                            €{month.shared?.toFixed(2) ?? '0.00'}
                                        </div>
                                        {showExpenseDetails && (
                                            <div className="text-sm text-green-700 space-y-1">
                                                <div className="font-medium">
                                                    {me.name}: €
                                                    {month.sharedByUser?.[userId]?.toFixed(2) ??
                                                        '0.00'}
                                                </div>
                                                {partnerIds.map(id => (
                                                    <div key={id} className="font-medium">
                                                        {users[id].name}: €
                                                        {month.sharedByUser?.[id]?.toFixed(2) ??
                                                            '0.00'}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Child - Read-only */}
                                    <div className="bg-green-100 border-2 border-green-200 rounded-lg p-4 text-center">
                                        <div className="flex items-center justify-center mb-2">
                                            <Baby className="h-5 w-5 mr-2 text-green-700" />
                                            <span className="text-base text-green-900 font-medium">
                                                Kind
                                            </span>
                                        </div>
                                        <div className="text-lg font-bold text-green-900 mb-2">
                                            €{month.child?.toFixed(2) ?? '0.00'}
                                        </div>
                                        {showExpenseDetails && (
                                            <div className="text-sm text-green-700 space-y-1">
                                                <div className="font-medium">
                                                    {me.name}: €
                                                    {month.childByUser?.[userId]?.toFixed(2) ??
                                                        '0.00'}
                                                </div>
                                                {partnerIds.map(id => (
                                                    <div key={id} className="font-medium">
                                                        {users[id].name}: €
                                                        {month.childByUser?.[id]?.toFixed(2) ??
                                                            '0.00'}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Gesamt - Read-only */}
                                    <div className="bg-green-200 border-2 border-green-300 rounded-lg p-4 text-center">
                                        <div className="flex items-center justify-center mb-2">
                                            <span className="text-base text-green-900 font-medium">
                                                Gesamt
                                            </span>
                                        </div>
                                        <div className="text-lg font-bold text-green-900 mb-2">
                                            €{month.total?.toFixed(2) ?? '0.00'}
                                        </div>
                                        {showExpenseDetails && (
                                            <div className="text-sm text-green-700 space-y-1">
                                                <div className="font-medium">
                                                    {me.name}: €
                                                    {month.totalByUser?.[userId]?.toFixed(2) ??
                                                        '0.00'}
                                                </div>
                                                {partnerIds.map(id => (
                                                    <div key={id} className="font-medium">
                                                        {users[id].name}: €
                                                        {month.totalByUser?.[id]?.toFixed(2) ??
                                                            '0.00'}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* 💰 Finale Ausgleichszahlungen (Completed) */}
                            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 shadow-sm border border-green-100">
                                <h4 className="text-lg font-semibold text-green-900 mb-4 flex items-center">
                                    <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                                    Finale Ausgleichszahlungen
                                </h4>

                                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 mb-4">
                                    <div className="space-y-4">
                                        {Object.entries(month.balanceByUser ?? {}).map(
                                            ([id, balance]) => {
                                                if (Math.abs(balance) < 0.01) return null
                                                const name = users[id]?.name ?? `Partner (${id})`
                                                const isPayment = balance < 0
                                                const amount = Math.abs(balance)

                                                return (
                                                    <div
                                                        key={id}
                                                        className="flex items-center justify-between p-3 bg-white rounded-lg border border-green-200"
                                                    >
                                                        <div className="flex items-center space-x-4">
                                                            <div
                                                                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                                                                    isPayment
                                                                        ? 'bg-orange-100 text-orange-600'
                                                                        : 'bg-green-100 text-green-600'
                                                                }`}
                                                            >
                                                                {isPayment ? (
                                                                    <ArrowUpRight className="h-5 w-5 rotate-45" />
                                                                ) : (
                                                                    <ArrowUpRight className="h-5 w-5 -rotate-45" />
                                                                )}
                                                            </div>
                                                            <div>
                                                                <div className="font-semibold text-gray-900 text-lg">
                                                                    {name}
                                                                </div>
                                                                <div
                                                                    className={`text-sm font-medium ${
                                                                        isPayment
                                                                            ? 'text-orange-600'
                                                                            : 'text-green-600'
                                                                    }`}
                                                                >
                                                                    {isPayment
                                                                        ? 'Zahlung geleistet'
                                                                        : 'Betrag erhalten'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="text-xl font-bold text-gray-900">
                                                            €{amount.toFixed(2)}
                                                        </div>
                                                    </div>
                                                )
                                            }
                                        )}
                                    </div>
                                </div>

                                {/* Info-Banner */}
                                <div className="bg-green-100 border-l-4 border-green-500 p-3 rounded">
                                    <div className="flex items-center">
                                        <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                                        <span className="text-green-800 font-medium text-sm">
                                            Alle Ausgleichszahlungen wurden bestätigt und der Monat
                                            wurde erfolgreich abgeschlossen.
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* 🔄 STANDARD: Normale Ansicht für andere Status */}
                    {!isCompleted && (
                        <>
                            {isFuture && (
                                <div className="bg-gray-100 border border-gray-200 rounded-lg p-4">
                                    <div className="flex items-center text-gray-600">
                                        <Calendar className="h-5 w-5 mr-2 text-gray-600" />
                                        <span className="text-sm">
                                            Dieser Monat ist noch nicht verfügbar. Ausgaben können
                                            erst nach Monatsende bearbeitet werden.
                                        </span>
                                    </div>
                                </div>
                            )}
                            {/* Info für "nicht berücksichtigt" Status */}
                            {notTakenIntoAccount && (
                                <div className="bg-gray-100 border border-gray-200 rounded-lg p-4">
                                    <div className="flex items-center text-gray-600">
                                        <Lock className="h-5 w-5 mr-2 text-gray-600" />
                                        <span className="text-sm">
                                            Da der Monat abgelaufen ist und keine gespeicherten
                                            Ausgaben vorliegen, wird dieser Monat nicht in die
                                            Abrechnung einbezogen.
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Standard Ausgaben-Übersicht mit Edit-Buttons */}
                            {!isFuture && !notTakenIntoAccount && (
                                <div className="bg-white rounded-lg p-4 shadow-sm">
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="text-lg font-semibold text-gray-900">
                                            Ausgaben
                                        </h4>
                                        <ActionButton
                                            variant="primary"
                                            onClick={e => {
                                                e.stopPropagation()
                                                setShowExpenseDetails(s => !s)
                                            }}
                                        >
                                            <Eye className="h-4 w-4 mr-1" />
                                            {showExpenseDetails
                                                ? 'Weniger Details'
                                                : 'Details anzeigen'}
                                        </ActionButton>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {/* Shared */}
                                        <div className="bg-blue-50 border-2 border-blue-100 rounded-lg p-4 text-center">
                                            <div className="flex items-center justify-center mb-2">
                                                <Users className="h-5 w-5 mr-2 text-blue-600" />
                                                <span className="text-base text-blue-900">
                                                    Gemeinsam
                                                </span>
                                            </div>
                                            <div className="text-base font-bold text-blue-900 mb-2">
                                                €{month.shared?.toFixed(2) ?? '0.00'}
                                            </div>
                                            {showExpenseDetails && (
                                                <div className="text-sm text-blue-700 space-y-1 mb-3">
                                                    <div>
                                                        {me.name}: €
                                                        {month.sharedByUser?.[userId]?.toFixed(2) ??
                                                            '0.00'}
                                                    </div>
                                                    {partnerIds.map(id => (
                                                        <div key={id}>
                                                            {users[id].name}: €
                                                            {month.sharedByUser?.[id]?.toFixed(2) ??
                                                                '0.00'}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            <ActionButton
                                                variant="primary"
                                                size="sm"
                                                onClick={e => {
                                                    e.stopPropagation()
                                                    redirectTo('/shared')
                                                }}
                                            >
                                                <ArrowUpRight className="h-4 w-4 mr-1" />
                                                Ausgaben verwalten
                                            </ActionButton>
                                        </div>

                                        {/* Child */}
                                        <div className="bg-purple-50 border-2 border-purple-100 rounded-lg p-4 text-center">
                                            <div className="flex items-center justify-center mb-2">
                                                <Baby className="h-5 w-5 mr-2 text-purple-600" />
                                                <span className="text-base text-purple-900">
                                                    Kind
                                                </span>
                                            </div>
                                            <div className="text-base font-bold text-purple-900 mb-2">
                                                €{month.child?.toFixed(2) ?? '0.00'}
                                            </div>
                                            {showExpenseDetails && (
                                                <div className="text-sm text-purple-700 space-y-1 mb-3">
                                                    <div>
                                                        {me.name}: €
                                                        {month.childByUser?.[userId]?.toFixed(2) ??
                                                            '0.00'}
                                                    </div>
                                                    {partnerIds.map(id => (
                                                        <div key={id}>
                                                            {users[id].name}: €
                                                            {month.childByUser?.[id]?.toFixed(2) ??
                                                                '0.00'}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            <ActionButton
                                                variant="primary"
                                                size="sm"
                                                onClick={e => {
                                                    e.stopPropagation()
                                                    redirectTo('/child')
                                                }}
                                            >
                                                <ArrowUpRight className="h-4 w-4 mr-1" />
                                                Ausgaben verwalten
                                            </ActionButton>
                                        </div>

                                        {/* Gesamt */}
                                        <div className="bg-gray-100 border-2 border-gray-200 rounded-lg p-4 text-center">
                                            <div className="flex items-center justify-center mb-2">
                                                <span className="text-base text-gray-700">
                                                    Gesamt
                                                </span>
                                            </div>
                                            <div className="text-base font-bold text-gray-900 mb-2">
                                                €{month.total?.toFixed(2) ?? '0.00'}
                                            </div>
                                            {showExpenseDetails && (
                                                <div className="text-sm text-gray-600 space-y-1">
                                                    <div>
                                                        {me.name}: €
                                                        {month.totalByUser?.[userId]?.toFixed(2) ??
                                                            '0.00'}
                                                    </div>
                                                    {partnerIds.map(id => (
                                                        <div key={id}>
                                                            {users[id].name}: €
                                                            {month.totalByUser?.[id]?.toFixed(2) ??
                                                                '0.00'}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* 🔐 Bestätigungslogik (Toggle) */}
                            {isPast && !isCompleted && !notTakenIntoAccount && (
                                <div className="bg-white rounded-lg p-4 shadow-sm">
                                    <h4 className="text-lg font-semibold text-gray-900 mb-4">
                                        Bestätigungen
                                    </h4>

                                    <div className="space-y-3">
                                        {Object.keys(month.totalByUser ?? {}).map(id => {
                                            const isMe = id === userId
                                            const name = isMe
                                                ? 'Du'
                                                : (users[id]?.name ?? `Partner (${id})`)
                                            const hasRejected = reactions[id] === true
                                            const hasConfirmed = confirmations?.[id] === true
                                            const hasOwnRejection =
                                                isMe && reactions[userId] === true

                                            return (
                                                <div
                                                    key={id}
                                                    className="grid grid-cols-2 gap-4 items-center p-3 rounded-lg border border-gray-200 bg-gray-50 h-[60px]"
                                                >
                                                    <span className="font-medium text-gray-800">
                                                        {name}
                                                    </span>
                                                    <div className="flex justify-end">
                                                        {hasRejected ? (
                                                            <div className="flex items-center text-amber-600 font-medium h-8">
                                                                <UserX className="w-5 h-5 mr-2 text-amber-600" />
                                                                <span>
                                                                    {isMe
                                                                        ? 'Du hast noch Redebedarf'
                                                                        : 'Hat noch Redebedarf'}
                                                                </span>
                                                            </div>
                                                        ) : isMe ? (
                                                            hasOwnRejection ? (
                                                                <div className="flex items-center text-amber-600 font-medium h-8">
                                                                    <UserX className="w-5 h-5 mr-2 text-amber-600" />
                                                                    <span>
                                                                        Du hast noch Redebedarf
                                                                    </span>
                                                                </div>
                                                            ) : (
                                                                // ✅ AKTUALISIERT: Toggle-Button für mich selbst mit Service-Integration
                                                                <button
                                                                    onClick={e =>
                                                                        toggleMyConfirmation(
                                                                            e,
                                                                            !hasConfirmed
                                                                        )
                                                                    }
                                                                    disabled={isConfirming}
                                                                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                                                                        hasConfirmed
                                                                            ? 'bg-green-500 text-white hover:bg-green-600'
                                                                            : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                                                                    } ${isConfirming ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                                >
                                                                    {isConfirming ? (
                                                                        'Laden...'
                                                                    ) : hasConfirmed ? (
                                                                        <>
                                                                            <UserCheck className="h-4 w-4 inline mr-1" />
                                                                            Zurücknehmen
                                                                        </>
                                                                    ) : (
                                                                        'Bestätigen'
                                                                    )}
                                                                </button>
                                                            )
                                                        ) : hasConfirmed ? (
                                                            <div className="flex items-center text-green-600 font-medium h-8">
                                                                <UserCheck className="h-5 w-5 mr-2 text-green-600" />
                                                                <span>Bestätigt</span>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center text-gray-500 font-medium h-8">
                                                                <span>Noch offen</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* ✅ AKTUALISIERT: Ausgleichszahlungen + Monat abschließen mit korrigierter Logik */}
                            {isPast && !isCompleted && (
                                <div className="bg-white rounded-lg p-4 shadow-sm mt-4">
                                    <h4 className="text-lg font-semibold text-gray-900 mb-4">
                                        Ausgleichszahlungen
                                    </h4>

                                    <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4 mb-4">
                                        <div className="space-y-3">
                                            {Object.entries(month.balanceByUser ?? {}).map(
                                                ([id, balance]) => {
                                                    if (Math.abs(balance) < 0.01) return null
                                                    const name =
                                                        users[id]?.name ?? `Partner (${id})`
                                                    const isPayment = balance < 0
                                                    const amount = Math.abs(balance)

                                                    return (
                                                        <div
                                                            key={id}
                                                            className="flex items-center justify-between"
                                                        >
                                                            <div className="flex items-center space-x-3">
                                                                <div
                                                                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                                                                        isPayment
                                                                            ? 'bg-amber-100 text-amber-600'
                                                                            : 'bg-green-100 text-green-600'
                                                                    }`}
                                                                >
                                                                    {isPayment ? (
                                                                        <ArrowUpRight className="h-4 w-4 rotate-45" />
                                                                    ) : (
                                                                        <ArrowUpRight className="h-4 w-4 -rotate-45" />
                                                                    )}
                                                                </div>
                                                                <div>
                                                                    <div className="font-medium text-gray-900">
                                                                        {name}
                                                                    </div>
                                                                    <div className="text-sm text-gray-600 font-medium">
                                                                        {isPayment
                                                                            ? 'gibt'
                                                                            : 'erhält'}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="font-bold text-base text-gray-900">
                                                                €{amount.toFixed(2)}
                                                            </div>
                                                        </div>
                                                    )
                                                }
                                            )}
                                        </div>
                                    </div>

                                    {/* ✅ NEU: Konditioneller Button mit korrekter Abschluss-Logik */}
                                    <button
                                        onClick={async e => {
                                            e.stopPropagation()
                                            if (!canCompleteMonth) return // Sicherheitscheck

                                            try {
                                                const [yearStr, monthStr] =
                                                    month.monthKey.split('-')
                                                const year = parseInt(yearStr, 10)
                                                const monthNumber = parseInt(monthStr, 10)

                                                await saveSnapshot(month.groupId, year, monthNumber)
                                                setLocalStatus('completed')
                                                console.log('✅ Snapshot erfolgreich gespeichert!')
                                            } catch (err) {
                                                console.error('❌ Snapshot fehlgeschlagen:', err)
                                                // TODO: User-Benachrichtigung bei Fehler
                                            }
                                        }}
                                        disabled={!canCompleteMonth}
                                        className={`w-full font-medium py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center shadow-sm ${
                                            canCompleteMonth
                                                ? 'bg-green-600 hover:bg-green-700 text-white hover:shadow cursor-pointer'
                                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        }`}
                                    >
                                        <CheckCircle className="h-5 w-5 mr-2" />
                                        {canCompleteMonth
                                            ? 'Monat abschließen'
                                            : 'Warten auf Bestätigungen'}
                                    </button>

                                    {/* ✅ NEU: Hilfetext wenn nicht alle bestätigt haben */}
                                    {!canCompleteMonth && !hasOpenReactions && (
                                        <div className="mt-2 text-sm text-gray-500 text-center">
                                            {!allUsersConfirmed &&
                                                'Noch nicht alle Benutzer haben bestätigt'}
                                            {hasOpenReactions &&
                                                'Offene Klärungspunkte müssen zuerst gelöst werden'}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Hinweis bei Klärungsbedarf */}
                            {needsClarification && (
                                <div className="bg-orange-100 border-l-4 border-orange-500 p-4 rounded">
                                    <div className="flex items-center">
                                        <AlertTriangle className="w-5 h-5 mr-2 text-orange-600" />
                                        <span className="text-orange-700 font-medium">
                                            Dieser Monat hat offene Klärungspunkte und benötigt Ihre
                                            Aufmerksamkeit.
                                        </span>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    )
}
