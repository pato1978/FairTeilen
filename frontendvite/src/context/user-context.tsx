import { createContext, ReactNode, useContext, useEffect, useState } from 'react'
import { users } from '@/data/users.ts' // Testdaten für Namen, Farben etc.
import { loadUserId, saveUserId } from '@/services/UserIdService' // Plattformspezifische Speicherlogik

// Kontext-Typdefinition
type UserContextType = {
    userId: string | null
    setUserId: (id: string) => Promise<void> // neu: async
    isReady: boolean
    user: AppUser | null
}

type AppUser = {
    id: string
    name: string
}

type Props = {
    children: ReactNode
}

// Kontext erzeugen
const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: Props): JSX.Element {
    const [userId, setUserId] = useState<string | null>(null)
    const [isReady, setIsReady] = useState(false)

    // Benutzerobjekt aus Testdaten extrahieren
    const user = userId ? (users[userId] ?? null) : null

    // Beim App-Start gespeicherte Benutzer-ID laden
    useEffect(() => {
        const init = async () => {
            const id = await loadUserId() // lokal oder Preferences
            setUserId(id)
            setIsReady(true) // jetzt kann die App gerendert werden
        }
        init()
    }, [])

    // Benutzer-ID setzen UND dauerhaft speichern
    const setUserIdWithStorage = async (id: string): Promise<void> => {
        await saveUserId(id) // z. B. via Preferences oder localStorage
        setUserId(id) // im React-Zustand aktualisieren
    }

    return (
        <UserContext.Provider
            value={{
                userId,
                setUserId: setUserIdWithStorage,
                isReady,
                user,
            }}
        >
            {children}
        </UserContext.Provider>
    )
}

// Custom Hook für Zugriff auf den Kontext
export function useUser(): UserContextType {
    const context = useContext(UserContext)
    if (!context) {
        throw new Error('useUser must be used within a UserProvider')
    }
    return context
}
