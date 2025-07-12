// src/services/expenses/BackendExpenseService.ts

import { Capacitor } from '@capacitor/core'
import type { Expense } from '@/types'
import { GROUP_ID } from '@/config/group-config'
import type { ExpenseScope, IExpenseService } from './IExpenseService'

// 👉 Plattformabhängige Basis-URL: App → Server, Web → Proxy
const API_BASE_URL = Capacitor.isNativePlatform?.()
    ? import.meta.env.VITE_API_URL_NATIVE // <-- HIER deine echte Server-URL eintragen!
    : '/api'

export class BackendExpenseService implements IExpenseService {
    /** Für zentrale API nicht nötig, aber für Interface-Konformität */
    async initDb(): Promise<void> {
        return
    }

    /** Liefert alle Ausgaben (optional nach Monat gefiltert) */
    async getAllExpenses(filter?: { monthKey?: string }): Promise<Expense[]> {
        const params = new URLSearchParams({
            ...(filter?.monthKey ? { month: filter.monthKey } : {}),
            group: GROUP_ID,
        })
        const res = await fetch(`${API_BASE_URL}/expenses?${params.toString()}`)
        if (!res.ok) throw new Error('Fehler beim Laden aller Ausgaben')
        return await res.json()
    }

    /** Erzeugt eine neue Ausgabe (inkl. groupId für shared/child) */
    async addExpense(expense: Expense, groupId?: string): Promise<void> {
        const gid = groupId ?? GROUP_ID
        const res = await fetch(`${API_BASE_URL}/expenses`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...expense, groupId: gid }),
        })
        if (!res.ok) throw new Error('Fehler beim Speichern der zentralen Ausgabe')
    }

    /** Aktualisiert eine bestehende Ausgabe (inkl. groupId) */
    async updateExpense(expense: Expense, groupId?: string): Promise<void> {
        const gid = groupId ?? GROUP_ID
        const res = await fetch(`${API_BASE_URL}/expenses/${expense.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...expense, groupId: gid }),
        })
        if (!res.ok) throw new Error('Fehler beim Aktualisieren der zentralen Ausgabe')
    }

    /** Löscht eine Ausgabe (inkl. groupId) */
    async deleteExpense(id: string, groupId?: string): Promise<void> {
        const gid = groupId ?? GROUP_ID
        const url = `${API_BASE_URL}/expenses/${id}${gid ? `?group=${encodeURIComponent(gid)}` : ''}`

        console.log('🧪 [deleteExpense] Aufruf gestartet')
        console.log('🧪 ID:', id)
        console.log('🧪 groupId (explizit):', groupId)
        console.log('🧪 groupId (verwendet):', gid)
        console.log('🧪 URL:', url)

        const res = await fetch(url, {
            method: 'DELETE',
        })

        if (!res.ok) {
            const errorText = await res.text()
            console.error('❌ Fehlertext vom Server:', errorText)
            throw new Error(`Fehler beim Löschen der zentralen Ausgabe: ${errorText}`)
        }

        console.log('✅ Ausgabe erfolgreich gelöscht')
    }

    /** Gefilterte Ausgaben für User, Scope und Monat */
    async getExpenses(
        userId: string,
        scope: ExpenseScope,
        monthKey: string,
        groupId?: string
    ): Promise<Expense[]> {
        const gid = groupId ?? GROUP_ID
        const params = new URLSearchParams({
            userId,
            scope,
            month: monthKey,
            group: gid,
        })
        const res = await fetch(`${API_BASE_URL}/expenses?${params.toString()}`)
        if (!res.ok) throw new Error('Fehler beim Laden der Ausgaben')
        return await res.json()
    }
}
