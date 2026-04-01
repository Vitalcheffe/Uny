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
              if (id.includes('Portal_A78x') || id.includes('Gate_X92') || id.includes('GlobalAudit') || id.includes('admin')) {
                return 'admin-protocol';
              }
              if (id.includes('node_modules')) {
                if (id.includes('framer-motion')) return 'vendor-motion';
                if (id.includes('recharts')) return 'vendor-charts';
                if (id.includes('@supabase')) return 'vendor-supabase';
                return 'vendor';
              }
            }
          }
        }
      },
      test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: './tests/setup.ts',
        coverage: {
          provider: 'v8',
          reporter: ['text', 'json', 'html'],
          exclude: [
            'node_modules/',
            'tests/',
            '**/*.d.ts',
            '**/*.config.*',
            '**/mockData/*',
          ],
        },
      },
    };
});
