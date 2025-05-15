const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5289"

// 💸 Holt das Budget für einen bestimmten Scope und Monat
export async function fetchBudget(scope: string, date: Date): Promise<number> {
    const month = date.toISOString().slice(0, 7)
    const res = await fetch(`${BASE_URL}/api/budget?scope=${scope}&month=${month}`)
    if (!res.ok) throw new Error("Fehler beim Laden des Budgets")
    return await res.json()
}

// 💾 Speichert oder aktualisiert das Budget für einen Scope und Monat
export async function saveBudget(scope: string, date: Date, amount: number): Promise<void> {
    const month = date.toISOString().slice(0, 7)
    await fetch(`${BASE_URL}/api/budget`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope, month, amount }),
    })
}
