// frontendvite/src/services/backendBudgetService.ts - GEMEINSAME BUDGETS

import { Capacitor } from '@capacitor/core'
import { GROUP_ID } from '@/config/group-config'
import type { IBudgetService } from './BudgetServiceInterface'
import type { Budget } from '@/types'

const API_BASE_URL = Capacitor.isNativePlatform?.()
    ? `${import.meta.env.VITE_API_URL_NATIVE}/api`
    : '/api'

console.log('🛠️ BackendBudgetService initialized:', {
    API_BASE_URL,
    GROUP_ID,
})

export const backendBudgetService: IBudgetService = {
    /**
     * ✅ KORRIGIERT: Budget laden - für Shared/Child wird GEMEINSAMES Budget geladen
     */
    async getBudget(
        scope: string,
        monthKey: string,
        userId: string,
        groupId?: string
    ): Promise<number> {
        const effectiveGroupId = groupId || GROUP_ID

        // ✅ FIX: Für gemeinsame Budgets (shared/child) einen festen "Gruppen-User" verwenden
        const effectiveUserId =
            scope === 'shared' || scope === 'child'
                ? `group-${effectiveGroupId}` // Gemeinsamer "User" für die ganze Gruppe
                : userId // Personal bleibt user-spezifisch

        const params = new URLSearchParams({
            scope,
            month: monthKey,
            userId: effectiveUserId, // ✅ WICHTIG: Für shared/child immer gleiche ID
            groupId: effectiveGroupId,
        })

        const url = `${API_BASE_URL}/budget?${params.toString()}`

        console.log('📊 getBudget (gemeinsam):', {
            scope,
            monthKey,
            originalUserId: userId,
            effectiveUserId,
            groupId: effectiveGroupId,
            isSharedBudget: scope === 'shared' || scope === 'child',
            url,
        })

        try {
            const res = await fetch(url)

            if (!res.ok) {
                const errorText = await res.text()
                console.error('❌ Fehler beim Laden des Budgets:', {
                    status: res.status,
                    statusText: res.statusText,
                    body: errorText,
                    url,
                })

                if (res.status === 404) {
                    console.log('📋 Kein Budget gefunden, verwende Standard: 0')
                    return 0
                }

                throw new Error(`Fehler beim Laden des Budgets: ${res.status} - ${errorText}`)
            }

            const amount: number = await res.json()
            console.log(
                `✅ ${scope === 'shared' || scope === 'child' ? 'Gemeinsames' : 'Persönliches'} Budget geladen: ${amount} für ${scope}/${monthKey}`
            )
            return amount ?? 0
        } catch (error) {
            console.error('❌ Netzwerkfehler beim Budget-Laden:', error)
            return 0
        }
    },

    /**
     * ✅ KORRIGIERT: Budget speichern - für Shared/Child wird GEMEINSAMES Budget gespeichert
     */
    async saveBudget(
        scope: string,
        monthKey: string,
        amount: number,
        userId: string,
        groupId?: string
    ): Promise<void> {
        const effectiveGroupId = groupId || GROUP_ID

        // ✅ FIX: Für gemeinsame Budgets (shared/child) einen festen "Gruppen-User" verwenden
        const effectiveUserId =
            scope === 'shared' || scope === 'child'
                ? `group-${effectiveGroupId}` // Gemeinsamer "User" für die ganze Gruppe
                : userId // Personal bleibt user-spezifisch

        const payload: Budget = {
            scope,
            month: monthKey,
            amount,
            userId: effectiveUserId, // ✅ WICHTIG: Für shared/child immer gleiche ID
            groupId: effectiveGroupId,
        }

        console.log('💾 saveBudget (gemeinsam):', {
            scope,
            monthKey,
            amount,
            originalUserId: userId,
            effectiveUserId,
            groupId: effectiveGroupId,
            isSharedBudget: scope === 'shared' || scope === 'child',
            payload,
        })

        try {
            const res = await fetch(`${API_BASE_URL}/budget`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })

            if (!res.ok) {
                const errorText = await res.text()
                console.error('❌ Fehler beim Speichern des Budgets:', {
                    status: res.status,
                    statusText: res.statusText,
                    body: errorText,
                    payload,
                })
                throw new Error(`Fehler beim Speichern des Budgets: ${res.status} - ${errorText}`)
            }

            console.log(
                `✅ ${scope === 'shared' || scope === 'child' ? 'Gemeinsames' : 'Persönliches'} Budget erfolgreich gespeichert: ${amount} für ${scope}/${monthKey}`
            )
        } catch (error) {
            console.error('❌ Netzwerkfehler beim Budget-Speichern:', error)
            throw error
        }
    },
}
