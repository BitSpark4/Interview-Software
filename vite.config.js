import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-dom/client',
      'react/jsx-runtime',
      'react/jsx-dev-runtime',
      'react-router-dom',
      'lucide-react',
      '@phosphor-icons/react',
      '@supabase/supabase-js',
      'recharts',
      'react-markdown',
    ],
    dedupe: ['react', 'react-dom', 'react-router-dom', '@phosphor-icons/react'],
  },
  resolve: {
    dedupe: ['react', 'react-dom', 'react-router-dom', '@phosphor-icons/react'],
  },
  build: {
    rollupOptions: {
      output: {
        // Split vendor libs into separate cached chunks — faster repeat loads
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/react-router-dom')) {
            return 'react-vendor'
          }
          if (id.includes('node_modules/@supabase')) {
            return 'supabase-vendor'
          }
        },
      },
    },
  },
})
