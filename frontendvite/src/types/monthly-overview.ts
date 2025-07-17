// types/monthly-overview.ts

export enum ClarificationStatus {
    Accepted = 'Accepted', // Zustimmung zur Ausgabe
    Rejected = 'Rejected', // Ablehnung / Widerspruch
    // Optional: InDiscussion = 'InDiscussion', Ignored = 'Ignored'
}

export interface ClarificationReaction {
    id: string
    expenseId: string
    userId: string
    status: ClarificationStatus // jetzt ein String-Enum
    timestamp: string // ISO-Format z. B. "2025-05-28T12:00:00Z"
}

export interface MonthlyOverview {
    id: string // GUID – eindeutiger Monatsbezeichner
    groupId: string
    monthId: string
    monthKey: string // "2025-07"
    yearKey: string // "2025"
    status:
        | 'open'
        | 'completed'
        | 'future'
        | 'pending'
        | 'notTakenIntoAccount'
        | 'needs-clarification'
        | 'past'

    name?: string

    total: number
    shared: number
    child: number
    balance: number

    sharedByUser?: Record<string, number>
    childByUser?: Record<string, number>
    totalByUser?: Record<string, number>
    balanceByUser?: Record<string, number>
    rejectionsByUser?: Record<string, boolean>
}
export interface YearOverview {
    year: number
    months: MonthlyOverview[]
}
