// src/pages/profile/page.tsx - FINALE VERSION - 100% BACKEND-INTEGRATION - VOLLSTÄNDIG
import { useEffect, useState } from 'react'
import {
    Check,
    Crown,
    LogOut,
    Settings,
    Star,
    User as UserIcon,
    Users,
    AlertCircle,
    X,
} from 'lucide-react'
import { PageLayout } from '@/components/layout/page-layout'
import { PageHeader } from '@/components/layout/page-header'
import { useNavigate } from 'react-router-dom'
import { useUser } from '@/context/user-context.tsx'
import { UserService, type AppUser } from '@/services/user/UserService'

export default function ProfilePage() {
    // ✅ Alle Funktionen aus dem vollständig Backend-integrierten Context
    const {
        //userId, // Aktuelle User-ID (aus localStorage + Backend)
        setUserId, // User wechseln (speichert + lädt Backend-Daten)
        user, // Aktueller User (komplett aus Backend)
        updateUserData, // User-Daten im Backend aktualisieren
        isLoading, // Loading-State für Backend-Operationen
        logout, // Komplett abmelden (Storage + State löschen)
        getAllAvailableUsers, // Alle User für Auswahl laden
        error, // Backend-Fehler aus Context
        clearError, // Fehler manuell löschen
    } = useUser()

    const navigate = useNavigate()

    // 🎨 UI State - lokale Verwaltung für bessere UX
    const [availableUsers, setAvailableUsers] = useState<AppUser[]>([]) // Alle User für Auswahl
    const [showSettings, setShowSettings] = useState(false) // Toggle für allgemeine Einstellungen
    const [showPersonalSettings, setShowPersonalSettings] = useState(false) // Toggle für persönliche Einstellungen
    const [personalData, setPersonalData] = useState({
        // Lokale Bearbeitung vor Backend-Save
        username: '',
        email: '',
        color: 'bg-blue-500',
    })
    const [isLoadingUsers, setIsLoadingUsers] = useState(false) // Separater Loading-State für User-Liste
    const [userLoadError, setUserLoadError] = useState<string | null>(null) // Separate Fehler für User-Liste

    // ✅ ALLE verfügbaren User vom Backend laden - KEINE Hardcoding mehr!
    useEffect(() => {
        const loadAvailableUsers = async () => {
            if (!user) return // Warten bis aktueller User geladen ist

            setIsLoadingUsers(true)
            setUserLoadError(null)

            try {
                console.log('🔄 Lade alle verfügbaren User für Profil-Auswahl...')

                // ✅ Echter Backend-Call - keine Mock-Daten!
                const users = await getAllAvailableUsers()
                setAvailableUsers(users)

                console.log(`✅ ${users.length} User für Profil-Auswahl geladen`)

                // Personal Data mit aktuellem User synchronisieren
                setPersonalData({
                    username: user.displayName || '',
                    email: user.email || '',
                    color: UserService.mapColorToCss(user.profileColor),
                })
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler'
                console.error('❌ Fehler beim Laden der User-Liste:', errorMessage)
                setUserLoadError(errorMessage)

                // Notfall-Fallback: Nur aktueller User (besser als gar nichts)
                if (user) {
                    console.log('⚠️ Fallback: Verwende nur aktuellen User')
                    setAvailableUsers([user])
                }
            } finally {
                setIsLoadingUsers(false)
            }
        }

        loadAvailableUsers()
    }, [user, getAllAvailableUsers]) // Reagiert auf User-Änderungen

    // ✅ Benutzer wechseln - 100% Backend-integriert
    const handleUserSelect = async (selectedUser: AppUser) => {
        // Optimierung: Nicht wechseln wenn bereits ausgewählt
        if (selectedUser.id === user?.id) {
            console.log('ℹ️ User bereits ausgewählt, ignoriere Klick')
            return
        }

        try {
            console.log(`🔄 Wechsle zu User: ${selectedUser.displayName || selectedUser.id}`)
            // ✅ Context macht ALLES automatisch: Storage + Backend-Laden
            await setUserId(selectedUser.id)
            console.log('✅ User-Wechsel erfolgreich')
        } catch (error) {
            console.error('❌ User-Wechsel fehlgeschlagen:', error)
            // Error wird automatisch im Context gesetzt und hier im UI angezeigt
        }
    }

    // ✅ Persönliche Daten ändern (nur lokal bis zum Speichern)
    const handlePersonalDataChange = (field: string, value: string) => {
        setPersonalData(prev => ({
            ...prev,
            [field]: value,
        }))
    }

    // ✅ Persönliche Daten im Backend speichern - vollständig integriert
    const handleSavePersonalData = async () => {
        try {
            console.log('💾 Speichere persönliche Daten im Backend:', personalData)

            // ✅ Backend-Update über Context
            await updateUserData({
                displayName: personalData.username,
                email: personalData.email,
                profileColor: UserService.mapCssToColor(personalData.color),
            })

            // Lokale User-Liste optimistisch aktualisieren für sofortige UI-Reaktion
            setAvailableUsers(prev =>
                prev.map(u =>
                    u.id === user?.id
                        ? {
                              ...u,
                              displayName: personalData.username,
                              email: personalData.email,
                              profileColor: personalData.color,
                          }
                        : u
                )
            )

            console.log('✅ Persönliche Daten erfolgreich im Backend gespeichert')
            // TODO: Success-Toast für bessere UX
        } catch (error) {
            console.error('❌ Speichern im Backend fehlgeschlagen:', error)
            // Error wird automatisch im Context gesetzt und hier angezeigt
        }
    }

    // ✅ Abmelden - vollständig über Context (Storage + State)
    const handleLogout = async () => {
        try {
            console.log('🚪 Starte Logout...')
            await logout() // Context macht Storage-Cleanup + State-Reset automatisch
            navigate('/') // Zur Startseite nach erfolgreichem Logout
        } catch (error) {
            console.error('❌ Logout fehlgeschlagen:', error)
            // Trotzdem zur Startseite, da Context State zurückgesetzt wird
            navigate('/')
        }
    }

    // 🎨 Verfügbare Farben für den User (werden ins Backend gespeichert)
    const availableColors = [
        { name: 'Blau', value: 'bg-blue-500' },
        { name: 'Grün', value: 'bg-green-500' },
        { name: 'Lila', value: 'bg-purple-500' },
        { name: 'Orange', value: 'bg-orange-500' },
        { name: 'Rot', value: 'bg-red-500' },
        { name: 'Gelb', value: 'bg-yellow-500' },
        { name: 'Türkis', value: 'bg-teal-500' },
        { name: 'Rosa', value: 'bg-pink-500' },
    ]

    // 🎭 Icon basierend auf User-Rolle (aus Backend-Daten)
    const resolveUserIcon = (role: string): React.ElementType => {
        switch (role) {
            case 'Admin':
                return Crown
            case 'Premium':
                return Users
            default:
                return UserIcon
        }
    }

    // ⏳ Loading State - warten auf Backend-Daten
    if (isLoadingUsers || !user) {
        return (
            <PageLayout showAddButton={false}>
                <div className="page-header-container">
                    <PageHeader title="Profil" showMonthSelector={false} />
                </div>
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Lade Benutzerdaten vom Backend...</p>
                        {isLoadingUsers && (
                            <p className="text-sm text-gray-500 mt-2">
                                Verfügbare User werden geladen...
                            </p>
                        )}
                    </div>
                </div>
            </PageLayout>
        )
    }

    // Icon für aktuellen User
    const CurrentUserIcon = resolveUserIcon(user.role)

    return (
        <PageLayout showAddButton={false}>
            <div className="page-header-container">
                <PageHeader title="Profil" showMonthSelector={false} />
            </div>

            <div className="flex-1 px-4 pb-6 mt-4 overflow-y-auto">
                {/* ✅ Error-Banner für Backend-Fehler - User-freundliche Anzeige */}
                {(error || userLoadError) && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 flex items-start">
                        <AlertCircle className="h-5 w-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                            <h4 className="text-sm font-medium text-red-800">
                                Backend-Verbindungsfehler
                            </h4>
                            <p className="text-sm text-red-700 mt-1">{error || userLoadError}</p>
                            <p className="text-xs text-red-600 mt-2">
                                Prüfen Sie Ihre Internetverbindung oder versuchen Sie es später
                                erneut.
                            </p>
                        </div>
                        <button
                            onClick={() => {
                                clearError()
                                setUserLoadError(null)
                            }}
                            className="text-red-500 hover:text-red-700 transition-colors"
                            aria-label="Fehlermeldung schließen"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                )}

                {/* ✅ Aktueller Benutzer - 100% Backend-Daten */}
                <div className="bg-white shadow-md rounded-lg p-4 mb-4 border border-blue-100">
                    <h3 className="font-semibold text-lg text-blue-600 mb-3">Aktueller Benutzer</h3>
                    <div className="flex items-center p-3 bg-blue-50 rounded-lg">
                        {/* User-Icon mit Farbe aus Backend */}
                        <div
                            className={`p-3 rounded-full ${UserService.mapColorToCss(user.profileColor)} mr-4`}
                        >
                            <CurrentUserIcon className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1">
                            {/* Alle Daten aus Backend */}
                            <h4 className="font-medium text-lg">
                                {user.displayName || 'Unbekannt'}
                            </h4>
                            <p className="text-sm text-gray-600">{user.email || 'Keine E-Mail'}</p>
                            <div className="flex items-center mt-1 space-x-2">
                                {/* User-Rolle aus Backend */}
                                <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                                    {user.role}
                                </span>
                                {/* User-ID für Debug-Zwecke */}
                                <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                    ID: {user.id.slice(0, 8)}...
                                </span>
                            </div>
                        </div>
                        <Check className="h-6 w-6 text-green-500" />
                    </div>
                </div>

                {/* ✅ Benutzer wechseln - ALLE User vom Backend (keine Mock-Daten!) */}
                <div className="bg-white shadow-md rounded-lg p-4 mb-4 border border-blue-100">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="font-semibold text-lg text-blue-600">Benutzer wechseln</h3>
                        <div className="flex items-center space-x-2">
                            {/* Anzahl verfügbarer User aus Backend */}
                            <span className="text-xs text-gray-500">
                                {availableUsers.length} verfügbar
                            </span>
                            <Star className="h-5 w-5 text-yellow-300" />
                        </div>
                    </div>

                    {/* Fallback wenn keine User vom Backend geladen werden konnten */}
                    {availableUsers.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <UserIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                            <p>Keine anderen User verfügbar</p>
                            {userLoadError && (
                                <p className="text-sm text-red-500 mt-1">
                                    Backend-Fehler beim Laden
                                </p>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {/* ✅ User-Liste komplett aus Backend */}
                            {availableUsers.map(availableUser => {
                                const IconComponent = resolveUserIcon(availableUser.role)
                                const isSelected = user.id === availableUser.id

                                return (
                                    <button
                                        key={availableUser.id}
                                        onClick={() => handleUserSelect(availableUser)}
                                        disabled={isLoading || isSelected}
                                        className={`w-full flex items-center p-3 rounded-lg transition-colors ${
                                            isSelected
                                                ? 'bg-blue-50 border border-blue-200'
                                                : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                                        } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        {/* Farbe aus Backend */}
                                        <div
                                            className={`p-2 rounded-full ${UserService.mapColorToCss(availableUser.profileColor)} mr-3`}
                                        >
                                            <IconComponent className="h-5 w-5 text-white" />
                                        </div>
                                        <div className="flex-1 text-left">
                                            {/* Alle Daten aus Backend */}
                                            <h4 className="font-medium">
                                                {availableUser.displayName || 'Unbekannt'}
                                            </h4>
                                            <p className="text-sm text-gray-600">
                                                {availableUser.role}
                                            </p>
                                            <p className="text-xs text-gray-400">
                                                {availableUser.email || 'Keine E-Mail'}
                                            </p>
                                        </div>
                                        {isSelected && <Check className="h-5 w-5 text-green-500" />}
                                        {/* Loading-Indikator während User-Wechsel */}
                                        {isLoading && isSelected && (
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                                        )}
                                    </button>
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* ✅ Einstellungen-Bereich */}
                <div className="bg-white shadow-md rounded-lg p-4 mb-4 border border-blue-100">
                    <h3 className="font-semibold text-lg text-blue-600 mb-3">Einstellungen</h3>
                    <div className="space-y-3">
                        {/* 🔧 Allgemeine Einstellungen - Toggle-Bereich */}
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

                        {/* Dummy-Einstellungen (später echte Funktionalität) */}
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

                        {/* ✅ Persönliche Einstellungen - Backend-Integration */}
                        <button
                            onClick={() => setShowPersonalSettings(!showPersonalSettings)}
                            className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            <div className="flex items-center">
                                <UserIcon className="h-5 w-5 text-blue-600 mr-3" />
                                <span>Persönliche Einstellungen</span>
                            </div>
                            <Star className="h-4 w-4 text-yellow-300" />
                        </button>

                        {/* ✅ Persönliche Daten Formular - speichert direkt ins Backend */}
                        {showPersonalSettings && (
                            <div className="ml-8 space-y-4 p-4 bg-blue-50 rounded-lg">
                                {/* ✅ Username - wird als displayName ins Backend gespeichert */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Benutzername
                                    </label>
                                    <input
                                        type="text"
                                        value={personalData.username}
                                        onChange={e =>
                                            handlePersonalDataChange('username', e.target.value)
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Ihr Benutzername"
                                        maxLength={100} // Backend-Validierung
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Wird als DisplayName im Backend gespeichert
                                    </p>
                                </div>

                                {/* ✅ E-Mail - wird direkt ins Backend gespeichert */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        E-Mail-Adresse
                                    </label>
                                    <input
                                        type="email"
                                        value={personalData.email}
                                        onChange={e =>
                                            handlePersonalDataChange('email', e.target.value)
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="ihre.email@example.com"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Wird in der AppUser-Tabelle gespeichert
                                    </p>
                                </div>

                                {/* ✅ Farbe auswählen - wird als ProfileColor ins Backend gespeichert */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Ihre Farbe
                                    </label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {availableColors.map(color => (
                                            <button
                                                key={color.value}
                                                onClick={() =>
                                                    handlePersonalDataChange('color', color.value)
                                                }
                                                className={`p-3 rounded-lg transition-all ${color.value} ${
                                                    personalData.color === color.value
                                                        ? 'ring-2 ring-gray-800 ring-offset-2'
                                                        : 'hover:scale-105'
                                                }`}
                                                title={color.name}
                                            >
                                                {personalData.color === color.value && (
                                                    <Check className="h-4 w-4 text-white mx-auto" />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Wird als ProfileColor im Backend gespeichert
                                    </p>
                                </div>

                                {/* ✅ Speichern Button - Backend-Integration mit Loading-State */}
                                <button
                                    onClick={handleSavePersonalData}
                                    disabled={isLoading}
                                    className={`w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center ${
                                        isLoading ? 'opacity-50 cursor-not-allowed' : ''
                                    }`}
                                >
                                    {isLoading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                            Speichere im Backend...
                                        </>
                                    ) : (
                                        <>
                                            <Check className="h-4 w-4 mr-2" />
                                            Änderungen speichern
                                        </>
                                    )}
                                </button>

                                {/* Info-Text für User */}
                                <div className="bg-blue-100 border border-blue-200 rounded p-2">
                                    <p className="text-xs text-blue-700">
                                        💡 Alle Änderungen werden direkt in der Datenbank
                                        gespeichert und sind sofort für alle Geräte verfügbar.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* ✅ Logout - Backend-Integration mit Storage-Cleanup */}
                        <button
                            onClick={handleLogout}
                            disabled={isLoading}
                            className={`w-full flex items-center p-3 bg-red-50 rounded-lg hover:bg-red-100 transition-colors text-red-600 ${
                                isLoading ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                        >
                            <LogOut className="h-5 w-5 mr-3" />
                            <span>Abmelden</span>
                            {isLoading && (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 ml-auto"></div>
                            )}
                        </button>
                    </div>
                </div>

                {/* ✅ Debug-Info für Entwicklung (kann später entfernt werden) */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs text-gray-600">
                    <h4 className="font-medium mb-2">Backend-Status:</h4>
                    <div className="space-y-1">
                        <div>User-ID: {user.id}</div>
                        <div>Backend geladen: {user.displayName ? '✅' : '❌'}</div>
                        <div>User-Liste: {availableUsers.length} User</div>
                        <div>Storage: localStorage</div>
                        <div>API: {isLoading ? 'Loading...' : 'Ready'}</div>
                    </div>
                </div>
            </div>
        </PageLayout>
    )
}
