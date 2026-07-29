import { defineConfig } from 'vite';

export default defineConfig({
  // Ensure pdf.worker is copied as a static asset and accessible at runtime
  assetsInclude: ['**/*.pdf'],
  server: {
    host: '0.0.0.0',
    port: 5174,
  },
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        chunkFileNames: 'js/[name]-[hash].js',
        entryFileNames: 'js/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
        // Separar dependencias PDF pesadas en su propio chunk de vendor
        manualChunks: {
          'vendor-pdflib': ['pdf-lib'],
          'vendor-pdfjs': ['pdfjs-dist'],
          'vendor-lucide': ['lucide'],
        }
      }
    }
  },
  // Optimise large PDF deps
  optimizeDeps: {
    include: ['pdf-lib', 'pdfjs-dist']
  }
});
