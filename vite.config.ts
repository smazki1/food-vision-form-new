/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    allowedHosts: true,
  },
  plugins: [
    react(),
    // mode === 'development' && componentTagger(), // Temporarily disable for testing
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@testing-library/react-hooks": "@testing-library/react",
    },
  },
  optimizeDeps: {
    include: ['@radix-ui/react-tooltip']
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunk for React and core libraries
          vendor: ['react', 'react-dom', 'react-router-dom'],
          // UI components chunk
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-tooltip', '@radix-ui/react-select', 'vaul', 'framer-motion'],
          // Supabase and data chunk
          data: ['@supabase/supabase-js', '@tanstack/react-query'],
          // Form and validation chunk
          forms: ['react-hook-form', '@hookform/resolvers', 'zod'],
          // Utilities chunk
          utils: ['date-fns', 'jszip', 'lucide-react', 'uuid'],
        }
      }
    },
    // Increase chunk size warning limit to 750kb (from default 500kb)
    chunkSizeWarningLimit: 750,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
  },
}));
