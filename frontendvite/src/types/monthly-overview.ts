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
    monthId: number
    name: string
    status: 'completed' | 'pending' | 'needs-clarification' | 'future' | 'notTakenIntoAccount'
    user1Confirmed: boolean
    user2Confirmed: boolean
    total: number
    shared: number
    sharedUser1: number
    sharedUser2: number
    child: number
    childUser1: number
    childUser2: number
    balance: number
    clarificationReactionsList: ClarificationReaction[]
}
