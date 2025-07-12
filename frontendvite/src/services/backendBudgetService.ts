import { Capacitor } from '@capacitor/core'
import { GROUP_ID } from '@/config/group-config'
import type { IBudgetService } from './IBudgetService'
import type { Budget } from '@/types'

// 🌍 Plattformabhängige Basis-URL
const API_BASE_URL = Capacitor.isNativePlatform?.()
    ? import.meta.env.VITE_API_URL_NATIVE // z. B. http://192.168.0.42:8080
    : '/api'

export const backendBudgetService: IBudgetService = {
    /** 🔄 Budget für bestimmten Monat laden (Rückgabe: amount als number) */
    async getBudget(
        scope: string,
        monthKey: string,
        userId: string,
        groupId?: string
    ): Promise<number> {
        const params = new URLSearchParams({
            month: monthKey,
            scope,
            userId,
            ...(groupId ? { groupId } : {}),
        })

        const res = await fetch(`${API_BASE_URL}/budget?${params.toString()}`)

        if (!res.ok) {
            const errorText = await res.text()
            console.error('❌ Fehler beim Laden des Budgets:', errorText)
            throw new Error(`Fehler beim Laden des Budgets: ${errorText}`)
        }

        const budget: Budget | null = await res.json()
        return budget?.amount ?? 0 // 🔁 Rückgabe: Nur der Betrag oder 0
    },

    /** 💾 Budget speichern oder aktualisieren */
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
            method: 'POST',
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
