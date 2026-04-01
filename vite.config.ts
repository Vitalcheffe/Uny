import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react(), tailwindcss()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        rollupOptions: {
          output: {
            manualChunks: (id) => {
              // Isoler la Secret Gate et les composants Admin
              if (id.includes('Portal_A78x') || id.includes('Gate_X92') || id.includes('GlobalAudit') || id.includes('admin')) {
                return 'admin-protocol';
              }
              // Isoler les grosses librairies
              if (id.includes('node_modules')) {
                if (id.includes('framer-motion')) return 'vendor-motion';
                if (id.includes('recharts')) return 'vendor-charts';
                if (id.includes('@supabase')) return 'vendor-supabase';
                return 'vendor';
              }
            }
          }
        }
      }
    };
});
