/*
 * ©AngelaMos | 2025
 */

import {
  createSignal,
  createResource,
  createMemo,
  createEffect,
  onMount,
  onCleanup,
} from 'solid-js';
import { createStore, produce } from 'solid-js/store';
import { performanceMonitor, performanceUtils } from '../utils/performance';

interface SystemMetrics {
  timestamp: string;
  cpu_usage_percent: number;
  memory_usage_percent: number;
  memory_total_gb: number;
  memory_available_gb: number;
  disk_usage_percent: number;
  load_average_1m: number;
  load_average_5m: number;
  load_average_15m: number;
  cpu_cores: number;
  cpu_threads: number;
  cpu_model: string;
  uptime_seconds: number;
  active_processes: number;
  network_rx_bytes_per_sec?: number;
  network_tx_bytes_per_sec?: number;
}

interface BenchmarkResult {
  benchmark_id: string;
  timestamp: string;
  total_duration_ms: number;
  benchmarks: {
    cpu: {
      single_thread: { duration_ms: number; primes_per_second: number };
      multi_thread: { duration_ms: number; primes_per_second: number };
      parallel_efficiency: number;
    };
    memory: {
      allocation: { duration_ms: number; mb_per_second: number };
      sequential_read: { duration_ms: number; mb_per_second: number };
      sequential_write: { duration_ms: number; mb_per_second: number };
    };
  };
  performance_rating: string;
  system_info: any;
}

interface Alert {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: string;
  resolved: boolean;
  metric?: string;
  value?: number;
  threshold?: number;
}

interface PerformanceState {
  currentMetrics: SystemMetrics | null;
  benchmarkResults: BenchmarkResult | null;
  alerts: Alert[];
  isMonitoring: boolean;
  isRunningBenchmark: boolean;
  error: string | null;
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting';
  metricsHistory: SystemMetrics[];
  webVitals: any;
}

