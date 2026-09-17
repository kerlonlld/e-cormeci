import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthGate } from './AuthGate.jsx'
import { AdminPanel } from './AdminPanel.jsx'
import { DeliveryPanel } from './DeliveryPanel.jsx'

const siteRole = import.meta.env.VITE_SITE_ROLE || 'cliente'

function Site() {
  if (siteRole === 'admin') return <AdminPanel />
  if (siteRole === 'entregador') return <DeliveryPanel />

  return (
    <AuthGate>
      <App />
    </AuthGate>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Site />
  </StrictMode>,
)
