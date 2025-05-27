/*
 * Performance monitoring utilities providing comprehensive web vitals tracking, resource monitoring, and optimization recommendations.
 * I'm implementing client-side performance measurement with real-time metrics collection, historical analysis, and integration with the backend performance service for holistic monitoring.
 */

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  threshold: {
    good: number;
    poor: number;
  };
}

interface WebVitals {
  cls: PerformanceMetric | null; // Cumulative Layout Shift
  fid: PerformanceMetric | null; // First Input Delay
  fcp: PerformanceMetric | null; // First Contentful Paint
  lcp: PerformanceMetric | null; // Largest Contentful Paint
  ttfb: PerformanceMetric | null; // Time to First Byte
}

interface ResourceTiming {
  name: string;
  duration: number;
  size: number;
  type: string;
  cached: boolean;
}

interface PerformanceObservation {
  timestamp: number;
  webVitals: WebVitals;
  resources: ResourceTiming[];
  memoryUsage: MemoryInfo | null;
  navigationTiming: PerformanceNavigationTiming | null;
}

// I'm defining performance thresholds based on web vitals standards
const PERFORMANCE_THRESHOLDS = {
  cls: { good: 0.1, poor: 0.25 },
  fid: { good: 100, poor: 300 },
  fcp: { good: 1800, poor: 3000 },
  lcp: { good: 2500, poor: 4000 },
  ttfb: { good: 800, poor: 1800 },
};

// I'm creating a performance monitoring class for comprehensive tracking
class PerformanceMonitor {
  private observations: PerformanceObservation[] = [];
  private observers: PerformanceObserver[] = [];
  private vitals: WebVitals = {
    cls: null,
    fid: null,
    fcp: null,
    lcp: null,
    ttfb: null,
  };

  constructor() {
    this.initializeObservers();
    this.startPeriodicCollection();
  }

  private initializeObservers() {
    // I'm setting up observers for different performance entry types
    if ('PerformanceObserver' in window) {
      this.observeWebVitals();
      this.observeResourceTiming();
      this.observeNavigationTiming();
    }
  }

