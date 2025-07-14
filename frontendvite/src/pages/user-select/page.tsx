import React, { useEffect, useState } from 'react'
import { useUser } from '@/context/user-context.tsx'
import { users } from '@/data/users.ts'
import { useNavigate } from 'react-router-dom'
import { loadHasSeenWelcome, saveHasSeenWelcome, resetHasSeenWelcome } from '@/lib/welcome-storage'

/**
 * (Optional deaktiviert) Komponente zur Auswahl des Nutzers beim ersten Start
 */
export function Page() {
    const { setUserId, isReady } = useUser()

    if (!isReady) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100 text-gray-500">
                Lade Benutzerdaten...
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 text-gray-400 p-4">
            <div className="text-center space-y-4">
                <p className="text-sm opacity-70">Debug-Seite: Benutzer manuell auswählen</p>
                <div className="flex flex-col gap-3">
                    {Object.entries(users).map(([id, user]) => (
                        <button
                            key={id}
                            onClick={async () => {
                                console.log('👆 Button clicked')
                                await setUserId(id) // ← wenn das funktioniert, MUSS saveUserId() geloggt werden
                                console.log('✅ setUserId fertig')
                                resetHasSeenWelcome()
                            }}
                            className={`bg-${user.color} text-white font-semibold py-2 px-4 rounded-lg`}
                        >
                            {user.name}
                        </button>
                    ))}
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
        console.log('👋 WelcomePage useEffect gestartet')

        const run = async () => {
            console.log('💾 Speichere Welcome-Status …')
            await saveHasSeenWelcome(true)

            console.log('➡️ Navigiere zur App (replace: true) …')
            navigate('/', { replace: true }) // ✅ WICHTIG: verhindert Zurückspringen
        }

        const timeout = setTimeout(run, 2000)
        return () => clearTimeout(timeout)
    }, [navigate])

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-[393px] mx-auto w-full">
                <div className="bg-white rounded-lg shadow-lg p-6 text-center">
                    <h1 className="text-2xl font-bold text-gray-800 mb-4">
                        Willkommen, {user?.name}!
                    </h1>
                    <div className={`bg-${user?.color} text-white p-4 rounded-lg mb-6`}>
                        <p className="font-medium">Du hast dich erfolgreich angemeldet</p>
                        <p className="text-sm opacity-90 mt-1">User ID: {user?.id}</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

/**
 * EntryGate - Entscheidet, ob UserSelect, Welcome oder App angezeigt wird
 * → Wird in `AppRouter.tsx` eingebunden
 */
export function UserEntryGate({ children }: { children: React.ReactNode }) {
    const { userId, isReady } = useUser()
    const [hasSeenWelcome, setHasSeenWelcome] = useState<boolean | null>(null)

    useEffect(() => {
        loadHasSeenWelcome().then(seen => setHasSeenWelcome(seen))
    }, [])

    if (!isReady || hasSeenWelcome === null) return null

    if (userId && !users[userId]) {
        localStorage.clear()
        return <Page />
    }

    if (!userId) {
        return <Page />
    }

    if (!hasSeenWelcome) {
        return <WelcomePage />
    }

    return <>{children}</>
}
