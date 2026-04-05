import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";

console.log("=== MAIN.TSX: Starting React app ===");
const rootDiv = document.getElementById("root");
console.log("Root div found:", rootDiv);

if (!rootDiv) {
  console.error("ERROR: Root div not found!");
} else {
  try {
    console.log("Creating root and rendering...");
    createRoot(rootDiv).render(
      <StrictMode>
        <App />
      </StrictMode>
    );
    console.log("=== React app rendered successfully ===");
  } catch (error) {
    console.error("ERROR rendering React app:", error);
  }
}