import { Capacitor } from '@capacitor/core'

const isNativeApp = Capacitor.isNativePlatform()

export const GROUP_ID = isNativeApp ? 'test-group-001' : 'local-dev-group'
