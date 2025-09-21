/*
 * ©AngelaMos | 2025
 */

import { createSignal, createEffect, onCleanup, onMount } from 'solid-js';

interface WebVitalsMetrics {
  // Core Web Vitals
  lcp: number | null; // Largest Contentful Paint
  fid: number | null; // First Input Delay
  cls: number | null; // Cumulative Layout Shift
  fcp: number | null; // First Contentful Paint
  ttfb: number | null; // Time to First Byte

  // Additional Performance Metrics
  domContentLoaded: number | null;
  loadComplete: number | null;
  firstPaint: number | null;
  navigationStart: number | null;

  // Custom Metrics
  timeToInteractive: number | null;
  totalBlockingTime: number | null;
  speedIndex: number | null;
}

interface PerformanceEntry {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
}

interface WebVitalsConfig {
  enableReporting?: boolean;
  reportingEndpoint?: string;
  samplingRate?: number;
  debug?: boolean;
}

export function useWebVitals(config: WebVitalsConfig = {}) {
  const [metrics, setMetrics] = createSignal<WebVitalsMetrics>({
    lcp: null,
    fid: null,
    cls: null,
    fcp: null,
    ttfb: null,
    domContentLoaded: null,
    loadComplete: null,
    firstPaint: null,
    navigationStart: null,
    timeToInteractive: null,
    totalBlockingTime: null,
    speedIndex: null,
  });

  const [performanceEntries, setPerformanceEntries] = createSignal<PerformanceEntry[]>([]);
  const [isLoading, setIsLoading] = createSignal(true);
  const [lastUpdate, setLastUpdate] = createSignal<Date>(new Date());

  let performanceObserver: PerformanceObserver | null = null;
  let navigationObserver: PerformanceObserver | null = null;

  const getMetricRating = (metricName: string, value: number): 'good' | 'needs-improvement' | 'poor' => {
    const thresholds = {
      lcp: { good: 2500, poor: 4000 },
      fid: { good: 100, poor: 300 },
      cls: { good: 0.1, poor: 0.25 },
      fcp: { good: 1800, poor: 3000 },
      ttfb: { good: 800, poor: 1800 },
    };

    const threshold = thresholds[metricName as keyof typeof thresholds];
    if (!threshold) return 'good';

    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
  };

  const updateMetric = (name: string, value: number) => {
    setMetrics(prev => ({
      ...prev,
      [name]: value
    }));

    const entry: PerformanceEntry = {
      name,
      value,
      rating: getMetricRating(name, value),
      timestamp: Date.now()
    };

    setPerformanceEntries(prev => [...prev, entry]);
    setLastUpdate(new Date());

    if (config.debug || import.meta.env.DEV) {
      console.log(`[WebVitals] ${name}:`, value, `(${entry.rating})`);
    }

    if (config.enableReporting) {
      reportMetric(entry);
    }
  };

  const reportMetric = async (entry: PerformanceEntry) => {
    if (!config.reportingEndpoint) return;

    if (config.samplingRate && Math.random() > config.samplingRate) return;

    try {
      await fetch(config.reportingEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          metric: entry,
          userAgent: navigator.userAgent,
          url: window.location.href,
          timestamp: entry.timestamp,
        }),
      });
    } catch (error) {
      if (config.debug) {
        console.warn('[WebVitals] Failed to report metric:', error);
      }
    }
  };

  // I'm collecting basic navigation and paint metrics
  const collectBasicMetrics = () => {
    if (!window.performance) return;

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const paintEntries = performance.getEntriesByType('paint');

    if (navigation) {
      updateMetric('navigationStart', navigation.navigationStart);
      updateMetric('domContentLoaded', navigation.domContentLoadedEventEnd - navigation.navigationStart);
      updateMetric('loadComplete', navigation.loadEventEnd - navigation.navigationStart);
      updateMetric('ttfb', navigation.responseStart - navigation.navigationStart);
    }

    // I'm collecting paint metrics
    paintEntries.forEach(entry => {
      if (entry.name === 'first-paint') {
        updateMetric('firstPaint', entry.startTime);
      }
      if (entry.name === 'first-contentful-paint') {
        updateMetric('fcp', entry.startTime);
      }
    });
  };

  // I'm setting up modern performance observers
  const setupPerformanceObservers = () => {
    if (!window.PerformanceObserver) return;

    // I'm observing layout shift for CLS
    try {
      performanceObserver = new PerformanceObserver((list) => {
        let clsValue = 0;
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'layout-shift' && !(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        }
        if (clsValue > 0) {
          updateMetric('cls', clsValue);
        }
      });
      performanceObserver.observe({ entryTypes: ['layout-shift'] });
    } catch (error) {
      if (config.debug) {
        console.warn('[WebVitals] Layout shift observer failed:', error);
      }
    }

    // I'm observing largest contentful paint
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        if (lastEntry && lastEntry.startTime) {
          updateMetric('lcp', lastEntry.startTime);
        }
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (error) {
      if (config.debug) {
        console.warn('[WebVitals] LCP observer failed:', error);
      }
    }

    // I'm observing first input delay
    try {
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          updateMetric('fid', (entry as any).processingStart - entry.startTime);
        }
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
    } catch (error) {
      if (config.debug) {
        console.warn('[WebVitals] FID observer failed:', error);
      }
    }
  };

  // I'm calculating additional derived metrics
  const calculateDerivedMetrics = () => {
    const currentMetrics = metrics();

    // I'm estimating Time to Interactive
    if (currentMetrics.domContentLoaded && currentMetrics.loadComplete) {
      const tti = Math.max(currentMetrics.domContentLoaded, currentMetrics.loadComplete || 0);
      updateMetric('timeToInteractive', tti);
    }

    // I'm calculating total blocking time approximation
    if (currentMetrics.fcp && currentMetrics.timeToInteractive) {
      const tbt = Math.max(0, currentMetrics.timeToInteractive - currentMetrics.fcp);
      updateMetric('totalBlockingTime', tbt);
    }
  };

  // I'm setting up performance monitoring on component mount
  onMount(() => {
    // I'm collecting initial metrics
    collectBasicMetrics();

    // I'm setting up observers for real-time metrics
    setupPerformanceObservers();

    // I'm calculating derived metrics after a delay
    setTimeout(() => {
      calculateDerivedMetrics();
      setIsLoading(false);
    }, 1000);

    // I'm setting up periodic metric collection
    const intervalId = setInterval(() => {
      collectBasicMetrics();
      calculateDerivedMetrics();
    }, 5000);

    onCleanup(() => {
      clearInterval(intervalId);
      if (performanceObserver) {
        performanceObserver.disconnect();
      }
      if (navigationObserver) {
        navigationObserver.disconnect();
      }
    });
  });

  // I'm providing utility functions for metric analysis
  const getOverallScore = () => {
    const currentMetrics = metrics();
    const entries = performanceEntries();

    if (entries.length === 0) return null;

    const scores = {
      good: 100,
      'needs-improvement': 75,
      poor: 50
    };

    const totalScore = entries.reduce((sum, entry) => sum + scores[entry.rating], 0);
    return Math.round(totalScore / entries.length);
  };

  const getMetricsByCategory = () => {
    const entries = performanceEntries();
    return {
      good: entries.filter(e => e.rating === 'good').length,
      needsImprovement: entries.filter(e => e.rating === 'needs-improvement').length,
      poor: entries.filter(e => e.rating === 'poor').length,
    };
  };

  // I'm providing a performance summary for display
  const getPerformanceSummary = () => {
    const currentMetrics = metrics();
    const score = getOverallScore();
    const categories = getMetricsByCategory();

    return {
      score,
      categories,
      coreWebVitals: {
        lcp: currentMetrics.lcp,
        fid: currentMetrics.fid,
        cls: currentMetrics.cls,
      },
      loadingMetrics: {
        fcp: currentMetrics.fcp,
        ttfb: currentMetrics.ttfb,
        domContentLoaded: currentMetrics.domContentLoaded,
        loadComplete: currentMetrics.loadComplete,
      },
      customMetrics: {
        timeToInteractive: currentMetrics.timeToInteractive,
        totalBlockingTime: currentMetrics.totalBlockingTime,
      }
    };
  };

  // I'm implementing custom performance markers
  const mark = (name: string) => {
    if (!window.performance?.mark) return;
    performance.mark(name);
  };

  const measure = (name: string, startMark?: string, endMark?: string) => {
    if (!window.performance?.measure) return null;

    try {
      performance.measure(name, startMark, endMark);
      const entry = performance.getEntriesByName(name, 'measure')[0];
      return entry ? entry.duration : null;
    } catch (error) {
      if (config.debug) {
        console.warn('[WebVitals] Measure failed:', error);
      }
      return null;
    }
  };

  return {
    // Core metrics
    metrics,
    performanceEntries,
    isLoading,
    lastUpdate,

    // Utility functions
    getOverallScore,
    getMetricsByCategory,
    getPerformanceSummary,

    // Custom measurement tools
    mark,
    measure,

    // Manual metric updates
    updateMetric,
  };
}
