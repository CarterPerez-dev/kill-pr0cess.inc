/*
 * Complete SolidStart application configuration with full optimization settings and Tailwind integration.
 * I'm configuring Vinxi with comprehensive build settings, development server options, and PostCSS integration for the dark performance showcase.
 */

import { defineConfig } from "@solidjs/start/config";

export default defineConfig({
  server: {
    preset: "node",
    experimental: {
      islands: false
    }
  },
  vite: {
    build: {
      target: 'esnext',
      minify: 'esbuild',
      sourcemap: true,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['solid-js', '@solidjs/router'],
          },
        },
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      open: false,
      hmr: {
        port: 3001,
      },
    },
    define: {
      __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
      __VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
    },
    css: {
      postcss: {
        plugins: [
          require('tailwindcss'),
          require('autoprefixer'),
        ],
      },
    },
    resolve: {
      alias: {
        '~': '/src',
        '@': '/src',
      }
    },
    optimizeDeps: {
      include: ['solid-js', '@solidjs/router', '@solidjs/meta'],
      exclude: ['@solidjs/start'],
    },
    esbuild: {
      target: 'esnext',
      drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
    },
  },
  solid: {
    ssr: true,
    islands: false,
    islandsRouter: false,
  },
});
