// src/services/UserService.ts - KORRIGIERT für vollständige Backend-Integration
import { Capacitor } from '@capacitor/core'

export interface AppUser {
    id: string
    displayName?: string
    email?: string
    profileColor?: string
    role: 'Free' | 'Premium' | 'Admin'
    groupId?: string // ✅ HINZUGEFÜGT
    createdAt: string
    isDeleted?: boolean
    avatarUrl?: string
}

// Plattformabhängige API-URL
const API_BASE_URL = Capacitor.isNativePlatform?.()
    ? `${import.meta.env.VITE_API_URL_NATIVE}/api`
    : '/api'

export class UserService {
    /**
     * ✅ Lädt User-Daten vom Backend oder erstellt User falls nicht vorhanden
     */
    static async getUserInfo(userId: string): Promise<AppUser> {
        console.log(`🔄 Lade User-Info für: ${userId}`)

        const res = await fetch(
            `${API_BASE_URL}/user/userinfo?userId=${encodeURIComponent(userId)}`
        )

        if (!res.ok) {
            const errorText = await res.text()
            console.error(`❌ Fehler beim Laden der User-Daten (${res.status}):`, errorText)
            throw new Error(`Fehler beim Laden der User-Daten: ${res.status}`)
        }

        const user = await res.json()
        console.log(`✅ User-Info geladen:`, user.displayName || user.id)
        return user
    }

    /**
     * ✅ Aktualisiert User-Daten im Backend
     */
    static async updateUser(user: AppUser): Promise<AppUser> {
        console.log(`🔄 Aktualisiere User:`, user.displayName || user.id)

        const res = await fetch(`${API_BASE_URL}/user/update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(user),
        })

        if (!res.ok) {
            const errorText = await res.text()
            console.error(`❌ Fehler beim Aktualisieren der User-Daten (${res.status}):`, errorText)
            throw new Error(`Fehler beim Aktualisieren der User-Daten: ${res.status}`)
        }

        const updatedUser = await res.json()
        console.log(`✅ User aktualisiert:`, updatedUser.displayName || updatedUser.id)
        return updatedUser
    }

    /**
     * ✅ KORRIGIERT: Lädt ALLE verfügbaren User vom Backend (kein Fallback mehr!)
     */
    static async getAllUsers(): Promise<AppUser[]> {
        console.log(`🔄 Lade alle User vom Backend...`)

        try {
            const res = await fetch(`${API_BASE_URL}/user`)

            if (!res.ok) {
                const errorText = await res.text()
                console.error(`❌ Fehler beim Laden aller User (${res.status}):`, errorText)
                throw new Error(`Backend-Fehler beim Laden der User-Liste: ${res.status}`)
            }

            const users: AppUser[] = await res.json()
            console.log(`✅ ${users.length} User vom Backend geladen`)

            // Validierung: Mindestens ein User sollte vorhanden sein
            if (users.length === 0) {
                console.warn('⚠️ Keine User in der Datenbank gefunden!')
                throw new Error('Keine User in der Datenbank vorhanden')
            }

            return users
        } catch (error) {
            console.error('❌ Kritischer Fehler beim Laden der User:', error)

            // KEIN FALLBACK mehr - Frontend muss mit dem Fehler umgehen!
            throw new Error(
                `Backend nicht erreichbar oder keine User vorhanden: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
            )
        }
    }

    /**
     * ✅ Prüft ob ein User existiert
     */
    static async userExists(userId: string): Promise<boolean> {
        console.log(`🔄 Prüfe User-Existenz: ${userId}`)

        try {
            const res = await fetch(
                `${API_BASE_URL}/user/exists?userId=${encodeURIComponent(userId)}`
            )

            if (!res.ok) {
                console.warn(`⚠️ Konnte User-Existenz nicht prüfen (${res.status})`)
                return false
            }

            const exists = await res.json()
            console.log(`✅ User ${userId} existiert: ${exists}`)
            return exists
        } catch (error) {
            console.error(`❌ Fehler bei User-Existenz-Prüfung:`, error)
            return false
        }
    }

    /**
     * ✅ Sucht User nach E-Mail
     */
    static async getUserByEmail(email: string): Promise<AppUser | null> {
        console.log(`🔄 Suche User nach E-Mail: ${email}`)

        try {
            const res = await fetch(
                `${API_BASE_URL}/user/by-email?email=${encodeURIComponent(email)}`
            )

            if (res.status === 404) {
                console.log(`ℹ️ Kein User mit E-Mail ${email} gefunden`)
                return null
            }

            if (!res.ok) {
                const errorText = await res.text()
                console.error(`❌ Fehler bei E-Mail-Suche (${res.status}):`, errorText)
                throw new Error(`Fehler bei der E-Mail-Suche: ${res.status}`)
            }

            const user = await res.json()
            console.log(`✅ User gefunden:`, user.displayName || user.id)
            return user
        } catch (error) {
            console.error(`❌ Fehler bei E-Mail-Suche:`, error)
            throw error
        }
    }

    /**
     * ✅ Mappt Backend-Farbe zu CSS-Klasse (robust gegen undefined)
     */
    static mapColorToCss(backendColor?: string): string {
        if (!backendColor) return 'bg-blue-500' // Default

        // Bereits CSS-Klasse? Direkt zurückgeben
        if (backendColor.startsWith('bg-')) return backendColor

        // Legacy-Mapping falls Backend andere Formate liefert
        const colorMap: Record<string, string> = {
            blue: 'bg-blue-500',
            green: 'bg-green-500',
            purple: 'bg-purple-500',
            orange: 'bg-orange-500',
            red: 'bg-red-500',
            yellow: 'bg-yellow-500',
            teal: 'bg-teal-500',
            pink: 'bg-pink-500',
        }

        return colorMap[backendColor.toLowerCase()] || 'bg-blue-500'
    }

    /**
     * ✅ Mappt CSS-Klasse zu Backend-Format
     */
    static mapCssToColor(cssClass: string): string {
        // CSS-Klasse direkt übernehmen - Backend speichert das gleiche Format
        return cssClass || 'bg-blue-500'
    }

    /**
     * 🆕 Validiert User-Daten vor dem Speichern
     */
    static validateUserData(user: Partial<AppUser>): { isValid: boolean; errors: string[] } {
        const errors: string[] = []

        if (!user.id) errors.push('User-ID ist erforderlich')
        if (user.displayName && user.displayName.length > 100)
            errors.push('Benutzername zu lang (max. 100 Zeichen)')
        if (user.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email))
            errors.push('Ungültige E-Mail-Adresse')

        return {
            isValid: errors.length === 0,
            errors,
        }
    }
}
