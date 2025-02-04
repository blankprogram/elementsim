import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/elementsim/',
  plugins: [react()],
  server: {
    fs: {
      allow: ['..'], // Allow accessing files in parent directories (e.g., backend/pkg)
    },
  },
});
