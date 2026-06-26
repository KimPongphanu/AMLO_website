import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom' // นำเข้า BrowserRouter
import App from './App.tsx'
import './i18n/index' // 🌟 i18n initialization
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* นำมาครอบ App ไว้ตรงนี้ */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
