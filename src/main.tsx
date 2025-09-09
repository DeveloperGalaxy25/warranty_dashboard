import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { loadConfig } from './lib/config'

// Load runtime configuration before rendering the app
async function initializeApp() {
  try {
    await loadConfig();
    console.log('Configuration loaded successfully');
  } catch (error) {
    console.error('Failed to load configuration:', error);
    // Show error to user
    const root = document.getElementById("root")!;
    root.innerHTML = `
      <div style="padding: 20px; font-family: Arial, sans-serif; color: #dc2626;">
        <h2>Configuration Error</h2>
        <p>Failed to load application configuration. Please check if config.json is accessible.</p>
        <p>Error: ${error instanceof Error ? error.message : 'Unknown error'}</p>
      </div>
    `;
    return;
  }

  // Render the app after config is loaded
  createRoot(document.getElementById("root")!).render(<App />);
}

initializeApp();
