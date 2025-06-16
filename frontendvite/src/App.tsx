import { Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
// Layout & Pages
import RootLayout from '@/pages/layout'

import SharedPage from '@/pages/shared/page.tsx'
import ChildPage from '@/pages/child/page'
import AnalysePage from '@/pages/analyse/page'
import JahresuebersichtPage from '@/pages/jahresuebersicht/page'
import PersonalPage from '@/pages/personal/page'
import StatisticsPage from '@/pages/statistics/page'
import ProfilePage from '@/pages/profile/page'
import TrendsPage from '@/pages/trends/page'
import { MultiBudgetProvider } from '@/context/multi-budget-context'
import { ClarificationReactionsProvider } from '@/context/clarificationContext'
import { sqlJsExpenseService } from './services/SqlJsExpenseService.ts'
import HomePage from '@/pages/home/page'

function App() {
    // ✅ neu
    useEffect(() => {
        sqlJsExpenseService
            .initDb()
            .then(() => {
                console.log('💾 sql.js (WASM) Datenbank bereit!')
            })
            .catch(err => {
                console.error('❌ Fehler beim Initialisieren der sql.js DB:', err)
            })
    }, [])

    return (
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
                    path="/statistics"
                    element={
                        <RootLayout>
                            <StatisticsPage />
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
    )
}

export default App
