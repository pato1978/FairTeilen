// src/services/YearOverviewService.ts
import { useCallback } from 'react'
import { Capacitor } from '@capacitor/core'
import { useUser } from '@/context/user-context'
import { GROUP_ID } from '@/config/group-config'
import type { YearOverview } from '@/types/monthly-overview'

/**
 * Service for fetching year overview data
 */
export class YearOverviewService {
    /**
     * Platform-dependent base URL (similar to BudgetService)
     * - In native app: use direct URL (e.g., 'https://api.veglia.de/api')
     * - In web: use '/api' (redirected by Vite proxy)
     */
    private static readonly API_BASE_URL = Capacitor.isNativePlatform?.()
        ? `${import.meta.env.VITE_API_URL_NATIVE}/api`
        : '/api';

    /**
     * Hook for fetching year overview data
     * 
     * @returns A function to fetch year overview data
     */
    public static useFetchYearOverview() {
        const { userId } = useUser()

        return useCallback(
            async (year: number): Promise<YearOverview> => {
                // Ensure a user is logged in
                if (!userId) {
                    throw new Error(
                        'Kein Nutzer angemeldet – Jahresübersicht kann nicht geladen werden.'
                    )
                }

                // Build URL without new URL - works in both app and web
                // Manually append and encode query parameters for security
                const url =
                    `${YearOverviewService.API_BASE_URL}/YearOverview/${year}` +
                    `?userId=${encodeURIComponent(userId)}` +
                    `&groupId=${encodeURIComponent(GROUP_ID)}`

                console.log('📤 Fetch YearOverview-Request to:', url)

                // Send request
                const res = await fetch(url)

                // Store response body for debugging
                const rawText = await res.text()

                // Group debug logging
                console.groupCollapsed(`🕵️‍♂️ YearOverview Response – HTTP ${res.status}`)
                console.log('Content-Type:', res.headers.get('content-type'))
                console.log('Body (first 300 chars):', rawText.slice(0, 300))
                console.groupEnd()

                // Error on HTTP status
                if (!res.ok) {
                    throw new Error(`Fehler beim Laden der Jahresübersicht: HTTP ${res.status}`)
                }

                // Error on unexpected content type
                const contentType = res.headers.get('content-type') ?? ''
                if (!contentType.includes('application/json')) {
                    throw new Error(`Erwartetes JSON, erhalten aber: ${contentType}`)
                }

                // All good: parse JSON and return as YearOverview
                return JSON.parse(rawText) as YearOverview
            },
            [userId] // React dependency: only recreate when userId changes
        )
    }
}

// For backward compatibility
export const useFetchYearOverview = YearOverviewService.useFetchYearOverview;