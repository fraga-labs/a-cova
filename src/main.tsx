import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './ui/App.js'
import './ui/styles.css'

const contedor = document.getElementById('root')
if (contedor === null) {
  throw new Error('Non atopo o contedor #root')
}

createRoot(contedor).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
