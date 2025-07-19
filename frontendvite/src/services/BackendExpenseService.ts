// src/services/BackendExpenseService.ts
import { Capacitor, CapacitorHttp, HttpResponse } from '@capacitor/core'
import { Expense, ExpenseType } from '@/types'
import { GROUP_ID } from '@/config/group-config'
import type { ExpenseScope, IExpenseService } from './ExpenseServiceInterface'
import { BaseExpenseService } from './BaseExpenseService'

/**
 * 🌐 Plattform‑abhängige Basis‑URL für API‑Zugriffe:
 * - Native App: Direkt auf echten Server (z.B. https://api.veglia.de)
 * - Web: Via Vite‑Proxy → '/api' leitet auf https://api.veglia.de/api um
 *
 * Wichtig: Dein ASP.NET-Controller nutzt [Route("api/expenses")],
 * daher immer mit `/api` anfangen!
 */
const API_BASE_URL = Capacitor.isNativePlatform?.()
    ? `${import.meta.env.VITE_API_URL_NATIVE}/api`
    : '/api'
console.log('🛠️ API_BASE_URL =', API_BASE_URL)

export class BackendExpenseService extends BaseExpenseService implements IExpenseService {
    async initDb(): Promise<void> {}

    /** 🔁 Alle Ausgaben (optional nach Monat gefiltert) */
    async getAllExpenses(filter?: { monthKey?: string }): Promise<Expense[]> {
        const qs = new URLSearchParams({
            ...(filter?.monthKey ? { month: filter.monthKey } : {}),
            group: GROUP_ID,
        }).toString()
        const url = `${API_BASE_URL}/expenses?${qs}`

        const res = await fetch(url)
        if (!res.ok) {
            const text = await res.text()
            console.error('LoadExpenses Fehler-Body:', text)
            throw new Error(`Fehler beim Laden aller Ausgaben: ${res.status}`)
        }
        return await res.json()
    }

    /** ➕ Neue Ausgabe erstellen */
    async addExpense(expense: Expense, groupId?: string): Promise<void> {
        const gid = groupId ?? GROUP_ID
        const url = `${API_BASE_URL}/expenses`
        const data = { ...expense, groupId: gid }

        if (Capacitor.isNativePlatform?.()) {
            const opts = { url, headers: { 'Content-Type': 'application/json' }, data }
            const response: HttpResponse = await CapacitorHttp.post(opts)
            if (response.status < 200 || response.status >= 300) {
                console.error('AddExpense Fehler-Body:', JSON.stringify(response.data))
                throw new Error(`Fehler beim Speichern der zentralen Ausgabe: ${response.status}`)
            }
        } else {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            })
            if (!res.ok) {
                const text = await res.text()
                console.error('AddExpense Fehler-Body:', text)
                throw new Error(`Fehler beim Speichern der zentralen Ausgabe: ${res.status}`)
            }
        }
    }

    /** 📝 Ausgabe aktualisieren */
    async updateExpense(expense: Expense, groupId?: string): Promise<void> {
        const gid = groupId ?? GROUP_ID
        const url = `${API_BASE_URL}/expenses/${expense.id}`
        const data = { ...expense, groupId: gid }

        if (Capacitor.isNativePlatform?.()) {
            const opts = { url, headers: { 'Content-Type': 'application/json' }, data }
            const response: HttpResponse = await CapacitorHttp.put(opts)
            if (response.status < 200 || response.status >= 300) {
                console.error('UpdateExpense Fehler-Body:', JSON.stringify(response.data))
                throw new Error(
                    `Fehler beim Aktualisieren der zentralen Ausgabe: ${response.status}`
                )
            }
        } else {
            const res = await fetch(url, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            })
            if (!res.ok) {
                const text = await res.text()
                console.error('UpdateExpense Fehler-Body:', text)
                throw new Error(`Fehler beim Aktualisieren der zentralen Ausgabe: ${res.status}`)
            }
        }
    }

    /** ❌ Ausgabe löschen */
    async deleteExpense(id: string, groupId?: string): Promise<void> {
        const gid = groupId ? `?group=${encodeURIComponent(groupId)}` : ''
        const url = `${API_BASE_URL}/expenses/${id}${gid}`

        if (Capacitor.isNativePlatform?.()) {
            const response: HttpResponse = await CapacitorHttp.delete({ url })
            if (response.status < 200 || response.status >= 300) {
                console.error('DeleteExpense Fehler-Body:', JSON.stringify(response.data))
                throw new Error(`Fehler beim Löschen der zentralen Ausgabe: ${response.status}`)
            }
        } else {
            const res = await fetch(url, { method: 'DELETE' })
            if (!res.ok) {
                const text = await res.text()
                console.error('DeleteExpense Fehler-Body:', text)
                throw new Error(`Fehler beim Löschen der zentralen Ausgabe: ${text}`)
            }
        }
    }

    /** 🔍 Ausgaben nach User, Scope und Monat */
    async getExpenses(
        userId: string,
        scope: ExpenseScope,
        monthKey: string,
        groupId?: string
    ): Promise<Expense[]> {
        const qs = new URLSearchParams({
            userId,
            scope,
            month: monthKey,
            group: groupId ?? GROUP_ID,
        }).toString()
        const url = `${API_BASE_URL}/expenses?${qs}`

        const res = await fetch(url)
        if (!res.ok) {
            const text = await res.text()
            console.error('GetExpenses Fehler-Body:', text)
            throw new Error(`Fehler beim Laden der Ausgaben: ${res.status}`)
        }
        return await res.json()
    }

    protected getDefaultType(): ExpenseType {
        return ExpenseType.Shared
    }
}
