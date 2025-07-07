import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

// This is a simple test script to ensure the application works correctly
// after the migration from Next.js to React.
// Run this script with: npx vite

const container = document.getElementById('root')
if (container) {
    const root = createRoot(container)
    root.render(
        <React.StrictMode>
            <BrowserRouter>
                <App />
            </BrowserRouter>
        </React.StrictMode>
    )
}

console.log('Test script loaded successfully ✅')
