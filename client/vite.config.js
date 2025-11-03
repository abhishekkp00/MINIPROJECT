/**
 * Vite Configuration File
 * Complete setup for React project with optimization and proxy
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  // ==================== PLUGINS ====================
  plugins: [
    react({
      // Enable Fast Refresh for React
      fastRefresh: true,
      // Babel configuration for React
      babel: {
        plugins: [
          // Add any babel plugins here if needed
        ],
      },
    }),
  ],

  // ==================== SERVER CONFIGURATION ====================
  server: {
    // Development server port
    port: 5173,
    
    // Automatically open browser on server start
    open: true,
    
    // Enable CORS for development
    cors: true,
    
    // Strict port - exit if port is already in use
    strictPort: false,
    
    // Host configuration
    host: true, // Listen on all addresses (0.0.0.0)
    
    // HMR (Hot Module Replacement) configuration
    hmr: {
      overlay: true, // Show error overlay
    },

    // ==================== API PROXY SETUP ====================
    // Proxy API requests to backend server
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        // Rewrite path if needed (uncomment if you want to remove /api prefix)
        // rewrite: (path) => path.replace(/^\/api/, ''),
        configure: (proxy, options) => {
          // Log proxy requests (helpful for debugging)
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('🔄 Proxying:', req.method, req.url, '→', options.target + req.url);
          });
        },
      },
      // WebSocket proxy for Socket.IO
      '/socket.io': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        ws: true, // Enable WebSocket proxying
      },
    },
  },

  // ==================== BUILD OPTIMIZATION ====================
  build: {
    // Output directory for production build
    outDir: 'dist',
    
    // Generate sourcemaps for production (useful for debugging)
    sourcemap: false,
    
    // Minify using terser (better compression than esbuild)
    minify: 'terser',
    
    // Terser options for better optimization
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true, // Remove debugger statements
      },
    },
    
    // Chunk size warning limit (500kb)
    chunkSizeWarningLimit: 1000,
    
    // Rollup options for advanced optimization
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching
        manualChunks: {
          // Vendor chunk - external dependencies
          vendor: ['react', 'react-dom', 'react-router-dom'],
          
          // UI libraries chunk
          ui: ['@headlessui/react', '@heroicons/react'],
          
          // Utilities chunk
          utils: ['axios', 'date-fns'],
        },
        
        // Asset file naming
        assetFileNames: (assetInfo) => {
          let extType = assetInfo.name.split('.').at(-1);
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
            return `assets/images/[name]-[hash][extname]`;
          }
          if (/woff|woff2|eot|ttf|otf/i.test(extType)) {
            return `assets/fonts/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
        
        // Chunk file naming
        chunkFileNames: 'assets/js/[name]-[hash].js',
        
        // Entry file naming
        entryFileNames: 'assets/js/[name]-[hash].js',
      },
    },
    
    // CSS code splitting
    cssCodeSplit: true,
    
    // Generate manifest for PWA
    manifest: true,
    
    // Assets inline limit (4kb)
    assetsInlineLimit: 4096,
  },

  // ==================== ENVIRONMENT VARIABLES ====================
  // Define environment variable prefix
  envPrefix: 'VITE_',
  
  // ==================== RESOLVE CONFIGURATION ====================
  resolve: {
    // Path aliases for cleaner imports
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@services': path.resolve(__dirname, './src/services'),
      '@store': path.resolve(__dirname, './src/store'),
      '@assets': path.resolve(__dirname, './src/assets'),
      '@styles': path.resolve(__dirname, './src/styles'),
    },
    
    // Extensions to resolve automatically
    extensions: ['.js', '.jsx', '.json', '.ts', '.tsx'],
  },

  // ==================== CSS CONFIGURATION ====================
  css: {
    // CSS modules configuration
    modules: {
      localsConvention: 'camelCase',
    },
    
    // PostCSS configuration
    postcss: './postcss.config.js',
    
    // Preprocessor options
    preprocessorOptions: {
      scss: {
        additionalData: `@import "@/styles/variables.scss";`,
      },
    },
  },

  // ==================== OPTIMIZATION ====================
  optimizeDeps: {
    // Include dependencies for optimization
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'axios',
    ],
    
    // Exclude dependencies from optimization
    exclude: [],
  },

  // ==================== PREVIEW SERVER ====================
  preview: {
    port: 4173,
    strictPort: true,
    open: true,
  },

  // ==================== LOGGING ====================
  logLevel: 'info', // 'info' | 'warn' | 'error' | 'silent'
  
  // Clear screen on dev server start
  clearScreen: true,
});
