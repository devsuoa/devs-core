import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import "./main.css";
import App from "./App";
import "./lib/posthog";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);

Promise.all([
  document.fonts ? document.fonts.ready : Promise.resolve(),
  new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  ),
]).then(() => {
  window.dispatchEvent(new Event("app-ready"));
});
