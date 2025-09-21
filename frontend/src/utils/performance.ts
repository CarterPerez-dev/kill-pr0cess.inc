/*
 * ©AngelaMos | 2025
 */

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  context?: string;
}

interface SystemResources {
  cpuUsage?: number;
  memoryUsage?: number;
  networkLatency?: number;
  diskIO?: number;
  gpuUsage?: number;
}

interface PerformanceSnapshot {
  timestamp: number;
  metrics: PerformanceMetric[];
  resources: SystemResources;
  userAgent: string;
  url: string;
}

interface BenchmarkResult {
  name: string;
  duration: number;
  iterations: number;
  averageTime: number;
  minTime: number;
  maxTime: number;
  standardDeviation: number;
  samples: number[];
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private observers: PerformanceObserver[] = [];
  private benchmarks: Map<string, number[]> = new Map();
  private isMonitoring: boolean = false;

  constructor() {
    this.initializeObservers();
  }

  // I'm setting up comprehensive performance observers
  private initializeObservers() {
    if (typeof PerformanceObserver === 'undefined') {
      console.warn('PerformanceObserver not supported');
      return;
    }

    try {
      // Navigation timing observer
      const navigationObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === 'navigation') {
            this.recordNavigationMetrics(entry as PerformanceNavigationTiming);
          }
        });
      });
      navigationObserver.observe({ entryTypes: ['navigation'] });
      this.observers.push(navigationObserver);

      // Resource timing observer
      const resourceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === 'resource') {
            this.recordResourceMetric(entry as PerformanceResourceTiming);
          }
        });
      });
      resourceObserver.observe({ entryTypes: ['resource'] });
      this.observers.push(resourceObserver);

      // Measure observer for custom metrics
      const measureObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === 'measure') {
            this.recordMeasure(entry as PerformanceMeasure);
          }
        });
      });
      measureObserver.observe({ entryTypes: ['measure'] });
      this.observers.push(measureObserver);

      // Paint timing observer
      const paintObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          this.recordPaintMetric(entry as PerformancePaintTiming);
        });
      });
      paintObserver.observe({ entryTypes: ['paint'] });
      this.observers.push(paintObserver);

    } catch (error) {
      console.warn('Failed to initialize performance observers:', error);
    }
  }

  // I'm recording navigation timing metrics
  private recordNavigationMetrics(entry: PerformanceNavigationTiming) {
    const metrics = [
      { name: 'dns_lookup', value: entry.domainLookupEnd - entry.domainLookupStart, unit: 'ms' },
      { name: 'tcp_connect', value: entry.connectEnd - entry.connectStart, unit: 'ms' },
      { name: 'request_response', value: entry.responseEnd - entry.requestStart, unit: 'ms' },
      { name: 'dom_content_loaded', value: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart, unit: 'ms' },
      { name: 'load_complete', value: entry.loadEventEnd - entry.loadEventStart, unit: 'ms' },
      { name: 'total_load_time', value: entry.loadEventEnd - entry.navigationStart, unit: 'ms' }
    ];

    metrics.forEach(metric => this.addMetric(metric.name, metric.value, metric.unit, 'navigation'));
  }

  // I'm recording resource loading metrics
  private recordResourceMetric(entry: PerformanceResourceTiming) {
    const resourceType = this.getResourceType(entry.name);
    const duration = entry.responseEnd - entry.startTime;

    this.addMetric(
      `resource_load_${resourceType}`,
      duration,
      'ms',
      `resource: ${entry.name}`
    );
  }

  // I'm recording custom measurements
  private recordMeasure(entry: PerformanceMeasure) {
    this.addMetric(
      entry.name,
      entry.duration,
      'ms',
      'custom_measure'
    );
  }

  // I'm recording paint timing metrics
  private recordPaintMetric(entry: PerformancePaintTiming) {
    this.addMetric(
      entry.name.replace('-', '_'),
      entry.startTime,
      'ms',
      'paint'
    );
  }

  // I'm providing utility to determine resource type
  private getResourceType(url: string): string {
    if (url.includes('.js')) return 'script';
    if (url.includes('.css')) return 'stylesheet';
    if (url.match(/\.(png|jpg|jpeg|gif|svg|webp)$/)) return 'image';
    if (url.includes('.woff')) return 'font';
    if (url.includes('/api/')) return 'api';
    return 'other';
  }

  // I'm adding metrics to the collection
  addMetric(name: string, value: number, unit: string, context?: string) {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: Date.now(),
      context
    };

    this.metrics.push(metric);

    // Keep only last 1000 metrics to prevent memory bloat
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }
  }

  // I'm implementing timing utilities for custom measurements
  time(name: string): () => void {
    const startTime = performance.now();
    
    return () => {
      const duration = performance.now() - startTime;
      this.addMetric(name, duration, 'ms', 'custom_timing');
    };
  }

  // I'm providing async timing wrapper
  async timeAsync<T>(name: string, operation: () => Promise<T>): Promise<T> {
    const startTime = performance.now();
    
    try {
      const result = await operation();
      const duration = performance.now() - startTime;
      this.addMetric(name, duration, 'ms', 'async_operation');
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      this.addMetric(`${name}_error`, duration, 'ms', 'async_operation_error');
      throw error;
    }
  }

  // I'm implementing benchmark utilities
  benchmark(name: string, iterations: number, operation: () => void): BenchmarkResult {
    const samples: number[] = [];
    
    // Warm up
    for (let i = 0; i < Math.min(iterations, 10); i++) {
      operation();
    }

    // Actual benchmarking
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      operation();
      const duration = performance.now() - start;
      samples.push(duration);
    }

    // Calculate statistics
    const totalDuration = samples.reduce((sum, sample) => sum + sample, 0);
    const averageTime = totalDuration / samples.length;
    const minTime = Math.min(...samples);
    const maxTime = Math.max(...samples);
    
    // Calculate standard deviation
    const variance = samples.reduce((sum, sample) => sum + Math.pow(sample - averageTime, 2), 0) / samples.length;
    const standardDeviation = Math.sqrt(variance);

    const result: BenchmarkResult = {
      name,
      duration: totalDuration,
      iterations,
      averageTime,
      minTime,
      maxTime,
      standardDeviation,
      samples
    };

    // Store benchmark results
    this.benchmarks.set(name, samples);
    this.addMetric(`benchmark_${name}`, averageTime, 'ms', 'benchmark');

    return result;
  }

  // I'm implementing memory usage monitoring
  getMemoryUsage(): any {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
        usage_percentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
      };
    }
    return null;
  }

  // I'm implementing Web Vitals monitoring
  getWebVitals(): Promise<any> {
    return new Promise((resolve) => {
      const vitals = {
        fcp: 0,
        lcp: 0,
        fid: 0,
        cls: 0,
        ttfb: 0
      };

      // First Contentful Paint
      const paintEntries = performance.getEntriesByType('paint');
      const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');
      if (fcpEntry) {
        vitals.fcp = fcpEntry.startTime;
      }

      // Time to First Byte
      const navigationEntries = performance.getEntriesByType('navigation');
      if (navigationEntries.length > 0) {
        const navEntry = navigationEntries[0] as PerformanceNavigationTiming;
        vitals.ttfb = navEntry.responseStart - navEntry.requestStart;
      }

      // Observer for LCP
      if ('PerformanceObserver' in window) {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          vitals.lcp = lastEntry.startTime;
        });

        try {
          lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        } catch (e) {
          console.warn('LCP observer not supported');
        }

        // Observer for FID
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            vitals.fid = entry.processingStart - entry.startTime;
          });
        });

        try {
          fidObserver.observe({ entryTypes: ['first-input'] });
        } catch (e) {
          console.warn('FID observer not supported');
        }

        // Observer for CLS
        const clsObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              vitals.cls += entry.value;
            }
          });
        });

        try {
          clsObserver.observe({ entryTypes: ['layout-shift'] });
        } catch (e) {
          console.warn('CLS observer not supported');
        }
      }

      setTimeout(() => {
        resolve(vitals);
      }, 100);
    });
  }

  // I'm providing metrics querying utilities
  getMetrics(filter?: {
    name?: string;
    context?: string;
    since?: number;
    limit?: number;
  }): PerformanceMetric[] {
    let filtered = this.metrics;

    if (filter) {
      if (filter.name) {
        filtered = filtered.filter(m => m.name.includes(filter.name!));
      }
      if (filter.context) {
        filtered = filtered.filter(m => m.context?.includes(filter.context!));
      }
      if (filter.since) {
        filtered = filtered.filter(m => m.timestamp > filter.since!);
      }
      if (filter.limit) {
        filtered = filtered.slice(-filter.limit);
      }
    }

    return filtered;
  }

  // I'm providing performance snapshot functionality
  getSnapshot(): PerformanceSnapshot {
    return {
      timestamp: Date.now(),
      metrics: [...this.metrics],
      resources: {
        memoryUsage: this.getMemoryUsage()?.usage_percentage,
        // Other resources would be populated by system monitoring
      },
      userAgent: navigator.userAgent,
      url: window.location.href
    };
  }

  // I'm implementing cleanup
  dispose() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.metrics = [];
    this.benchmarks.clear();
  }
}

