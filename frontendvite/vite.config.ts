import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()], // React plugin hinzugefügt, Tailwind wird über PostCSS geladen
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
