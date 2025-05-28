// @refresh reload
import { mount, StartClient } from "@solidjs/start/client";

// I'm mounting the client application with performance monitoring
mount(() => <StartClient />, document.getElementById("app")!);

// I'm setting up client-side performance tracking
if (typeof window !== 'undefined') {
  // I'm recording the client hydration time
  const hydrationStart = (window as any).__PERFORMANCE_START__ || Date.now();

  window.addEventListener('load', () => {
    const hydrationEnd = Date.now();
    const hydrationTime = hydrationEnd - hydrationStart;

    console.log(`[Client] Hydration completed in ${hydrationTime}ms`);

    // I'm sending hydration metrics if performance endpoint is configured
    if ((import.meta.env as any).VITE_PERFORMANCE_ENDPOINT) {
      fetch((import.meta.env as any).VITE_PERFORMANCE_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metric: {
            name: 'hydration_time',
            value: hydrationTime,
            timestamp: Date.now(),
          },
          url: window.location.href,
          userAgent: navigator.userAgent,
        }),
      }).catch(() => {
        // I'm silently handling reporting failures
      });
    }
  });

  // I'm setting up global error tracking for performance analysis
  window.addEventListener('error', (event) => {
    console.error('[Client] Runtime error:', event.error);
  });

  window.addEventListener('unhandledrejection', (event) => {
    console.error('[Client] Unhandled promise rejection:', event.reason);
  });
}