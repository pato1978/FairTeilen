// src/services/UserIdService.ts
import { loadSetting, saveSetting } from '@/lib/app-storage'

/**
 * Service for managing user ID
 */
export class UserIdService {
    /**
     * Key for storing user ID in app settings
     */
    private static readonly USER_ID_KEY = 'userId';

    /**
     * Loads the user ID from app settings
     * 
     * @returns The user ID or null if not found
     */
    public static async loadUserId(): Promise<string | null> {
        const value = await loadSetting(this.USER_ID_KEY)
        console.log('[loadUserId]', value)
        return value
    }

    /**
     * Saves the user ID to app settings
     * 
     * @param id The user ID to save
     */
    public static async saveUserId(id: string): Promise<void> {
        console.log('[saveUserId]', id)
        await saveSetting(this.USER_ID_KEY, id)
    }
}

// For backward compatibility
export const loadUserId = UserIdService.loadUserId.bind(UserIdService);
export const saveUserId = UserIdService.saveUserId.bind(UserIdService);