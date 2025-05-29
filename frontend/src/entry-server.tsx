// frontend/src/entry-server.tsx
// @refresh reload
import { createHandler, StartServer } from "@solidjs/start/server";
import App from "./app"; // Import your App component

export default createHandler(() => (
  <StartServer
    document={({ assets, children, scripts }) => (
      // 'children' here will be <App /> because we pass it below
      <html lang="en" class="dark">
        <head>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <meta name="theme-color" content="#000000" />
          <meta name="color-scheme" content="dark" />
          <link rel="icon" href="/favicon.ico" />
          {/* Using a generic font for simplicity in this test */}
          <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap" />
          {assets}
        </head>
        <body style="margin: 0; background-color: #000; color: #fff; font-family: sans-serif;">
          <div id="app">{children}</div>
          {scripts}
          <script textContent="window.__PERFORMANCE_START__ = Date.now();" />
        </body>
      </html>
    )}
  >
    <App /> {/* Pass App as a child to StartServer */}
  </StartServer>
));
