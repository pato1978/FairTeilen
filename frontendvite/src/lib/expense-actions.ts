import type { Expense } from "@/types"
import type { Dispatch, SetStateAction } from "react"
import { getCurrentUserId } from "@/lib/user-storage"

/**
 * Speichert oder aktualisiert eine Ausgabe im Backend
 * und aktualisiert den lokalen Zustand (State) entsprechend.
 *
 * Hinweis: Dein Backend verwendet nur POST (kein PUT),
 * und entscheidet anhand der ID selbst, ob es sich um ein neues oder bestehendes Objekt handelt.
 *
 * @param expense       Die Ausgabedaten (neu oder geändert)
 * @param icon          Das aktuell ausgewählte Icon
 * @param setExpenses   React-Setter für den lokalen Expense-Array
 * @returns             Das vom Server zurückgegebene, gespeicherte Objekt (inkl. ID)
 */
export async function saveExpense(
    expense: Expense,
    icon: any,
    setExpenses: Dispatch<SetStateAction<Expense[]>>
): Promise<Expense | null> {
    // Optional: Datum in das Format "YYYY-MM-DD" konvertieren,
    // da HTML oder .NET eventuell kein ISO mit Zeitanteil erwartet.
    const normalizedDate = expense.date.split("T")[0]

    // Sende Anfrage an das Backend
    const response = await fetch("http://localhost:5289/api/expenses", {
        method: "POST", // ← Immer POST, dein Backend entscheidet selbst zwischen "neu" und "aktualisieren"
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            ...expense,
            date: normalizedDate, // evtl. wichtig für Backend-Kompatibilität
            CreatedByUserId: getCurrentUserId() // ✅ wichtig!
        }),
    })

    // Fehlerbehandlung: Wenn Statuscode z. B. 400, 404 oder 500 ist
    if (!response.ok) {
        console.error("❌ Fehler beim Speichern:", response.status, await response.text())
        return null
    }

    // Antwort enthält das gespeicherte Objekt inkl. echter ID vom Server
    const saved: Expense = await response.json()

    // Lokalen Zustand aktualisieren: entweder ersetzen oder neu anhängen
    setExpenses(prev => {
        const alreadyExists = saved.id && prev.some(e => e.id === saved.id)

        if (alreadyExists) {
            // Update: vorhandenes Element ersetzen
            return prev.map(e => e.id === saved.id ? { ...saved, icon } : e)
        } else {
            // Neuer Eintrag: anhängen
            return [...prev, { ...saved, icon }]
        }
    })

    return saved
}
