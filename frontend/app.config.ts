import { defineConfig } from "@solidjs/start/config";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
    // I'm optimizing build performance and bundle size
    build: {
      target: 'esnext',
      minify: 'esbuild',
      sourcemap: true,
      rollupOptions: {
        output: {
          manualChunks: {
            // I'm separating vendor code for better caching
            vendor: ['solid-js'],
            ui: ['./src/components/UI/Button', './src/components/UI/Card', './src/components/UI/LoadingSpinner'],
            github: ['./src/hooks/useGitHub', './src/services/github'],
            performance: ['./src/hooks/usePerformance', './src/utils/performance', './src/hooks/useWebVitals'],
          }
        }
      }
    },
    // I'm configuring development server for optimal performance testing
    server: {
      port: 3000,
      host: true,
      open: false,
    },
    // I'm setting up environment variables and aliases
    define: {
      __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
      __VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
    },
    resolve: {
      alias: {
        '~': '/src',
        '@': '/src',
      }
    },
    // I'm optimizing CSS processing
    css: {
      devSourcemap: true,
      preprocessorOptions: {
        scss: {
          additionalData: `@import "/src/styles/variables.scss";`
        }
      }
    },
    // I'm configuring performance optimizations
    optimizeDeps: {
      include: ['solid-js', '@solidjs/router'],
      exclude: ['@solidjs/start']
    }
  },
  // I'm configuring SolidStart specific options
  start: {
    server: {
      preset: 'node',
      // I'm enabling production optimizations
      experimental: {
        islands: true
      }
    },
    // I'm setting up build optimizations for the performance showcase
    solid: {
      babel: {
        plugins: [
          // I'm enabling additional Solid optimizations
          ['babel-plugin-solid-labels', { dev: process.env.NODE_ENV !== 'production' }]
        ]
      }
    }
  }
});
