// src/services/IBudgetService.ts

export interface IBudgetService {
    /** optional, nur lokale DB-Services implementieren das */
    initDb?(): Promise<void>

    /**
     * Liefert das Budget für einen Bereich und Monat.
     *
     * @param scope   'personal' | 'shared' | 'child'
     * @param monthKey 'YYYY-MM'
     * @param userId
     * @param groupId nur bei shared/child nötig
     */
    getBudget(scope: string, monthKey: string, userId: string, groupId?: string): Promise<number>

    /**
     * Speichert oder aktualisiert das Budget.
     *
     * @param scope
     * @param monthKey
     * @param amount
     * @param userId
     * @param groupId nur bei shared/child nötig
     */
    saveBudget(
        scope: string,
        monthKey: string,
        amount: number,
        userId: string,
        groupId?: string
    ): Promise<void>
}
