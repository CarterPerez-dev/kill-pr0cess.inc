import { Suspense, Component, JSX, createSignal, onMount, Show } from "solid-js";
import { MetaProvider, Title, Meta, Link as MetaLink } from "@solidjs/meta";
import { Router } from "@solidjs/router"; // For the main Router context
import { FileRoutes, Scripts } from "@solidjs/start/router"; // For FileRoutes and Scripts
import "./app.css"; // Your global styles

// Import your Header and Footer components if you want a global layout
import { Header } from './components/Layout/Header';
import { Footer } from './components/Layout/Footer';
import { ErrorBoundary } from './components/UI/ErrorBoundary'; // Assuming this exists
// If PerformanceDebugPanel is for this level, import it too, or remove if it was for _layout
// import { PerformanceDebugPanel } from './components/Layout/Layout';


const App: Component = () => {
  console.log("[app.tsx] Official Example Structure - App component function executed.");
  const [isShellLoading, setIsShellLoading] = createSignal(true);

  onMount(() => {
    console.log("[app.tsx] Official Example Structure - App onMount.");
    setTimeout(() => {
      setIsShellLoading(false);
      console.log("[app.tsx] Official Example Structure - Shell loading complete.");
    }, 100);
  });

  return (
    <Router
      root={(props) => ( // The 'root' prop of Router provides the layout
        <MetaProvider>
          <Title>Performance Showcase - SolidStart</Title>
          <Meta name="description" content="A dark, contemplative performance showcase application using SolidStart." />
          <MetaLink rel="icon" href="/favicon.ico" />
          <MetaLink rel="preconnect" href="https://fonts.googleapis.com" />
          <MetaLink rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700&display=swap" rel="stylesheet" />

          <div id="app-shell-from-official-example-structure" class="min-h-screen bg-black text-neutral-100 flex flex-col">
            <Header /> {/* Your global header */}

            <Show
              when={!isShellLoading()}
              fallback={
                <div style="flex-grow: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #000;">
                  <div style="width: 50px; height: 50px; border: 4px solid #555; border-top-color: #0af; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                  <p style="color: #777; margin-top: 15px; font-family: monospace;">Initializing Shell...</p>
                  <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
              }
            >
              <main class="flex-grow relative" style="border: 3px dashed mediumvioletred; padding: 10px;">
                <ErrorBoundary context="FileRoutes Content" level="page">
                  <Suspense fallback={<div style="text-align:center; padding:20px; color:#666;">Loading Route...</div>}>
                    {props.children} {/* This is where FileRoutes' output goes */}
                  </Suspense>
                </ErrorBoundary>
              </main>
            </Show>

            <Footer /> {/* Your global footer */}

            {import.meta.env.DEV && (
              <div style="position: fixed; bottom: 10px; right: 10px; background: rgba(0,0,0,0.8); color: #aaa; padding: 5px 10px; font-size: 10px; font-family: monospace; z-index: 1000;">
                <div>SolidStart (Official Example Structure)</div>
                <div>Mode: {typeof window !== 'undefined' ? 'Hydrated' : 'SSR'}</div>
              </div>
            )}
          </div>
          <Scripts /> {/* Scripts from @solidjs/start/router */}
        </MetaProvider>
      )}
    >
      <FileRoutes /> {/* FileRoutes is a child of Router, it determines which page to render into props.children of the root layout */}
    </Router>
  );
};

export default App;
