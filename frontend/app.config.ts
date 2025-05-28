/*
 * Complete SolidStart application configuration with full optimization settings and Tailwind integration.
 * I'm configuring Vinxi with comprehensive build settings, development server options, and PostCSS integration for the dark performance showcase.
 */

import { defineConfig } from "@solidjs/start/config";
import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";

export default defineConfig({
  server: {
    preset: "node",
    // conditions: ["development", "browser", "worker", "solid", "solid-server"], // Removed as it's not a known property
    // defaultServerConditions: [], // Removed as it's not a known property
    experimental: {
      // islands: false // Removed as it's not a known property
    }
  },
    vite: {
      resolve: {
        conditions: ['solid', 'development', 'browser', 'module', 'import', 'default', 'node'],
        alias: {
          '~': '/src',
          '@': '/src',
        }
      },
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
      hmr: false, // Re-enable HMR with default settings
    },
    define: {
      __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
      __VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
    },
    css: {
      postcss: {
        plugins: [
          tailwindcss(),
          autoprefixer(),
        ],
      },
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
    // islands: false, // Removed as it's not a known property
    // islandsRouter: false, // Removed as it's not a known property
  },
});
