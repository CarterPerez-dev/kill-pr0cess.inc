/*
 * Clean and focused SolidStart application configuration with essential vite-plugin-solid compatibility fixes.
 * I'm providing the minimal configuration needed to resolve plugin issues while maintaining optimal performance.
 */

import { defineConfig } from "@solidjs/start/config";
import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";

export default defineConfig({
  server: {
    preset: "node",
  },
  vite: {
    resolve: {
      conditions: ['solid', 'development', 'browser', 'module', 'import', 'default', 'node'],
      alias: {
        '~': '/src',
        '@': '/src',
      },
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
  },
});
