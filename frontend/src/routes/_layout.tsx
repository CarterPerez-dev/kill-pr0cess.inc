import { Component, JSX, createSignal, onMount, Show, createEffect } from 'solid-js';
import { MetaProvider, Title, Meta, Link as MetaLink } from "@solidjs/meta";
import { Header } from '../components/Layout/Header';
import { Footer } from '../components/Layout/Footer';
import { ErrorBoundary } from '../components/UI/ErrorBoundary';
import { performanceMonitor } from '../utils/performance';
import '../app.css';

interface LayoutProps {
  children: JSX.Element;
  showHeader?: boolean;
  showFooter?: boolean;
  fullWidth?: boolean;
  className?: string;
}

const RootLayout: Component<LayoutProps> = (props) => {
  const [isLoaded, setIsLoaded] = createSignal(false);
  const [scrollY, setScrollY] = createSignal(0);
  const [isOnline, setIsOnline] = createSignal(typeof navigator !== 'undefined' ? navigator.onLine : true);

  onMount(() => {
    if (typeof window !== 'undefined') {
      const stopLayoutMeasure = performanceMonitor.time('layout_mount');
      const handleScroll = () => {
        setScrollY(window.scrollY);
      };
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);

      window.addEventListener('scroll', handleScroll, { passive: true });
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      setTimeout(() => {
        setIsLoaded(true);
        stopLayoutMeasure();
        console.log("[_layout.tsx] RootLayout onMount and shell loading complete.");
      }, 100);

      return () => {
        window.removeEventListener('scroll', handleScroll);
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    } else {
      setIsLoaded(true);
      console.log("[_layout.tsx] RootLayout onMount (SSR context).");
    }
  });

  const parallaxOffset = () => typeof window !== 'undefined' ? scrollY() * 0.1 : 0;

  return (
    <MetaProvider>
      <Title>Performance Showcase</Title>
      <Meta name="description" content="A dark, contemplative performance showcase." />
      <MetaLink rel="icon" href="/favicon.ico" />
      <MetaLink rel="preconnect" href="https://fonts.googleapis.com" />
      <MetaLink rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700&display=swap" rel="stylesheet" />


      <div class={`min-h-screen bg-black text-neutral-100 relative overflow-x-hidden ${props.className || ''}`}>
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
          <div class="absolute inset-0">
            {typeof window !== 'undefined' && Array.from({ length: 20 }, (_, i) => (
              <div
                class="absolute w-1 h-1 bg-cyan-400/20 rounded-full animate-pulse"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  'animation-delay': `${Math.random() * 10}s`,
                  'animation-duration': `${3 + Math.random() * 4}s`,
                  transform: `translateY(${parallaxOffset() * (1 + Math.random())}px)`
                }}
              ></div>
            ))}
          </div>
        </div>

        <Show when={typeof window !== 'undefined' ? !isOnline() : false}>
          <div class="fixed top-0 left-0 right-0 bg-red-900/90 text-red-100 text-center py-2 text-sm font-mono z-50">
            <span class="animate-pulse">●</span> OFFLINE MODE - Limited functionality available
          </div>
        </Show>

        <div class={`relative z-10 flex flex-col min-h-screen transition-opacity duration-1000 ${isLoaded() ? 'opacity-100' : 'opacity-0'}`}>
          <Show when={props.showHeader !== false}>
            <ErrorBoundary context="Header">
              <Header />
            </ErrorBoundary>
          </Show>

          <main class={`flex-1 relative ${props.fullWidth ? '' : 'container mx-auto'}`}>
            <ErrorBoundary context="Main Content" level="page">
              {props.children}
            </ErrorBoundary>
          </main>

          <Show when={props.showFooter !== false}>
            <ErrorBoundary context="Footer">
              <Footer />
            </ErrorBoundary>
          </Show>
        </div>

        <Show when={!isLoaded() && typeof window !== 'undefined'}>
          <div class="fixed inset-0 bg-black z-[1000] flex items-center justify-center">
            <div class="text-center">
              <div class="w-16 h-16 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mb-4"></div>
              <div class="text-cyan-400 font-mono text-sm tracking-wider">
                INITIALIZING PERFORMANCE SHOWCASE
              </div>
              <div class="text-neutral-600 font-mono text-xs mt-2">
                Loading computational precision...
              </div>
            </div>
          </div>
        </Show>

        <Show when={typeof window !== 'undefined'}>
          <div class="fixed top-0 left-0 right-0 h-0.5 bg-neutral-900 z-40">
            <div
              class="h-full bg-gradient-to-r from-cyan-400 to-indigo-400 transition-all duration-100 ease-out"
              style={{
                width: `${Math.min(100, (scrollY() / (document.documentElement.scrollHeight - window.innerHeight)) * 100)}%`
              }}
            ></div>
          </div>
        </Show>

        <Show when={import.meta.env.DEV && typeof window !== 'undefined'}>
          <PerformanceDebugPanel />
        </Show>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </MetaProvider>
  );
};

export default RootLayout;

const PerformanceDebugPanel: Component = () => {
  const [isOpen, setIsOpen] = createSignal(false);
  const [metrics, setMetrics] = createSignal<any>({});

  onMount(() => {
    if (typeof window === 'undefined') return;
    const updateMetrics = () => {
      const memoryUsage = performanceMonitor.getMemoryUsage();
      const recentMetrics = performanceMonitor.getMetrics({ limit: 10 });

      setMetrics({
        memory: memoryUsage,
        recentMetrics: recentMetrics.slice(-5),
        timestamp: Date.now()
      });
    };
    updateMetrics();
    const interval = setInterval(updateMetrics, 1000);
    return () => clearInterval(interval);
  });

  return (
    <div class="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setIsOpen(!isOpen())}
        class="bg-neutral-900/90 border border-neutral-700 text-neutral-400 p-2 rounded-full hover:bg-neutral-800 transition-colors duration-200"
        title="Performance Debug Panel"
      >
        📊
      </button>
      <Show when={isOpen()}>
        <div class="absolute bottom-12 right-0 w-80 bg-black/95 border border-neutral-700 rounded-lg p-4 text-sm font-mono">
          <div class="text-cyan-400 font-semibold mb-3">Performance Debug</div>
          <Show when={metrics().memory}>
            <div class="mb-3">
              <div class="text-neutral-500 text-xs">Memory Usage</div>
              <div class="text-neutral-300">
                {(metrics().memory.usedJSHeapSize / 1024 / 1024).toFixed(1)} MB
              </div>
              <div class="text-neutral-500 text-xs">
                {metrics().memory.usage_percentage?.toFixed(1)}% of limit
              </div>
            </div>
          </Show>
          <div class="mb-3">
            <div class="text-neutral-500 text-xs mb-1">Recent Metrics</div>
            <div class="space-y-1">
              {metrics().recentMetrics?.map((metric: any) => (
                <div class="flex justify-between text-xs">
                  <span class="text-neutral-400 truncate">
                    {metric.name}
                  </span>
                  <span class="text-neutral-300">
                    {metric.value.toFixed(1)}{metric.unit}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div class="flex justify-between text-xs">
            <button onClick={() => performanceMonitor.getSnapshot()} class="text-cyan-400 hover:text-cyan-300">
              Snapshot
            </button>
            <button onClick={() => console.log('Performance Metrics:', performanceMonitor.getMetrics())} class="text-cyan-400 hover:text-cyan-300">
              Log All
            </button>
          </div>
        </div>
      </Show>
    </div>
  );
};
