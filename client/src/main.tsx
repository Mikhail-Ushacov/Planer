import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Запит на дозвіл сповіщень
if ('Notification' in window) {
  Notification.requestPermission();
}

// Реєстрація SW для фонових сповіщень
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}