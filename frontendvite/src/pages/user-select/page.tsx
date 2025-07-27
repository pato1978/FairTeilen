import React, { useEffect } from 'react'
import { useUser } from '@/context/user-context.tsx'
import { users, getUsersByGroup } from '@/data/users.ts'
import { useNavigate } from 'react-router-dom'
import { loadHasSeenWelcome, saveHasSeenWelcome, resetHasSeenWelcome } from '@/lib/welcome-storage'
import { GROUP_ID } from '@/config/group-config'
import { Capacitor } from '@capacitor/core'
import type { AppUser } from '@/data/users'

/**
 * User-Auswahl-Seite für ersten App-Start.
 * Zeigt nur User der aktuellen Plattform (Web vs. Native) an.
 *
 * @returns JSX.Element - User-Auswahl Interface oder Fehlermeldung
 */
export function Page() {
    const { setUserId, isReady } = useUser()

    // ===== PLATTFORM-SPEZIFISCHE USER-FILTERUNG =====
    /**
     * Lädt nur User die zur aktuellen Plattform gehören.
     * - Web (localhost): 'local-dev-group' → DEV-User IDs
     * - Native App: 'test-group-001' → Production-User IDs
     */
    const platformUsers = getUsersByGroup(GROUP_ID)

    // ===== COMPONENT MOUNT LOGGING =====
    useEffect(() => {
        console.group('[UserSelect] [INIT] User-Auswahl-Komponente initialisiert')
        console.log('[UserSelect] [INIT] Platform-Info:', {
            platform: Capacitor.isNativePlatform() ? 'Native App' : 'Web Development',
            groupId: GROUP_ID,
            isNative: Capacitor.isNativePlatform(),
        })
        console.log('[UserSelect] [INIT] Verfügbare User für aktuelle Plattform:', {
            totalCount: Object.keys(platformUsers).length,
            users: Object.values(platformUsers).map(u => ({
                id: u.id,
                name: u.name,
                email: u.email,
                groupId: u.groupId,
                role: u.role,
            })),
        })

        // Debug: Zeige auch User anderer Plattformen
        const allUsers = Object.values(users)
        const otherPlatformUsers = allUsers.filter(u => u.groupId !== GROUP_ID)
        if (otherPlatformUsers.length > 0) {
            console.log('[UserSelect] [DEBUG] User anderer Plattformen (werden nicht angezeigt):', {
                count: otherPlatformUsers.length,
                users: otherPlatformUsers.map(u => ({
                    id: u.id,
                    name: u.name,
                    groupId: u.groupId,
                })),
            })
        }

        console.groupEnd()
    }, [])

    /**
     * Behandelt User-Auswahl mit Validierung und Persistierung.
     *
     * @param id - Ausgewählte User-ID aus users.ts
     * @param user - User-Objekt für Logging
     */
    const handleUserSelection = async (id: string, user: AppUser) => {
        console.group('[UserSelect] [SELECT] User-Auswahl getätigt')
        console.log('[UserSelect] [SELECT] Ausgewählter User:', {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            groupId: user.groupId,
            platform: GROUP_ID,
            timestamp: new Date().toISOString(),
        })

        try {
            console.log('[UserSelect] [SAVE] Starte User-Auswahl-Prozess...')
            console.log('[UserSelect] [SAVE] - Validiere User-ID gegen Plattform')
            console.log('[UserSelect] [SAVE] - Lade Backend-Daten')
            console.log('[UserSelect] [SAVE] - Speichere in localStorage')

            // setUserId führt komplette Validierung + Backend-Load + localStorage durch
            await setUserId(id)

            console.log('[UserSelect] [SUCCESS] User-Auswahl erfolgreich abgeschlossen:', {
                userId: id,
                userName: user.name,
                platform: GROUP_ID,
                nextStep: 'Welcome-Screen',
            })

            // Welcome-Screen für nächsten Login zurücksetzen
            await resetHasSeenWelcome()
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler'
            console.error('[UserSelect] [ERROR] User-Auswahl fehlgeschlagen:', {
                userId: id,
                userName: user.name,
                error: errorMessage,
                platform: GROUP_ID,
            })

            // User-freundliche Fehlermeldung
            alert(`Fehler bei User-Auswahl: ${errorMessage}`)
        }

        console.groupEnd()
    }

    // ===== RENDER GUARDS =====
    if (!isReady) {
        console.log('[UserSelect] [RENDER] Warte auf UserProvider-Initialisierung...')
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100 text-gray-500">
                Lade Benutzerdaten...
            </div>
        )
    }

    // Validierung: Mindestens ein User für aktuelle Plattform verfügbar
    if (Object.keys(platformUsers).length === 0) {
        console.error('[UserSelect] [ERROR] Keine User für aktuelle Plattform verfügbar:', {
            platform: GROUP_ID,
            configPath: 'src/data/users.ts',
            allUsersCount: Object.keys(users).length,
            allGroups: [...new Set(Object.values(users).map(u => u.groupId))],
        })

        return (
            <div className="min-h-screen flex items-center justify-center bg-red-100 text-red-600 p-4">
                <div className="text-center max-w-md">
                    <h2 className="text-xl font-bold mb-4">⚠️ Konfigurationsfehler</h2>
                    <p className="mb-2">
                        Keine User für Plattform <code>"{GROUP_ID}"</code> verfügbar.
                    </p>
                    <div className="text-sm bg-red-50 p-3 rounded mt-4">
                        <p className="font-semibold">Debug-Info:</p>
                        <p>
                            Datei: <code>src/data/users.ts</code>
                        </p>
                        <p>
                            Plattform: <code>{GROUP_ID}</code>
                        </p>
                        <p>Verfügbare User: {Object.keys(users).length}</p>
                    </div>
                </div>
            </div>
        )
    }

    // ===== HAUPTRENDER =====
    console.log(
        '[UserSelect] [RENDER] Rendere User-Auswahl mit',
        Object.keys(platformUsers).length,
        'Usern'
    )

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
            <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">👋 Willkommen!</h1>
                    <p className="text-gray-600">Wähle deinen Benutzer aus:</p>
                </div>

                {/* User-Buttons */}
                <div className="space-y-3">
                    {Object.entries(platformUsers).map(([id, user]) => (
                        <button
                            key={id}
                            onClick={() => handleUserSelection(id, user)}
                            className={`w-full bg-${user.color} hover:opacity-90 text-white font-semibold py-3 px-4 rounded-lg transition-opacity flex items-center justify-between`}
                        >
                            <div className="flex items-center">
                                <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-3">
                                    <span className="text-sm font-bold">{user.initials}</span>
                                </div>
                                <div className="text-left">
                                    <div className="font-semibold">{user.name}</div>
                                    <div className="text-sm opacity-90">{user.role}</div>
                                </div>
                            </div>
                            <user.icon className="w-5 h-5" />
                        </button>
                    ))}
                </div>

                {/* Debug-Info */}
                <div className="mt-8 pt-4 border-t border-gray-200">
                    <div className="text-xs text-gray-500 space-y-1">
                        <p>
                            <strong>Platform:</strong> {GROUP_ID}
                        </p>
                        <p>
                            <strong>User-Count:</strong> {Object.keys(platformUsers).length}
                        </p>
                        <p>
                            <strong>Environment:</strong>{' '}
                            {Capacitor.isNativePlatform() ? 'Native App' : 'Web Dev'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

/**
 * Komponente zur Begrüßung nach der Auswahl (wird nur 1x gezeigt)
 */
export function WelcomePage() {
    const { userId } = useUser()
    const navigate = useNavigate()

    if (!userId) {
        return (
            <div className="min-h-screen flex items-center justify-center text-red-600 bg-red-100 p-4">
                Fehler: Keine User-ID gesetzt.
            </div>
        )
    }

    const user = users[userId]

    useEffect(() => {
        console.log('[WelcomePage] [INIT] Welcome-Screen gestartet für User:', {
            userId,
            userName: user?.name,
            platform: GROUP_ID,
        })

        const run = async () => {
            console.log('[WelcomePage] [SAVE] Speichere Welcome-Status...')
            await saveHasSeenWelcome(true)

            console.log('[WelcomePage] [NAVIGATE] Navigiere zur Hauptapp...')
            navigate('/', { replace: true }) // ✅ WICHTIG: verhindert Zurückspringen
        }

        const timeout = setTimeout(run, 2000)
        return () => clearTimeout(timeout)
    }, [navigate, userId, user?.name])

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-[393px] mx-auto w-full">
                <div className="bg-white rounded-lg shadow-lg p-6 text-center">
                    <h1 className="text-2xl font-bold text-gray-800 mb-4">
                        Willkommen, {user?.name}!
                    </h1>
                    <div className={`bg-${user?.color} text-white p-4 rounded-lg mb-6`}>
                        <p className="font-medium">Du hast dich erfolgreich angemeldet</p>
                        <p className="text-sm opacity-90 mt-1">Platform: {GROUP_ID}</p>
                    </div>
                    <div className="text-sm text-gray-500">
                        Du wirst automatisch weitergeleitet...
                    </div>
                </div>
            </div>
        </div>
    )
}

