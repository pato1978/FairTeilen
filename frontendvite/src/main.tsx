import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

import {MonthProvider} from "@/context/month-context";

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
      <MonthProvider>

              <BrowserRouter>
                  <App />
              </BrowserRouter>

      </MonthProvider>


  </React.StrictMode>,
)

console.log('Happy developing with React and Vite ✨')