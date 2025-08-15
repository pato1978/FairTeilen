// src/context/user-context.tsx - FINAL MIT localStorage UND Plattform-Validierung
import { createContext, ReactNode, useContext, useEffect, useState } from 'react'
import { UserService, type AppUser } from '@/services/user/UserService'
import { UserIdService } from '@/services/user/UserIdService'
import { getUsersByGroup } from '@/data/users'
import { GROUP_ID } from '@/config/group-config'
import { Capacitor } from '@capacitor/core'

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

    /**
     * Initialisiert den UserProvider beim App-Start mit plattform-spezifischer Logic.
     *
     * Ablauf:
     * 1. Prüfe localStorage auf gespeicherte User-ID
     * 2. Falls vorhanden: Validiere gegen aktuelle Plattform-User aus users.ts
     * 3. Falls gültig: Lade Backend-Daten, falls ungültig: User-Auswahl
     * 4. Falls nicht vorhanden: User-Auswahl
     *
     * @throws {Error} Bei Backend-Fehlern oder Validierungsfehlern
     */
    useEffect(() => {
        const initializeUser = async () => {
            console.group('[UserProvider] [INIT] App-Initialisierung gestartet')
            console.log(
                '[UserProvider] [INIT] Platform:',
                Capacitor.isNativePlatform() ? 'Native App' : 'Web Development'
            )
            console.log('[UserProvider] [INIT] Group-ID:', GROUP_ID)

            setIsLoading(true)
            setError(null)

            try {
                // ===== SCHRITT 1: localStorage prüfen =====
                console.log('[UserProvider] [LOAD] Prüfe localStorage auf gespeicherte User-ID...')
                const savedUserId = await UserIdService.loadUserId()

                console.log('[UserProvider] [LOAD] localStorage-Ergebnis:', {
                    found: !!savedUserId,
                    userId: savedUserId || 'nicht vorhanden',
                    platform: GROUP_ID,
                })

                if (savedUserId) {
                    // ===== SCHRITT 2: Plattform-Validierung =====
                    console.log(
                        '[UserProvider] [VALIDATE] Validiere User-ID gegen aktuelle Plattform...'
                    )

                    const platformUsers = getUsersByGroup(GROUP_ID)
                    const isValidForPlatform = !!platformUsers[savedUserId]

                    console.log('[UserProvider] [VALIDATE] Plattform-Validierung:', {
                        savedUserId,
                        platform: GROUP_ID,
                        isValid: isValidForPlatform,
                        availableUserIds: Object.keys(platformUsers),
                        availableUserNames: Object.values(platformUsers).map(u => u.name),
                    })

                    if (isValidForPlatform) {
                        // ===== SCHRITT 3a: Gültige User-ID → Backend laden =====
                        console.log('[UserProvider] [LOAD] User-ID gültig - lade Backend-Daten...')

                        const userData = await UserService.getUserInfo(savedUserId)

                        setUserId(savedUserId)
                        setUser(userData)

                        console.log(
                            '[UserProvider] [SUCCESS] User erfolgreich aus localStorage geladen:',
                            {
                                userId: userData.id,
                                displayName: userData.displayName,
                                groupId: userData.groupId,
                                platform: GROUP_ID,
                                source: 'localStorage + Backend',
                            }
                        )
                    } else {
                        // ===== SCHRITT 3b: Ungültige User-ID → User-Auswahl =====
                        console.warn(
                            '[UserProvider] [FALLBACK] Gespeicherte User-ID gehört nicht zur aktuellen Plattform'
                        )
                        console.log(
                            '[UserProvider] [FALLBACK] Lösche ungültige User-ID und zeige User-Auswahl'
                        )

                        await UserIdService.saveUserId('') // Ungültige ID löschen
                        // userId bleibt null → UserSelectPage wird angezeigt
                    }
                } else {
                    // ===== SCHRITT 4: Keine User-ID → User-Auswahl =====
                    console.log('[UserProvider] [FALLBACK] Keine gespeicherte User-ID gefunden')
                    console.log(
                        '[UserProvider] [FALLBACK] Zeige User-Auswahl für Plattform:',
                        GROUP_ID
                    )

                    const platformUsers = getUsersByGroup(GROUP_ID)
                    console.log('[UserProvider] [FALLBACK] Verfügbare User für Auswahl:', {
                        platform: GROUP_ID,
                        userCount: Object.keys(platformUsers).length,
                        users: Object.values(platformUsers).map(u => ({
                            id: u.id,
                            name: u.name,
                            groupId: u.groupId,
                        })),
                    })

                    if (Object.keys(platformUsers).length === 0) {
                        throw new Error(
                            `Keine User für Plattform ${GROUP_ID} in src/data/users.ts definiert`
                        )
                    }
                }
            } catch (error) {
                // ===== FEHLERBEHANDLUNG =====
                const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler'
                console.error('[UserProvider] [ERROR] Initialisierungsfehler:', {
                    error: errorMessage,
                    platform: GROUP_ID,
                    savedUserId: await UserIdService.loadUserId().catch(() => 'Fehler beim Laden'),
                })

                setError(`User-Initialisierung fehlgeschlagen: ${errorMessage}`)
                setUserId(null)
                setUser(null)
            } finally {
                // ===== FINALISIERUNG =====
                setIsLoading(false)
                setIsReady(true) // KRITISCH: Immer auf true setzen für Rendering

                console.log('[UserProvider] [INIT] Initialisierung abgeschlossen:', {
                    isReady: true,
                    hasUserId: !!userId,
                    hasUser: !!user,
                    willShowUserSelect: !userId,
                    platform: GROUP_ID,
                })
                console.groupEnd()
            }
        }

        initializeUser()
    }, [])

    /**
     * Lädt User-Daten vom Backend für eine gegebene User-ID.
     *
     * @param id - User-ID zum Laden
     * @throws {Error} Bei Backend-Fehlern oder ungültigen User-Daten
     */
    const loadUserFromBackend = async (id: string): Promise<void> => {
        if (!id) return

        try {
            console.log('[UserProvider] [LOAD] Lade User-Daten für ID:', id)
            const userData = await UserService.getUserInfo(id)
            setUser(userData)
            setError(null)
            console.log(
                '[UserProvider] [SUCCESS] User-Daten erfolgreich geladen:',
                userData.displayName || userData.id
            )
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler'
            console.error('[UserProvider] [ERROR] Fehler beim Laden der User-Daten:', errorMessage)
            setError(`User-Daten konnten nicht geladen werden: ${errorMessage}`)
            setUser(null)
        }
    }

    /**
     * Setzt neue User-ID, validiert sie gegen aktuelle Plattform und speichert persistent.
     * Wird bei User-Auswahl und User-Wechsel verwendet.
     *
     * @param id - User-ID aus src/data/users.ts
     * @throws {Error} Bei Validierungs- oder Backend-Fehlern
     */
    const setUserIdWithBackend = async (id: string): Promise<void> => {
        console.group('[UserProvider] [SELECT] User-Wechsel gestartet')
        console.log('[UserProvider] [SELECT] User-ID:', {
            userId: id,
            platform: GROUP_ID,
            timestamp: new Date().toISOString(),
        })

        if (!id) throw new Error('User-ID darf nicht leer sein')

        setIsLoading(true)
        setError(null)

        try {
            // ===== PLATTFORM-VALIDIERUNG =====
            console.log('[UserProvider] [VALIDATE] Prüfe User-ID gegen aktuelle Plattform...')
            const platformUsers = getUsersByGroup(GROUP_ID)
            const userFromConfig = platformUsers[id]

            if (!userFromConfig) {
                const availableIds = Object.keys(platformUsers)
                console.error(
                    '[UserProvider] [VALIDATE] User-ID nicht für aktuelle Plattform verfügbar:',
                    {
                        userId: id,
                        platform: GROUP_ID,
                        availableUserIds: availableIds,
                        availableUserNames: Object.values(platformUsers).map(u => u.name),
                    }
                )
                throw new Error(`User-ID ${id} nicht verfügbar für Plattform ${GROUP_ID}`)
            }

            console.log('[UserProvider] [VALIDATE] User-ID validiert:', {
                userId: id,
                userName: userFromConfig.name,
                platform: GROUP_ID,
                groupId: userFromConfig.groupId,
            })

            // ===== BACKEND-VALIDIERUNG =====
            console.log('[UserProvider] [LOAD] Prüfe User-Existenz im Backend...')
            const exists = await UserService.userExists(id)
            if (!exists) {
                throw new Error(`User ${id} existiert nicht im Backend`)
            }

            // ===== USER-DATEN LADEN =====
            console.log('[UserProvider] [LOAD] Lade User-Daten vom Backend...')
            await loadUserFromBackend(id)

            // ===== PERSISTIERUNG =====
            console.log('[UserProvider] [SAVE] Speichere User-ID in localStorage...')
            await UserIdService.saveUserId(id)

            // ===== STATE AKTUALISIERUNG =====
            setUserId(id)

            console.log('[UserProvider] [SUCCESS] User-Wechsel erfolgreich:', {
                userId: id,
                displayName: user?.displayName,
                platform: GROUP_ID,
                persistedToStorage: true,
            })
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler'
            console.error('[UserProvider] [ERROR] User-Wechsel fehlgeschlagen:', {
                userId: id,
                error: errorMessage,
                platform: GROUP_ID,
            })

            setError(`User-Wechsel fehlgeschlagen: ${errorMessage}`)
            throw error
        } finally {
            setIsLoading(false)
            console.groupEnd()
        }
    }

    /**
     * Aktualisiert die User-Daten des aktuell angemeldeten Users.
     *
     * @throws {Error} Wenn kein User angemeldet ist
     */
    const refreshUser = async (): Promise<void> => {
        if (!userId) return
        console.log('[UserProvider] [REFRESH] Refreshe User-Daten...')
        setIsLoading(true)
        setError(null)

        try {
            await loadUserFromBackend(userId)
        } finally {
            setIsLoading(false)
        }
    }

    /**
     * Aktualisiert User-Daten im Backend und lokal.
     *
     * @param updates - Teilweise User-Daten zum Aktualisieren
     * @throws {Error} Bei Validierungs- oder Backend-Fehlern
     */
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

            console.log('[UserProvider] [UPDATE] User-Daten erfolgreich aktualisiert')
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler'
            console.error(
                '[UserProvider] [ERROR] Fehler beim Aktualisieren der User-Daten:',
                errorMessage
            )
            setError(`Update fehlgeschlagen: ${errorMessage}`)
            throw error
        } finally {
            setIsLoading(false)
        }
    }

    /**
     * Lädt alle verfügbaren User vom Backend.
     *
     * @returns Liste aller verfügbaren User
     * @throws {Error} Bei Backend-Fehlern
     */
    const getAllAvailableUsers = async (): Promise<AppUser[]> => {
        console.log('[UserProvider] [LOAD] Lade alle verfügbaren User...')

        try {
            const users = await UserService.getAllUsers()
            console.log(`[UserProvider] [SUCCESS] ${users.length} User für Auswahl verfügbar`)
            return users
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler'
            console.error('[UserProvider] [ERROR] Fehler beim Laden der User-Liste:', errorMessage)
            setError(`User-Liste konnte nicht geladen werden: ${errorMessage}`)
            throw error
        }
    }

    /**
     * Meldet den aktuellen User ab und löscht alle gespeicherten Daten.
     */
    const logout = async (): Promise<void> => {
        console.log('[UserProvider] [LOGOUT] Benutzer wird abgemeldet...')
        setIsLoading(true)

        try {
            await UserIdService.saveUserId('') // localStorage leeren
            setUserId(null)
            setUser(null)
            setError(null)
            console.log('[UserProvider] [SUCCESS] Benutzer erfolgreich abgemeldet')
        } catch (error) {
            console.error('[UserProvider] [ERROR] Fehler beim Abmelden:', error)
            setUserId(null)
            setUser(null)
        } finally {
            setIsLoading(false)
        }
    }

    /**
     * Löscht den aktuellen Error-Status.
     */
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
