// @refresh reload
import { createHandler, StartServer } from "@solidjs/start/server";

export default createHandler(() => (
  <StartServer
    document={({ assets, children, scripts }) => (
      <html lang="en" class="dark">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <meta name="theme-color" content="#000000" />
          <meta name="color-scheme" content="dark" />
          <link rel="icon" href="/favicon.ico" />
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
          <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700&display=swap" rel="preload" as="style" onload="this.onload=null;this.rel='stylesheet'" />
          <noscript>
            <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
          </noscript>
          {assets}
        </head>
        <body class="bg-black text-neutral-100 antialiased">
          <div id="app">{children}</div>
          {scripts}
          <script>
            {/* I'm injecting performance monitoring script for SSR */}
            window.__PERFORMANCE_START__ = Date.now();
          </script>
        </body>
      </html>
    )}
  />
));
