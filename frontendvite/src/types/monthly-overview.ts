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

    // Gesamtbeträge des Monats
    total: number // Gesamt aller Ausgaben (shared + child)
    shared: number // Nur geteilte Ausgaben (Summe)
    child: number // Nur Kind-bezogene Ausgaben (Summe)

    // Neu: Gruppierung pro Nutzer (nach userId)
    sharedByUser: Record<string, number> // z. B. { "abc123": 40.50, "xyz456": 21.00 }
    childByUser: Record<string, number>
    totalByUser: Record<string, number> // shared + child
    balanceByUser: Record<string, number> // Differenz zu den anderen

    // Rejected-Status pro Nutzer (für Klärung)
    rejectionsByUser: Record<string, boolean>
}
