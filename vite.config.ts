import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base MUST match the GitHub Pages project path — without it the deployed
// page requests its assets from the domain root and renders blank.
export default defineConfig({
  base: "/stocks-launcher/",
  plugins: [react()],
});
