// src/services/BackendBudgetService.ts
import { Capacitor } from '@capacitor/core'
import { GROUP_ID } from '@/config/group-config'
import type { IBudgetService } from './BudgetServiceInterface'
import type { Budget } from '@/types'

// 🌍 Plattformabhängige Basis-URL
// Hinweis: Der Controller läuft auf Route("api/budget") → daher: + /api
const API_BASE_URL = Capacitor.isNativePlatform?.()
    ? `${import.meta.env.VITE_API_URL_NATIVE}/api` // z. B. http://192.168.0.42:8080/api
    : '/api' // ⚠️ wichtig: Vite-Proxy → /api wird zu https://api.veglia.de/api
console.log('🛠️ API_BASE_URL =', API_BASE_URL)
export const backendBudgetService: IBudgetService = {
    /**
     * 🔄 Budget für einen bestimmten Monat laden
     * @param scope z. B. 'personal', 'shared', 'child'
     * @param monthKey im Format 'yyyy-MM'
     * @param userId eindeutige Benutzer-ID
     * @param groupId optional – aktuell (noch) nicht im Controller verwendet
     * @returns number – Betrag für das Budget
     */
    async getBudget(
        scope: string,
        monthKey: string,
        userId: string,
        groupId?: string
    ): Promise<number> {
        const params = new URLSearchParams({
            scope,
            month: monthKey,
            userId,
            ...(groupId ? { groupId } : {}), // optional
        })

        const res = await fetch(`${API_BASE_URL}/budget?${params.toString()}`)

        if (!res.ok) {
            const errorText = await res.text()
            console.error('❌ Fehler beim Laden des Budgets:', errorText)
            throw new Error(`Fehler beim Laden des Budgets: ${errorText}`)
        }

        const amount: number = await res.json() // Controller gibt direkt `entry.Amount` zurück
        return amount ?? 0
    },

    /**
     * 💾 Budget speichern oder aktualisieren
     * @param scope z. B. 'personal', 'shared', 'child'
     * @param monthKey im Format 'yyyy-MM'
     * @param amount zu speichernder Betrag
     * @param userId eindeutige Benutzer-ID
     * @param groupId optional – wird mitgeschickt, aber im Backend aktuell nicht ausgewertet
     */
    async saveBudget(
        scope: string,
        monthKey: string,
        amount: number,
        userId: string,
        groupId?: string
    ): Promise<void> {
        const payload: Budget = {
            scope,
            month: monthKey,
            amount,
            userId,
            groupId: groupId ?? GROUP_ID,
        }

        const res = await fetch(`${API_BASE_URL}/budget`, {
            method: 'PUT', // ⚠️ dein Controller nimmt aktuell [HttpPut], daher entweder ändern oder hier `method: 'PUT'`
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        })

        if (!res.ok) {
            const errorText = await res.text()
            console.error('❌ Fehler beim Speichern des Budgets:', errorText)
            throw new Error(`Fehler beim Speichern des Budgets: ${errorText}`)
        }
    },
}