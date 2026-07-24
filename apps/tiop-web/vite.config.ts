import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Static-fixture mode by default (demo-ready without a running API). Point VITE_API_BASE
// at the FastAPI service (http://localhost:8000/api/v1) to consume it live instead.
// base is "/" for local dev and Vercel; on GitHub Pages the deploy workflow sets
// VITE_BASE=/scientific-intelligence-platform/ so assets resolve under the repo subpath.
export default defineConfig({
  base: process.env.VITE_BASE || "/",
  plugins: [react()],
  server: { port: 5173 },
});
