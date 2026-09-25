import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { ViteImageOptimizer } from "vite-plugin-image-optimizer";

export default defineConfig({
  preview: {
    allowedHosts: [".railway.app", "medicarehms.up.railway.app"]
  },
  server: {
    allowedHosts: [".railway.app", "medicarehms.up.railway.app"]
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
