import './index.css'
import { waitForSQLiteReady } from '@/services/SqliteReadinessService'
import { getExpenseService } from '@/services/ExpenseServiceFactory'
import { getBudgetService } from '@/services/BudgetServiceFactory'
import { Capacitor } from '@capacitor/core'
import { CapacitorSQLite } from '@capacitor-community/sqlite'
import { UserProvider } from './context/user-context'
import { MultiBudgetProvider } from './context/multi-budget-context'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { MonthProvider } from './context/month-context'
import { createRoot } from 'react-dom/client'

async function start() {
    try {
        // ✅ WICHTIG: Erst auf native SQLite-Schicht warten (nur bei nativer Plattform)
        if (Capacitor.isNativePlatform?.()) {
            // Verbesserte setVerbose Behandlung

            console.log('📱 warte auf native SQLite-Schicht …')
            await waitForSQLiteReady()
            console.log('✅ native SQLite-Schicht bereit')

            try {
                await CapacitorSQLite.echo({ value: 'ping' })
                console.log('✅ SQLite echo erfolgreich')
            } catch (err) {
                console.error('❌ echo() fehlgeschlagen', err)
            }
        }

        // === Expense-Service initialisieren ===
        try {
            const expenseService = await getExpenseService()
            if (expenseService?.initDb instanceof Function) {
                await expenseService.initDb()
                console.log('✅ ExpenseService initialisiert')
            } else {
                console.warn('Kein ExpenseService.initDb verfügbar – skippe initDb')
            }
        } catch (expenseError) {
            console.error('❌ Fehler bei ExpenseService Initialisierung:', expenseError)
        }

        // === Budget-Service initialisieren ===
        try {
            const budgetService = await getBudgetService()
            if ((budgetService as any)?.initDb instanceof Function) {
                await (budgetService as any).initDb()
                console.log('✅ BudgetService initialisiert')
            } else {
                console.warn('Kein BudgetService.initDb verfügbar – skippe initDb')
            }
        } catch (budgetError) {
            console.error('❌ Fehler bei BudgetService Initialisierung:', budgetError)
        }

        console.log('✅ Lokale SQL-Dienste initialisiert')
    } catch (err) {
        console.error('❌ Kritischer Fehler bei initDb():', err)
        // App trotzdem starten, aber mit Warnung
        console.warn('⚠️ App startet trotz Datenbankfehler')
    }

    // Jetzt die App rendern
    const container = document.getElementById('root')!
    const root = createRoot(container)
    root.render(
        <MonthProvider>
            <UserProvider>
                <MultiBudgetProvider>
                    <BrowserRouter>
                        <App />
                    </BrowserRouter>
                </MultiBudgetProvider>
            </UserProvider>
        </MonthProvider>
    )

    console.log('Happy developing with React und Vite ✨')
}

start()
