import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { ViteImageOptimizer } from "vite-plugin-image-optimizer";

export default defineConfig({
  preview: {
    host: "0.0.0.0",
    allowedHosts: ["medicarehms.up.railway.app", ".up.railway.app", ".railway.app", "all"]
  },
  server: {
    host: "0.0.0.0",
    allowedHosts: ["medicarehms.up.railway.app", ".up.railway.app", ".railway.app", "all"]
  },
  plugins: [
    react(),
    ViteImageOptimizer({
      logStats: true,
      cache: true,
      jpeg: { quality: 78, progressive: true, mozjpeg: true },
      jpg: { quality: 78, progressive: true, mozjpeg: true },
      png: { quality: 80, compressionLevel: 9 },
      webp: { quality: 80 },
      avif: { quality: 65 }
    })
  ]
});
