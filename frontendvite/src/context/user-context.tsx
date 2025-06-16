import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

// Konstanten
const USER_STORAGE_KEY = 'user_id'
const DEFAULT_USER_ID = 'debug-user-id'

// Typdefinitionen
type UserContextType = {
    userId: string
    setUserId: (id: string) => void
}

type Props = {
    children: ReactNode
}

// Kontext erstellen
const UserContext = createContext<UserContextType | undefined>(undefined)

// Storage Hilfsfunktion
const getUserIdFromStorage = (): string => {
    const storedId = localStorage.getItem(USER_STORAGE_KEY)
    if (!storedId) {
        localStorage.setItem(USER_STORAGE_KEY, DEFAULT_USER_ID)
        return DEFAULT_USER_ID
    }
    return storedId
}

export function UserProvider({ children }: Props): JSX.Element {
    const [userId, setUserId] = useState<string>('')

    useEffect(() => {
        const initialUserId = getUserIdFromStorage()
        setUserId(initialUserId)
    }, [])

    const setUserIdWithStorage = (id: string): void => {
        localStorage.setItem(USER_STORAGE_KEY, id)
        setUserId(id)
    }

    return (
        <UserContext.Provider value={{ userId, setUserId: setUserIdWithStorage }}>
            {children}
        </UserContext.Provider>
    )
}

export function useUser(): UserContextType {
    const context = useContext(UserContext)
    if (!context) {
        throw new Error('useUser must be used within a UserProvider')
    }
    return context
}
