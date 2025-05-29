// @refresh reload
import { mount, StartClient } from "@solidjs/start/client";

if (typeof window !== 'undefined') {
  const hydrationStart = (window as any).__PERFORMANCE_START__ || Date.now();
  window.addEventListener('load', () => {
    const hydrationEnd = Date.now();
    const hydrationTime = hydrationEnd - hydrationStart;
    console.log(`[Client] Hydration completed in ${hydrationTime}ms (Official Example Structure)`);
    if ((import.meta.env as any).VITE_PERFORMANCE_ENDPOINT) {
      fetch((import.meta.env as any).VITE_PERFORMANCE_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metric: { name: 'hydration_time', value: hydrationTime, timestamp: Date.now() },
          url: window.location.href, userAgent: navigator.userAgent,
        }),
      }).catch(() => {});
    }
  });
  window.addEventListener('error', (event) => { console.error('[Client] Runtime error:', event.error); });
  window.addEventListener('unhandledrejection', (event) => { console.error('[Client] Unhandled promise rejection:', event.reason); });
}

mount(() => <StartClient />, document.getElementById("app")!);
