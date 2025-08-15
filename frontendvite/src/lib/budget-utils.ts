import { extractAmountValue } from '@/lib/utils'

/**
 * Berechnet die Gesamtsumme aller Ausgaben.
 * Funktioniert sowohl mit Beträgen vom Typ `string` (z. B. "12,34 €") als auch `number` (z. B. 12.34).
 *
 * @param expenses - Ein Array von Ausgabenobjekten mit einem `amount`-Feld
 * @returns Die Summe aller Beträge als Zahl
 */
export function calculateTotalExpenses(expenses: { amount: string | number }[]): number {
    return expenses.reduce((sum, exp) => {
        // Nutze Hilfsfunktion, um string- oder number-basierte Beträge sicher zu verarbeiten
        const value = extractAmountValue(exp.amount) || 0
        return sum + value
    }, 0)
}

export function calculateTotalExpensesWithoutRecurring(
    expenses: { amount: string | number; isRecurring?: boolean }[]
): number {
    return expenses
        .filter(exp => !exp.isRecurring) // nur nicht-wiederkehrende behalten
        .reduce((sum, exp) => {
            const value = extractAmountValue(exp.amount) || 0
            return sum + value
        }, 0)
}

/**
 * Berechnet den prozentualen Anteil der Ausgaben am Budget.
 *
 * @param totalExpenses - Die Gesamtausgaben (z. B. 250)
 * @param budget - Das Budget (z. B. 500)
 * @returns Prozentwert (0–100), wie viel vom Budget verbraucht wurde
 */
export function calculatePercentageUsed(totalExpenses: number, budget: number): number {
    // Schütze vor Division durch 0 und begrenze den Wert auf maximal 100 %
    if (budget === 0) return 0
    return Math.round((totalExpenses / budget) * 100)
}
