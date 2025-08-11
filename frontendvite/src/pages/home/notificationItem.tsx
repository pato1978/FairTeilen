import { Plus, Edit3, Trash2, CheckCircle, AlertCircle, Clock, Check } from 'lucide-react'
import { useSwipe } from '@/lib/hooks/use-swipe'
import type { Notification } from '@/types/notification'
import { formatRelativeTime } from '@/lib/date-utils'

interface NotificationItemProps {
    notification: Notification
    onDismiss: (id: string) => void
    onClick: () => void
}

export function NotificationItem({ notification, onDismiss, onClick }: NotificationItemProps) {
    // Swipe-Funktionalität
    const { ref, touchProps, style, state } = useSwipe(-80, 0, {
        onSwipeLeft: () => onDismiss(notification.id),
    })

    // Zeitformatierung auf Deutsch
    const timeAgo = formatRelativeTime(notification.createdAt)

    // Icon und Farbe basierend auf Typ
    const getIconAndColor = () => {
        switch (notification.type) {
            case 'Created':
                return {
                    icon: Plus,
                    bgColor: 'bg-emerald-100',
                    iconColor: 'text-emerald-600',
                    borderColor: notification.isRead ? 'border-gray-200' : 'border-emerald-400',
                }
            case 'Updated':
                return {
                    icon: Edit3,
                    bgColor: 'bg-blue-100',
                    iconColor: 'text-blue-600',
                    borderColor: notification.isRead ? 'border-gray-200' : 'border-blue-400',
                }
            case 'Deleted':
                return {
                    icon: Trash2,
                    bgColor: 'bg-rose-100',
                    iconColor: 'text-rose-600',
                    borderColor: notification.isRead ? 'border-gray-200' : 'border-rose-400',
                }
            case 'Confirmed':
                return {
                    icon: CheckCircle,
                    bgColor: 'bg-green-100',
                    iconColor: 'text-green-600',
                    borderColor: notification.isRead ? 'border-gray-200' : 'border-green-400',
                }
            case 'Rejected':
                return {
                    icon: AlertCircle,
                    bgColor: 'bg-amber-100',
                    iconColor: 'text-amber-600',
                    borderColor: notification.isRead ? 'border-gray-200' : 'border-amber-400',
                }
            default:
                return {
                    icon: Clock,
                    bgColor: 'bg-gray-100',
                    iconColor: 'text-gray-600',
                    borderColor: notification.isRead ? 'border-gray-200' : 'border-gray-400',
                }
        }
    }

    const { icon: Icon, bgColor, iconColor, borderColor } = getIconAndColor()

    return (
        <div className="relative overflow-hidden">
            {/* Swipe-Aktion Hintergrund */}
            <div
                className="absolute inset-y-0 right-0 bg-gradient-to-l from-blue-500 to-blue-400 flex items-center justify-end pr-4 text-white"
                style={{ opacity: state.leftOpacity }}
            >
                <div className="flex items-center gap-2">
                    <Check className="h-4 w-4" />
                    <span className="text-xs font-medium">Gelesen</span>
                </div>
            </div>

            {/* Notification Content */}
            <div
                ref={ref}
                className={`
                    relative bg-white transition-all cursor-pointer
                    ${notification.isRead ? 'opacity-75' : 'shadow-sm'}
                    ${state.isDragging ? '' : 'transition-transform duration-300'}
                    hover:shadow-md border-b border-gray-100
                `}
                style={style}
                {...touchProps}
                onClick={onClick}
            >
                <div className="flex items-start gap-3 p-4">
                    {/* Icon Container */}
                    <div
                        className={`
                        flex-shrink-0 w-10 h-10 rounded-full 
                        ${bgColor} 
                        flex items-center justify-center
                        ${!notification.isRead ? 'ring-2 ring-offset-1 ring-' + iconColor.replace('text-', '') : ''}
                    `}
                    >
                        <Icon className={`h-5 w-5 ${iconColor}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                            <p
                                className={`
                                text-sm leading-5
                                ${
                                    notification.isRead
                                        ? 'text-gray-600'
                                        : 'text-gray-900 font-medium'
                                }
                            `}
                            >
                                {notification.message}
                            </p>
                            {/* Unread Badge */}
                            {!notification.isRead && (
                                <span className="ml-2 flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    Neu
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                            <p className="text-xs text-gray-500">{timeAgo}</p>
                            {notification.expenseType && (
                                <span
                                    className={`
                                    text-xs px-2 py-0.5 rounded-full
                                    ${
                                        notification.expenseType === 'shared'
                                            ? 'bg-purple-50 text-purple-700'
                                            : notification.expenseType === 'child'
                                              ? 'bg-pink-50 text-pink-700'
                                              : 'bg-gray-50 text-gray-700'
                                    }
                                `}
                                >
                                    {notification.expenseType === 'shared'
                                        ? 'Gemeinsam'
                                        : notification.expenseType === 'child'
                                          ? 'Kind'
                                          : 'Persönlich'}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Subtle border on left to indicate status */}
                <div
                    className={`absolute left-0 top-0 bottom-0 w-1 ${borderColor.replace('border-', 'bg-')}`}
                />
            </div>
        </div>
    )
}
