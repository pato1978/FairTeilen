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
    server: {
        port: 5173, // optional, falls du explizit Port 5173 willst
        proxy: {
            '/api': {
                target: 'http://localhost:5289',
                changeOrigin: true,
                secure: false,
            },
        },
    },
})
