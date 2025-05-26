// lib/user-storage.ts
export function getCurrentUserId(): string {
    const userId = localStorage.getItem("user_id")
    if (!userId) {
        console.warn("⚠️ Kein Nutzer angemeldet – bitte User-ID setzen.")
       return ""
    }
    return userId
}
export function setCurrentUserId(id: string) {
    localStorage.setItem("user_id", id)
}