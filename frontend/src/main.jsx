// src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App'
import './index.css' // Onde está o @tailwind
import { ToastProvider } from './components/ui/NotificationToast'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ToastProvider>
      <App />
    </ToastProvider>
  </React.StrictMode>,
)