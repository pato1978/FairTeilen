import { Capacitor } from '@capacitor/core'
import type { Notification } from '@/types/notification'

const API_BASE_URL = Capacitor.isNativePlatform?.()
    ? `${import.meta.env.VITE_API_URL_NATIVE}/api`
    : '/api'

export const NotificationService = {
    /**
     * Lädt alle Notifications für einen spezifischen User in einer spezifischen Gruppe
     * SICHERHEIT: Beide Parameter sind erforderlich
     */
    async getNotifications(userId: string, groupId: string, page = 1): Promise<Notification[]> {
        if (!userId || !groupId) {
            throw new Error('userId und groupId sind erforderlich für Notifications')
        }

        const qs = new URLSearchParams({
            groupId,
            userId,
            page: page.toString(),
        }).toString()

        const url = `${API_BASE_URL}/notification?${qs}`
        console.log('🔄 NotificationService: Loading notifications', { userId, groupId, url })

        const res = await fetch(url)
        if (!res.ok) {
            if (res.status === 403) {
                throw new Error('Nicht autorisiert für diese Notifications')
            }
            throw new Error('Fehler beim Laden der Notifications')
        }

        const data = await res.json()

        // Client-seitige Sicherheitsprüfung
        const validNotifications = data.filter(
            (n: Notification) => n.userId === userId && n.groupId === groupId
        )

        if (validNotifications.length !== data.length) {
            console.error(
                '🔒 SECURITY WARNING: Server returned notifications for wrong user/group!'
            )
            console.error('Expected:', { userId, groupId })
            console.error('Got some with different ids')
        }

        return validNotifications
    },

    /**
     * Markiert eine Notification als gelesen
     * SICHERHEIT: userId und groupId werden zur Validierung mitgesendet
     */
    async markAsRead(id: string, userId: string, groupId: string): Promise<void> {
        if (!id || !userId || !groupId) {
            throw new Error('id, userId und groupId sind erforderlich')
        }

        const qs = new URLSearchParams({
            userId,
            groupId,
        }).toString()

        const url = `${API_BASE_URL}/notification/${id}/read?${qs}`
        console.log('✅ NotificationService: Marking as read', { id, userId, groupId })

        const res = await fetch(url, { method: 'PUT' })

        if (!res.ok) {
            if (res.status === 403) {
                throw new Error('Nicht autorisiert diese Notification zu ändern')
            }
            throw new Error('Fehler beim Aktualisieren der Notification')
        }
    },

    /**
     * Zählt nur ungelesene Notifications für einen spezifischen User in einer Gruppe
     */
    async getUnreadCount(userId: string, groupId: string): Promise<number> {
        if (!userId || !groupId) {
            console.warn('⚠️ Cannot get unread count without userId and groupId')
            return 0
        }

        const qs = new URLSearchParams({
            groupId,
            userId,
        }).toString()

        const url = `${API_BASE_URL}/notification/unread-count?${qs}`
        console.log('📊 NotificationService: Getting unread count', { userId, groupId })

        const res = await fetch(url)
        if (!res.ok) {
            console.error('Failed to get unread count')
            return 0
        }

        const count = await res.json()
        return count ?? 0
    },
}
