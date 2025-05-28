import { defineConfig } from "@solidjs/start/config";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
    build: {
      target: 'esnext',
      minify: 'esbuild',
      sourcemap: true,
    },
    server: {
      port: 3000,
      host: true,
      open: false,
    },
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
    optimizeDeps: {
      include: ['solid-js', '@solidjs/router'],
      exclude: ['@solidjs/start'],
    },
    ssr: {
      external: ["solid-js"],
    }
  },
  server: {
    preset: 'node',
    experimental: {
      islands: true
    }
  },
  solid: {
  }
});
