import { Crown, Users } from 'lucide-react'

export interface AppUser {
    id: string // GUID-kompatibel
    name: string
    email: string
    initials: string
    role: string
    icon: typeof Users
    color: string // Tailwind-Farbe, z. B. "bg-green-500"
    groupId: string
}

// ✅ Alle Nutzer – IDs müssen eindeutig sein!
export const users: Record<string, AppUser> = {
    // 👤 Martyna – test-group-001
    '9aaf8e82-6d38-4b2b-84ce-9130c6dd98a9': {
        id: '9aaf8e82-6d38-4b2b-84ce-9130c6dd98a9',
        name: 'Martyna',
        email: 'm.p.siuda@gmail.com',
        initials: 'MS',
        role: 'Partnerin',
        icon: Users,
        color: 'green-500',
        groupId: 'test-group-001',
    },

    // 👤 Martyna – local-dev-group
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa': {
        id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        name: 'Martyna (DEV)',
        email: 'm.p.siuda@gmail.com',
        initials: 'MS',
        role: 'Partnerin',
        icon: Users,
        color: 'green-500',
        groupId: 'local-dev-group',
    },

    // 👑 Patrizio – test-group-001
    '4dfde3f4-d9c2-4b0b-875f-2e5e41b531f7': {
        id: '4dfde3f4-d9c2-4b0b-875f-2e5e41b531f7',
        name: 'Patrizio',
        email: 'pveglia@gmx.de',
        initials: 'PV',
        role: 'Hauptnutzer',
        icon: Crown,
        color: 'blue-500',
        groupId: 'test-group-001',
    },

    // 👑 Patrizio – local-dev-group
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb': {
        id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        name: 'Patrizio (DEV)',
        email: 'pveglia@gmx.de',
        initials: 'PV',
        role: 'Hauptnutzer',
        icon: Crown,
        color: 'blue-500',
        groupId: 'local-dev-group',
    },
}

// 🔍 Alle User einer bestimmten Gruppe (z. B. für Select, Provider etc.)
export const getUsersByGroup = (groupId: string): Record<string, AppUser> => {
    return Object.fromEntries(Object.entries(users).filter(([_, user]) => user.groupId === groupId))
}

// 🔁 Gruppe zu einer gegebenen userId ermitteln (z. B. für Fallback-Checks)
export const getGroupForUserId = (userId: string): string | undefined => {
    return users[userId]?.groupId
}
