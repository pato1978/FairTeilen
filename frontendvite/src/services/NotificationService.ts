import { Capacitor } from '@capacitor/core'
import { GROUP_ID } from '@/config/group-config'
import type { Notification } from '@/types/notification'

const API_BASE_URL = Capacitor.isNativePlatform?.()
    ? `${import.meta.env.VITE_API_URL_NATIVE}/api`
    : '/api'

export const NotificationService = {
    async getNotifications(userId: string, page = 1): Promise<Notification[]> {
        const qs = new URLSearchParams({
            groupId: GROUP_ID,
            userId,
            page: page.toString(),
        }).toString()
        const url = `${API_BASE_URL}/notification?${qs}`
        const res = await fetch(url)
        if (!res.ok) throw new Error('Fehler beim Laden der Notifications')
        return await res.json()
    },

    async markAsRead(id: string): Promise<void> {
        const url = `${API_BASE_URL}/notification/${id}/read`
        const res = await fetch(url, { method: 'PUT' })
        if (!res.ok) throw new Error('Fehler beim Aktualisieren der Notification')
    },

    async getUnreadCount(userId: string): Promise<number> {
        const qs = new URLSearchParams({
            groupId: GROUP_ID,
            userId,
        }).toString()
        const url = `${API_BASE_URL}/notification/unread-count?${qs}`
        const res = await fetch(url)
        if (!res.ok) return 0
        const count = await res.json()
        return count ?? 0
    },
}
