import { getCurrentUserId } from '@/lib/user-storage'
import type { MonthlyOverview } from '@/types/monthly-overview'

export interface YearOverview { year: number; months: MonthlyOverview[] }

export async function fetchYearOverview(year: number): Promise<YearOverview> {
    const res = await fetch(`/api/yearoverview/${year}?userId=${getCurrentUserId()}`)
    if (!res.ok) {
        throw new Error('Fehler beim Laden der Jahresübersicht')
    }
    return await res.json()
}
