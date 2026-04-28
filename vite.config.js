import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Vite + React 기본 설정
export default defineConfig({
  plugins: [react(), tailwindcss()],
});
