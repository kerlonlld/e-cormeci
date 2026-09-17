import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthGate } from './AuthGate.jsx'
import { AdminPanel } from './AdminPanel.jsx'
import { DeliveryPanel } from './DeliveryPanel.jsx'

const caminho = window.location.pathname.toLowerCase().replace(/\/+$/, '') || '/'
const siteRole = caminho === '/admim' || caminho === '/admin'
  ? 'admin'
  : caminho === '/entegrador' || caminho === '/entregador'
    ? 'entregador'
    : import.meta.env.VITE_SITE_ROLE || 'cliente'

function Site() {
  if (siteRole === 'admin') return <AdminPanel onVoltar={() => { window.location.href = '/' }} />
  if (siteRole === 'entregador') return <DeliveryPanel onVoltar={() => { window.location.href = '/' }} />

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
