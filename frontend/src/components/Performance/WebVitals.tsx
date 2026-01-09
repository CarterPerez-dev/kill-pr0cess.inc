/*
 * ©AngelaMos | 2025
 */

import {
  type Component,
  createSignal,
  onMount,
  onCleanup,
  createEffect,
} from 'solid-js';
import { onCLS, onINP, onFCP, onLCP, onTTFB } from 'web-vitals';

interface VitalsMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  threshold: { good: number; poor: number };
  unit: string;
  description: string;
}

interface WebVitalsState {
  metrics: Map<string, VitalsMetric>;
  isLoading: boolean;
  lastUpdated: Date | null;
}

export const WebVitals: Component = () => {
  const [vitals, setVitals] = createSignal<WebVitalsState>({
    metrics: new Map(),
    isLoading: true,
    lastUpdated: null,
  });

  const [performanceEntries, setPerformanceEntries] = createSignal<
    PerformanceEntry[]
  >([]);

  const thresholds = {
    LCP: { good: 2500, poor: 4000 },
    INP: { good: 200, poor: 500 },
    CLS: { good: 0.1, poor: 0.25 },
    FCP: { good: 1800, poor: 3000 },
    TTFB: { good: 800, poor: 1800 },
  };

  const getRating = (
    name: string,
    value: number,
  ): 'good' | 'needs-improvement' | 'poor' => {
    const threshold = thresholds[name as keyof typeof thresholds];
    if (!threshold) return 'good';

    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
  };

  const updateMetric = (
    name: string,
    value: number,
    unit: string,
    description: string,
  ) => {
    setVitals((prev) => {
      const newMetrics = new Map(prev.metrics);
      newMetrics.set(name, {
        name,
        value,
        rating: getRating(name, value),
        threshold: thresholds[name as keyof typeof thresholds] || {
          good: 0,
          poor: 0,
        },
        unit,
        description,
      });

      return {
        ...prev,
        metrics: newMetrics,
        lastUpdated: new Date(),
        isLoading: false,
      };
    });
  };

  const collectAdditionalMetrics = () => {
    const nav = performance.getEntriesByType(
      'navigation',
    )[0] as PerformanceNavigationTiming;
    if (nav) {
      const domContentLoaded = nav.domContentLoadedEventEnd - nav.startTime;
      const pageLoad = nav.loadEventEnd - nav.startTime;

      if (domContentLoaded > 0) {
        updateMetric(
          'DOM Content Loaded',
          Math.round(domContentLoaded),
          'ms',
          'Time to interactive DOM',
        );
      }
      if (pageLoad > 0) {
        updateMetric(
          'Page Load',
          Math.round(pageLoad),
          'ms',
          'Complete page load time',
        );
      }
    }

    const resources = performance.getEntriesByType('resource');
    if (resources.length > 0) {
      const totalSize = resources.reduce(
        (sum, resource) => sum + (resource as any).transferSize || 0,
        0,
      );
      updateMetric(
        'Total Resources',
        resources.length,
        'count',
        'Number of loaded resources',
      );
      updateMetric(
        'Transfer Size',
        Math.round(totalSize / 1024),
        'KB',
        'Total transfer size',
      );
    }

    if ('memory' in performance) {
      const memory = (performance as any).memory;
      updateMetric(
        'JS Heap Used',
        Math.round(memory.usedJSHeapSize / 1024 / 1024),
        'MB',
        'JavaScript heap memory used',
      );
    }
  };

  onMount(() => {
    onCLS((metric) =>
      updateMetric('CLS', metric.value, '', 'Cumulative Layout Shift'),
    );
    onINP((metric) =>
      updateMetric('INP', metric.value, 'ms', 'Interaction to Next Paint'),
    );
    onFCP((metric) =>
      updateMetric('FCP', metric.value, 'ms', 'First Contentful Paint'),
    );
    onLCP((metric) =>
      updateMetric('LCP', metric.value, 'ms', 'Largest Contentful Paint'),
    );
    onTTFB((metric) =>
      updateMetric('TTFB', metric.value, 'ms', 'Time to First Byte'),
    );

    collectAdditionalMetrics();

    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        setPerformanceEntries((prev) => [...prev, ...list.getEntries()]);
        collectAdditionalMetrics();
      });

      try {
        observer.observe({
          entryTypes: [
            'navigation',
            'resource',
            'paint',
            'largest-contentful-paint',
          ],
        });
      } catch (e) {
        console.warn('Performance Observer not fully supported:', e);
      }

      onCleanup(() => observer.disconnect());
    }

    const interval = setInterval(collectAdditionalMetrics, 5000);
    onCleanup(() => clearInterval(interval));
  });

  const formatValue = (metric: VitalsMetric): string => {
    if (metric.name === 'CLS') {
      return metric.value?.toFixed(3) || '0.000';
    }
    if (metric.unit === 'ms') {
      return `${Math.round(metric.value || 0)}${metric.unit}`;
    }
    return `${metric.value || 0}${metric.unit}`;
  };

  const getRatingColor = (rating: string): string => {
    switch (rating) {
      case 'good':
        return 'text-emerald-400 border-emerald-500/30';
      case 'needs-improvement':
        return 'text-amber-400 border-amber-500/30';
      case 'poor':
        return 'text-red-400 border-red-500/30';
      default:
        return 'text-neutral-400 border-neutral-500/30';
    }
  };

  const getRatingIcon = (rating: string): string => {
    switch (rating) {
      case 'good':
        return '●';
      case 'needs-improvement':
        return '◐';
      case 'poor':
        return '○';
      default:
        return '◯';
    }
  };

  return (
    <div class="space-y-6">
      <div class="text-center">
        <h3 class="text-xl font-mono font-light tracking-wider text-neutral-200 mb-2">
          REAL-TIME WEB VITALS
        </h3>
        <p class="text-sm text-neutral-500">
          Core Web Vitals and performance metrics •{' '}
          {vitals().isLoading ? 'Collecting...' : 'Live'}
        </p>
        {vitals().lastUpdated && (
          <p class="text-xs text-neutral-600 mt-1">
            Last updated: {vitals().lastUpdated.toLocaleTimeString()}
          </p>
        )}
      </div>

      {vitals().isLoading ? (
        <div class="flex justify-center items-center h-32">
          <div class="loading-pulse w-8 h-8 rounded-full"></div>
        </div>
      ) : (
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from(vitals().metrics.values()).map((metric) => (
            <div
              class={`glass-effect-strong border rounded-lg p-4 hover-lift transition-all duration-500 ${getRatingColor(metric.rating)}`}
            >
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-2">
                  <span
                    class={`text-lg ${getRatingColor(metric.rating).split(' ')[0]}`}
                  >
                    {getRatingIcon(metric.rating)}
                  </span>
                  <span class="text-sm font-mono text-neutral-300 tracking-wider">
                    {metric.name}
                  </span>
                </div>
              </div>

              <div class="text-2xl font-mono font-light text-gradient mb-2">
                {formatValue(metric)}
              </div>

              <p class="text-xs text-neutral-500 leading-relaxed">
                {metric.description}
              </p>

              {metric.threshold.good > 0 && (
                <div class="mt-3 pt-2 border-t border-neutral-700/50">
                  <div class="flex justify-between text-xs text-neutral-600">
                    <span>
                      Good: ≤{metric.threshold.good}
                      {metric.unit}
                    </span>
                    <span>
                      Poor: &gt;{metric.threshold.poor}
                      {metric.unit}
                    </span>
                  </div>
                  <div class="mt-1 h-1 bg-neutral-800 rounded-full overflow-hidden">
                    <div
                      class={`h-full transition-all duration-1000 ${
                        metric.rating === 'good'
                          ? 'bg-emerald-500'
                          : metric.rating === 'needs-improvement'
                            ? 'bg-amber-500'
                            : 'bg-red-500'
                      }`}
                      style={{
                        width: `${Math.min(100, (metric.value / metric.threshold.poor) * 100)}%`,
                      }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Performance Summary */}
      <div class="glass-effect border border-neutral-700/50 rounded-lg p-4">
        <div class="flex items-center justify-between mb-3">
          <h4 class="text-sm font-mono text-neutral-300 tracking-wider">
            PERFORMANCE SUMMARY
          </h4>
          <div class="flex gap-4 text-xs">
            <span class="flex items-center gap-1">
              <span class="text-emerald-400">●</span> Good
            </span>
            <span class="flex items-center gap-1">
              <span class="text-amber-400">◐</span> Needs Improvement
            </span>
            <span class="flex items-center gap-1">
              <span class="text-red-400">○</span> Poor
            </span>
          </div>
        </div>

        <div class="grid grid-cols-3 gap-4 text-center">
          <div>
            <div class="text-lg font-mono font-light text-emerald-400">
              {
                Array.from(vitals().metrics.values()).filter(
                  (m) => m.rating === 'good',
                ).length
              }
            </div>
            <div class="text-xs text-neutral-500">Good</div>
          </div>
          <div>
            <div class="text-lg font-mono font-light text-amber-400">
              {
                Array.from(vitals().metrics.values()).filter(
                  (m) => m.rating === 'needs-improvement',
                ).length
              }
            </div>
            <div class="text-xs text-neutral-500">Needs Work</div>
          </div>
          <div>
            <div class="text-lg font-mono font-light text-red-400">
              {
                Array.from(vitals().metrics.values()).filter(
                  (m) => m.rating === 'poor',
                ).length
              }
            </div>
            <div class="text-xs text-neutral-500">Poor</div>
          </div>
        </div>
      </div>
    </div>
  );
};
