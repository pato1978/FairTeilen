import type { Expense } from '@/types'
import type { Dispatch, SetStateAction } from 'react'
import { getCurrentUserId } from '@/lib/user-storage'

/**
 * 📦 Speichert oder aktualisiert eine Ausgabe im Backend
 * und aktualisiert gleichzeitig den lokalen React-Zustand.
 *
 * 💡 Hinweis:
 * - Das Backend verwendet nur POST – es erkennt anhand der ID, ob es ein neues oder bestehendes Objekt ist.
 * - Das Icon wird nur lokal im Zustand mitgeführt und NICHT an das Backend gesendet.
 *
 * @param expense     Die Ausgabedaten (neu oder geändert)
 * @param icon        Das aktuell ausgewählte Icon (nur lokal relevant)
 * @param setExpenses Setter-Funktion zur Aktualisierung des lokalen Zustands
 * @returns           Die gespeicherte Ausgabe (inkl. vom Server vergebener ID) oder null bei Fehler
 */
export async function saveExpense(
    expense: Expense,
    icon: any,
    setExpenses: Dispatch<SetStateAction<Expense[]>>
): Promise<Expense | null> {
    // 🔄 Datum auf "YYYY-MM-DD" kürzen (z. B. "2025-06-01"), um Probleme mit ISO-Zeitstempeln zu vermeiden
    const normalizedDate = expense.date.split('T')[0]

    // 🌐 API-Endpunkt – über Vite-Proxy (kein CORS, kein localhost hart codiert)
    const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            ...expense,
            date: normalizedDate, // ✅ bereinigtes Datum
            createdByUserId: getCurrentUserId(), // ✅ aktuelle Nutzer-ID (z. B. aus localStorage)
        }),
    })

    // ❌ Wenn der Server-Response kein "200 OK" oder "201 Created" liefert:
    if (!response.ok) {
        console.error('❌ Fehler beim Speichern:', response.status, await response.text())
        return null
    }

    // ✅ Server liefert die gespeicherte Ausgabe zurück (inkl. ID)
    const saved: Expense = await response.json()

    // 🔁 Lokalen Zustand aktualisieren:
    setExpenses(prev => {
        const alreadyExists = saved.id && prev.some(e => e.id === saved.id)

        if (alreadyExists) {
            // 🔧 Update-Fall: vorhandene Ausgabe ersetzen
            return prev.map(e => (e.id === saved.id ? { ...saved, icon } : e))
        } else {
            // ➕ Neuer Eintrag: ans Ende anhängen
            return [...prev, { ...saved, icon }]
        }
    })

    return saved
}
