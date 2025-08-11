// lib/utils/date-utils.ts

/**
 * Formatiert ein Datum im deutschen Format: DD.MM.YYYY
 */
export function formatDateGerman(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date
    const day = d.getDate().toString().padStart(2, '0')
    const month = (d.getMonth() + 1).toString().padStart(2, '0')
    const year = d.getFullYear()
    return `${day}.${month}.${year}`
}

/**
 * Formatiert ein Datum mit Zeit im deutschen Format: DD.MM.YYYY HH:mm
 */
export function formatDateTimeGerman(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date
    const dateStr = formatDateGerman(d)
    const hours = d.getHours().toString().padStart(2, '0')
    const minutes = d.getMinutes().toString().padStart(2, '0')
    return `${dateStr} ${hours}:${minutes}`
}

/**
 * Konvertiert ein ISO-Datum (YYYY-MM-DD) ins deutsche Format für Anzeige
 */
export function convertDateToDisplay(dateString: string): string {
    if (!dateString) return ''

    // Wenn es bereits im deutschen Format ist, zurückgeben
    if (dateString.includes('.')) return dateString

    // ISO-Format konvertieren
    const parts = dateString.split('-')
    if (parts.length === 3) {
        const [year, month, day] = parts
        return `${day}.${month}.${year}`
    }

    // Fallback: versuche Date-Objekt
    try {
        return formatDateGerman(new Date(dateString))
    } catch {
        return dateString
    }
}

/**
 * Formatiert relative Zeit auf Deutsch
 */
export function formatRelativeTime(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'gerade eben'
    if (diffMins < 60) return `vor ${diffMins} Minute${diffMins !== 1 ? 'n' : ''}`
    if (diffHours < 24) return `vor ${diffHours} Stunde${diffHours !== 1 ? 'n' : ''}`
    if (diffDays < 7) return `vor ${diffDays} Tag${diffDays !== 1 ? 'en' : ''}`

    // Für ältere Nachrichten: Datum anzeigen
    return formatDateGerman(d)
}

/**
 * Gibt deutschen Monatsnamen zurück
 */
export function getGermanMonthName(monthIndex: number): string {
    const months = [
        'Januar',
        'Februar',
        'März',
        'April',
        'Mai',
        'Juni',
        'Juli',
        'August',
        'September',
        'Oktober',
        'November',
        'Dezember',
    ]
    return months[monthIndex]
}

/**
 * Formatiert Monat/Jahr auf Deutsch (z.B. "Juli 2024")
 */
export function formatMonthYear(date: Date): string {
    const month = getGermanMonthName(date.getMonth())
    const year = date.getFullYear()
    return `${month} ${year}`
}
