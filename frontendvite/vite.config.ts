import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr' // ✅ NEU HINZUFÜGEN
import path from 'path'

export default defineConfig({
    base: './', // ← 🔧 DAS IST DER FEHLENDE SCHLÜSSEL
    plugins: [react(), svgr()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    optimizeDeps: {
        exclude: ['@capacitor-community/sqlite/dist/loader'],
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