export function usePerformance() {
  const [state, setState] = createStore<PerformanceState>({
    currentMetrics: null,
    benchmarkResults: null,
    alerts: [],
    isMonitoring: false,
    isRunningBenchmark: false,
    error: null,
    connectionStatus: 'disconnected',
    metricsHistory: [],
    webVitals: null,
  });

  const [metricsResource] = createResource(
    () => ({ monitoring: state.isMonitoring }),
    async () => {
      try {
        setState('error', null);

        const response = await fetch('/api/performance/system');
        if (!response.ok) {
          throw new Error(
            `HTTP ${response.status}: Failed to fetch system metrics`,
          );
        }

        const metrics: SystemMetrics = await response.json();

        setState('currentMetrics', metrics);
        setState('connectionStatus', 'connected');

        setState(
          'metricsHistory',
          produce((history) => {
            history.push(metrics);
            if (history.length > 100) {
              history.shift();
            }
          }),
        );

        checkForAlerts(metrics);

        return metrics;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to fetch metrics';
        setState('error', errorMessage);
        setState('connectionStatus', 'disconnected');
        throw error;
      }
    },
  );

  const [benchmarkResource] = createResource(
    () => ({ running: state.isRunningBenchmark }),
    async () => {
      if (!state.isRunningBenchmark) return null;

      try {
        setState('error', null);

        const response = await fetch('/api/performance/benchmark', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: Benchmark failed`);
        }

        const results: BenchmarkResult = await response.json();
        setState('benchmarkResults', results);
        return results;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Benchmark failed';
        setState('error', errorMessage);
        throw error;
      } finally {
        setState('isRunningBenchmark', false);
      }
    },
  );

  let metricsInterval: number | null = null;
  let webVitalsInterval: number | null = null;

  onMount(() => {
    collectWebVitals();

    webVitalsInterval = setInterval(collectWebVitals, 30000);
  });

  onCleanup(() => {
    if (metricsInterval) clearInterval(metricsInterval);
    if (webVitalsInterval) clearInterval(webVitalsInterval);
  });

  const collectWebVitals = async () => {
    try {
      const vitals = await performanceUtils.getWebVitals();
      setState('webVitals', vitals);

      performanceMonitor.addMetric(
        'web_vitals_fcp',
        vitals.fcp,
        'ms',
        'web_vitals',
      );
      performanceMonitor.addMetric(
        'web_vitals_lcp',
        vitals.lcp,
        'ms',
        'web_vitals',
      );
      performanceMonitor.addMetric(
        'web_vitals_fid',
        vitals.fid,
        'ms',
        'web_vitals',
      );
      performanceMonitor.addMetric(
        'web_vitals_cls',
        vitals.cls,
        'score',
        'web_vitals',
      );
      performanceMonitor.addMetric(
        'web_vitals_ttfb',
        vitals.ttfb,
        'ms',
        'web_vitals',
      );
    } catch (error) {
      console.warn('Failed to collect Web Vitals:', error);
    }
  };

  const checkForAlerts = (metrics: SystemMetrics) => {
    const newAlerts: Alert[] = [];

    if (metrics.cpu_usage_percent > 90) {
      newAlerts.push({
        id: `cpu_high_${Date.now()}`,
        severity: 'critical',
        message: `CPU usage critically high: ${metrics.cpu_usage_percent.toFixed(1)}%`,
        timestamp: new Date().toISOString(),
        resolved: false,
        metric: 'cpu_usage_percent',
        value: metrics.cpu_usage_percent,
        threshold: 90,
      });
    } else if (metrics.cpu_usage_percent > 75) {
      newAlerts.push({
        id: `cpu_warning_${Date.now()}`,
        severity: 'high',
        message: `CPU usage high: ${metrics.cpu_usage_percent.toFixed(1)}%`,
        timestamp: new Date().toISOString(),
        resolved: false,
        metric: 'cpu_usage_percent',
        value: metrics.cpu_usage_percent,
        threshold: 75,
      });
    }

    if (metrics.memory_usage_percent > 85) {
      newAlerts.push({
        id: `memory_high_${Date.now()}`,
        severity: 'critical',
        message: `Memory usage critically high: ${metrics.memory_usage_percent.toFixed(1)}%`,
        timestamp: new Date().toISOString(),
        resolved: false,
        metric: 'memory_usage_percent',
        value: metrics.memory_usage_percent,
        threshold: 85,
      });
    } else if (metrics.memory_usage_percent > 70) {
      newAlerts.push({
        id: `memory_warning_${Date.now()}`,
        severity: 'medium',
        message: `Memory usage elevated: ${metrics.memory_usage_percent.toFixed(1)}%`,
        timestamp: new Date().toISOString(),
        resolved: false,
        metric: 'memory_usage_percent',
        value: metrics.memory_usage_percent,
        threshold: 70,
      });
    }

    if (metrics.load_average_1m > metrics.cpu_cores * 2) {
      newAlerts.push({
        id: `load_high_${Date.now()}`,
        severity: 'high',
        message: `Load average high: ${metrics.load_average_1m.toFixed(2)} (${metrics.cpu_cores} cores)`,
        timestamp: new Date().toISOString(),
        resolved: false,
        metric: 'load_average_1m',
        value: metrics.load_average_1m,
        threshold: metrics.cpu_cores * 2,
      });
    }

    if (newAlerts.length > 0) {
      setState(
        'alerts',
        produce((alerts) => {
          alerts.push(...newAlerts);
          // Keep only last 50 alerts
          if (alerts.length > 50) {
            alerts.splice(0, alerts.length - 50);
          }
        }),
      );
    }
  };

  const performanceInsights = createMemo(() => {
    const metrics = state.currentMetrics;
    if (!metrics) return null;

    const cpuScore = Math.max(0, 100 - metrics.cpu_usage_percent);
    const memoryScore = Math.max(0, 100 - metrics.memory_usage_percent);
    const loadScore = Math.max(
      0,
      100 - (metrics.load_average_1m / metrics.cpu_cores) * 50,
    );

    const overallScore = (cpuScore + memoryScore + loadScore) / 3;

    let grade = 'F';
    if (overallScore >= 90) grade = 'A';
    else if (overallScore >= 80) grade = 'B';
    else if (overallScore >= 70) grade = 'C';
    else if (overallScore >= 60) grade = 'D';

    return {
      overallScore,
      grade,
      cpuScore,
      memoryScore,
      loadScore,
      recommendations: generateRecommendations(metrics),
    };
  });

  const metricsHistory = createMemo(() => {
    return state.metricsHistory.map((metrics) => ({
      timestamp: metrics.timestamp,
      cpu: metrics.cpu_usage_percent,
      memory: metrics.memory_usage_percent,
      load: metrics.load_average_1m,
    }));
  });

  const activeAlerts = createMemo(() => {
    return state.alerts.filter((alert) => !alert.resolved);
  });

  const criticalAlerts = createMemo(() => {
    return activeAlerts().filter((alert) => alert.severity === 'critical');
  });

  const generateRecommendations = (metrics: SystemMetrics): string[] => {
    const recommendations: string[] = [];

    if (metrics.cpu_usage_percent > 80) {
      recommendations.push('Consider optimizing CPU-intensive processes');
    }

    if (metrics.memory_usage_percent > 80) {
      recommendations.push('Review memory usage and consider cleanup');
    }

    if (metrics.load_average_1m > metrics.cpu_cores) {
      recommendations.push('System load is high - consider load balancing');
    }

    if (metrics.disk_usage_percent > 85) {
      recommendations.push(
        'Disk space is running low - cleanup recommended',
      );
    }

    return recommendations;
  };

  const actions = {
    startMonitoring() {
      setState('isMonitoring', true);

      metricsInterval = setInterval(() => {
        metricsResource.refetch();
      }, 12000); // Every 12 seconds
    },

    stopMonitoring() {
      setState('isMonitoring', false);

      if (metricsInterval) {
        clearInterval(metricsInterval);
        metricsInterval = null;
      }
    },

    // Run benchmark
    async runBenchmark() {
      setState('isRunningBenchmark', true);
      benchmarkResource.refetch();
    },

    // Refresh current metrics
    async refreshMetrics() {
      metricsResource.refetch();
    },

    // Clear error state
    clearError() {
      setState('error', null);
    },

    // Resolve alert
    resolveAlert(alertId: string) {
      setState(
        'alerts',
        produce((alerts) => {
          const alert = alerts.find((a) => a.id === alertId);
          if (alert) {
            alert.resolved = true;
          }
        }),
      );
    },

    // Clear all resolved alerts
    clearResolvedAlerts() {
      setState(
        'alerts',
        produce((alerts) => {
          const unresolved = alerts.filter((alert) => !alert.resolved);
          alerts.length = 0;
          alerts.push(...unresolved);
        }),
      );
    },

    // Get performance grade
    getPerformanceGrade() {
      return performanceUtils.getPerformanceGrade();
    },

    detectIssues() {
      return performanceUtils.detectPerformanceIssues();
    },

    exportData() {
      return {
        currentMetrics: state.currentMetrics,
        benchmarkResults: state.benchmarkResults,
        metricsHistory: state.metricsHistory,
        alerts: state.alerts,
        webVitals: state.webVitals,
        insights: performanceInsights(),
        exportedAt: new Date().toISOString(),
      };
    },

    measureOperation<T>(name: string, operation: () => T): T {
      return performanceUtils.measure(name, operation);
    },

    async measureAsyncOperation<T>(
      name: string,
      operation: () => Promise<T>,
    ): Promise<T> {
      return performanceUtils.measureAsync(name, operation);
    },
  };

  return {
    currentMetrics: () => state.currentMetrics,
    benchmarkResults: () => state.benchmarkResults,
    alerts: activeAlerts,
    criticalAlerts,
    isMonitoring: () => state.isMonitoring,
    isRunningBenchmark: () => state.isRunningBenchmark,
    error: () => state.error,
    connectionStatus: () => state.connectionStatus,
    webVitals: () => state.webVitals,

    // Computed values
    performanceInsights,
    metricsHistory,

    // Resources
    metricsResource,
    benchmarkResource,

    // Actions
    ...actions,

    // Utilities
    performanceMonitor,
    performanceUtils,
  };
}

export type { SystemMetrics, BenchmarkResult, Alert };
