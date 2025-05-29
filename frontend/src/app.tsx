// frontend/src/app.tsx
import { Component, createSignal, onMount, Show } from 'solid-js';
import './app.css';
import './routes.tsx'; // This import is usually for SolidStart to pick up route definitions

const App: Component = () => {
  const [isLoading, setIsLoading] = createSignal(true);

  onMount(() => {
    setTimeout(() => {
      setIsLoading(false);
      console.log("[App.tsx] Initial loading simulation complete.");
    }, 100);
  });

  return (
    <div id="app-shell-root" style="min-height: 100vh; background-color: #111; color: #eee; font-family: sans-serif;">
      <h1 style="color: deeppink; padding: 10px; border-bottom: 1px solid #444; position: fixed; top: 0; left: 0; width: 100%; background: #222; z-index: 100;">
        APP.TSX SHELL IS RUNNING (Standard SolidStart Structure)
      </h1>

      <Show
        when={!isLoading()}
        fallback={
          <div style="position: fixed; inset: 0; background: #000; display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 99;">
            <div style="width: 50px; height: 50px; border: 4px solid #555; border-top-color: #0af; border-radius: 50%; animation: spin 1s linear infinite;"></div>
            <p style="color: #777; margin-top: 15px; font-family: monospace;">Loading Shell...</p>
          </div>
        }
      >
        <div style="padding-top: 70px;">
          <div
            id="page-content-outlet"
            style="border: 3px dashed limegreen; padding: 20px; margin: 20px; min-height: 200px;"
          >
            PLACEHOLDER: SolidStart Router should inject page content here.
          </div>
        </div>
      </Show>

      {import.meta.env.DEV && (
        <div style="position: fixed; bottom: 10px; right: 10px; background: rgba(0,0,0,0.7); color: #aaa; padding: 5px 10px; font-size: 10px; font-family: monospace; z-index: 100;">
          <div>SolidStart: {typeof window !== 'undefined' ? 'Hydrated' : 'SSR'}</div>
          <div>Build: DEV</div>
        </div>
      )}

      <style>
        {`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default App;
