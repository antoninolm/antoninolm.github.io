import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import Query from '../components/query.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Query />
  </StrictMode>,
)
