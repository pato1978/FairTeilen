export enum ActionType {
    Created = 'Created',
    Updated = 'Updated',
    Deleted = 'Deleted',
    Confirmed = 'Confirmed',
    Rejected = 'Rejected',
}

export interface Notification {
    id: string
    userId: string
    groupId: string
    expenseId?: string
    type: ActionType
    message: string
    isRead: boolean
    createdAt: string
    actionUrl?: string
}
