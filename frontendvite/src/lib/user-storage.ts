import { Capacitor } from '@capacitor/core'
import { Preferences } from '@capacitor/preferences'

export async function saveUserId(id: string) {
    if (Capacitor.isNativePlatform()) {
        await Preferences.set({ key: 'user_id', value: id })
    } else {
        localStorage.setItem('user_id', id)
    }
}

export async function loadUserId(): Promise<string | null> {
    if (Capacitor.isNativePlatform()) {
        const { value } = await Preferences.get({ key: 'user_id' })
        return value
    } else {
        return localStorage.getItem('user_id')
    }
}
