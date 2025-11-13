import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

console.log('main.jsx is loading')

// エラーハンドリング
try {
  console.log('Looking for root element...')
  const rootElement = document.getElementById('root')
  if (!rootElement) {
    throw new Error('Root element not found')
  }
  console.log('Root element found:', rootElement)

  console.log('Creating React root...')
  const root = ReactDOM.createRoot(rootElement)
  console.log('Rendering App component...')
  
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
  
  console.log('App component rendered successfully')
} catch (error) {
  console.error('Error mounting React app:', error)
  document.body.innerHTML = `
    <div style="padding: 20px; font-family: sans-serif;">
      <h1>エラーが発生しました</h1>
      <p>${error.message}</p>
      <pre>${error.stack}</pre>
    </div>
  `
}

