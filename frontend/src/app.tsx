/*
 * Manual layout solution that bypasses SolidStart's _layout.tsx system by wrapping routes directly in app.tsx.
 * I'm implementing this approach when the automatic layout system isn't working, ensuring we still get our header, footer, and dark theme.
 */

import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Suspense, ErrorBoundary, Component, JSX, createSignal, onMount, Show } from "solid-js";
import { MetaProvider } from "@solidjs/meta";
import "./app.css";

// I'm importing our layout components directly
import { Header } from "./components/Layout/Header";
import { Footer } from "./components/Layout/Footer";
import { ErrorBoundary as CustomErrorBoundary } from "./components/UI/ErrorBoundary";

// I'm importing theme initialization
import { initializeTheme } from "./utils/theme";

// I'm creating a manual layout wrapper component
const ManualLayoutWrapper: Component<{ children: JSX.Element }> = (props) => {
  const [isLoaded, setIsLoaded] = createSignal(false);
  const [scrollY, setScrollY] = createSignal(0);

  onMount(() => {
    console.log('[MANUAL LAYOUT] Layout wrapper mounting...');

    // I'm initializing the theme
    initializeTheme();

    // I'm setting up scroll tracking
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });

    // I'm implementing the loading delay for the eerie effect
    setTimeout(() => {
      setIsLoaded(true);
      console.log('[MANUAL LAYOUT] Layout loaded and ready');
    }, 300);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  });

  const parallaxOffset = () => scrollY() * 0.1;

  return (
    <div class="min-h-screen bg-black text-neutral-100 relative overflow-x-hidden">
      {/* I'm adding the atmospheric background */}
      <div class="fixed inset-0 pointer-events-none">
        <div
          class="absolute inset-0 opacity-[0.02]"
          style={{
            background: `radial-gradient(circle at 50% ${50 + parallaxOffset()}%, rgba(34, 211, 238, 0.1) 0%, transparent 50%)`,
          }}
        ></div>
        <div
          class="absolute inset-0 opacity-[0.03]"
          style={{
            "background-image": `linear-gradient(rgba(34, 211, 238, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(34, 211, 238, 0.1) 1px, transparent 1px)`,
            "background-size": "50px 50px",
            transform: `translateY(${parallaxOffset()}px)`
          }}
        ></div>
      </div>

      {/* I'm creating the main application structure */}
      <div class={`relative z-10 flex flex-col min-h-screen transition-opacity duration-1000 ${isLoaded() ? 'opacity-100' : 'opacity-0'}`}>
        <CustomErrorBoundary context="Header" level="component">
          <Header />
        </CustomErrorBoundary>

        <main class="flex-1 relative">
          <CustomErrorBoundary context="Page Content" level="page">
            {props.children}
          </CustomErrorBoundary>
        </main>

        <CustomErrorBoundary context="Footer" level="component">
          <Footer />
        </CustomErrorBoundary>
      </div>

      {/* I'm implementing the loading screen */}
      <Show when={!isLoaded()}>
        <div class="fixed inset-0 bg-black z-[60] flex items-center justify-center">
          <div class="text-center">
            <div class="relative mb-8">
              <div class="w-20 h-20 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin"></div>
              <div class="absolute inset-2 w-16 h-16 border border-indigo-400/20 border-r-indigo-400 rounded-full animate-spin" style="animation-direction: reverse; animation-duration: 2s;"></div>
            </div>
            <div class="text-cyan-400 font-mono text-lg tracking-wider mb-2 animate-pulse">
              PERFORMANCE SHOWCASE
            </div>
            <div class="text-neutral-400 font-mono text-sm tracking-wider">
              Manual layout system active...
            </div>
          </div>
        </div>
      </Show>

      {/* I'm adding scroll progress indicator */}
      <Show when={isLoaded()}>
        <div class="fixed top-0 left-0 right-0 h-0.5 bg-neutral-900 z-40">
          <div
            class="h-full bg-gradient-to-r from-cyan-400 to-indigo-400 transition-all duration-100 ease-out"
            style={{
              width: `${Math.min(100, (scrollY() / (document.documentElement.scrollHeight - window.innerHeight)) * 100)}%`
            }}
          ></div>
        </div>
      </Show>

      {/* I'm adding corner accents */}
      <div class="fixed top-0 left-0 w-32 h-32 border-l border-t border-neutral-800/30 opacity-20 pointer-events-none z-10"></div>
      <div class="fixed top-0 right-0 w-32 h-32 border-r border-t border-neutral-800/30 opacity-20 pointer-events-none z-10"></div>
      <div class="fixed bottom-0 left-0 w-32 h-32 border-l border-b border-neutral-800/30 opacity-20 pointer-events-none z-10"></div>
      <div class="fixed bottom-0 right-0 w-32 h-32 border-r border-b border-neutral-800/30 opacity-20 pointer-events-none z-10"></div>
    </div>
  );
};

export default function App() {
  return (
    <Router
      root={props => (
        <MetaProvider>
          <ErrorBoundary
            fallback={(err, reset) => (
              <div class="min-h-screen bg-black text-neutral-100 flex items-center justify-center p-6">
                <div class="text-center max-w-md">
                  <div class="text-red-400 text-6xl mb-6">⚠</div>
                  <h1 class="text-2xl font-thin text-neutral-100 mb-4">
                    APPLICATION ERROR
                  </h1>
                  <p class="text-neutral-400 mb-6 leading-relaxed">
                    An unexpected error occurred. Manual layout system failed.
                  </p>
                  <button
                    onClick={reset}
                    class="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded font-mono text-sm transition-colors duration-200"
                  >
                    RETRY APPLICATION
                  </button>
                  <div class="mt-4 text-xs text-neutral-600">
                    Error: {err.message}
                  </div>
                </div>
              </div>
            )}
          >
            <Suspense
              fallback={
                <div class="min-h-screen bg-black flex items-center justify-center">
                  <div class="text-center">
                    <div class="w-16 h-16 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin mb-4"></div>
                    <div class="text-cyan-400 font-mono text-sm tracking-wider animate-pulse">
                      Loading Application...
                    </div>
                  </div>
                </div>
              }
            >
              <ManualLayoutWrapper>
                {props.children}
              </ManualLayoutWrapper>
            </Suspense>
          </ErrorBoundary>
        </MetaProvider>
      )}
    >
      <FileRoutes />
    </Router>
  );
}
