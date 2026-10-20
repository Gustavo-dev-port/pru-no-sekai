import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// estilos globais primeiro: o CSS de cada módulo vem depois e pode refinar
import './styles/global.css'
import './styles/app.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
