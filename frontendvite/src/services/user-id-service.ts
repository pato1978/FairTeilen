import { loadSetting, saveSetting } from '@/lib/app-storage'

const USER_ID_KEY = 'userId'
console.log('[user-id-service] loaded')
export async function loadUserId(): Promise<string | null> {
    const value = await loadSetting(USER_ID_KEY)
    console.log('[loadUserId]', value)
    return value
}

export async function saveUserId(id: string): Promise<void> {
    console.log('[saveUserId]', id)
    await saveSetting(USER_ID_KEY, id)
}
