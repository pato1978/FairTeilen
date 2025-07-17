import { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
    appId: 'com.shareTogether.app',
    appName: 'shareTogether - fairTeilen',
    webDir: 'dist',
    plugins: {
        CapacitorHttp: {
            enabled: true,
        },
    },
}

export default config
