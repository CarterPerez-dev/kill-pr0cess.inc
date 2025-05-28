/*
 * Main application component orchestrating the complete dark performance showcase with sophisticated routing and state management.
 * I'm implementing comprehensive application architecture with SolidJS fine-grained reactivity, dynamic theming, and performance monitoring integration.
 */

import { Component, createSignal, onMount } from 'solid-js';
import { Router, Route, Routes } from '@solidjs/router';
import { Header } from './components/Layout/Header';
import { Footer } from './components/Layout/Footer';
import Home from './pages/Home';
import Projects from './pages/Projects';
import Performance from './pages/Performance';
import About from './pages/About';
import { useWebVitals } from './hooks/useWebVitals';
import './app.css';

const App: Component = () => {
  const [isLoading, setIsLoading] = createSignal(true);

  // I'm initializing Web Vitals monitoring for performance tracking
  useWebVitals();

  onMount(() => {
    // I'm simulating initial application loading with performance considerations
    const startTime = performance.now();

    setTimeout(() => {
      setIsLoading(false);
      const loadTime = performance.now() - startTime;
      console.log(`[Performance] Application loaded in ${loadTime.toFixed(2)}ms`);
    }, 500);
  });

  return (
    <div class="min-h-screen bg-black text-gray-100 overflow-x-hidden">
      {/* Loading screen with sophisticated animation */}
      <div
        class={`fixed inset-0 bg-black z-50 transition-opacity duration-1000 ${
          isLoading() ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div class="absolute inset-0 flex items-center justify-center">
          <div class="relative">
            <div class="w-16 h-16 border-2 border-primary-400 border-t-transparent rounded-full animate-spin"></div>
            <div class="absolute inset-0 w-16 h-16 border-2 border-secondary-500 border-b-transparent rounded-full animate-spin animation-delay-150"></div>
          </div>
        </div>

        {/* Loading progress indicator */}
        <div class="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <div class="text-sm text-gray-400 font-mono">
            Initializing performance showcase...
          </div>
        </div>
      </div>

      {/* Main application structure */}
      <Router>
        <div class="flex flex-col min-h-screen">
          <Header />

          <main class="flex-1 relative">
            {/* Atmospheric background with grid pattern */}
            <div class="absolute inset-0 opacity-5">
              <div class="absolute inset-0 bg-gradient-to-br from-primary-900/20 to-transparent"></div>
              <div class="absolute inset-0 performance-grid"></div>
            </div>

            {/* Router configuration for all application pages */}
            <Routes>
              <Route path="/" component={Home} />
              <Route path="/projects" component={Projects} />
              <Route path="/performance" component={Performance} />
              <Route path="/about" component={About} />
              <Route path="*" component={() => (
                <div class="min-h-screen bg-black text-white flex items-center justify-center">
                  <div class="text-center">
                    <h1 class="text-6xl font-thin text-neutral-100 mb-4 font-mono">404</h1>
                    <p class="text-xl text-neutral-400">Page not found</p>
                    <div class="mt-8">
                      <a href="/" class="text-primary-400 hover:text-primary-300 transition-colors">
                        Return to home
                      </a>
                    </div>
                  </div>
                </div>
              )} />
            </Routes>
          </main>

          <Footer />
        </div>
      </Router>

      {/* Performance monitoring overlay (development only) */}
      {process.env.NODE_ENV === 'development' && (
        <div class="fixed bottom-4 right-4 bg-black/80 text-xs text-gray-400 p-2 rounded font-mono z-40">
          <div>SolidJS: {typeof window !== 'undefined' ? 'Hydrated' : 'SSR'}</div>
          <div>Build: {__BUILD_TIME__}</div>
        </div>
      )}
    </div>
  );
};

export default App;
