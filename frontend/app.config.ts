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
        clientPort: 3000,
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
      include: ['solid-js'],
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
