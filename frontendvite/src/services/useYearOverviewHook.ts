import { useCallback } from 'react'
import { Capacitor } from '@capacitor/core'
import { useUser } from '@/context/user-context'
import { GROUP_ID } from '@/config/group-config'
import type { YearOverview } from '@/types/monthly-overview'

// 🌍 Plattformabhängige Basis-URL (wie im Budget‑Service)
// → In der nativen App verwenden wir z. B. 'https://api.veglia.de/api'
// → Im Web (Vite) bleibt es '/api' (wird vom Vite-Proxy umgeleitet)
const API_BASE_URL = Capacitor.isNativePlatform?.()
    ? `${import.meta.env.VITE_API_URL_NATIVE}/api`
    : '/api'

/**
 * 🔁 Hook, um die Jahresübersicht für einen bestimmten Nutzer und ein bestimmtes Jahr zu laden.
 * Wird per `useCallback` zurückgegeben, um Memoisierung im React-Kontext zu unterstützen.
 */
export function useFetchYearOverview() {
    const { userId } = useUser()

    return useCallback(
        async (year: number): Promise<YearOverview> => {
            // 🔐 Sicherstellen, dass ein Nutzer angemeldet ist
            if (!userId) {
                throw new Error(
                    'Kein Nutzer angemeldet – Jahresübersicht kann nicht geladen werden.'
                )
            }

            // 🧱 URL aufbauen OHNE new URL – funktioniert in App UND Web
            // → Query-Parameter manuell anfügen + encoden für Sicherheit
            const url =
                `${API_BASE_URL}/YearOverview/${year}` +
                `?userId=${encodeURIComponent(userId)}` +
                `&groupId=${encodeURIComponent(GROUP_ID)}`

            console.log('📤 Fetch YearOverview-Request to:', url)

            // 🚀 Request absetzen
            const res = await fetch(url)

            // 📋 Response-Body für Debugging zwischenspeichern
            const rawText = await res.text()

            // 🔍 Debug-Logging gruppieren
            console.groupCollapsed(`🕵️‍♂️ YearOverview Response – HTTP ${res.status}`)
            console.log('Content-Type:', res.headers.get('content-type'))
            console.log('Body (first 300 chars):', rawText.slice(0, 300))
            console.groupEnd()

            // ❗ Fehler bei HTTP-Status
            if (!res.ok) {
                throw new Error(`Fehler beim Laden der Jahresübersicht: HTTP ${res.status}`)
            }

            // ❗ Fehler bei unerwartetem Content-Type
            const contentType = res.headers.get('content-type') ?? ''
            if (!contentType.includes('application/json')) {
                throw new Error(`Erwartetes JSON, erhalten aber: ${contentType}`)
            }

            // ✅ Alles gut: JSON parsen und als YearOverview zurückgeben
            return JSON.parse(rawText) as YearOverview
        },
        [userId] // → React-Abhängigkeit: Nur neu erzeugen, wenn sich userId ändert
    )
}
