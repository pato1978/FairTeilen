import { createContext, useContext, useEffect, useState } from 'react'
import { NotificationService } from '@/services/NotificationService'
import type { Notification } from '@/types/notification'
import { useUser } from './user-context'

interface NotificationContextType {
    notifications: Notification[]
    unreadCount: number
    isLoading: boolean
    refreshNotifications: () => Promise<void>
    markAsRead: (id?: string) => Promise<void>
    markAllAsRead: () => Promise<void>
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const { userId } = useUser()
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [isLoading, setIsLoading] = useState(false)

    const load = async () => {
        if (!userId) return
        setIsLoading(true)
        try {
            const data = await NotificationService.getNotifications(userId)
            setNotifications(data)
            const count = await NotificationService.getUnreadCount(userId)
            setUnreadCount(count)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        load()
        const id = setInterval(load, 30000)
        return () => clearInterval(id)
    }, [userId])

    const markAsRead = async (id?: string) => {
        if (!userId) return
        if (id) {
            await NotificationService.markAsRead(id)
        } else {
            for (const n of notifications.filter(n => !n.isRead)) {
                await NotificationService.markAsRead(n.id)
            }
        }
        await load()
    }

    const markAllAsRead = async () => {
        if (!userId) return
        for (const n of notifications.filter(n => !n.isRead)) {
            await NotificationService.markAsRead(n.id)
        }
        await load()
    }

    return (
        <NotificationContext.Provider
            value={{ notifications, unreadCount, isLoading, refreshNotifications: load, markAsRead, markAllAsRead }}
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
