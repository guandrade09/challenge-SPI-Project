// src/main.jsx
import React, { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App'
import './index.css' // Onde está o @tailwind
import { ToastProvider } from './components/ui/NotificationToast'

ReactDOM.createRoot(document.getElementById('root')).render(
  <ToastProvider>
    <App />
  </ToastProvider>
)