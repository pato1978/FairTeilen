import './index.css' // ✅ Tailwind-CSS aktivieren
import { waitForSQLiteReady } from '@/services/wait-sqlite-ready'
import { getExpenseService } from '@/services/ExpenseFactory'
import { getBudgetService } from '@/services/budgetFactory'
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
            await (CapacitorSQLite as any).setVerbose?.(false)
            console.log('📱 warte auf native SQLite-Schicht …')
            await waitForSQLiteReady()
            console.log('✅ native SQLite-Schicht bereit')

            // 🧪 TEST: Existiert das Plugin überhaupt?
            if (!CapacitorSQLite) {
                //console.error('❌ CapacitorSQLite ist undefined – Plugin nicht geladen')
            } else {
                // console.log('🔍 Test: Rufe echo() des Plugins auf …')
                try {
                    await CapacitorSQLite.echo({ value: 'ping' })
                    //  console.log('✅ echo() erfolgreich:', result)
                } catch (err) {
                    console.error('❌ echo() fehlgeschlagen', err)
                }
            }
        }

        // === Expense-Service initialisieren ===
        const expenseService = await getExpenseService()
        if (expenseService?.initDb instanceof Function) {
            await expenseService.initDb()
        } else {
            console.warn('Kein ExpenseService.initDb verfügbar – skippe initDb')
        }

        // === Budget-Service initialisieren ===
        const budgetService = await getBudgetService()
        if ((budgetService as any)?.initDb instanceof Function) {
            await (budgetService as any).initDb()
        } else {
            console.warn('Kein BudgetService.initDb verfügbar – skippe initDb')
        }

        console.log('✅ Lokale SQL-Dienste initialisiert')
    } catch (err) {
        console.error('❌ Fehler bei initDb():', err)
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
