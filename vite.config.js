import { defineConfig } from "vite";
export default defineConfig({
  server: { hmr: false },
  base: "./",
  build: { chunkSizeWarningLimit: 1500 },
});
