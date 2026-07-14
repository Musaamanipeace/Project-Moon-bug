import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// The Vite dev server binds 0.0.0.0:3000 (the designated external preview port)
// and proxies /api to the Go backend running on 8080. In production the Go
// binary serves the built SPA directly and also owns the API.
export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
    },
    server: {
      host: "0.0.0.0",
      port: 3000,
      strictPort: true,
      proxy: {
        "/api": {
          target: "http://localhost:8080",
          changeOrigin: true,
        },
      },
      hmr: process.env.DISABLE_HMR !== "true",
      watch: process.env.DISABLE_HMR === "true" ? null : {},
    },
  };
});
