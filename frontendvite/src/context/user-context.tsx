// src/context/user-context.tsx - FINAL MIT VOLLSTÄNDIGER BACKEND-INTEGRATION
import { createContext, ReactNode, useContext, useEffect, useState } from 'react'
import { UserService, type AppUser } from '@/services/UserService'

// Kontext-Typdefinition
type UserContextType = {
    userId: string | null
    setUserId: (id: string) => Promise<void>
    isReady: boolean
    user: AppUser | null
    refreshUser: () => Promise<void>
    updateUserData: (updates: Partial<AppUser>) => Promise<void>
    isLoading: boolean
    logout: () => Promise<void>
    // 🆕 Zusätzliche Helper für bessere UX
    getAllAvailableUsers: () => Promise<AppUser[]>
    error: string | null
    clearError: () => void
}

type Props = {
    children: ReactNode
}

// ✅ Einfache localStorage-Funktionen (ersetzt UserIdService komplett)
const STORAGE_KEY = 'current_user_id'

const saveUserIdToStorage = async (userId: string): Promise<void> => {
    try {
        localStorage.setItem(STORAGE_KEY, userId)
        console.log('💾 User-ID in localStorage gespeichert:', userId)
    } catch (error) {
        console.warn('⚠️ localStorage nicht verfügbar:', error)
        // Graceful degradation - App funktioniert trotzdem
    }
}

const loadUserIdFromStorage = async (): Promise<string | null> => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY)
        console.log('📂 User-ID aus localStorage geladen:', stored || 'keine')
        return stored
    } catch (error) {
        console.warn('⚠️ localStorage nicht verfügbar:', error)
        return null
    }
}

const clearUserIdFromStorage = async (): Promise<void> => {
    try {
        localStorage.removeItem(STORAGE_KEY)
        console.log('🗑️ User-ID aus localStorage entfernt')
    } catch (error) {
        console.warn('⚠️ localStorage nicht verfügbar:', error)
    }
}

