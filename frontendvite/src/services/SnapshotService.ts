// src/services/SnapshotService.ts
import { Capacitor } from '@capacitor/core'

/**
 * Service for managing snapshots
 */
export class SnapshotService {
    /**
     * Platform-dependent base URL
     * - In native app: use direct URL (e.g., 'https://api.veglia.de/api')
     * - In web: use '/api' (redirected by Vite proxy)
     */
    private static readonly API_BASE_URL = Capacitor.isNativePlatform?.()
        ? `${import.meta.env.VITE_API_URL_NATIVE}/api`
        : '/api';

    /**
     * Saves a snapshot for a specific group, year, and month
     * 
     * @param groupId The group ID
     * @param year The year
     * @param month The month
     */
    public static async saveSnapshot(groupId: string, year: number, month: number): Promise<void> {
        const url = `${this.API_BASE_URL}/snapshots/${groupId}/${year}/${month}`

        const response = await fetch(url, {
            method: 'POST',
            credentials: 'include', // important for cookie-based auth
        })

        if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`Snapshot konnte nicht gespeichert werden: ${errorText}`)
        }
    }
}

// For backward compatibility
export const saveSnapshot = SnapshotService.saveSnapshot.bind(SnapshotService);