import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Debug: Log when main.jsx loads
console.log('✅ main.jsx loaded');

// Check if root element exists
const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('❌ Root element not found!');
  document.body.innerHTML = '<h1 style="padding: 20px; color: red;">Error: Root element not found</h1>';
} else {
  console.log('✅ Root element found, rendering App...');
  try {
    createRoot(rootElement).render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
    console.log('✅ App rendered successfully');
  } catch (error) {
    console.error('❌ Error rendering App:', error);
    rootElement.innerHTML = `<h1 style="padding: 20px; color: red;">Error: ${error.message}</h1>`;
  }
}
