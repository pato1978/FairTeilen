import { createContext, useCallback, useContext, useEffect, useState } from 'react'
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

    console.log('📢 NotificationProvider mounted')

    const load = useCallback(async () => {
        if (!userId) return
        console.log('🔄 NotificationService: API call', { userId })
        setIsLoading(true)
        try {
            const [data, count] = await Promise.all([
                NotificationService.getNotifications(userId),
                NotificationService.getUnreadCount(userId),
            ])
            setNotifications(data)
            setUnreadCount(count)
            console.log('✅ NotificationProvider: Data loaded', { count: data.length })
        } catch (error) {
            console.error('❌ Notification load error:', error)
            setNotifications([])
            setUnreadCount(0)
        } finally {
            setIsLoading(false)
        }
    }, [userId])

    useEffect(() => {
        load()
        const id = setInterval(load, 30000)
        return () => clearInterval(id)
    }, [load])

    const markAsRead = async (id?: string) => {
        if (!userId) return
        console.log('🔄 markAsRead', { id })
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
        console.log('🔄 markAllAsRead')
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
