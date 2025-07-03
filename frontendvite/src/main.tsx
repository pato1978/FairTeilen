// src/main.tsx

import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

import App from './App'
import './index.css'

import { MonthProvider } from '@/context/month-context'
import { UserProvider } from '@/context/user-context'
import { MultiBudgetProvider } from '@/context/multi-budget-context'

import { getExpenseService } from '@/services/useDataService'
import { getBudgetService } from '@/services/budgetFactory'

// Wir initialisieren lokale DBs vor dem Rendern
async function start() {
    try {
        // === Expense-Service ===
        const expenseService = await getExpenseService() // kein await hier
        if (expenseService && typeof expenseService.initDb === 'function') {
            await expenseService.initDb()
        } else {
            console.warn('Kein ExpenseService.initDb verfügbar – skipping initDb')
        }

        // === Budget-Service ===
        const budgetService = await getBudgetService()
        if (budgetService && typeof (budgetService as any).initDb === 'function') {
            await (budgetService as any).initDb()
        } else {
            console.warn('Kein BudgetService.initDb verfügbar – skipping initDb')
        }

        console.log('✅ Lokale SQL-Dienste initialisiert')
    } catch (err) {
        console.error('❌ Fehler bei initDb():', err)
    }

    // Jetzt die App rendern
    ReactDOM.createRoot(document.getElementById('root')!).render(
        <React.StrictMode>
            <MonthProvider>
                <UserProvider>
                    <MultiBudgetProvider>
                        <BrowserRouter>
                            <App />
                        </BrowserRouter>
                    </MultiBudgetProvider>
                </UserProvider>
            </MonthProvider>
        </React.StrictMode>
    )
    console.log('Happy developing with React and Vite ✨')
}

start()
