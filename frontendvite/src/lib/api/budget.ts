import { getCurrentUserId } from '@/lib/user-storage'

// 💸 Holt das Budget für einen bestimmten Scope und Monat
export async function fetchBudget(scope: string, date: Date): Promise<number> {
    const month = date.toISOString().slice(0, 7)

    const res = await fetch(
        `/api/budget?scope=${scope}&month=${month}&userId=${getCurrentUserId()}`
    )

    if (!res.ok) {
        console.error(`Fehler beim Laden des Budgets für "${scope}" im Monat ${month}`)
        throw new Error('Fehler beim Laden des Budgets')
    }

    return await res.json()
}

// 💾 Speichert oder aktualisiert das Budget für einen Scope und Monat
export async function saveBudget(scope: string, date: Date, amount: number): Promise<void> {
    const month = date.toISOString().slice(0, 7)

    await fetch(`/api/budget`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scope, month, amount, userId: getCurrentUserId() }),
    }).catch(err => {
        console.error('Fehler beim Speichern des Budgets:', err)
    })
}
