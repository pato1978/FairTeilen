import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    optimizeDeps: {
        exclude: ['@capacitor-community/sqlite/dist/loader'], // 🔧 wichtig für Web-Loader
    },
    server: {
        port: 5173,
        proxy: {
            '/api': {
                target: 'http://localhost:5289',
                changeOrigin: true,
                secure: false,
            },
        },
    },
})
