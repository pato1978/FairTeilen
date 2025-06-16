// 💸 Holt das Budget für einen bestimmten Scope und Monat für einen bestimmten Nutzer
export async function fetchBudget(scope: string, date: Date, userId: string): Promise<number> {
    const month = date.toISOString().slice(0, 7)

    const res = await fetch(`/api/budget?scope=${scope}&month=${month}&userId=${userId}`)

    if (!res.ok) {
        console.error(`❌ Fehler beim Laden des Budgets für "${scope}" im Monat ${month}`)
        throw new Error('Fehler beim Laden des Budgets')
    }

    return await res.json()
}

// 💾 Speichert oder aktualisiert das Budget für einen Scope und Monat für einen bestimmten Nutzer
export async function saveBudget(
    scope: string,
    date: Date,
    amount: number,
    userId: string
): Promise<void> {
    const month = date.toISOString().slice(0, 7)

    try {
        await fetch(`/api/budget`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ scope, month, amount, userId }),
        })
    } catch (err) {
        console.error('❌ Fehler beim Speichern des Budgets:', err)
    }
}
