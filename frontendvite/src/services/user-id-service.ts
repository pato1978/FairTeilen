import { loadSetting, saveSetting } from '@/lib/app-storage'

const USER_ID_KEY = 'userId'

export async function loadUserId(): Promise<string | null> {
    return await loadSetting(USER_ID_KEY)
}

export async function saveUserId(id: string): Promise<void> {
    await saveSetting(USER_ID_KEY, id)
}