/**
 * EntryGate - Entscheidet, ob UserSelect, Welcome oder App angezeigt wird
 * → Wird in `App.tsx` eingebunden
 */
export function UserEntryGate({ children }: { children: React.ReactNode }) {
    const { userId, isReady } = useUser()
    const [hasSeenWelcome, setHasSeenWelcome] = React.useState<boolean | null>(null)

    useEffect(() => {
        console.log('[UserEntryGate] [INIT] Prüfe Welcome-Status...')
        loadHasSeenWelcome().then(seen => {
            console.log('[UserEntryGate] [LOAD] Welcome-Status:', { hasSeenWelcome: seen })
            setHasSeenWelcome(seen)
        })
    }, [])

    console.log('[UserEntryGate] [RENDER] Render-Entscheidung:', {
        isReady,
        userId: !!userId,
        hasSeenWelcome,
        platform: GROUP_ID,
    })

    if (!isReady || hasSeenWelcome === null) {
        console.log('[UserEntryGate] [RENDER] Warte auf Initialisierung...')
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100 text-gray-500">
                App wird geladen...
            </div>
        )
    }

    // User-ID ungültig für aktuelle Plattform
    if (userId && !users[userId]) {
        console.warn('[UserEntryGate] [VALIDATE] User-ID ungültig - zurück zur Auswahl')
        return <Page />
    }

    // Kein User ausgewählt
    if (!userId) {
        console.log('[UserEntryGate] [RENDER] Zeige User-Auswahl')
        return <Page />
    }

    // Welcome-Screen noch nicht gesehen
    if (!hasSeenWelcome) {
        console.log('[UserEntryGate] [RENDER] Zeige Welcome-Screen')
        return <WelcomePage />
    }

    // Alles OK → Hauptapp anzeigen
    console.log('[UserEntryGate] [RENDER] Zeige Hauptapp')
    return <>{children}</>
}
