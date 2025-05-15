import type { Expense } from "@/types"

// 🌐 API-Basis-URL: entweder aus .env-Datei oder lokal fallback
const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5289"

// 🔢 Mögliche Werte für den Ausgaben-Scope
export type ExpenseScope = "personal" | "shared" | "child" | string

/**
 * 📡 Lädt Ausgaben vom Backend für einen gegebenen Scope, Monat und (optional) Gruppen-ID.
 *
 * ⚠️ Während der Testphase wird keine echte `group` übergeben – bei "shared" wird `null` verwendet.
 * Diese Funktion sorgt dafür, dass `group=null` oder "null" NICHT in der URL landet.
 *
 * @param scope - "personal", "shared", "child" oder andere benutzerdefinierte Gruppen
 * @param group - Optional: Gruppen-ID (z. B. "abc123") oder `null`
 * @param date - Ein beliebiges Datum im gewünschten Monat (z. B. new Date())
 * @returns Promise<Expense[]> - Die geladenen Ausgaben
 */
export async function fetchExpenses(
    scope: ExpenseScope,
    group: string | null,
    date: Date
): Promise<Expense[]> {
    // 🗓️ Monat aus dem Datum extrahieren im Format "YYYY-MM"
    const month = date.toISOString().slice(0, 7)

    // ✅ Nur dann anhängen, wenn `group` wirklich gesetzt ist (also NICHT "null", "undefined", leer)
    const isValidGroup = group && group !== "null" && group !== "undefined" && group !== ""

    // 🧩 Query-Parameter zusammenbauen
    const params = new URLSearchParams({
        scope,
        ...(isValidGroup ? { group } : {}), // ← Nur wenn gültig
        month,
    })

    // 🧾 Vollständige URL bauen
    const url = `${BASE_URL}/api/expenses?${params.toString()}`

    // 🧪 Debug-Ausgabe (optional wieder entfernen)
    console.log("[fetchExpenses] URL:", url)

    // 🌍 Anfrage an das Backend senden
    const res = await fetch(url)

    // ⚠️ Fehlerbehandlung: Wenn HTTP-Status nicht OK (200–299)
    if (!res.ok) {
        console.error(`[fetchExpenses] Fehler bei scope=${scope}, group=${group}, month=${month}`)
        throw new Error("Fehler beim Laden der Ausgaben")
    }

    // ✅ Daten erfolgreich empfangen und als JSON zurückgeben
    return await res.json()
}
