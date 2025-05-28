/*
 * Real-time performance metrics visualization component that displays live system performance data with interactive charts and alerts.
 * I'm implementing comprehensive metrics display with real-time updates, historical trends, and performance analysis using Chart.js and WebSocket integration.
 */

import { Component, createSignal, createEffect, onMount, onCleanup, Show, For } from 'solid-js';
import { performanceService, SystemMetrics } from '../../services/performance';

interface MetricCard {
  id: string;
  label: string;
  value: string;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  status: 'excellent' | 'good' | 'warning' | 'critical';
  description: string;
}

interface ChartDataPoint {
  timestamp: string;
  value: number;
}

export const MetricsDisplay: Component = () => {
  const [metrics, setMetrics] = createSignal<SystemMetrics | null>(null);
  const [isLoading, setIsLoading] = createSignal(true);
  const [error, setError] = createSignal<string | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = createSignal<'1h' | '6h' | '24h' | '7d'>('1h');
  const [cpuHistory, setCpuHistory] = createSignal<ChartDataPoint[]>([]);
  const [memoryHistory, setMemoryHistory] = createSignal<ChartDataPoint[]>([]);
  const [alerts, setAlerts] = createSignal<any[]>([]);

  let unsubscribe: (() => void) | null = null;
  let metricsInterval: number | null = null;

  onMount(() => {
    initializeMetrics();
  });

  onCleanup(() => {
    if (unsubscribe) unsubscribe();
    if (metricsInterval) clearInterval(metricsInterval);
  });

  const initializeMetrics = async () => {
    try {
      setIsLoading(true);

      // I'm subscribing to real-time metrics updates
      unsubscribe = performanceService.subscribe('metrics', (newMetrics: SystemMetrics) => {
        setMetrics(newMetrics);
        updateHistoricalData(newMetrics);
        setError(null);
      });

      // I'm also subscribing to alerts
      performanceService.subscribe('alert', (alert) => {
        setAlerts(prev => [alert, ...prev.slice(0, 4)]); // Keep last 5 alerts
      });

      // I'm fetching initial metrics
      const initialMetrics = await performanceService.getCurrentMetrics();
      setMetrics(initialMetrics.system);

      // I'm setting up fallback polling in case WebSocket fails
      metricsInterval = setInterval(async () => {
        try {
          const snapshot = await performanceService.getCurrentMetrics();
          setMetrics(snapshot.system);
          updateHistoricalData(snapshot.system);
        } catch (err) {
          console.warn('Failed to fetch metrics:', err);
        }
      }, 5000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load metrics');
    } finally {
      setIsLoading(false);
    }
  };

  const updateHistoricalData = (newMetrics: SystemMetrics) => {
    const timestamp = new Date().toISOString();

    // I'm maintaining historical data for charting
    setCpuHistory(prev => {
      const updated = [...prev, { timestamp, value: newMetrics.cpu_usage_percent }];
      return updated.slice(-60); // Keep last 60 points (5 minutes at 5s intervals)
    });

    setMemoryHistory(prev => {
      const updated = [...prev, { timestamp, value: newMetrics.memory_usage_percent }];
      return updated.slice(-60);
    });
  };

  const getMetricCards = (): MetricCard[] => {
    if (!metrics()) return [];

    const m = metrics()!;
    return [
      {
        id: 'cpu',
        label: 'CPU Usage',
        value: m.cpu_usage_percent.toFixed(1),
        unit: '%',
        trend: 'stable', // Would calculate from history
        status: m.cpu_usage_percent > 80 ? 'critical' : m.cpu_usage_percent > 60 ? 'warning' : 'good',
        description: `${m.cpu_cores} cores, ${m.cpu_threads} threads`
      },
      {
        id: 'memory',
        label: 'Memory Usage',
        value: m.memory_usage_percent.toFixed(1),
        unit: '%',
        trend: 'stable',
        status: m.memory_usage_percent > 85 ? 'critical' : m.memory_usage_percent > 70 ? 'warning' : 'good',
        description: `${m.memory_available_gb.toFixed(1)}GB available of ${m.memory_total_gb.toFixed(1)}GB`
      },
      {
        id: 'load',
        label: 'Load Average',
        value: m.load_average_1m.toFixed(2),
        unit: '',
        trend: 'stable',
        status: m.load_average_1m > m.cpu_cores * 2 ? 'critical' : m.load_average_1m > m.cpu_cores ? 'warning' : 'good',
        description: '1-minute load average'
      },
      {
        id: 'processes',
        label: 'Active Processes',
        value: m.active_processes.toString(),
        unit: '',
        trend: 'stable',
        status: 'good',
        description: 'Currently running processes'
      }
    ];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-400';
      case 'good': return 'text-blue-400';
      case 'warning': return 'text-yellow-400';
      case 'critical': return 'text-red-400';
      default: return 'text-neutral-400';
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'bg-green-900/20 border-green-800';
      case 'good': return 'bg-blue-900/20 border-blue-800';
      case 'warning': return 'bg-yellow-900/20 border-yellow-800';
      case 'critical': return 'bg-red-900/20 border-red-800';
      default: return 'bg-neutral-900/20 border-neutral-800';
    }
  };

  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  return (
    <div class="space-y-6">
      {/* Header with controls */}
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-2xl font-thin text-neutral-200 mb-2">
            SYSTEM PERFORMANCE
          </h2>
          <p class="text-neutral-500 text-sm">
            Real-time system metrics and performance analysis
          </p>
        </div>

        <div class="flex items-center gap-2">
          <select
            value={selectedTimeRange()}
            onChange={(e) => setSelectedTimeRange(e.currentTarget.value as any)}
            class="bg-neutral-900 border border-neutral-700 rounded-sm px-3 py-2 text-neutral-100 text-sm font-mono focus:border-neutral-500 focus:outline-none"
          >
            <option value="1h">Last Hour</option>
            <option value="6h">Last 6 Hours</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
          </select>
        </div>
      </div>

      {/* Loading state */}
      <Show when={isLoading()}>
        <div class="flex items-center justify-center py-12">
          <div class="w-8 h-8 border-2 border-neutral-600 border-t-neutral-300 rounded-full animate-spin"></div>
          <span class="ml-3 text-neutral-400 font-mono text-sm">Loading metrics...</span>
        </div>
      </Show>

      {/* Error state */}
      <Show when={error()}>
        <div class="bg-red-900/20 border border-red-800 rounded-lg p-4">
          <div class="text-red-400 font-mono text-sm mb-2">METRICS ERROR</div>
          <div class="text-neutral-300 text-sm">{error()}</div>
        </div>
      </Show>

      {/* Metrics display */}
      <Show when={!isLoading() && !error() && metrics()}>
        {/* Alert banner */}
        <Show when={alerts().length > 0}>
          <div class="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4">
            <div class="text-yellow-400 font-mono text-sm mb-2">
              ACTIVE ALERTS ({alerts().length})
            </div>
            <div class="space-y-1">
              <For each={alerts().slice(0, 2)}>
                {(alert) => (
                  <div class="text-neutral-300 text-sm flex items-center justify-between">
                    <span>{alert.message}</span>
                    <span class="text-xs px-2 py-1 bg-yellow-800 text-yellow-200 rounded-sm">
                      {alert.severity.toUpperCase()}
                    </span>
                  </div>
                )}
              </For>
            </div>
          </div>
        </Show>

        {/* Main metrics grid */}
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <For each={getMetricCards()}>
            {(card) => (
              <div class={`rounded-lg p-4 border ${getStatusBgColor(card.status)}`}>
                <div class="flex items-center justify-between mb-2">
                  <div class="text-neutral-400 text-sm font-mono">{card.label}</div>
                  <div class={`text-xs px-2 py-1 rounded-sm ${getStatusColor(card.status)} bg-current/10`}>
                    {card.status.toUpperCase()}
                  </div>
                </div>

                <div class="flex items-baseline gap-2 mb-2">
                  <div class={`text-2xl font-mono ${getStatusColor(card.status)}`}>
                    {card.value}
                  </div>
                  <div class="text-neutral-500 text-sm">{card.unit}</div>
                </div>

                <div class="text-neutral-600 text-xs">
                  {card.description}
                </div>
              </div>
            )}
          </For>
        </div>

        {/* Charts section */}
        <div class="grid md:grid-cols-2 gap-6">
          {/* CPU Usage Chart */}
          <div class="bg-neutral-900/30 border border-neutral-800 rounded-lg p-6">
            <h3 class="text-lg font-mono text-neutral-300 mb-4">CPU USAGE TREND</h3>
            <div class="h-48 relative">
              <Show when={cpuHistory().length > 1} fallback={
                <div class="flex items-center justify-center h-full text-neutral-600">
                  Collecting data...
                </div>
              }>
                <svg class="w-full h-full" viewBox="0 0 400 200">
                  {/* Grid lines */}
                  <defs>
                    <pattern id="grid" width="40" height="20" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 20" fill="none" stroke="#374151" stroke-width="0.5"/>
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" opacity="0.3"/>

                  {/* CPU usage line */}
                  <polyline
                    fill="none"
                    stroke="#22d3ee"
                    stroke-width="2"
                    points={cpuHistory().map((point, index) => {
                      const x = (index / (cpuHistory().length - 1)) * 400;
                      const y = 200 - (point.value / 100) * 200;
                      return `${x},${y}`;
                    }).join(' ')}
                  />

                  {/* Current value indicator */}
                  <Show when={cpuHistory().length > 0}>
                    <circle
                      cx="400"
                      cy={200 - (cpuHistory()[cpuHistory().length - 1]?.value / 100) * 200}
                      r="3"
                      fill="#22d3ee"
                    />
                  </Show>
                </svg>

                {/* Y-axis labels */}
                <div class="absolute inset-y-0 -left-8 flex flex-col justify-between text-xs text-neutral-500 font-mono">
                  <span>100%</span>
                  <span>50%</span>
                  <span>0%</span>
                </div>
              </Show>
            </div>
          </div>

          {/* Memory Usage Chart */}
          <div class="bg-neutral-900/30 border border-neutral-800 rounded-lg p-6">
            <h3 class="text-lg font-mono text-neutral-300 mb-4">MEMORY USAGE TREND</h3>
            <div class="h-48 relative">
              <Show when={memoryHistory().length > 1} fallback={
                <div class="flex items-center justify-center h-full text-neutral-600">
                  Collecting data...
                </div>
              }>
                <svg class="w-full h-full" viewBox="0 0 400 200">
                  <rect width="100%" height="100%" fill="url(#grid)" opacity="0.3"/>

                  <polyline
                    fill="none"
                    stroke="#a855f7"
                    stroke-width="2"
                    points={memoryHistory().map((point, index) => {
                      const x = (index / (memoryHistory().length - 1)) * 400;
                      const y = 200 - (point.value / 100) * 200;
                      return `${x},${y}`;
                    }).join(' ')}
                  />

                  <Show when={memoryHistory().length > 0}>
                    <circle
                      cx="400"
                      cy={200 - (memoryHistory()[memoryHistory().length - 1]?.value / 100) * 200}
                      r="3"
                      fill="#a855f7"
                    />
                  </Show>
                </svg>

                <div class="absolute inset-y-0 -left-8 flex flex-col justify-between text-xs text-neutral-500 font-mono">
                  <span>100%</span>
                  <span>50%</span>
                  <span>0%</span>
                </div>
              </Show>
            </div>
          </div>
        </div>

        {/* System information */}
        <div class="bg-neutral-900/30 border border-neutral-800 rounded-lg p-6">
          <h3 class="text-lg font-mono text-neutral-300 mb-4">SYSTEM INFORMATION</h3>
          <div class="grid md:grid-cols-3 gap-6 text-sm">
            <div>
              <div class="text-neutral-500 mb-2">PROCESSOR</div>
              <div class="text-neutral-300 font-mono mb-1">{metrics()!.cpu_model}</div>
              <div class="text-neutral-600 text-xs">
                {metrics()!.cpu_cores} cores • {metrics()!.cpu_threads} threads
              </div>
            </div>

            <div>
              <div class="text-neutral-500 mb-2">MEMORY</div>
              <div class="text-neutral-300 font-mono mb-1">
                {metrics()!.memory_total_gb.toFixed(1)} GB Total
              </div>
              <div class="text-neutral-600 text-xs">
                {metrics()!.memory_available_gb.toFixed(1)} GB available
              </div>
            </div>

            <div>
              <div class="text-neutral-500 mb-2">UPTIME</div>
              <div class="text-neutral-300 font-mono mb-1">
                {formatUptime(metrics()!.uptime_seconds)}
              </div>
              <div class="text-neutral-600 text-xs">
                System uptime
              </div>
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
};
