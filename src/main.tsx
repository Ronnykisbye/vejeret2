/* =========================================================
   Afsnit 01 – Imports
   ========================================================= */
import React from "react";
import ReactDOM from "react-dom/client";
import App from "../App";

/* =========================================================
   Afsnit 02 – Mount React
   ========================================================= */
const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

/* =========================================================
   Afsnit 03 – PWA: Register Service Worker
   ========================================================= */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {
      // Ignorer fejl (fx hvis browseren blokerer)
    });
  });
}
