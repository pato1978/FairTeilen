import { useUser } from '@/context/user-context.tsx'
import type { YearOverview } from '@/types/monthly-overview' // oder '@/types'
import { useCallback } from 'react'
import { GROUP_ID } from '@/config/group-config'

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

            const res = await fetch(
                `/api/yearoverview/${year}?userId=${userId}&groupId=${GROUP_ID}`
            )

            if (!res.ok) {
                throw new Error('Fehler beim Laden der Jahresübersicht')
            }

            return await res.json()
        },
        [userId]
    )
}