// Kontext erzeugen
const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: Props): JSX.Element {
    const [userId, setUserId] = useState<string | null>(null)
    const [user, setUser] = useState<AppUser | null>(null)
    const [isReady, setIsReady] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // ✅ App-Start: Gespeicherte User-ID laden und Backend-Daten abrufen
    useEffect(() => {
        const initializeUser = async () => {
            console.log('🚀 UserProvider wird initialisiert...')
            setIsLoading(true)

            try {
                const storedUserId = await loadUserIdFromStorage()

                if (storedUserId) {
                    console.log('📱 Gespeicherte User-ID gefunden:', storedUserId)

                    // Prüfen ob User noch existiert
                    const exists = await UserService.userExists(storedUserId)
                    if (exists) {
                        setUserId(storedUserId)
                        await loadUserFromBackend(storedUserId)
                    } else {
                        console.warn(
                            '⚠️ Gespeicherte User-ID existiert nicht mehr, lösche aus Storage'
                        )
                        await clearUserIdFromStorage()
                    }
                } else {
                    console.log('📱 Keine gespeicherte User-ID - User muss sich anmelden')
                }
            } catch (error) {
                console.error('❌ Fehler bei UserProvider-Initialisierung:', error)
                setError(
                    `Initialisierung fehlgeschlagen: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
                )
            } finally {
                setIsLoading(false)
                setIsReady(true)
                console.log('✅ UserProvider initialisiert')
            }
        }

        initializeUser()
    }, [])

    // ✅ User-Daten vom Backend laden
    const loadUserFromBackend = async (id: string): Promise<void> => {
        if (!id) {
            console.warn('⚠️ Keine User-ID zum Laden vorhanden')
            return
        }

        try {
            console.log('🔄 Lade User-Daten für ID:', id)
            const userData = await UserService.getUserInfo(id)
            setUser(userData)
            setError(null) // Fehler zurücksetzen bei erfolgreichem Laden
            console.log('✅ User-Daten erfolgreich geladen:', userData.displayName || userData.id)
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler'
            console.error('❌ Fehler beim Laden der User-Daten:', errorMessage)

            setError(`User-Daten konnten nicht geladen werden: ${errorMessage}`)
            setUser(null)

            // Bei kritischen Fehlern: User-ID aus Storage entfernen
            if (errorMessage.includes('404') || errorMessage.includes('nicht gefunden')) {
                console.log('🗑️ User existiert nicht mehr, lösche aus Storage')
                await clearUserIdFromStorage()
                setUserId(null)
            }
        }
    }

    // ✅ Benutzer-ID setzen + speichern + Backend laden
    const setUserIdWithBackend = async (id: string): Promise<void> => {
        console.log('🔄 Setze neue User-ID:', id)

        if (!id) {
            throw new Error('User-ID darf nicht leer sein')
        }

        setIsLoading(true)
        setError(null)

        try {
            // 1. Validierung: User existiert?
            const exists = await UserService.userExists(id)
            if (!exists) {
                throw new Error(`User mit ID '${id}' existiert nicht`)
            }

            // 2. State und Storage aktualisieren
            setUserId(id)
            await saveUserIdToStorage(id)

            // 3. User-Daten laden
            await loadUserFromBackend(id)

            console.log('✅ User-Wechsel erfolgreich abgeschlossen')
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler'
            console.error('❌ Fehler beim User-Wechsel:', errorMessage)
            setError(`User-Wechsel fehlgeschlagen: ${errorMessage}`)
            throw error // Für UI-Feedback
        } finally {
            setIsLoading(false)
        }
    }

    // ✅ User-Daten manuell neu laden
    const refreshUser = async (): Promise<void> => {
        if (!userId) {
            console.warn('⚠️ Kein User zum Refreshen vorhanden')
            return
        }

        console.log('🔄 Refreshe User-Daten...')
        setIsLoading(true)
        setError(null)

        try {
            await loadUserFromBackend(userId)
        } finally {
            setIsLoading(false)
        }
    }

    // ✅ User-Daten aktualisieren (Frontend + Backend)
    const updateUserData = async (updates: Partial<AppUser>): Promise<void> => {
        if (!user) {
            throw new Error('Kein User geladen - Update nicht möglich')
        }

        setIsLoading(true)
        setError(null)

        try {
            console.log('💾 Aktualisiere User-Daten:', updates)

            // Validierung
            const validation = UserService.validateUserData({ ...user, ...updates })
            if (!validation.isValid) {
                throw new Error(`Validierung fehlgeschlagen: ${validation.errors.join(', ')}`)
            }

            const updatedUser = { ...user, ...updates }
            const savedUser = await UserService.updateUser(updatedUser)
            setUser(savedUser)

            console.log('✅ User-Daten erfolgreich aktualisiert')
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler'
            console.error('❌ Fehler beim Aktualisieren der User-Daten:', errorMessage)
            setError(`Update fehlgeschlagen: ${errorMessage}`)
            throw error
        } finally {
            setIsLoading(false)
        }
    }

    // ✅ Alle verfügbaren User laden (für Profil-Auswahl)
    const getAllAvailableUsers = async (): Promise<AppUser[]> => {
        console.log('🔄 Lade alle verfügbaren User...')

        try {
            const users = await UserService.getAllUsers()
            console.log(`✅ ${users.length} User für Auswahl verfügbar`)
            return users
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler'
            console.error('❌ Fehler beim Laden der User-Liste:', errorMessage)
            setError(`User-Liste konnte nicht geladen werden: ${errorMessage}`)
            throw error
        }
    }

    // ✅ Komplett abmelden (Storage leeren, State zurücksetzen)
    const logout = async (): Promise<void> => {
        console.log('🚪 Benutzer wird abgemeldet...')

        setIsLoading(true)

        try {
            // Storage leeren
            await clearUserIdFromStorage()

            // State zurücksetzen
            setUserId(null)
            setUser(null)
            setError(null)

            console.log('✅ Benutzer erfolgreich abgemeldet')
        } catch (error) {
            console.error('❌ Fehler beim Abmelden:', error)
            // Trotzdem State zurücksetzen für sauberen Zustand
            setUserId(null)
            setUser(null)
        } finally {
            setIsLoading(false)
        }
    }

    // ✅ Fehler manuell löschen
    const clearError = (): void => {
        setError(null)
    }

    const contextValue: UserContextType = {
        userId,
        setUserId: setUserIdWithBackend,
        isReady,
        user,
        refreshUser,
        updateUserData,
        isLoading,
        logout,
        getAllAvailableUsers,
        error,
        clearError,
    }

    return <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>
}

// Custom Hook für Zugriff auf den Kontext
export function useUser(): UserContextType {
    const context = useContext(UserContext)
    if (!context) {
        throw new Error('useUser must be used within a UserProvider')
    }
    return context
}
