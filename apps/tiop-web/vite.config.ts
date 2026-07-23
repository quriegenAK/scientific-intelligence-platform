import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Static-fixture mode by default (demo-ready without a running API). Point VITE_API_BASE
// at the FastAPI service (http://localhost:8000/api/v1) to consume it live instead.
export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
});
