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

// Debug-Logging für GroupId-Probleme
console.log('🛠️ BackendExpenseService initialized:', {
    API_BASE_URL,
    GROUP_ID,
    platform: Capacitor.getPlatform(),
    isNative: Capacitor.isNativePlatform?.(),
})

export class BackendExpenseService extends BaseExpenseService implements IExpenseService {
    async initDb(): Promise<void> {
        // Keine Initialisierung nötig für Backend-Service
    }

    /** 🔁 Alle Ausgaben (optional nach Monat gefiltert) */
    async getAllExpenses(filter?: { monthKey?: string }): Promise<Expense[]> {
        // ✅ GroupId immer mitschicken
        const qs = new URLSearchParams({
            ...(filter?.monthKey ? { month: filter.monthKey } : {}),
            group: GROUP_ID,
        }).toString()

        const url = `${API_BASE_URL}/expenses?${qs}`

        console.log('📊 getAllExpenses:', {
            url,
            GROUP_ID,
            filter,
        })

        const res = await fetch(url)
        if (!res.ok) {
            const text = await res.text()
            console.error('❌ LoadExpenses Fehler:', {
                status: res.status,
                body: text,
                url,
            })
            throw new Error(`Fehler beim Laden aller Ausgaben: ${res.status}`)
        }

        const data = await res.json()
        console.log(`✅ getAllExpenses: ${data.length} Ausgaben geladen`)
        return data
    }

