'use client'
import React, { useState } from 'react'
import { useUser } from '@/context/user-context.tsx'
import type { MonthlyOverview } from '@/types/monthly-overview'
import { useNavigate } from 'react-router-dom'

import { getStatusInfo } from '@/pages/jahresuebersicht/status-info'
import {
    ArrowUpRight,
    Users,
    Baby,
    ArrowRight,
    UserX,
    UserCheck,
    CheckCircle,
    Clock,
    AlertTriangle,
    Calendar,
    ChevronDown,
    ChevronUp,
    Eye,
    MousePointer,
} from 'lucide-react'
import { users } from '@/data/users'

interface EnhancedMonthCardProps {
    month: MonthlyOverview
    onClick?: () => void
    onStatusClick?: (e: React.MouseEvent) => void
}

function ClickableCard({
    children,
    onClick,
    className = '',
    disabled = false,
}: React.PropsWithChildren<{ onClick?: () => void; className?: string; disabled?: boolean }>) {
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

export function EnhancedMonthCard({ month, onClick, onStatusClick }: EnhancedMonthCardProps) {
    const [isExpanded, setIsExpanded] = useState(false)
    const [showExpenseDetails, setShowExpenseDetails] = useState(false)
    const [reactions, setReactions] = useState<Record<string, boolean | null>>(
        month.rejectionsByUser ?? {}
    )

    const navigate = useNavigate()
    const { userId } = useUser()
    const statusInfo = getStatusInfo(month.status)
    if (!userId) return null

    const allUserIds = Object.keys(month.totalByUser)
    const partnerIds = allUserIds.filter(id => id !== userId)
    const me = users[userId]
    const youPaid = month.totalByUser[userId] ?? 0
    const partnerId = partnerIds[0]
    const partnerPaid = month.totalByUser[partnerId] ?? 0
    const difference = Math.abs(youPaid - partnerPaid)
    const youOwe = youPaid < partnerPaid

    const isPending = month.status === 'pending'
    const isCompleted = month.status === 'completed'
    const isFuture = month.status === 'future'
    const needsClarification = month.status === 'needs-clarification'
    const notTakenIntoAccount = month.status === 'notTakenIntoAccount'

    const handleToggleConfirmation = (id: string) =>
        setReactions(prev => ({ ...prev, [id]: prev[id] === false ? null : false }))

    const handleHeaderClick = (e: React.MouseEvent) => {
        e.stopPropagation()
        setIsExpanded(prev => !prev)
        onClick?.()
    }

    return (
        <div
            className={`group relative bg-white rounded-lg shadow-sm border-2 ${statusInfo.borderColor} overflow-hidden`}
        >
            <ClickableCard onClick={handleHeaderClick} disabled={false} className="relative">
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900">{month.name}</h3>
                    <div className="flex items-center space-x-2">
                        <div
                            onClick={onStatusClick}
                            className={`flex items-center px-3 py-1 rounded-full ${statusInfo.statusBgColor}`}
                        >
                            {statusInfo.icon}
                            <span className={`ml-1.5 text-sm font-medium ${statusInfo.textColor}`}>
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
                <div className="p-4 space-y-6 bg-gray-50">
                    {isFuture && (
                        <div className="bg-gray-100 border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center text-gray-600">
                                <Calendar className="h-5 w-5 mr-3" />
                                <span className="text-sm">
                                    Dieser Monat ist noch nicht verfügbar. Ausgaben können erst nach
                                    Monatsende bearbeitet werden.
                                </span>
                            </div>
                        </div>
                    )}
                    {notTakenIntoAccount && (
                        <div className="bg-gray-100 border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center text-gray-600">
                                <Calendar className="h-5 w-5 mr-3" />
                                <span className="text-sm">
                                    Dieser Monat ist hat keine Ausgaben und wird daher nicht
                                    berücksichtigt.
                                </span>
                            </div>
                        </div>
                    )}

                    {!isFuture && !notTakenIntoAccount && (
                        <div className="bg-white rounded-lg p-4 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-lg font-semibold text-gray-900">Ausgaben</h4>
                                <ActionButton
                                    onClick={e => {
                                        e.stopPropagation()
                                        setShowExpenseDetails(s => !s)
                                    }}
                                    variant="primary"
                                >
                                    <Eye className="h-4 w-4 mr-1" />
                                    {showExpenseDetails ? 'Weniger Details' : 'Details anzeigen'}
                                </ActionButton>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Gemeinsam */}
                                <div className="bg-blue-50 border-2 border-blue-100 rounded-lg p-4 text-center">
                                    <div className="flex items-center justify-center mb-2">
                                        <Users className="h-5 w-5 text-blue-600 mr-2" />
                                        <span className="text-base text-blue-900">Gemeinsam</span>
                                    </div>
                                    <div className="text-base font-bold text-blue-900 mb-2">
                                        €{month.shared.toFixed(2)}
                                    </div>
                                    {showExpenseDetails && (
                                        <div className="text-sm text-blue-700 space-y-1 mb-3">
                                            <div>
                                                {me.name}: €
                                                {month.sharedByUser[userId]?.toFixed(2) ?? '0.00'}
                                            </div>
                                            {partnerIds.map(id => (
                                                <div key={id}>
                                                    {users[id].name}: €
                                                    {month.sharedByUser[id]?.toFixed(2) ?? '0.00'}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <ActionButton
                                        onClick={e => {
                                            e.stopPropagation()
                                            navigate('/shared')
                                        }}
                                        variant="primary"
                                        size="sm"
                                    >
                                        <ArrowUpRight className="h-4 w-4 mr-1" />
                                        Ausgaben verwalten
                                    </ActionButton>
                                </div>
                                {/* Kind */}
                                <div className="bg-purple-50 border-2 border-purple-100 rounded-lg p-4 text-center">
                                    <div className="flex items-center justify-center mb-2">
                                        <Baby className="h-5 w-5 text-purple-600 mr-2" />
                                        <span className="text-base text-purple-900">Kind</span>
                                    </div>
                                    <div className="text-base font-bold text-purple-900 mb-2">
                                        €{month.child.toFixed(2)}
                                    </div>
                                    {showExpenseDetails && (
                                        <div className="text-sm text-purple-700 space-y-1 mb-3">
                                            <div>
                                                {me.name}: €
                                                {month.childByUser[userId]?.toFixed(2) ?? '0.00'}
                                            </div>
                                            {partnerIds.map(id => (
                                                <div key={id}>
                                                    {users[id].name}: €
                                                    {month.childByUser[id]?.toFixed(2) ?? '0.00'}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <ActionButton
                                        onClick={e => {
                                            e.stopPropagation()
                                            navigate('/child')
                                        }}
                                        variant="primary"
                                        size="sm"
                                    >
                                        <ArrowUpRight className="h-4 w-4 mr-1" />
                                        Ausgaben verwalten
                                    </ActionButton>
                                </div>
                                {/* Gesamt */}
                                <div className="bg-gray-100 border-2 border-gray-200 rounded-lg p-4 text-center">
                                    <div className="flex items-center justify-center mb-2">
                                        <span className="text-base text-gray-700">Gesamt</span>
                                    </div>
                                    <div className="text-base font-bold text-gray-900 mb-2">
                                        €{month.total.toFixed(2)}
                                    </div>
                                    {showExpenseDetails && (
                                        <div className="text-sm text-gray-600 space-y-1">
                                            <div>
                                                {me.name}: €
                                                {month.totalByUser[userId]?.toFixed(2) ?? '0.00'}
                                            </div>
                                            {partnerIds.map(id => (
                                                <div key={id}>
                                                    {users[id].name}: €
                                                    {month.totalByUser[id]?.toFixed(2) ?? '0.00'}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {!isFuture && !isCompleted && !notTakenIntoAccount && (
                        <div className="bg-white rounded-lg p-4 shadow-sm">
                            <h4 className="text-lg font-semibold text-gray-900 mb-4">
                                Bestätigungen
                            </h4>
                            <div className="space-y-3">
                                {Object.keys(month.totalByUser).map(id => {
                                    const isMe = id === userId
                                    const name = isMe
                                        ? 'Du'
                                        : (users[id]?.name ?? `Partner (${id})`)
                                    const hasRejected = reactions[id] === true
                                    const hasConfirmed = false
                                    const iHaveRedebedarf = reactions[userId] === true

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
                                                        <UserX className="h-5 w-5 mr-2" />
                                                        <span>Hat noch Redebedarf</span>
                                                    </div>
                                                ) : isMe ? (
                                                    <ActionButton
                                                        onClick={e => {
                                                            e.stopPropagation()
                                                            if (!iHaveRedebedarf)
                                                                handleToggleConfirmation(id)
                                                        }}
                                                        variant={
                                                            iHaveRedebedarf
                                                                ? 'disabled'
                                                                : hasConfirmed
                                                                  ? 'confirmed'
                                                                  : 'unconfirmed'
                                                        }
                                                        size="md"
                                                        disabled={iHaveRedebedarf}
                                                    >
                                                        <UserCheck className="h-5 w-5 mr-2" />
                                                        <span>
                                                            {iHaveRedebedarf
                                                                ? 'Bestätigen'
                                                                : hasConfirmed
                                                                  ? 'Zurücknehmen'
                                                                  : 'Bestätigen'}
                                                        </span>
                                                    </ActionButton>
                                                ) : (
                                                    <div className="flex items-center text-green-600 font-medium h-8">
                                                        <UserCheck className="h-5 w-5 mr-2" />
                                                        <span>Bestätigt</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {needsClarification && (
                        <div className="bg-orange-100 border-l-4 border-orange-500 p-4 rounded">
                            <div className="flex items-center">
                                <AlertTriangle className="h-6 w-6 text-orange-600 mr-3" />
                                <span className="text-orange-700 font-medium">
                                    Dieser Monat hat offene Klärungspunkte und benötigt Ihre
                                    Aufmerksamkeit.
                                </span>
                            </div>
                        </div>
                    )}

                    {isCompleted && (
                        <div className="bg-green-100 border-l-4 border-green-500 p-4 rounded">
                            <div className="flex items-center">
                                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                                <span className="text-green-700 font-medium">
                                    Dieser Monat ist vollständig abgeschlossen und von allen
                                    bestätigt.
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
