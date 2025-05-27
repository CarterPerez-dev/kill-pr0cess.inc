/*
 * Real-time system resource monitoring component that displays CPU, memory, network usage with alerts and optimization recommendations.
 * I'm implementing comprehensive system monitoring with historical analysis, threshold alerting, and performance optimization suggestions using WebSocket integration.
 */

import { Component, createSignal, createEffect, onMount, onCleanup, Show, For } from 'solid-js';
import { performanceService, SystemMetrics, Alert } from '../../services/performance';

interface ResourceUsage {
  current: number;
  max: number;
  average: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  status: 'normal' | 'warning' | 'critical';
}

interface OptimizationRecommendation {
  category: string;
  severity: 'low' | 'medium' | 'high';
  message: string;
  action?: string;
}

interface NetworkStats {
  rx_bytes_per_sec: number;
  tx_bytes_per_sec: number;
  total_rx_mb: number;
  total_tx_mb: number;
}

export const SystemMonitor: Component = () => {
  const [metrics, setMetrics] = createSignal<SystemMetrics | null>(null);
  const [alerts, setAlerts] = createSignal<Alert[]>([]);
  const [isConnected, setIsConnected] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  const [historicalData, setHistoricalData] = createSignal<SystemMetrics[]>([]);
  const [selectedMetric, setSelectedMetric] = createSignal<'cpu' | 'memory' | 'disk' | 'network'>('cpu');

  let unsubscribeMetrics: (() => void) | null = null;
  let unsubscribeAlerts: (() => void) | null = null;

  onMount(() => {
    initializeMonitoring();
  });

  onCleanup(() => {
    if (unsubscribeMetrics) unsubscribeMetrics();
    if (unsubscribeAlerts) unsubscribeAlerts();
  });

  const initializeMonitoring = async () => {
    try {
      // I'm subscribing to real-time metrics updates
      unsubscribeMetrics = performanceService.subscribe('metrics', (newMetrics: SystemMetrics) => {
        setMetrics(newMetrics);
        updateHistoricalData(newMetrics);
        setIsConnected(true);
        setError(null);
      });

      // I'm subscribing to alert notifications
      unsubscribeAlerts = performanceService.subscribe('alert', (alert: Alert) => {
        setAlerts(prev => [alert, ...prev.slice(0, 9)]); // Keep last 10 alerts
      });

      // I'm fetching initial metrics
      const initialMetrics = await performanceService.getCurrentMetrics();
      setMetrics(initialMetrics.system);
      setIsConnected(true);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize monitoring');
      setIsConnected(false);
    }
  };

  const updateHistoricalData = (newMetrics: SystemMetrics) => {
    setHistoricalData(prev => {
      const updated = [...prev, newMetrics];
      return updated.slice(-120); // Keep last 2 hours at 1-minute intervals
    });
  };

  const getResourceUsage = (type: 'cpu' | 'memory' | 'disk'): ResourceUsage => {
    const current = metrics();
    const history = historicalData();

    if (!current || history.length === 0) {
      return { current: 0, max: 0, average: 0, trend: 'stable', status: 'normal' };
    }

    let currentValue: number;
    let values: number[];

    switch (type) {
      case 'cpu':
        currentValue = current.cpu_usage_percent;
        values = history.map(m => m.cpu_usage_percent);
        break;
      case 'memory':
        currentValue = current.memory_usage_percent;
        values = history.map(m => m.memory_usage_percent);
        break;
      case 'disk':
        currentValue = current.disk_usage_percent || 0;
        values = history.map(m => m.disk_usage_percent || 0);
        break;
    }

    const max = Math.max(...values);
    const average = values.reduce((sum, val) => sum + val, 0) / values.length;

    // I'm calculating trend based on recent values
    const recentValues = values.slice(-10);
    const oldAvg = recentValues.slice(0, 5).reduce((sum, val) => sum + val, 0) / 5;
    const newAvg = recentValues.slice(-5).reduce((sum, val) => sum + val, 0) / 5;

    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (newAvg > oldAvg + 5) trend = 'increasing';
    else if (newAvg < oldAvg - 5) trend = 'decreasing';

    // I'm determining status based on current value and type
    let status: 'normal' | 'warning' | 'critical' = 'normal';
    if (type === 'cpu') {
      if (currentValue > 85) status = 'critical';
      else if (currentValue > 70) status = 'warning';
    } else if (type === 'memory') {
      if (currentValue > 90) status = 'critical';
      else if (currentValue > 75) status = 'warning';
    } else if (type === 'disk') {
      if (currentValue > 95) status = 'critical';
      else if (currentValue > 85) status = 'warning';
    }

    return { current: currentValue, max, average, trend, status };
  };

  const getOptimizationRecommendations = (): OptimizationRecommendation[] => {
    const current = metrics();
    if (!current) return [];

    const recommendations: OptimizationRecommendation[] = [];

    // I'm analyzing CPU usage patterns
    if (current.cpu_usage_percent > 80) {
      recommendations.push({
        category: 'CPU',
        severity: 'high',
        message: 'High CPU usage detected',
        action: 'Consider reducing computational workload or scaling resources'
      });
    }

    // I'm analyzing memory usage
    if (current.memory_usage_percent > 85) {
      recommendations.push({
        category: 'Memory',
        severity: 'high',
        message: 'Memory usage is critically high',
        action: 'Review memory-intensive processes and consider adding more RAM'
      });
    }

    // I'm analyzing load average
    if (current.load_average_1m > current.cpu_cores * 1.5) {
      recommendations.push({
        category: 'Load',
        severity: 'medium',
        message: 'System load is above optimal threshold',
        action: 'Monitor process activity and consider load balancing'
      });
    }

    // I'm checking for process count
    if (current.active_processes > 500) {
      recommendations.push({
        category: 'Processes',
        severity: 'low',
        message: 'High number of active processes',
        action: 'Review running services and cleanup unnecessary processes'
      });
    }

    return recommendations;
  };

  const getNetworkStats = (): NetworkStats => {
    const current = metrics();
    if (!current) {
      return { rx_bytes_per_sec: 0, tx_bytes_per_sec: 0, total_rx_mb: 0, total_tx_mb: 0 };
    }

    return {
      rx_bytes_per_sec: current.network_rx_bytes_per_sec || 0,
      tx_bytes_per_sec: current.network_tx_bytes_per_sec || 0,
      total_rx_mb: (current.network_rx_bytes_per_sec || 0) / 1024 / 1024,
      total_tx_mb: (current.network_tx_bytes_per_sec || 0) / 1024 / 1024
    };
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal': return 'text-green-400';
      case 'warning': return 'text-yellow-400';
      case 'critical': return 'text-red-400';
      default: return 'text-neutral-400';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': return '↗';
      case 'decreasing': return '↘';
      default: return '→';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-400 bg-red-900/20 border-red-800';
      case 'medium': return 'text-yellow-400 bg-yellow-900/20 border-yellow-800';
      case 'low': return 'text-blue-400 bg-blue-900/20 border-blue-800';
      default: return 'text-neutral-400 bg-neutral-900/20 border-neutral-800';
    }
  };

  return (
    <div class="space-y-6">
      {/* Header with connection status */}
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-2xl font-thin text-neutral-200 mb-2">
            SYSTEM MONITOR
          </h2>
          <p class="text-neutral-500 text-sm">
            Real-time system resource monitoring and analysis
          </p>
        </div>

        <div class="flex items-center gap-3">
          <div class={`flex items-center gap-2 text-sm ${isConnected() ? 'text-green-400' : 'text-red-400'}`}>
            <div class={`w-2 h-2 rounded-full ${isConnected() ? 'bg-green-400' : 'bg-red-400'} ${isConnected() ? 'animate-pulse' : ''}`}></div>
            {isConnected() ? 'CONNECTED' : 'DISCONNECTED'}
          </div>
        </div>
      </div>

      {/* Error display */}
      <Show when={error()}>
        <div class="bg-red-900/20 border border-red-800 rounded-lg p-4">
          <div class="text-red-400 font-mono text-sm mb-2">CONNECTION ERROR</div>
          <div class="text-neutral-300 text-sm">{error()}</div>
        </div>
      </Show>

      {/* Main metrics display */}
      <Show when={metrics() && !error()}>
        {/* Resource usage cards */}
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* CPU Usage */}
          <div class="bg-neutral-900/30 border border-neutral-800 rounded-lg p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-mono text-neutral-300">CPU USAGE</h3>
              <div class={`text-sm font-mono ${getStatusColor(getResourceUsage('cpu').status)}`}>
                {getResourceUsage('cpu').status.toUpperCase()}
              </div>
            </div>

            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-neutral-500 text-sm">Current</span>
                <span class={`font-mono ${getStatusColor(getResourceUsage('cpu').status)}`}>
                  {getResourceUsage('cpu').current.toFixed(1)}%
                  <span class="ml-2">{getTrendIcon(getResourceUsage('cpu').trend)}</span>
                </span>
              </div>

              <div class="w-full bg-neutral-800 rounded-full h-2">
                <div
                  class={`h-2 rounded-full transition-all duration-500 ${
                    getResourceUsage('cpu').status === 'critical' ? 'bg-red-500' :
                    getResourceUsage('cpu').status === 'warning' ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${getResourceUsage('cpu').current}%` }}
                ></div>
              </div>

              <div class="grid grid-cols-2 gap-4 text-xs text-neutral-600">
                <div>Peak: {getResourceUsage('cpu').max.toFixed(1)}%</div>
                <div>Avg: {getResourceUsage('cpu').average.toFixed(1)}%</div>
              </div>
            </div>
          </div>

          {/* Memory Usage */}
          <div class="bg-neutral-900/30 border border-neutral-800 rounded-lg p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-mono text-neutral-300">MEMORY</h3>
              <div class={`text-sm font-mono ${getStatusColor(getResourceUsage('memory').status)}`}>
                {getResourceUsage('memory').status.toUpperCase()}
              </div>
            </div>

            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-neutral-500 text-sm">Used</span>
                <span class={`font-mono ${getStatusColor(getResourceUsage('memory').status)}`}>
                  {getResourceUsage('memory').current.toFixed(1)}%
                  <span class="ml-2">{getTrendIcon(getResourceUsage('memory').trend)}</span>
                </span>
              </div>

              <div class="w-full bg-neutral-800 rounded-full h-2">
                <div
                  class={`h-2 rounded-full transition-all duration-500 ${
                    getResourceUsage('memory').status === 'critical' ? 'bg-red-500' :
                    getResourceUsage('memory').status === 'warning' ? 'bg-yellow-500' : 'bg-purple-500'
                  }`}
                  style={{ width: `${getResourceUsage('memory').current}%` }}
                ></div>
              </div>

              <div class="grid grid-cols-2 gap-4 text-xs text-neutral-600">
                <div>Total: {metrics()!.memory_total_gb.toFixed(1)}GB</div>
                <div>Free: {metrics()!.memory_available_gb.toFixed(1)}GB</div>
              </div>
            </div>
          </div>

          {/* Load Average */}
          <div class="bg-neutral-900/30 border border-neutral-800 rounded-lg p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-mono text-neutral-300">LOAD AVERAGE</h3>
              <div class={`text-sm font-mono ${
                metrics()!.load_average_1m > metrics()!.cpu_cores * 2 ? 'text-red-400' :
                metrics()!.load_average_1m > metrics()!.cpu_cores ? 'text-yellow-400' : 'text-green-400'
              }`}>
                {metrics()!.load_average_1m > metrics()!.cpu_cores * 2 ? 'HIGH' :
                 metrics()!.load_average_1m > metrics()!.cpu_cores ? 'ELEVATED' : 'NORMAL'}
              </div>
            </div>

            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-neutral-500 text-sm">1 minute</span>
                <span class="font-mono text-neutral-100">
                  {metrics()!.load_average_1m.toFixed(2)}
                </span>
              </div>

              <div class="flex items-center justify-between">
                <span class="text-neutral-500 text-sm">5 minute</span>
                <span class="font-mono text-neutral-300">
                  {metrics()!.load_average_5m.toFixed(2)}
                </span>
              </div>

              <div class="flex items-center justify-between">
                <span class="text-neutral-500 text-sm">15 minute</span>
                <span class="font-mono text-neutral-400">
                  {metrics()!.load_average_15m.toFixed(2)}
                </span>
              </div>

              <div class="text-xs text-neutral-600 pt-2 border-t border-neutral-800">
                CPU Cores: {metrics()!.cpu_cores} | Processes: {metrics()!.active_processes}
              </div>
            </div>
          </div>
        </div>

        {/* Network Activity */}
        <div class="bg-neutral-900/30 border border-neutral-800 rounded-lg p-6">
          <h3 class="text-lg font-mono text-neutral-300 mb-4">NETWORK ACTIVITY</h3>
          <div class="grid md:grid-cols-4 gap-6">
            <div class="text-center">
              <div class="text-2xl font-mono text-green-400 mb-1">
                {formatBytes(getNetworkStats().rx_bytes_per_sec)}/s
              </div>
              <div class="text-sm text-neutral-500">Download</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-mono text-blue-400 mb-1">
                {formatBytes(getNetworkStats().tx_bytes_per_sec)}/s
              </div>
              <div class="text-sm text-neutral-500">Upload</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-mono text-neutral-300 mb-1">
                {getNetworkStats().total_rx_mb.toFixed(1)} MB
              </div>
              <div class="text-sm text-neutral-500">Total RX</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-mono text-neutral-300 mb-1">
                {getNetworkStats().total_tx_mb.toFixed(1)} MB
              </div>
              <div class="text-sm text-neutral-500">Total TX</div>
            </div>
          </div>
        </div>

        {/* Optimization Recommendations */}
        <Show when={getOptimizationRecommendations().length > 0}>
          <div class="bg-neutral-900/30 border border-neutral-800 rounded-lg p-6">
            <h3 class="text-lg font-mono text-neutral-300 mb-4">OPTIMIZATION RECOMMENDATIONS</h3>
            <div class="space-y-3">
              <For each={getOptimizationRecommendations()}>
                {(rec) => (
                  <div class={`border rounded-sm p-4 ${getSeverityColor(rec.severity)}`}>
                    <div class="flex items-center justify-between mb-2">
                      <div class="font-mono text-sm">{rec.category}</div>
                      <div class="text-xs px-2 py-1 rounded-sm bg-current/10">
                        {rec.severity.toUpperCase()}
                      </div>
                    </div>
                    <div class="text-sm mb-2">{rec.message}</div>
                    <Show when={rec.action}>
                      <div class="text-xs opacity-75">{rec.action}</div>
                    </Show>
                  </div>
                )}
              </For>
            </div>
          </div>
        </Show>

        {/* Recent Alerts */}
        <Show when={alerts().length > 0}>
          <div class="bg-neutral-900/30 border border-neutral-800 rounded-lg p-6">
            <h3 class="text-lg font-mono text-neutral-300 mb-4">RECENT ALERTS</h3>
            <div class="space-y-2">
              <For each={alerts().slice(0, 5)}>
                {(alert) => (
                  <div class="flex items-center justify-between p-3 bg-neutral-800/30 rounded-sm">
                    <div class="flex-1">
                      <div class="text-sm text-neutral-300">{alert.message}</div>
                      <div class="text-xs text-neutral-600">
                        {new Date(alert.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                    <div class={`text-xs px-2 py-1 rounded-sm ${getSeverityColor(alert.severity)}`}>
                      {alert.severity.toUpperCase()}
                    </div>
                  </div>
                )}
              </For>
            </div>
          </div>
        </Show>
      </Show>

      {/* No data message */}
      <Show when={!metrics() && !error()}>
        <div class="text-center py-12">
          <div class="w-16 h-16 border-2 border-neutral-600 border-t-neutral-300 rounded-full animate-spin mx-auto mb-4"></div>
          <div class="text-neutral-500 font-mono text-sm">
            Connecting to system monitor...
          </div>
        </div>
      </Show>
    </div>
  );
};
