import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The Chrome extension build target. root is extension/ so popup.html
// lands at the OUTPUT ROOT (where manifest.json points); file names are
// pinned un-hashed for the same reason. `npm run build:ext` copies
// public/symbols.json in after the build.
export default defineConfig({
  root: "extension",
  base: "./",
  plugins: [react()],
  publicDir: "public",
  build: {
    outDir: path.resolve(__dirname, "dist-extension"),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: path.resolve(__dirname, "extension/popup.html"),
        background: path.resolve(__dirname, "extension/background.ts"),
      },
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "chunks/[name].js",
        assetFileNames: "assets/[name][extname]",
      },
    },
  },
});
