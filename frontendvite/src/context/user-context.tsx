// src/context/user-context.tsx - FINAL OHNE localStorage
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
    getAllAvailableUsers: () => Promise<AppUser[]>
    error: string | null
    clearError: () => void
}

type Props = {
    children: ReactNode
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: Props): JSX.Element {
    const [userId, setUserId] = useState<string | null>(null)
    const [user, setUser] = useState<AppUser | null>(null)
    const [isReady, setIsReady] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const initializeUser = async () => {
            console.log('🚀 UserProvider wird initialisiert...')
            setIsLoading(true)

            try {
                const users = await UserService.getAllUsers()

                if (users.length > 0) {
                    const firstUser = users[0] // Optional: bessere Auswahl
                    setUserId(firstUser.id)
                    setUser(firstUser)
                    console.log('✅ User geladen:', firstUser.displayName)
                } else {
                    console.warn('⚠️ Keine Benutzer im System gefunden')
                    setError('Keine Benutzer im System gefunden')
                }
            } catch (error) {
                const msg = error instanceof Error ? error.message : 'Unbekannter Fehler'
                console.error('❌ Fehler beim Initialisieren:', msg)
                setError(msg)
            } finally {
                setIsLoading(false)
                setIsReady(true)
            }
        }

        initializeUser()
    }, [])

    const loadUserFromBackend = async (id: string): Promise<void> => {
        if (!id) return

        try {
            console.log('🔄 Lade User-Daten für ID:', id)
            const userData = await UserService.getUserInfo(id)
            setUser(userData)
            setError(null)
            console.log('✅ User-Daten erfolgreich geladen:', userData.displayName || userData.id)
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler'
            console.error('❌ Fehler beim Laden der User-Daten:', errorMessage)
            setError(`User-Daten konnten nicht geladen werden: ${errorMessage}`)
            setUser(null)
        }
    }

    const setUserIdWithBackend = async (id: string): Promise<void> => {
        console.log('🔄 Setze neue User-ID:', id)

        if (!id) throw new Error('User-ID darf nicht leer sein')

        setIsLoading(true)
        setError(null)

        try {
            const exists = await UserService.userExists(id)
            if (!exists) throw new Error(`User mit ID '${id}' existiert nicht`)

            setUserId(id)
            await loadUserFromBackend(id)

            console.log('✅ User-Wechsel erfolgreich abgeschlossen')
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler'
            console.error('❌ Fehler beim User-Wechsel:', errorMessage)
            setError(`User-Wechsel fehlgeschlagen: ${errorMessage}`)
            throw error
        } finally {
            setIsLoading(false)
        }
    }

    const refreshUser = async (): Promise<void> => {
        if (!userId) return
        console.log('🔄 Refreshe User-Daten...')
        setIsLoading(true)
        setError(null)

        try {
            await loadUserFromBackend(userId)
        } finally {
            setIsLoading(false)
        }
    }

    const updateUserData = async (updates: Partial<AppUser>): Promise<void> => {
        if (!user) throw new Error('Kein User geladen - Update nicht möglich')

        setIsLoading(true)
        setError(null)

        try {
            const validation = UserService.validateUserData({ ...user, ...updates })
            if (!validation.isValid) {
                throw new Error(`Validierung fehlgeschlagen: ${validation.errors.join(', ')}`)
            }

            const savedUser = await UserService.updateUser({ ...user, ...updates })
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

    const logout = async (): Promise<void> => {
        console.log('🚪 Benutzer wird abgemeldet...')
        setIsLoading(true)

        try {
            setUserId(null)
            setUser(null)
            setError(null)
            console.log('✅ Benutzer erfolgreich abgemeldet')
        } catch (error) {
            console.error('❌ Fehler beim Abmelden:', error)
            setUserId(null)
            setUser(null)
        } finally {
            setIsLoading(false)
        }
    }

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

export function useUser(): UserContextType {
    const context = useContext(UserContext)
    if (!context) throw new Error('useUser must be used within a UserProvider')
    return context
}
