import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { BrowserRouter } from "react-router-dom";

// Add global error handler
window.addEventListener('error', (event) => {
  console.error('Global error caught:', event.error);
});

// Ensure root element exists
const rootElement = document.getElementById("root");
if (!rootElement) {
  console.error("Root element not found! Check your index.html file.");
}

// Try to render the app with error handling
try {
  createRoot(rootElement).render(
    <StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </StrictMode>
  );
  console.log("App rendered successfully");
} catch (error) {
  console.error("Failed to render app:", error);
  
  // Fallback rendering if the main app fails
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="padding: 20px; color: white; background: #333; margin: 20px; border-radius: 8px; font-family: sans-serif;">
        <h2>Failed to load application</h2>
        <p>Please check the console for errors.</p>
        <pre>${error.message}</pre>
      </div>
    `;
  }
}
