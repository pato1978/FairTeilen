import { useEffect, useState } from 'react'
import { Check, Settings, LogOut, Users, Crown, Star, User as UserIcon } from 'lucide-react'
import { PageLayout } from '@/components/layout/page-layout'
import { PageHeader } from '@/components/layout/page-header'
import { useNavigate } from 'react-router-dom'
import { useUser } from '@/context/user-context' // ✅ Zentraler Zugriff auf userId

// 🔧 Benutzerliste – später ggf. aus Backend laden
const users = [
    {
        id: '4dfde3f4-d9c2-4b0b-875f-2e5e41b531f7',
        name: 'Partner 1',
        email: 'partner1@example.com',
        role: 'Hauptnutzer',
        icon: Crown,
        color: 'bg-blue-500',
    },
    {
        id: '9aaf8e82-6d38-4b2b-84ce-9130c6dd98a9',
        name: 'Partner 2',
        email: 'partner2@example.com',
        role: 'Partner',
        icon: Users,
        color: 'bg-green-500',
    },
    {
        id: '3fcb1191-1741-4b1d-87be-c0be899b356c',
        name: 'Partner 3',
        email: 'partner3@example.com',
        role: 'Partner',
        icon: Users,
        color: 'bg-purple-500',
    },
    {
        id: 'guest-user-0000',
        name: 'Gast',
        email: 'gast@example.com',
        role: 'Gastnutzer',
        icon: UserIcon,
        color: 'bg-orange-500',
    },
]

export default function ProfilePage() {
    const { userId, setUserId } = useUser() // ✅ zentrale Benutzerverwaltung
    const navigate = useNavigate()
    const [selectedUser, setSelectedUser] = useState(users[0])
    const [showSettings, setShowSettings] = useState(false)

    // 🔄 Wenn sich der UserContext ändert, passe die UI an
    useEffect(() => {
        const found = users.find(u => u.id === userId)
        if (found) setSelectedUser(found)
    }, [userId])

    // ✅ Benutzer aktiv setzen (in UI und Context)
    const handleUserSelect = (user: (typeof users)[0]) => {
        setSelectedUser(user)
        setUserId(user.id)
        console.log(`Wechsel zu Benutzer: ${user.name}`)
    }

    // 🧹 Benutzer abmelden (userId zurücksetzen und zur Startseite navigieren)
    const handleLogout = () => {
        setUserId('')
        localStorage.removeItem('user_id') // Optional – für klare Trennung
        console.log('Benutzer abgemeldet')
        navigate('/')
    }

    return (
        <PageLayout showAddButton={false}>
            <div className="page-header-container">
                <PageHeader title="Profil" showMonthSelector={false} />
            </div>

            <div className="flex-1 px-4 pb-6 mt-4 overflow-y-auto">
                {/* 🧑 Aktueller Benutzer */}
                <div className="bg-white shadow-md rounded-lg p-4 mb-4 border border-blue-100">
                    <h3 className="font-semibold text-lg text-blue-600 mb-3">Aktueller Benutzer</h3>
                    <div className="flex items-center p-3 bg-blue-50 rounded-lg">
                        <div className={`p-3 rounded-full ${selectedUser.color} mr-4`}>
                            <selectedUser.icon className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-medium text-lg">{selectedUser.name}</h4>
                            <p className="text-sm text-gray-600">{selectedUser.email}</p>
                            <span className="inline-block mt-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                                {selectedUser.role}
                            </span>
                        </div>
                        <Check className="h-6 w-6 text-green-500" />
                    </div>
                </div>

                {/* 🔁 Benutzer wechseln */}
                <div className="bg-white shadow-md rounded-lg p-4 mb-4 border border-blue-100">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="font-semibold text-lg text-blue-600">Benutzer wechseln</h3>
                        <Star className="h-5 w-5 text-yellow-300" />
                    </div>
                    <div className="space-y-3">
                        {users.map(user => (
                            <button
                                key={user.id}
                                onClick={() => handleUserSelect(user)}
                                className={`w-full flex items-center p-3 rounded-lg transition-colors ${
                                    selectedUser.id === user.id
                                        ? 'bg-blue-50 border border-blue-200'
                                        : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                                }`}
                            >
                                <div className={`p-2 rounded-full ${user.color} mr-3`}>
                                    <user.icon className="h-5 w-5 text-white" />
                                </div>
                                <div className="flex-1 text-left">
                                    <h4 className="font-medium">{user.name}</h4>
                                    <p className="text-sm text-gray-600">{user.role}</p>
                                </div>
                                {selectedUser.id === user.id && (
                                    <Check className="h-5 w-5 text-green-500" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ⚙️ Einstellungen */}
                <div className="bg-white shadow-md rounded-lg p-4 mb-4 border border-blue-100">
                    <h3 className="font-semibold text-lg text-blue-600 mb-3">Einstellungen</h3>
                    <div className="space-y-3">
                        <button
                            onClick={() => setShowSettings(!showSettings)}
                            className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            <div className="flex items-center">
                                <Settings className="h-5 w-5 text-blue-600 mr-3" />
                                <span>Allgemeine Einstellungen</span>
                            </div>
                            <Star className="h-4 w-4 text-yellow-300" />
                        </button>

                        {/* 🔧 Einfache Dummy-Einstellungen */}
                        {showSettings && (
                            <div className="ml-8 space-y-2 p-3 bg-blue-50 rounded-lg">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Benachrichtigungen</span>
                                    <div className="w-10 h-6 bg-blue-600 rounded-full relative">
                                        <div className="w-4 h-4 bg-white rounded-full absolute top-1 right-1"></div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Dunkler Modus</span>
                                    <div className="w-10 h-6 bg-gray-300 rounded-full relative">
                                        <div className="w-4 h-4 bg-white rounded-full absolute top-1 left-1"></div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Automatische Backups</span>
                                    <div className="w-10 h-6 bg-blue-600 rounded-full relative">
                                        <div className="w-4 h-4 bg-white rounded-full absolute top-1 right-1"></div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 🚪 Logout */}
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center p-3 bg-red-50 rounded-lg hover:bg-red-100 transition-colors text-red-600"
                        >
                            <LogOut className="h-5 w-5 mr-3" />
                            <span>Abmelden</span>
                        </button>
                    </div>
                </div>
            </div>
        </PageLayout>
    )
}
