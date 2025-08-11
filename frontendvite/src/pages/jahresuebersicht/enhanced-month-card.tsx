// EnhancedMonthCard.tsx
'use client'

/**
 * Diese Version nutzt KONSISTENT die zentrale status-info.ts:
 *  - Icon, Text, Farben (Hintergrund, Text, Border) kommen ausschließlich aus getStatusInfo(status)
 *  - Keine eigene Farblogik mehr abhängig vom Status in dieser Komponente
 *  - Die frühere linke Status-Farbleiste (border-l-*) wurde entfernt
 *  - Die Karten-Border nutzt statusInfo.borderColor
 *  - Info-Boxen (Future / NotTakenIntoAccount / Needs-clarification) nutzen statusInfo.* + statusInfo.icon
 *
 * Nicht-Status-bezogene Farben (z. B. Balance-Badges in grün/orange) bleiben erhalten, da sie
 * inhaltlich (Saldo) und nicht durch den Monatsstatus bestimmt sind.
 */

import React, { useState } from 'react'
import { saveSnapshot } from '@/services/SnapshotService'
import { MonthlyConfirmationService } from '@/services/MonthlyConfirmationService'
import { useUser } from '@/context/user-context.tsx'
import type { MonthlyOverview } from '@/types/monthly-overview'
import { useNavigate } from 'react-router-dom'
import { useMonth } from '@/context/month-context.tsx'

// 🔑 ZENTRALE Status-Quelle
import { getStatusInfo } from '@/pages/jahresuebersicht/status-info'

// UI-Icons (nur für NICHT Status-bezogene Elemente)
import {
    ArrowUpRight,
    Baby,
    CheckCircle,
    ChevronDown,
    ChevronUp,
    Eye,
    UserCheck,
    UserX,
    Users,
    TrendingUp,
    TrendingDown,
} from 'lucide-react'

import { users } from '@/data/users'
import { useClarificationReactions } from '@/context/clarificationContext'

interface EnhancedMonthCardProps {
    month: MonthlyOverview
    onClick?: (e?: React.MouseEvent) => void
}