// I'm creating a global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// I'm providing utility functions for common performance tasks
export const performanceUtils = {
  // Measure function execution time
  measure: <T>(name: string, fn: () => T): T => {
    const stop = performanceMonitor.time(name);
    const result = fn();
    stop();
    return result;
  },

  // Measure async function execution time
  measureAsync: async <T>(name: string, fn: () => Promise<T>): Promise<T> => {
    return performanceMonitor.timeAsync(name, fn);
  },

  // Monitor frame rate
  monitorFPS: (callback: (fps: number) => void, duration: number = 1000) => {
    let frameCount = 0;
    let lastTime = performance.now();

    const measureFrame = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime - lastTime >= duration) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        callback(fps);
        frameCount = 0;
        lastTime = currentTime;
      }
      
      requestAnimationFrame(measureFrame);
    };

    requestAnimationFrame(measureFrame);
  },

  // Monitor memory usage
  monitorMemory: (callback: (usage: any) => void, interval: number = 1000) => {
    const monitor = () => {
      const usage = performanceMonitor.getMemoryUsage();
      if (usage) {
        callback(usage);
      }
    };

    monitor();
    const intervalId = setInterval(monitor, interval);
    return () => clearInterval(intervalId);
  },

  // Detect performance issues
  detectPerformanceIssues: (): string[] => {
    const issues: string[] = [];
    const metrics = performanceMonitor.getMetrics({ limit: 100 });

    // Check for slow API calls
    const apiMetrics = metrics.filter(m => m.context === 'api');
    const slowAPICalls = apiMetrics.filter(m => m.value > 1000);
    if (slowAPICalls.length > 0) {
      issues.push(`Slow API calls detected: ${slowAPICalls.length} calls > 1000ms`);
    }

    // Check for memory issues
    const memoryUsage = performanceMonitor.getMemoryUsage();
    if (memoryUsage && memoryUsage.usage_percentage > 80) {
      issues.push(`High memory usage: ${memoryUsage.usage_percentage.toFixed(1)}%`);
    }

    // Check for slow render times
    const renderMetrics = metrics.filter(m => m.name.includes('render'));
    const slowRenders = renderMetrics.filter(m => m.value > 16); // 60fps = 16ms per frame
    if (slowRenders.length > 5) {
      issues.push(`Slow rendering detected: ${slowRenders.length} renders > 16ms`);
    }

    return issues;
  },

  // Get performance grade
  getPerformanceGrade: (): { grade: string; score: number; details: any } => {
    const metrics = performanceMonitor.getMetrics({ limit: 100 });
    
    // Calculate scores for different aspects
    const scores = {
      loading: 100,
      rendering: 100,
      memory: 100,
      network: 100
    };

    // Adjust scores based on metrics
    const loadMetrics = metrics.filter(m => m.name.includes('load'));
    const avgLoadTime = loadMetrics.reduce((sum, m) => sum + m.value, 0) / loadMetrics.length;
    if (avgLoadTime > 1000) scores.loading = Math.max(0, 100 - (avgLoadTime - 1000) / 10);

    const renderMetrics = metrics.filter(m => m.name.includes('render'));
    const avgRenderTime = renderMetrics.reduce((sum, m) => sum + m.value, 0) / renderMetrics.length;
    if (avgRenderTime > 16) scores.rendering = Math.max(0, 100 - (avgRenderTime - 16) * 2);

    const memoryUsage = performanceMonitor.getMemoryUsage();
    if (memoryUsage) {
      scores.memory = Math.max(0, 100 - memoryUsage.usage_percentage);
    }

    const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0) / 4;
    
    let grade = 'F';
    if (totalScore >= 90) grade = 'A';
    else if (totalScore >= 80) grade = 'B';
    else if (totalScore >= 70) grade = 'C';
    else if (totalScore >= 60) grade = 'D';

    return { grade, score: totalScore, details: scores };
  }
};

// I'm providing React/SolidJS integration utilities
export const usePerformanceMonitoring = () => {
  return {
    monitor: performanceMonitor,
    utils: performanceUtils,
    
    // Hook for measuring component render time
    measureRender: (componentName: string) => {
      const startTime = performance.now();
      
      return () => {
        const duration = performance.now() - startTime;
        performanceMonitor.addMetric(
          `render_${componentName}`,
          duration,
          'ms',
          'component_render'
        );
      };
    },

    // Hook for measuring effect execution time
    measureEffect: (effectName: string, fn: () => void) => {
      const stop = performanceMonitor.time(`effect_${effectName}`);
      fn();
      stop();
    }
  };
};

// I'm exporting types and interfaces
export type {
  PerformanceMetric,
  SystemResources,
  PerformanceSnapshot,
  BenchmarkResult
};
