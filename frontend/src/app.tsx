/*
 * ©AngelaMos | 2025
 */

import { Router } from '@solidjs/router';
import { FileRoutes } from '@solidjs/start/router';
import { Suspense, ErrorBoundary, type Component, type JSX } from 'solid-js';
import { MetaProvider } from '@solidjs/meta';
import './app.css';

import { Header } from './components/Layout/Header';
import { Footer } from './components/Layout/Footer';
import { ErrorBoundary as CustomErrorBoundary } from './components/UI/ErrorBoundary';

const LayoutWrapper: Component<{ children: JSX.Element }> = (props) => {
  return (
    <div class="min-h-screen bg-[hsl(0,0%,7.1%)] text-[hsl(0,0%,98%)] relative overflow-x-hidden">
      <div class="relative z-10 flex flex-col min-h-screen">
        <CustomErrorBoundary
          context="Header"
          level="component"
        >
          <Header />
        </CustomErrorBoundary>

        <main class="flex-1 relative">
          <CustomErrorBoundary
            context="Page Content"
            level="page"
          >
            {props.children}
          </CustomErrorBoundary>
        </main>

        <CustomErrorBoundary
          context="Footer"
          level="component"
        >
          <Footer />
        </CustomErrorBoundary>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <Router
      root={(props) => (
        <MetaProvider>
          <ErrorBoundary
            fallback={(err, reset) => (
              <div class="min-h-screen bg-[hsl(0,0%,7.1%)] text-[hsl(0,0%,98%)] flex items-center justify-center p-6">
                <div class="text-center max-w-md">
                  <div class="text-[#C15F3C] text-4xl mb-6">!</div>
                  <h1 class="text-lg font-medium text-[hsl(0,0%,98%)] mb-3">
                    Application Error
                  </h1>
                  <p class="text-sm text-[hsl(0,0%,53.7%)] mb-6">
                    An unexpected error occurred.
                  </p>
                  <button
                    onClick={reset}
                    class="px-4 py-2 bg-[#C15F3C] text-[hsl(0,0%,98%)] rounded text-sm transition-[filter] duration-100 hover:brightness-110"
                  >
                    Retry
                  </button>
                  <div class="mt-4 text-xs text-[hsl(0,0%,30.2%)] font-mono">
                    {err.message}
                  </div>
                </div>
              </div>
            )}
          >
            <Suspense>
              <LayoutWrapper>{props.children}</LayoutWrapper>
            </Suspense>
          </ErrorBoundary>
        </MetaProvider>
      )}
    >
      <FileRoutes />
    </Router>
  );
}
