// main.jsx is the JavaScript entry point.
// It mounts the React application into the HTML page.
// index.html has a <div id="root"> — React renders into that div.

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)