  private observeWebVitals() {
    try {
      // Largest Contentful Paint observer
      const lcpObserver = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          this.vitals.lcp = this.createMetric('lcp', entry.startTime, 'ms', PERFORMANCE_THRESHOLDS.lcp);
        }
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(lcpObserver);

      // First Contentful Paint observer
      const fcpObserver = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            this.vitals.fcp = this.createMetric('fcp', entry.startTime, 'ms', PERFORMANCE_THRESHOLDS.fcp);
          }
        }
      });
      fcpObserver.observe({ entryTypes: ['paint'] });
      this.observers.push(fcpObserver);

      // Cumulative Layout Shift observer
      const clsObserver = new PerformanceObserver((entryList) => {
        let clsValue = 0;
        for (const entry of entryList.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        }
        if (clsValue > 0) {
          this.vitals.cls = this.createMetric('cls', clsValue, 'score', PERFORMANCE_THRESHOLDS.cls);
        }
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(clsObserver);

      // First Input Delay observer
      const fidObserver = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          const fid = (entry as any).processingStart - entry.startTime;
          this.vitals.fid = this.createMetric('fid', fid, 'ms', PERFORMANCE_THRESHOLDS.fid);
        }
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
      this.observers.push(fidObserver);

    } catch (error) {
      console.warn('Failed to setup web vitals observers:', error);
    }
  }

  private observeResourceTiming() {
    try {
      const resourceObserver = new PerformanceObserver((entryList) => {
        // I'm processing resource timing data for analysis
        const resources = entryList.getEntries().map(entry => {
          const resource = entry as PerformanceResourceTiming;
          return {
            name: resource.name,
            duration: resource.duration,
            size: resource.transferSize || 0,
            type: this.getResourceType(resource.name),
            cached: resource.transferSize === 0 && resource.decodedBodySize > 0,
          };
        });

        // Store latest resource timings
        this.observations.push({
          timestamp: Date.now(),
          webVitals: { ...this.vitals },
          resources,
          memoryUsage: this.getMemoryInfo(),
          navigationTiming: this.getNavigationTiming(),
        });
      });

      resourceObserver.observe({ entryTypes: ['resource'] });
      this.observers.push(resourceObserver);
    } catch (error) {
      console.warn('Failed to setup resource timing observer:', error);
    }
  }

  private observeNavigationTiming() {
    // I'm collecting navigation timing data for page load analysis
    if (performance.getEntriesByType && performance.getEntriesByType('navigation').length > 0) {
      const navTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const ttfb = navTiming.responseStart - navTiming.requestStart;

      this.vitals.ttfb = this.createMetric('ttfb', ttfb, 'ms', PERFORMANCE_THRESHOLDS.ttfb);
    }
  }

  private createMetric(name: string, value: number, unit: string, threshold: { good: number; poor: number }): PerformanceMetric {
    let rating: 'good' | 'needs-improvement' | 'poor';

    if (value <= threshold.good) {
      rating = 'good';
    } else if (value <= threshold.poor) {
      rating = 'needs-improvement';
    } else {
      rating = 'poor';
    }

    return {
      name,
      value,
      unit,
      timestamp: Date.now(),
      rating,
      threshold,
    };
  }

  private getResourceType(url: string): string {
    const extension = url.split('.').pop()?.toLowerCase();

    switch (extension) {
      case 'js': return 'script';
      case 'css': return 'stylesheet';
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
      case 'svg':
      case 'webp': return 'image';
      case 'woff':
      case 'woff2':
      case 'ttf': return 'font';
      default: return 'other';
    }
  }

  private getMemoryInfo(): MemoryInfo | null {
    // I'm accessing memory information when available
    return (performance as any).memory || null;
  }

  private getNavigationTiming(): PerformanceNavigationTiming | null {
    const entries = performance.getEntriesByType('navigation');
    return entries.length > 0 ? entries[0] as PerformanceNavigationTiming : null;
  }

  private startPeriodicCollection() {
    // I'm collecting performance snapshots periodically
    setInterval(() => {
      this.collectSnapshot();
    }, 30000); // Every 30 seconds
  }

  private collectSnapshot() {
    this.observations.push({
      timestamp: Date.now(),
      webVitals: { ...this.vitals },
      resources: [],
      memoryUsage: this.getMemoryInfo(),
      navigationTiming: this.getNavigationTiming(),
    });

    // Keep only the last 100 observations
    if (this.observations.length > 100) {
      this.observations = this.observations.slice(-100);
    }
  }

  // Public API methods
  getCurrentVitals(): WebVitals {
    return { ...this.vitals };
  }

  getObservations(): PerformanceObservation[] {
    return [...this.observations];
  }

  getPerformanceScore(): number {
    const vitals = Object.values(this.vitals).filter(v => v !== null) as PerformanceMetric[];

    if (vitals.length === 0) return 0;

    const scores = vitals.map(vital => {
      switch (vital.rating) {
        case 'good': return 100;
        case 'needs-improvement': return 60;
        case 'poor': return 20;
        default: return 0;
      }
    });

    return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
  }

  getRecommendations(): string[] {
    const recommendations: string[] = [];

    if (this.vitals.lcp && this.vitals.lcp.rating !== 'good') {
      recommendations.push('Optimize Largest Contentful Paint by reducing server response times and optimizing resource loading');
    }

    if (this.vitals.cls && this.vitals.cls.rating !== 'good') {
      recommendations.push('Reduce Cumulative Layout Shift by setting dimensions on images and avoiding dynamic content insertion');
    }

    if (this.vitals.fid && this.vitals.fid.rating !== 'good') {
      recommendations.push('Improve First Input Delay by reducing JavaScript execution time and splitting long tasks');
    }

    const memoryInfo = this.getMemoryInfo();
    if (memoryInfo && memoryInfo.usedJSHeapSize > 50 * 1024 * 1024) { // 50MB
      recommendations.push('High memory usage detected - consider reducing JavaScript heap size');
    }

    return recommendations;
  }

  destroy() {
    // I'm cleaning up all observers
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// I'm creating utility functions for performance analysis
export const performanceUtils = {
  // Measure function execution time
  measureFunction: async <T>(fn: () => Promise<T> | T, label?: string): Promise<{ result: T; duration: number }> => {
    const start = performance.now();
    const result = await fn();
    const duration = performance.now() - start;

    if (label) {
      console.log(`${label}: ${duration.toFixed(2)}ms`);
    }

    return { result, duration };
  },

  // Measure React component render time
  measureRender: (componentName: string, renderFn: () => void) => {
    const start = performance.now();
    renderFn();
    const duration = performance.now() - start;

    console.log(`${componentName} render: ${duration.toFixed(2)}ms`);
    return duration;
  },

  // Debounce function for performance optimization
  debounce: <T extends (...args: any[]) => void>(fn: T, delay: number): T => {
    let timeoutId: number;

    return ((...args: any[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn(...args), delay);
    }) as T;
  },

  // Throttle function for performance optimization
  throttle: <T extends (...args: any[]) => void>(fn: T, delay: number): T => {
    let lastCallTime = 0;

    return ((...args: any[]) => {
      const currentTime = Date.now();
      if (currentTime - lastCallTime >= delay) {
        fn(...args);
        lastCallTime = currentTime;
      }
    }) as T;
  },

  // Lazy loading utility
  createIntersectionObserver: (
    callback: (entries: IntersectionObserverEntry[]) => void,
    options?: IntersectionObserverInit
  ) => {
    if (!('IntersectionObserver' in window)) {
      // Fallback for browsers without IntersectionObserver
      return {
        observe: () => {},
        unobserve: () => {},
        disconnect: () => {},
      };
    }

    return new IntersectionObserver(callback, {
      root: null,
      rootMargin: '50px',
      threshold: 0.1,
      ...options,
    });
  },

  // Resource preloading utilities
  preloadResource: (href: string, as: string, crossorigin?: string) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = href;
    link.as = as;
    if (crossorigin) link.crossOrigin = crossorigin;

    document.head.appendChild(link);

    return () => document.head.removeChild(link);
  },

  // Prefetch resources for better navigation
  prefetchResource: (href: string) => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = href;

    document.head.appendChild(link);

    return () => document.head.removeChild(link);
  },

  // Bundle analysis helper
  analyzeBundle: () => {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const scripts = entries.filter(entry => entry.name.includes('.js'));
        const totalScriptSize = scripts.reduce((total, script) =>
          total + ((script as PerformanceResourceTiming).transferSize || 0), 0
        );

        console.log('Bundle Analysis:', {
          totalScripts: scripts.length,
          totalSize: `${(totalScriptSize / 1024).toFixed(2)}KB`,
          scripts: scripts.map(s => ({
            name: s.name.split('/').pop(),
            size: `${(((s as PerformanceResourceTiming).transferSize || 0) / 1024).toFixed(2)}KB`,
            duration: `${s.duration.toFixed(2)}ms`
          }))
        });
      });

      observer.observe({ entryTypes: ['resource'] });

      return () => observer.disconnect();
    }

    return () => {};
  }
};

