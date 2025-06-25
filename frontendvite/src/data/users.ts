import { User, Users, User as UserIcon, Crown } from 'lucide-react'

export interface AppUser {
    id: string // <-- jetzt string (GUID-kompatibel!)
    name: string
    email: string
    initials: string
    role: string
    icon: typeof User
    color: string // Tailwind-Farbe, z. B. "bg-green-500"
}

// IDs **müssen mit den GUIDs übereinstimmen**, die du im Backend vergibst
export const users: Record<string, AppUser> = {
    '4dfde3f4-d9c2-4b0b-875f-2e5e41b531f7': {
        id: '4dfde3f4-d9c2-4b0b-875f-2e5e41b531f7',
        name: 'Patrizio',
        email: 'partner1@example.com',
        initials: 'PV',
        role: 'Hauptnutzer',
        icon: Crown,
        color: 'blue-500',
    },
    '9aaf8e82-6d38-4b2b-84ce-9130c6dd98a9': {
        id: '9aaf8e82-6d38-4b2b-84ce-9130c6dd98a9',
        name: 'Martyna',
        email: 'partner2@example.com',
        initials: 'MS',
        role: 'Partner',
        icon: Users,
        color: 'green-500',
    },
    '3fcb1191-1741-4b1d-87be-c0be899b356c': {
        id: '3fcb1191-1741-4b1d-87be-c0be899b356c',
        name: 'Partner 3',
        email: 'partner3@example.com',
        initials: 'SS',
        role: 'Partner',
        icon: Users,
        color: 'bg-purple-500',
    },
    'guest-user-0000': {
        id: 'guest-user-0000',
        name: 'Gast',
        email: 'gast@example.com',
        initials: 'G',
        role: 'Gastnutzer',
        icon: UserIcon,
        color: 'bg-orange-500',
    },
}
