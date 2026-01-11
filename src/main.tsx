import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
// Initialize session logger early to capture console logs from app start
import "./lib/session-logger";

createRoot(document.getElementById("root")!).render(<App />);
