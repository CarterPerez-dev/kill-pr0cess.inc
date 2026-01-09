// @refresh reload
import { createHandler, StartServer } from '@solidjs/start/server';

export default createHandler(() => (
  <StartServer
    document={({ assets, children, scripts }) => (
      <html
        lang="en"
        class="dark"
      >
        <head>
          <meta charSet="utf-8" />
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1"
          />
          <meta
            name="theme-color"
            content="#000000"
          />
          <meta
            name="color-scheme"
            content="dark"
          />
          <link
            rel="icon"
            href="/favicon.ico"
          />
          <link
            rel="stylesheet"
            href="https://fonts.googleapis.com/css2?family=Inter:wght@400&display=swap"
          />
          {assets}
        </head>
        <body>
          <div id="app">{children}</div>
          {scripts}
          <script>window.__PERFORMANCE_START__ = Date.now();</script>
        </body>
      </html>
    )}
  />
));
