import React, { useEffect, useState } from 'react'
import { useUser } from '@/context/user-context.tsx'
import { users } from '@/data/users.ts'
import { useNavigate } from 'react-router-dom'

/**
 * Komponente zur Auswahl des Nutzers beim ersten Start
 */
export function UserSelectPage() {
    const { userId, setUserId, isReady } = useUser()

    if (!isReady) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100 text-gray-500">
                Lade Benutzerdaten...
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-[393px] w-full mx-auto">
                <div className="bg-white rounded-lg shadow-lg p-6">
                    <h1 className="text-2xl font-bold text-gray-800 text-center mb-6">
                        Wer bist du?
                    </h1>
                    <div className="flex flex-col gap-4">
                        {Object.entries(users).map(([id, user]) => (
                            <button
                                key={id}
                                onClick={() => {
                                    setUserId(id)
                                    localStorage.removeItem('hasSeenWelcome') // Zurücksetzen, falls vorher mal gesetzt
                                }}
                                className={`bg-${user.color} text-white font-semibold py-4 px-6 rounded-lg shadow-md flex items-center gap-4 hover:opacity-90 active:scale-95 transition-all duration-200`}
                            >
                                <user.icon className="w-6 h-6" />
                                <span>{user.name}</span>
                            </button>
                        ))}
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
    const { user } = useUser()
    const navigate = useNavigate()

    useEffect(() => {
        const timeout = setTimeout(() => {
            localStorage.setItem('hasSeenWelcome', 'true')
            navigate('/')
        }, 2000)

        return () => clearTimeout(timeout)
    }, [])

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
 * → Diese Komponente kommt in `AppRouter.tsx` zum Einsatz!
 */
export function UserEntryGate({ children }: { children: React.ReactNode }) {
    const { userId, isReady } = useUser()

    if (!isReady) {
        return null // oder z. B. <SplashScreen />
    }

    if (!userId) {
        return <UserSelectPage />
    }

    const hasSeenWelcome = localStorage.getItem('hasSeenWelcome') === 'true'
    if (!hasSeenWelcome) {
        return <WelcomePage />
    }

    return <>{children}</> // → App starten
}
