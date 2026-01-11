import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
// Initialize session logger early to capture console logs from app start
import "./lib/session-logger";
import { ErrorBoundary } from "./components/ErrorBoundary";

// Global error handlers for unhandled errors
window.onerror = (message, source, lineno, colno, error) => {
  console.error('Global error:', { message, source, lineno, colno, error });
  return false;
};

window.onunhandledrejection = (event) => {
  console.error('Unhandled promise rejection:', event.reason);
};

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
