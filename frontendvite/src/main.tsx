import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

import App from './App'
import './index.css'
import { MonthProvider } from '@/context/month-context'
import { getExpenseService } from '@/services/useDataService' // ✅ Import
import { UserProvider } from './context/user-context'
const renderApp = () => {
    ReactDOM.createRoot(document.getElementById('root')!).render(
        <React.StrictMode>
            <MonthProvider>
                <UserProvider>
                    <BrowserRouter>
                        <App />
                    </BrowserRouter>
                </UserProvider>
            </MonthProvider>
        </React.StrictMode>
    )
    console.log('Happy developing with React and Vite ✨')
}

async function start() {
    try {
        const service = getExpenseService()
        await service.initDb() // ✅ Einmalig initialisieren
        console.log('✅ Lokale SQL.js-Datenbank initialisiert')
    } catch (err) {
        console.error('❌ Fehler bei initDb():', err)
    }

    renderApp()
}

start()
