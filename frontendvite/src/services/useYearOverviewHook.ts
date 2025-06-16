import { useUser } from '@/context/user-context.tsx'
import type { MonthlyOverview } from '@/types/monthly-overview.ts'
import type { YearOverview } from '@/types/year-overview'
import { useCallback } from 'react'

/**
 * Liefert eine Funktion, um die Jahresübersicht für den aktuellen Nutzer zu laden.
 */
export function useFetchYearOverview() {
    const { userId } = useUser()

    return useCallback(
        async (year: number): Promise<YearOverview> => {
            if (!userId) {
                throw new Error(
                    'Kein Nutzer angemeldet – Jahresübersicht kann nicht geladen werden.'
                )
            }

            const res = await fetch(`/api/yearoverview/${year}?userId=${userId}`)

            if (!res.ok) {
                throw new Error('Fehler beim Laden der Jahresübersicht')
            }

            return await res.json()
        },
        [userId]
    )
}
