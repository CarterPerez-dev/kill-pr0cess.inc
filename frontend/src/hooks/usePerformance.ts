/*
 * Performance monitoring hook providing reactive access to system metrics, benchmarks, and real-time performance data throughout the application.
 * I'm implementing comprehensive performance tracking with SolidJS reactivity, WebSocket integration, and intelligent caching for smooth real-time monitoring experiences.
 */

import { createSignal, createEffect, onMount, onCleanup } from 'solid-js';
import { createStore, produce } from 'solid-js/store';
import { performanceService, SystemMetrics } from '../services/performance';

interface PerformanceState {
  currentMetrics: SystemMetrics | null;
  historicalData: SystemMetrics[];
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  benchmarkResults: any | null;
  alerts: any[];
  lastUpdated: Date | null;
}

interface PerformanceAnalysis {
  overall_health: 'excellent' | 'good' | 'fair' | 'poor';
  bottlenecks: string[];
  recommendations: string[];
  score: number;
  trends: {
    cpu: 'improving' | 'stable' | 'degrading';
    memory: 'improving' | 'stable' | 'degrading';
    performance_delta: number;
  };
}

export function usePerformance() {
  // I'm setting up reactive state management for performance data
  const [state, setState] = createStore<PerformanceState>({
    currentMetrics: null,
    historicalData: [],
    isConnected: false,
    isLoading: true,
    error: null,
    benchmarkResults: null,
    alerts: [],
    lastUpdated: null,
  });

  // I'm creating additional reactive signals for computed values
  const [refreshInterval, setRefreshInterval] = createSignal<number | null>(null);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = createSignal(true);

  let unsubscribeMetrics: (() => void) | null = null;
  let unsubscribeAlerts: (() => void) | null = null;
  let intervalId: number | null = null;

  onMount(() => {
    initializePerformanceMonitoring();
  });

  onCleanup(() => {
    cleanup();
  });

  const initializePerformanceMonitoring = async () => {
    try {
      setState('isLoading', true);
      setState('error', null);

      // I'm subscribing to real-time performance updates
      unsubscribeMetrics = performanceService.subscribe('metrics', (metrics: SystemMetrics) => {
        setState('currentMetrics', metrics);
        setState('lastUpdated', new Date());
        setState('isConnected', true);
        setState('error', null);

        // I'm updating historical data
        setState('historicalData', produce(history => {
          history.push(metrics);
          if (history.length > 100) {
            history.shift(); // Keep last 100 entries
          }
        }));
      });

      // I'm subscribing to alert notifications
      unsubscribeAlerts = performanceService.subscribe('alert', (alert) => {
        setState('alerts', produce(alerts => {
          alerts.unshift(alert);
          if (alerts.length > 10) {
            alerts.splice(10); // Keep last 10 alerts
          }
        }));
      });

      // I'm fetching initial metrics
      const initialSnapshot = await performanceService.getCurrentMetrics();
      setState('currentMetrics', initialSnapshot.system);
      setState('isConnected', true);

      // I'm setting up auto-refresh if enabled
      if (autoRefreshEnabled()) {
        startAutoRefresh();
      }

    } catch (error) {
      setState('error', error instanceof Error ? error.message : 'Failed to initialize performance monitoring');
      setState('isConnected', false);
    } finally {
      setState('isLoading', false);
    }
  };

  const startAutoRefresh = () => {
    if (intervalId) clearInterval(intervalId);

    intervalId = setInterval(async () => {
      try {
        const snapshot = await performanceService.getCurrentMetrics();
        setState('currentMetrics', snapshot.system);
        setState('lastUpdated', new Date());
        setState('isConnected', true);
        setState('error', null);
      } catch (error) {
        setState('error', 'Connection lost - attempting to reconnect...');
        setState('isConnected', false);
      }
    }, 5000); // Refresh every 5 seconds

    setRefreshInterval(intervalId);
  };

  const stopAutoRefresh = () => {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
      setRefreshInterval(null);
    }
  };

  const cleanup = () => {
    if (unsubscribeMetrics) unsubscribeMetrics();
    if (unsubscribeAlerts) unsubscribeAlerts();
    stopAutoRefresh();
  };

  // I'm implementing performance analysis functions
  const analyzePerformance = (): PerformanceAnalysis | null => {
    const current = state.currentMetrics;
    const history = state.historicalData;

    if (!current) return null;

    let score = 100;
    const bottlenecks: string[] = [];
    const recommendations: string[] = [];

    // I'm analyzing CPU performance
    if (current.cpu_usage_percent > 80) {
      score -= 20;
      bottlenecks.push('High CPU usage');
      recommendations.push('Consider optimizing CPU-intensive operations or scaling resources');
    } else if (current.cpu_usage_percent > 60) {
      score -= 10;
      recommendations.push('Monitor CPU usage trends for potential optimization');
    }

    // I'm analyzing memory performance
    if (current.memory_usage_percent > 85) {
      score -= 15;
      bottlenecks.push('High memory usage');
      recommendations.push('Review memory usage patterns and consider cleanup or scaling');
    } else if (current.memory_usage_percent > 70) {
      score -= 5;
      recommendations.push('Monitor memory usage for potential leaks');
    }

    // I'm analyzing disk usage
    if (current.disk_usage_percent && current.disk_usage_percent > 90) {
      score -= 10;
      bottlenecks.push('Low disk space');
      recommendations.push('Clean up disk space or add more storage');
    }

    // I'm analyzing load average
    if (current.load_average_1m > current.cpu_cores * 2) {
      score -= 15;
      bottlenecks.push('High system load');
      recommendations.push('Reduce concurrent processes or scale resources');
    }

    // I'm calculating trends from historical data
    let trends = {
      cpu: 'stable' as const,
      memory: 'stable' as const,
      performance_delta: 0,
    };

    if (history.length >= 10) {
      const recent = history.slice(-5);
      const older = history.slice(-10, -5);

      const recentCpuAvg = recent.reduce((sum, m) => sum + m.cpu_usage_percent, 0) / recent.length;
      const olderCpuAvg = older.reduce((sum, m) => sum + m.cpu_usage_percent, 0) / older.length;

      const recentMemAvg = recent.reduce((sum, m) => sum + m.memory_usage_percent, 0) / recent.length;
      const olderMemAvg = older.reduce((sum, m) => sum + m.memory_usage_percent, 0) / older.length;

      const cpuDelta = recentCpuAvg - olderCpuAvg;
      const memDelta = recentMemAvg - olderMemAvg;

      trends = {
        cpu: cpuDelta > 5 ? 'degrading' : cpuDelta < -5 ? 'improving' : 'stable',
        memory: memDelta > 5 ? 'degrading' : memDelta < -5 ? 'improving' : 'stable',
        performance_delta: (cpuDelta + memDelta) / 2,
      };
    }

    let overall_health: 'excellent' | 'good' | 'fair' | 'poor';
    if (score >= 90) overall_health = 'excellent';
    else if (score >= 75) overall_health = 'good';
    else if (score >= 60) overall_health = 'fair';
    else overall_health = 'poor';

    return {
      overall_health,
      bottlenecks,
      recommendations,
      score: Math.max(0, score),
      trends,
    };
  };

  // I'm implementing benchmark execution
  const runBenchmark = async () => {
    try {
      setState('isLoading', true);
      setState('error', null);

      const results = await performanceService.runBenchmark();
      setState('benchmarkResults', results);

      return results;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Benchmark failed';
      setState('error', errorMessage);
      throw error;
    } finally {
      setState('isLoading', false);
    }
  };

  // I'm implementing manual refresh functionality
  const refreshMetrics = async () => {
    try {
      setState('isLoading', true);
      setState('error', null);

      const snapshot = await performanceService.getCurrentMetrics();
      setState('currentMetrics', snapshot.system);
      setState('lastUpdated', new Date());
      setState('isConnected', true);

      return snapshot;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to refresh metrics';
      setState('error', errorMessage);
      setState('isConnected', false);
      throw error;
    } finally {
      setState('isLoading', false);
    }
  };

  // I'm implementing alert management
  const acknowledgeAlert = (alertId: string) => {
    setState('alerts', produce(alerts => {
      const alert = alerts.find(a => a.id === alertId);
      if (alert) {
        alert.acknowledged = true;
      }
    }));

    performanceService.acknowledgeAlert(alertId);
  };

  const clearAlert = (alertId: string) => {
    setState('alerts', produce(alerts => {
      const index = alerts.findIndex(a => a.id === alertId);
      if (index !== -1) {
        alerts.splice(index, 1);
      }
    }));

    performanceService.clearAlert(alertId);
  };

  const clearAllAlerts = () => {
    state.alerts.forEach(alert => {
      performanceService.clearAlert(alert.id);
    });
    setState('alerts', []);
  };

  // I'm implementing auto-refresh controls
  const toggleAutoRefresh = () => {
    const newState = !autoRefreshEnabled();
    setAutoRefreshEnabled(newState);

    if (newState) {
      startAutoRefresh();
    } else {
      stopAutoRefresh();
    }
  };

  // I'm creating computed properties for easy access
  const getMetricsSummary = () => {
    const current = state.currentMetrics;
    if (!current) return null;

    return {
      cpu: {
        value: current.cpu_usage_percent,
        status: current.cpu_usage_percent > 80 ? 'critical' :
                current.cpu_usage_percent > 60 ? 'warning' : 'good',
        description: `${current.cpu_cores} cores, ${current.cpu_threads} threads`,
      },
      memory: {
        value: current.memory_usage_percent,
        status: current.memory_usage_percent > 85 ? 'critical' :
                current.memory_usage_percent > 70 ? 'warning' : 'good',
        description: `${current.memory_available_gb.toFixed(1)}GB / ${current.memory_total_gb.toFixed(1)}GB`,
      },
      load: {
        value: current.load_average_1m,
        status: current.load_average_1m > current.cpu_cores * 2 ? 'critical' :
                current.load_average_1m > current.cpu_cores ? 'warning' : 'good',
        description: '1-minute load average',
      },
      uptime: {
        value: current.uptime_seconds,
        status: 'good',
        description: formatUptime(current.uptime_seconds),
      },
    };
  };

  const getActiveAlertsCount = () => {
    return state.alerts.filter(alert => !alert.acknowledged).length;
  };

  const getCriticalAlertsCount = () => {
    return state.alerts.filter(alert => !alert.acknowledged && alert.severity === 'critical').length;
  };

  // I'm providing export functionality
  const exportMetrics = (format: 'json' | 'csv' = 'json') => {
    const data = {
      current: state.currentMetrics,
      historical: state.historicalData,
      alerts: state.alerts,
      analysis: analyzePerformance(),
      exportTime: new Date().toISOString(),
    };

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `performance-metrics-${Date.now()}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } else {
      // I'm creating CSV format for data analysis
      const csvLines = [
        'timestamp,cpu_usage,memory_usage,disk_usage,load_average_1m,uptime',
        ...state.historicalData.map(metric =>
          `${metric.timestamp},${metric.cpu_usage_percent},${metric.memory_usage_percent},${metric.disk_usage_percent || 0},${metric.load_average_1m},${metric.uptime_seconds}`
        ),
      ];

      const blob = new Blob([csvLines.join('\n')], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `performance-metrics-${Date.now()}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  // Helper function to format uptime
  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  return {
    // State
    currentMetrics: () => state.currentMetrics,
    historicalData: () => state.historicalData,
    isConnected: () => state.isConnected,
    isLoading: () => state.isLoading,
    error: () => state.error,
    benchmarkResults: () => state.benchmarkResults,
    alerts: () => state.alerts,
    lastUpdated: () => state.lastUpdated,

    // Computed values
    analysis: analyzePerformance,
    metricsSummary: getMetricsSummary,
    activeAlertsCount: getActiveAlertsCount,
    criticalAlertsCount: getCriticalAlertsCount,

    // Actions
    refreshMetrics,
    runBenchmark,
    acknowledgeAlert,
    clearAlert,
    clearAllAlerts,
    exportMetrics,

    // Auto-refresh controls
    autoRefreshEnabled,
    toggleAutoRefresh,
    refreshInterval,

    // Utility functions
    formatUptime,
  };
}
