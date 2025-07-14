import { Capacitor } from '@capacitor/core'
import { Preferences } from '@capacitor/preferences'

const KEY = 'hasSeenWelcome'

export async function saveHasSeenWelcome(value: boolean): Promise<void> {
    if (Capacitor.isNativePlatform()) {
        await Preferences.set({ key: KEY, value: value ? 'true' : 'false' })
    } else {
        localStorage.setItem(KEY, value ? 'true' : 'false')
    }
}

export async function loadHasSeenWelcome(): Promise<boolean> {
    if (Capacitor.isNativePlatform()) {
        const { value } = await Preferences.get({ key: KEY })
        return value === 'true'
    } else {
        return localStorage.getItem(KEY) === 'true'
    }
}

export async function resetHasSeenWelcome(): Promise<void> {
    if (Capacitor.isNativePlatform()) {
        await Preferences.remove({ key: KEY })
    } else {
        localStorage.removeItem(KEY)
    }
}
