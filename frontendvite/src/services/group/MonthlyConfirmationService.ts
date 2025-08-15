export class MonthlyConfirmationService {
    private static API_BASE = '/api/monthlyconfirmation'

    static async getConfirmations(
        groupId: string,
        monthKey: string
    ): Promise<Record<string, boolean>> {
        const response = await fetch(
            `${this.API_BASE}?groupId=${encodeURIComponent(groupId)}&monthKey=${encodeURIComponent(monthKey)}`
        )

        if (!response.ok) {
            throw new Error(`Fehler beim Laden der Bestätigungen: ${response.status}`)
        }

        return await response.json()
    }

    static async setConfirmation(
        userId: string,
        groupId: string,
        monthKey: string,
        confirmed: boolean
    ): Promise<void> {
        const response = await fetch(this.API_BASE, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId,
                groupId,
                monthKey,
                confirmed,
            }),
        })

        if (!response.ok) {
            throw new Error(`Fehler beim Speichern der Bestätigung: ${response.status}`)
        }
    }
}