// I'm creating specific utilities for fractal performance monitoring
export const fractalPerformanceUtils = {
  measureFractalGeneration: (
    generationFn: () => Promise<any>,
    parameters: { width: number; height: number; zoom: number; iterations: number }
  ) => {
    return performanceUtils.measureFunction(async () => {
      const result = await generationFn();

      // Calculate pixels per second
      const pixelsPerSecond = (parameters.width * parameters.height) / (result.computationTime / 1000);

      return {
        ...result,
        pixelsPerSecond,
        parameters,
        efficiency: pixelsPerSecond / (parameters.width * parameters.height), // Normalized efficiency
      };
    }, 'Fractal Generation');
  },

  trackCanvasPerformance: (canvas: HTMLCanvasElement) => {
    let frameCount = 0;
    let lastTime = performance.now();
    let fps = 0;

    const measureFPS = () => {
      frameCount++;
      const currentTime = performance.now();

      if (currentTime - lastTime >= 1000) {
        fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        frameCount = 0;
        lastTime = currentTime;

        // Log performance warnings
        if (fps < 30) {
          console.warn(`Canvas FPS is low: ${fps}fps`);
        }
      }

      requestAnimationFrame(measureFPS);
    };

    measureFPS();

    return {
      getFPS: () => fps,
      getCanvasMetrics: () => ({
        width: canvas.width,
        height: canvas.height,
        fps,
        pixelCount: canvas.width * canvas.height,
      })
    };
  }
};

// I'm exporting the main performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// I'm creating initialization function for the performance monitoring system
export const initializePerformanceMonitoring = () => {
  // Start monitoring immediately
  const monitor = performanceMonitor;

  // Send performance data to backend periodically
  const sendMetricsToBackend = performanceUtils.throttle(async () => {
    try {
      const vitals = monitor.getCurrentVitals();
      const score = monitor.getPerformanceScore();

      // Only send if we have meaningful data
      if (score > 0) {
        await fetch('/api/performance/web-vitals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            vitals,
            score,
            timestamp: Date.now(),
            userAgent: navigator.userAgent,
          })
        });
      }
    } catch (error) {
      console.warn('Failed to send metrics to backend:', error);
    }
  }, 60000); // Send every minute

  // Set up periodic reporting
  setInterval(sendMetricsToBackend, 60000);

  // Report on page visibility change
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      sendMetricsToBackend();
    }
  });

  // Report on page unload
  window.addEventListener('beforeunload', sendMetricsToBackend);

  return monitor;
};

// Export types for use in other modules
export type {
  PerformanceMetric,
  WebVitals,
  ResourceTiming,
  PerformanceObservation
};