    /** ➕ Neue Ausgabe erstellen */
    async addExpense(expense: Expense, groupId?: string): Promise<void> {
        const gid = groupId ?? GROUP_ID
        const url = `${API_BASE_URL}/expenses`
        const data = { ...expense, groupId: gid }

        console.log('➕ addExpense:', {
            name: expense.name,
            type: expense.type,
            groupId: gid,
            configGroupId: GROUP_ID,
        })

        if (Capacitor.isNativePlatform?.()) {
            const opts = {
                url,
                headers: { 'Content-Type': 'application/json' },
                data,
            }
            const response: HttpResponse = await CapacitorHttp.post(opts)
            if (response.status < 200 || response.status >= 300) {
                console.error('❌ AddExpense Fehler:', {
                    status: response.status,
                    data: response.data,
                })
                throw new Error(`Fehler beim Speichern der zentralen Ausgabe: ${response.status}`)
            }
            console.log('✅ Ausgabe erfolgreich gespeichert (native)')
        } else {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            })
            if (!res.ok) {
                const text = await res.text()
                console.error('❌ AddExpense Fehler:', {
                    status: res.status,
                    body: text,
                })
                throw new Error(`Fehler beim Speichern der zentralen Ausgabe: ${res.status}`)
            }
            console.log('✅ Ausgabe erfolgreich gespeichert (web)')
        }
    }

    /** 📝 Ausgabe aktualisieren - verwendet POST wie beim Erstellen */
    async updateExpense(expense: Expense, groupId?: string): Promise<void> {
        const gid = groupId ?? GROUP_ID
        const url = `${API_BASE_URL}/expenses`
        const data = { ...expense, groupId: gid }

        console.log('📝 updateExpense:', {
            id: expense.id,
            name: expense.name,
            groupId: gid,
            configGroupId: GROUP_ID,
        })

        if (Capacitor.isNativePlatform?.()) {
            const opts = {
                url,
                headers: { 'Content-Type': 'application/json' },
                data,
            }
            const response: HttpResponse = await CapacitorHttp.post(opts)
            if (response.status < 200 || response.status >= 300) {
                console.error('❌ UpdateExpense Fehler:', {
                    status: response.status,
                    data: response.data,
                })
                throw new Error(
                    `Fehler beim Aktualisieren der zentralen Ausgabe: ${response.status}`
                )
            }
            console.log('✅ Ausgabe erfolgreich aktualisiert (native)')
        } else {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            })
            if (!res.ok) {
                const text = await res.text()
                console.error('❌ UpdateExpense Fehler:', {
                    status: res.status,
                    body: text,
                })
                throw new Error(`Fehler beim Aktualisieren der zentralen Ausgabe: ${res.status}`)
            }
            console.log('✅ Ausgabe erfolgreich aktualisiert (web)')
        }
    }

    /** ❌ Ausgabe löschen */
    async deleteExpense(id: string, groupId?: string): Promise<void> {
        // ✅ GroupId immer aus Config nehmen, wenn nicht explizit übergeben
        const gid = groupId ?? GROUP_ID
        const url = `${API_BASE_URL}/expenses/${id}?group=${encodeURIComponent(gid)}`

        console.log('🗑️ deleteExpense:', {
            id,
            groupId: gid,
            url,
        })

        if (Capacitor.isNativePlatform?.()) {
            const response: HttpResponse = await CapacitorHttp.delete({ url })
            if (response.status < 200 || response.status >= 300) {
                console.error('❌ DeleteExpense Fehler:', {
                    status: response.status,
                    data: response.data,
                })
                throw new Error(`Fehler beim Löschen der zentralen Ausgabe: ${response.status}`)
            }
            console.log('✅ Ausgabe erfolgreich gelöscht (native)')
        } else {
            const res = await fetch(url, { method: 'DELETE' })
            if (!res.ok) {
                const text = await res.text()
                console.error('❌ DeleteExpense Fehler:', {
                    status: res.status,
                    body: text,
                })
                throw new Error(`Fehler beim Löschen der zentralen Ausgabe: ${text}`)
            }
            console.log('✅ Ausgabe erfolgreich gelöscht (web)')
        }
    }

    /** 🔍 Ausgaben nach User, Scope und Monat */
    async getExpenses(
        userId: string,
        scope: ExpenseScope,
        monthKey: string,
        groupId?: string
    ): Promise<Expense[]> {
        // ✅ GroupId immer aus Config nehmen, wenn nicht explizit übergeben
        const effectiveGroupId = groupId ?? GROUP_ID

        // ✅ Validierung: GroupId muss vorhanden sein
        if (!effectiveGroupId) {
            console.error('❌ Keine GroupId verfügbar!', {
                passedGroupId: groupId,
                configGroupId: GROUP_ID,
            })
            throw new Error('GroupId ist erforderlich für das Laden von Ausgaben')
        }

        const qs = new URLSearchParams({
            userId,
            scope,
            month: monthKey,
            group: effectiveGroupId,
        }).toString()

        const url = `${API_BASE_URL}/expenses?${qs}`

        console.log('📊 getExpenses:', {
            url,
            params: {
                userId,
                scope,
                monthKey,
                groupId: effectiveGroupId,
                configGroupId: GROUP_ID,
            },
        })

        try {
            const res = await fetch(url)
            if (!res.ok) {
                const text = await res.text()
                console.error('❌ GetExpenses Fehler:', {
                    status: res.status,
                    body: text,
                    url,
                })
                throw new Error(`Fehler beim Laden der Ausgaben: ${res.status} - ${text}`)
            }

            const data = await res.json()
            console.log(`✅ getExpenses: ${data.length} Ausgaben für ${scope} geladen`)

            // Debug: Zeige GroupIds der geladenen Ausgaben
            if (data.length > 0) {
                const groupIds = [...new Set(data.map((e: Expense) => e.groupId))]
                console.log('📋 Geladene GroupIds:', groupIds)

                if (groupIds.length > 1) {
                    console.warn('⚠️ WARNUNG: Ausgaben aus mehreren Gruppen geladen!', groupIds)
                }
            }

            return data
        } catch (error) {
            console.error('❌ Netzwerkfehler beim Laden der Ausgaben:', error)
            throw error
        }
    }

    protected getDefaultType(): ExpenseType {
        return ExpenseType.Shared
    }
}
