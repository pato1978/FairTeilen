import { Route, Routes } from 'react-router-dom'
import { useEffect } from 'react'
import RootLayout from '@/pages/layout'
import SharedPage from '@/pages/shared/page.tsx'
import ChildPage from '@/pages/child/page'
import AnalysePage from '@/pages/analyse/page'
import JahresuebersichtPage from '@/pages/jahresuebersicht/page'
import PersonalPage from '@/pages/personal/page'

import ProfilePage from '@/pages/profile/page'
import TrendsPage from '@/pages/trends/page'
import HomePage from '@/pages/home/page'

import { MultiBudgetProvider } from '@/context/multi-budget-context'
import { ClarificationReactionsProvider } from '@/context/clarificationContext'
import { UserProvider, useUser } from '@/context/user-context' // ✅ NEU
import { Page as UserSelectPage, UserEntryGate } from '@/pages/user-select/page' // ✅ Deine neue Seite
import { getExpenseService } from './services/useDataService'

function AppRouter() {
    const { userId, isReady } = useUser()

    if (!isReady) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100 text-gray-500">
                Lade App...
            </div>
        )
    }

    if (!userId) {
        return <UserSelectPage />
    }

    return (
        <UserEntryGate>
            <ClarificationReactionsProvider>
                <Routes>
                    <Route
                        path="/"
                        element={
                            <RootLayout>
                                <MultiBudgetProvider>
                                    <HomePage />
                                </MultiBudgetProvider>
                            </RootLayout>
                        }
                    />
                    <Route
                        path="/shared"
                        element={
                            <RootLayout>
                                <SharedPage />
                            </RootLayout>
                        }
                    />
                    <Route
                        path="/child"
                        element={
                            <RootLayout>
                                <ChildPage />
                            </RootLayout>
                        }
                    />
                    <Route
                        path="/analyse"
                        element={
                            <RootLayout>
                                <AnalysePage />
                            </RootLayout>
                        }
                    />
                    <Route
                        path="/jahresuebersicht"
                        element={
                            <RootLayout>
                                <JahresuebersichtPage />
                            </RootLayout>
                        }
                    />
                    <Route
                        path="/personal"
                        element={
                            <RootLayout>
                                <PersonalPage />
                            </RootLayout>
                        }
                    />

                    <Route
                        path="/trends"
                        element={
                            <RootLayout>
                                <TrendsPage />
                            </RootLayout>
                        }
                    />
                    <Route
                        path="/profile"
                        element={
                            <RootLayout>
                                <ProfilePage />
                            </RootLayout>
                        }
                    />
                    <Route
                        path="*"
                        element={
                            <RootLayout>
                                <div className="text-center text-red-500 p-8">Page Not Found</div>
                            </RootLayout>
                        }
                    />
                </Routes>
            </ClarificationReactionsProvider>
        </UserEntryGate>
    )
}

export default function App() {
    useEffect(() => {
        getExpenseService()
            .then(service => {
                // 💡 Hier KEIN initDb mehr nötig, weil bereits in main.tsx ausgeführt
                console.log('ℹ️ getExpenseService() erfolgreich geladen:', service)
            })
            .catch(err => console.error('❌ Fehler beim Laden des ExpenseService:', err))
    }, [])

    return (
        <UserProvider>
            <AppRouter />
        </UserProvider>
    )
}
