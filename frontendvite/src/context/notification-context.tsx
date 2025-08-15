import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { NotificationService } from '@/services/common/NotificationService'
import type { Notification } from '@/types/notification'
import { useUser } from './user-context'
import { GROUP_ID } from '@/config/group-config'

interface NotificationContextType {
    notifications: Notification[] // Alle Notifications
    unreadNotifications: Notification[] // Nur ungelesene
    readNotifications: Notification[] // Nur gelesene
    unreadCount: number
    isLoading: boolean
    showOnlyUnread: boolean
    setShowOnlyUnread: (show: boolean) => void
    refreshNotifications: () => Promise<void>
    markAsRead: (id: string) => Promise<void>
    markAllAsRead: () => Promise<void>
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const { userId, isReady } = useUser()
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [showOnlyUnread, setShowOnlyUnread] = useState(true)
    const [isLoading, setIsLoading] = useState(false)

    // GroupId aus Config - WICHTIG: Sollte später aus User Context kommen
    const groupId = GROUP_ID

    // Getrennte Listen berechnen
    const unreadNotifications = notifications.filter(n => !n.isRead)
    const readNotifications = notifications.filter(n => n.isRead)
    const unreadCount = unreadNotifications.length

    const load = useCallback(async () => {
        // Sicherheit: Nur laden wenn User authentifiziert
        if (!userId || !isReady || !groupId) {
            console.warn('⚠️ Cannot load notifications: missing userId or groupId')
            return
        }

        setIsLoading(true)
        try {
            // WICHTIG: Immer userId UND groupId senden
            const data = await NotificationService.getNotifications(userId, groupId)

            // Zusätzliche Sicherheitsprüfung im Frontend
            const filteredData = data.filter(n => n.userId === userId && n.groupId === groupId)

            if (filteredData.length !== data.length) {
                console.error(
                    '🔒 SECURITY WARNING: Server returned notifications for wrong user/group!'
                )
            }

            setNotifications(filteredData)
            console.log('✅ Notifications loaded securely:', {
                total: filteredData.length,
                unread: filteredData.filter(n => !n.isRead).length,
                userId,
                groupId,
            })
        } catch (error) {
            console.error('❌ Notification load error:', error)
            setNotifications([])
        } finally {
            setIsLoading(false)
        }
    }, [userId, groupId, isReady])

    useEffect(() => {
        if (isReady && userId && groupId) {
            load()
            const interval = setInterval(load, 30000)
            return () => clearInterval(interval)
        }
    }, [load, isReady, userId, groupId])

    const markAsRead = async (id: string) => {
        if (!userId || !groupId) {
            console.error('⚠️ Cannot mark as read: missing userId or groupId')
            return
        }

        // Finde die Notification für Sicherheitsprüfung
        const notification = notifications.find(n => n.id === id)
        if (!notification) {
            console.error('⚠️ Notification not found:', id)
            return
        }

        // Sicherheitsprüfung: Gehört diese Notification zu diesem User?
        if (notification.userId !== userId || notification.groupId !== groupId) {
            console.error('🔒 SECURITY: Cannot mark notification of another user/group!')
            return
        }

        try {
            await NotificationService.markAsRead(id, userId, groupId)

            // Optimistisches Update
            setNotifications(prev => prev.map(n => (n.id === id ? { ...n, isRead: true } : n)))

            // Server-Sync nach kurzer Verzögerung
            setTimeout(() => load(), 500)
        } catch (error) {
            console.error('❌ Error marking as read:', error)
            await load() // Reload to sync state
        }
    }

    const markAllAsRead = async () => {
        if (!userId || !groupId) {
            console.error('⚠️ Cannot mark all as read: missing userId or groupId')
            return
        }

        try {
            // Nur eigene ungelesene Notifications markieren
            const myUnread = unreadNotifications.filter(
                n => n.userId === userId && n.groupId === groupId
            )

            if (myUnread.length === 0) {
                console.log('No unread notifications to mark')
                return
            }

            const promises = myUnread.map(n =>
                NotificationService.markAsRead(n.id, userId, groupId)
            )
            await Promise.all(promises)

            // Optimistisches Update
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))

            // Server-Sync
            setTimeout(() => load(), 500)
        } catch (error) {
            console.error('❌ Error marking all as read:', error)
            await load()
        }
    }

    return (
        <NotificationContext.Provider
            value={{
                notifications,
                unreadNotifications,
                readNotifications,
                unreadCount,
                isLoading,
                showOnlyUnread,
                setShowOnlyUnread,
                refreshNotifications: load,
                markAsRead,
                markAllAsRead,
            }}
        >
            {children}
        </NotificationContext.Provider>
    )
}

export function useNotification() {
    const ctx = useContext(NotificationContext)
    if (!ctx) throw new Error('useNotification must be inside NotificationProvider')
    return ctx
}
