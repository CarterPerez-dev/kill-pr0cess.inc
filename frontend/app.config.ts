import { defineConfig } from "@solidjs/start/config";
import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";

export default defineConfig({
  server: {
    preset: "node-server",
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
          manualChunks: (id) => {
            if (id.includes('node_modules')) {
              if (id.includes('@solidjs/router')) return 'router';
              if (id.includes('web-vitals')) return 'vitals';
              return 'vendor';
            }
          },
        },
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      open: false,
      hmr: process.env.NODE_ENV === 'development' ? {
        port: 3000,
      } : false,
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
      include: ['web-vitals'],
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
