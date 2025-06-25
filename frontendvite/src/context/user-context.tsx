import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { users } from '@/data/users.ts' // Testdaten (z. B. für Namen, Farben etc.)
import { loadUserId, saveUserId } from '@/services/user-id-service.ts' // NEU: Service für Speicherlogik

// KONSTANTE: Key wird intern im Service verwendet
const USER_STORAGE_KEY = 'user_id'

// Typdefinition für den Kontext
type UserContextType = {
    userId: string | null
    setUserId: (id: string) => void
    isReady: boolean
    user: AppUser | null
}

type Props = {
    children: ReactNode
}

// Kontext erstellen
const UserContext = createContext<UserContextType | undefined>(undefined)

/*
// ALT: Direkter Zugriff auf localStorage → wird ersetzt durch loadUserId()
const getUserIdFromStorage = (): string | null => {
  return localStorage.getItem(USER_STORAGE_KEY)
}
*/

export function UserProvider({ children }: Props): JSX.Element {
    const [userId, setUserId] = useState<string | null>(null)
    const [isReady, setIsReady] = useState(false)

    // Wenn userId bekannt ist → passenden Benutzer aus Testdaten heraussuchen
    const user = userId ? (users[userId] ?? null) : null

    // NEU: Beim ersten Laden → ID aus Service holen (SQLite oder localStorage, je nach Umgebung)
    useEffect(() => {
        const init = async () => {
            let id = await loadUserId() // holt bestehende ID oder gibt null zurück

            if (!id) {
                id = crypto.randomUUID() // Wenn keine vorhanden → neue ID generieren
                await saveUserId(id) // und dauerhaft speichern
            }

            setUserId(id) // in den Zustand setzen → App kann damit arbeiten
            setIsReady(true) // Signalisiert, dass ID bereit ist
        }

        init()
    }, [])

    // NEU: Benutzer-ID setzen und im Service speichern (z. B. bei Benutzerwechsel oder Reset)
    const setUserIdWithStorage = (id: string): void => {
        saveUserId(id) // dauerhaft speichern
        setUserId(id) // im React-Zustand aktualisieren
    }

    return (
        <UserContext.Provider value={{ userId, setUserId: setUserIdWithStorage, isReady, user }}>
            {children}
        </UserContext.Provider>
    )
}

// Hook für Zugriff auf den Benutzerkontext
export function useUser(): UserContextType {
    const context = useContext(UserContext)
    if (!context) {
        throw new Error('useUser must be used within a UserProvider')
    }
    return context
}