// Clickable wrapper (unverändert, nur Styling)
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
        'inline-flex items-center font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors'
    const variants: Record<ActionButtonVariant, string> = {
        primary: 'text-blue-600 hover:text-blue-800 hover:bg-blue-50 focus:ring-blue-500',
        secondary: 'text-gray-600 hover:text-gray-800 hover:bg-gray-50 focus:ring-gray-500',
        success: 'text-green-600 hover:text-green-800 hover:bg-green-50 focus:ring-green-500',
        warning: 'text-amber-600 hover:text-amber-800 hover:bg-amber-50 focus:ring-amber-500',
        confirmed: 'text-white bg-green-600 border-2 border-green-600 hover:bg-green-700',
        unconfirmed: 'text-gray-700 bg-gray-100 border-2 border-gray-300 hover:bg-gray-200',
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

export function EnhancedMonthCard({ month, onClick }: EnhancedMonthCardProps) {
    const [isExpanded, setIsExpanded] = useState(false)
    const [showDetails, setShowDetails] = useState(false)

    const { refresh: refreshClarifications } = useClarificationReactions()
    const [reactions] = useState<Record<string, boolean | null>>(month.rejectionsByUser ?? {})

    const [localStatus, setLocalStatus] = useState(month.status)
    const [confirmations, setConfirmations] = useState<Record<string, boolean>>(
        month.confirmationsByUser ?? {}
    )
    const [isConfirming, setIsConfirming] = useState(false)

    const { setCurrentDate } = useMonth()
    const navigate = useNavigate()
    const { userId } = useUser()

    if (!userId) return null

    // ⛳️ EINZIGE Quelle für Status-UI
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

    const allUsersConfirmed = Object.keys(month.totalByUser ?? {}).every(
        uid => confirmations?.[uid] === true
    )
    const canCompleteMonth = isPast && !hasOpenReactions && allUsersConfirmed && !isCompleted

    // Balance (nicht Status-abhängig)
    const myBalance = month.balanceByUser?.[userId] ?? 0
    const isOwed = myBalance > 0
    const owes = myBalance < 0

    // Navigationshilfe
    const redirectTo = async (scope: string) => {
        const [yearStr, monthStr] = month.monthKey.split('-')
        const year = parseInt(yearStr, 10)
        const monthIndex = parseInt(monthStr, 10) - 1

        try {
            const newDate = new Date(year, monthIndex, 1)
            setCurrentDate(newDate)
            await new Promise(r => setTimeout(r, 100))
            refreshClarifications()
            await new Promise(r => setTimeout(r, 100))
            navigate(scope)
        } catch {
            navigate(scope)
        }
    }

    const handleHeaderClick = (e?: React.MouseEvent) => {
        e?.stopPropagation()
        setIsExpanded(prev => !prev)
        if (onClick) onClick(e)
    }

    const toggleMyConfirmation = async (e: React.MouseEvent, newConfirmed: boolean) => {
        e.stopPropagation()
        setIsConfirming(true)
        try {
            await MonthlyConfirmationService.setConfirmation(
                userId,
                month.groupId,
                month.monthKey,
                newConfirmed
            )
            setConfirmations(prev => ({ ...prev, [userId]: newConfirmed }))
        } catch (err) {
            console.error('❌ Bestätigung fehlgeschlagen:', err)
        } finally {
            setIsConfirming(false)
        }
    }

    // ───────────────────────────────────────────────────────────────────────────────
    // RETURN – KONSEQUENT statusInfo verwenden
    // ───────────────────────────────────────────────────────────────────────────────
    return (
        <div
            className={`bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 ${statusInfo.borderColor} ${statusInfo.borderLeftClass} overflow-hidden mb-3`}
        >
            {/* Header */}
            <ClickableCard onClick={handleHeaderClick} className="relative">
                <div className="p-4 cursor-pointer hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-lg font-semibold text-gray-800">
                                    {month.name}
                                </h3>

                                {/* Status-Chip: Farben + Icon + Text NUR aus statusInfo */}
                                <div
                                    className={`px-2 py-1 rounded-full text-xs font-medium flex items-center ${statusInfo.statusBgColor}`}
                                >
                                    {/* Icon aus statusInfo */}
                                    {statusInfo.icon}
                                    <span className={`ml-1 ${statusInfo.textColor}`}>
                                        {statusInfo.text}
                                    </span>
                                </div>
                            </div>

                            {/* Quick Summary + Balance Indicator (Saldo-Farben bleiben inhaltlich) */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    <span className="text-sm text-gray-500">Gesamt:</span>
                                    <span className="text-base font-semibold text-gray-900">
                                        €{month.total?.toFixed(2) ?? '0.00'}
                                    </span>
                                </div>

                                {!isFuture && !isCompleted && !notTakenIntoAccount && (
                                    <div className="flex items-center">
                                        {isOwed && (
                                            <div className="flex items-center bg-green-100 px-3 py-1 rounded-full">
                                                <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                                                <span className="text-sm font-semibold text-green-700">
                                                    +€{Math.abs(myBalance).toFixed(2)}
                                                </span>
                                            </div>
                                        )}
                                        {owes && (
                                            <div className="flex items-center bg-orange-100 px-3 py-1 rounded-full">
                                                <TrendingDown className="h-4 w-4 text-orange-600 mr-1" />
                                                <span className="text-sm font-semibold text-orange-700">
                                                    -€{Math.abs(myBalance).toFixed(2)}
                                                </span>
                                            </div>
                                        )}
                                        {!isOwed && !owes && (
                                            <div className="flex items-center text-green-600">
                                                <CheckCircle className="h-4 w-4 mr-1" />
                                                <span className="text-sm font-medium">
                                                    Ausgeglichen
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {isExpanded ? (
                            <ChevronUp className="h-5 w-5 text-gray-400 ml-3" />
                        ) : (
                            <ChevronDown className="h-5 w-5 text-gray-400 ml-3" />
                        )}
                    </div>
                </div>
            </ClickableCard>

            {/* Expanded */}
            {isExpanded && (
                <div className="border-t border-gray-100">
                    {/* COMPLETED – alte Logik, Optik mit neutralem Weiß; Statusfarben kommen über Header/Karte */}
                    {isCompleted && (
                        <div className="p-4 space-y-6 bg-gradient-to-br from-green-50/50 to-emerald-50/50">
                            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 shadow-sm border border-green-100">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-lg font-semibold text-green-900">
                                        Finanzübersicht
                                    </h4>
                                    <ActionButton
                                        variant="primary"
                                        onClick={e => {
                                            e.stopPropagation()
                                            setShowDetails(s => !s)
                                        }}
                                    >
                                        <Eye className="h-4 w-4 mr-1" />
                                        {showDetails ? 'Weniger Details' : 'Details anzeigen'}
                                    </ActionButton>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {/* Shared */}
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
                                        {showDetails && (
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

                                    {/* Child */}
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
                                        {showDetails && (
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

                                    {/* Gesamt */}
                                    <div className="bg-green-200 border-2 border-green-300 rounded-lg p-4 text-center">
                                        <div className="flex items-center justify-center mb-2">
                                            <span className="text-base text-green-900 font-medium">
                                                Gesamt
                                            </span>
                                        </div>
                                        <div className="text-lg font-bold text-green-900 mb-2">
                                            €{month.total?.toFixed(2) ?? '0.00'}
                                        </div>
                                        {showDetails && (
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

                            {/* Finale Ausgleichszahlungen */}
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
                        </div>
                    )}

                    {/* STANDARD (nicht completed) */}
                    {!isCompleted && (
                        <div className="p-4 space-y-6 bg-gray-50">
                            {/* FUTURE: Info-Box nutzt statusInfo */}
                            {isFuture && (
                                <div
                                    className={`rounded-lg p-4 border ${statusInfo.borderColor} ${statusInfo.statusBgColor}`}
                                >
                                    <div className={`flex items-center ${statusInfo.textColor}`}>
                                        <span className="mr-2">{statusInfo.icon}</span>
                                        <span className="text-sm">
                                            Dieser Monat ist noch nicht verfügbar. Ausgaben können
                                            erst nach Monatsende bearbeitet werden.
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* NOT TAKEN INTO ACCOUNT: Info-Box nutzt statusInfo */}
                            {notTakenIntoAccount && (
                                <div
                                    className={`rounded-lg p-4 border ${statusInfo.borderColor} ${statusInfo.statusBgColor}`}
                                >
                                    <div className={`flex items-center ${statusInfo.textColor}`}>
                                        <span className="mr-2">{statusInfo.icon}</span>
                                        <span className="text-sm">
                                            Da der Monat abgelaufen ist und keine gespeicherten
                                            Ausgaben vorliegen, wird dieser Monat nicht in die
                                            Abrechnung einbezogen.
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Ausgabenübersicht – behält neutrales Look & Feel, Statusfarben nur für Controls nicht nötig */}
                            {!isFuture && !notTakenIntoAccount && (
                                <div className="p-4 bg-gray-50">
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="font-medium text-gray-700 flex items-center">
                                            Ausgabenübersicht
                                        </h4>
                                        <button
                                            onClick={e => {
                                                e.stopPropagation()
                                                setShowDetails(s => !s)
                                            }}
                                            className="text-sm text-blue-600 hover:text-blue-700 flex items-center transition-colors"
                                        >
                                            {showDetails ? (
                                                <>
                                                    {/* EyeOff */}
                                                    <svg
                                                        className="h-4 w-4 mr-1"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        stroke="currentColor"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                                                        />
                                                    </svg>
                                                    Weniger
                                                </>
                                            ) : (
                                                <>
                                                    {/* Eye */}
                                                    <svg
                                                        className="h-4 w-4 mr-1"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        stroke="currentColor"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                                        />
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                                        />
                                                    </svg>
                                                    Details
                                                </>
                                            )}
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        {/* Gemeinsam */}
                                        <div className="bg-white rounded-lg p-4 border border-gray-200 hover:border-blue-300 transition-colors">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center">
                                                    <div className="p-2 bg-blue-100 rounded-full">
                                                        <Users className="h-4 w-4 text-blue-600" />
                                                    </div>
                                                    <span className="ml-3 text-sm font-medium text-gray-700">
                                                        Gemeinsam
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={e => {
                                                        e.stopPropagation()
                                                        redirectTo('/shared')
                                                    }}
                                                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 p-1 rounded transition-colors"
                                                    title="Zu Gemeinsam wechseln"
                                                >
                                                    <ArrowUpRight className="h-4 w-4" />
                                                </button>
                                            </div>

                                            <div className="text-xl font-bold text-gray-900 mb-2">
                                                €{month.shared?.toFixed(2) ?? '0.00'}
                                            </div>

                                            {showDetails && (
                                                <div className="pt-2 border-t border-gray-100 space-y-1">
                                                    <div className="flex justify-between text-xs">
                                                        <span className="text-gray-600">
                                                            {me.name}:
                                                        </span>
                                                        <span className="font-medium">
                                                            €
                                                            {month.sharedByUser?.[userId]?.toFixed(
                                                                2
                                                            ) ?? '0.00'}
                                                        </span>
                                                    </div>
                                                    {partnerIds.map(id => (
                                                        <div
                                                            key={id}
                                                            className="flex justify-between text-xs"
                                                        >
                                                            <span className="text-gray-600">
                                                                {users[id]?.name}:
                                                            </span>
                                                            <span className="font-medium">
                                                                €
                                                                {month.sharedByUser?.[id]?.toFixed(
                                                                    2
                                                                ) ?? '0.00'}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Kind */}
                                        <div className="bg-white rounded-lg p-4 border border-gray-200 hover:border-purple-300 transition-colors">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center">
                                                    <div className="p-2 bg-purple-100 rounded-full">
                                                        <Baby className="h-4 w-4 text-purple-600" />
                                                    </div>
                                                    <span className="ml-3 text-sm font-medium text-gray-700">
                                                        Kind
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={e => {
                                                        e.stopPropagation()
                                                        redirectTo('/child')
                                                    }}
                                                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 p-1 rounded transition-colors"
                                                    title="Zu Kind wechseln"
                                                >
                                                    <ArrowUpRight className="h-4 w-4" />
                                                </button>
                                            </div>

                                            <div className="text-xl font-bold text-gray-900 mb-2">
                                                €{month.child?.toFixed(2) ?? '0.00'}
                                            </div>

                                            {showDetails && (
                                                <div className="pt-2 border-t border-gray-100 space-y-1">
                                                    <div className="flex justify-between text-xs">
                                                        <span className="text-gray-600">
                                                            {me.name}:
                                                        </span>
                                                        <span className="font-medium">
                                                            €
                                                            {month.childByUser?.[userId]?.toFixed(
                                                                2
                                                            ) ?? '0.00'}
                                                        </span>
                                                    </div>
                                                    {partnerIds.map(id => (
                                                        <div
                                                            key={id}
                                                            className="flex justify-between text-xs"
                                                        >
                                                            <span className="text-gray-600">
                                                                {users[id]?.name}:
                                                            </span>
                                                            <span className="font-medium">
                                                                €
                                                                {month.childByUser?.[id]?.toFixed(
                                                                    2
                                                                ) ?? '0.00'}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Wer schuldet wem? */}
                            {!isFuture && !isCompleted && !notTakenIntoAccount && (
                                <div className="bg-white border-t border-gray-100 rounded-lg p-4 shadow-sm">
                                    <h4 className="text-lg font-semibold text-gray-900 mb-4">
                                        Wer schuldet wem?
                                    </h4>

                                    <div className="space-y-2 mb-4">
                                        {Object.entries(month.balanceByUser || {}).map(
                                            ([id, balance]) => {
                                                if (Math.abs(balance) < 0.01) return null
                                                const user = users[id]
                                                const userOwes = balance < 0
                                                const amount = Math.abs(balance)

                                                return (
                                                    <div
                                                        key={id}
                                                        className={`rounded-lg p-4 ${
                                                            userOwes
                                                                ? 'bg-orange-50 border border-orange-200'
                                                                : 'bg-green-50 border border-green-200'
                                                        }`}
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center">
                                                                <div
                                                                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-white mr-3 ${
                                                                        user?.color === 'blue'
                                                                            ? 'bg-blue-500'
                                                                            : user?.color ===
                                                                                'green'
                                                                              ? 'bg-green-500'
                                                                              : user?.color ===
                                                                                  'purple'
                                                                                ? 'bg-purple-500'
                                                                                : 'bg-gray-500'
                                                                    }`}
                                                                >
                                                                    {user?.name?.charAt(0) || '?'}
                                                                </div>
                                                                <div>
                                                                    <span className="font-medium text-gray-800 text-base">
                                                                        {user?.name || 'Unbekannt'}
                                                                    </span>
                                                                    <span
                                                                        className={`text-base ml-2 ${userOwes ? 'text-orange-600' : 'text-green-600'}`}
                                                                    >
                                                                        {userOwes
                                                                            ? 'schuldet'
                                                                            : 'bekommt'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <span
                                                                className={`text-xl font-bold ${userOwes ? 'text-orange-600' : 'text-green-600'}`}
                                                            >
                                                                €{amount.toFixed(2)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                )
                                            }
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Bestätigungen */}
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
                                                    className="grid grid-cols-2 gap-4 items-center p-3 rounded-lg border border-gray-200 bg-gray-50"
                                                >
                                                    {/* Name */}
                                                    <span className="font-medium text-gray-800 text-base">
                                                        {name}
                                                    </span>

                                                    <div className="flex justify-end">
                                                        {hasRejected ? (
                                                            <div className="flex items-center text-amber-600 font-medium h-8">
                                                                <UserX className="w-5 h-5 mr-2 text-amber-600" />
                                                                <span className="text-base">
                                                                    {isMe
                                                                        ? 'Du hast noch Redebedarf'
                                                                        : 'Hat noch Redebedarf'}
                                                                </span>
                                                            </div>
                                                        ) : isMe ? (
                                                            hasOwnRejection ? (
                                                                <div className="flex items-center text-amber-600 font-medium h-8">
                                                                    <UserX className="w-5 h-5 mr-2 text-amber-600" />
                                                                    <span className="text-base">
                                                                        Du hast noch Redebedarf
                                                                    </span>
                                                                </div>
                                                            ) : (
                                                                <button
                                                                    onClick={e =>
                                                                        toggleMyConfirmation(
                                                                            e,
                                                                            !hasConfirmed
                                                                        )
                                                                    }
                                                                    disabled={isConfirming}
                                                                    className={`px-4 py-1.5 rounded-full font-medium transition-all duration-200 ${
                                                                        hasConfirmed
                                                                            ? 'bg-green-500 text-white hover:bg-green-600'
                                                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                                    } ${isConfirming ? 'opacity-50 cursor-not-allowed' : ''} text-base`}
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
                                                                <span className="text-base">
                                                                    Bestätigt
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center text-gray-500 font-medium h-8">
                                                                <span className="text-base">
                                                                    Noch offen
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Monat abschließen */}
                            {isPast && !isCompleted && (
                                <div className="bg-white rounded-lg p-4 shadow-sm">
                                    <button
                                        onClick={async e => {
                                            e.stopPropagation()
                                            if (!canCompleteMonth) return
                                            try {
                                                const [yearStr, monthStr] =
                                                    month.monthKey.split('-')
                                                const year = parseInt(yearStr, 10)
                                                const monthNumber = parseInt(monthStr, 10)
                                                await saveSnapshot(month.groupId, year, monthNumber)
                                                setLocalStatus('completed')
                                            } catch (err) {
                                                console.error('❌ Snapshot fehlgeschlagen:', err)
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

                            {/* Hinweis bei Klärungsbedarf – nutzt statusInfo */}
                            {needsClarification && (
                                <div
                                    className={`rounded p-4 border-l-4 ${statusInfo.statusBgColor}`}
                                >
                                    <div className={`flex items-center ${statusInfo.textColor}`}>
                                        <span className="mr-2">{statusInfo.icon}</span>
                                        <span className="font-medium">
                                            Dieser Monat hat offene Klärungspunkte und benötigt
                                            deine Aufmerksamkeit.
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
