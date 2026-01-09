/*
 * ©AngelaMos | 2025
 */

import {
  type Component,
  createSignal,
  onMount,
  Show,
  For,
  createEffect,
} from 'solid-js';
import { usePerformance } from '../../hooks/usePerformance';
import { Card, MetricCard, StatusCard } from '../UI/Card';
import { LoadingSpinner } from '../UI/LoadingSpinner';

interface ResourceGaugeProps {
  label: string;
  value: number;
  max: number;
  unit: string;
  warning?: number;
  critical?: number;
  color?: string;
}

const ResourceGauge: Component<ResourceGaugeProps> = (props) => {
  const percentage = () => Math.min((props.value / props.max) * 100, 100);

  const getColor = () => {
    if (props.critical && props.value >= props.critical)
      return 'text-red-400 bg-red-400';
    if (props.warning && props.value >= props.warning)
      return 'text-yellow-400 bg-yellow-400';
    return props.color || 'text-cyan-400 bg-cyan-400';
  };

  const getGradient = () => {
    if (props.critical && props.value >= props.critical)
      return 'from-red-600 to-red-400';
    if (props.warning && props.value >= props.warning)
      return 'from-yellow-600 to-yellow-400';
    return 'from-cyan-600 to-cyan-400';
  };

  return (
    <div class="space-y-3">
      <div class="flex justify-between items-baseline">
        <span class="text-sm font-mono text-neutral-400 tracking-wide">
          {props.label}
        </span>
        <div class="text-right">
          <span
            class={`text-lg font-mono font-semibold ${getColor().split(' ')[0]}`}
          >
            {props.value.toFixed(1)}
          </span>
          <span class="text-sm text-neutral-500 ml-1">{props.unit}</span>
        </div>
      </div>

      <div class="relative">
        <div class="w-full h-2 bg-neutral-800 rounded-full overflow-hidden">
          <div
            class={`h-full bg-gradient-to-r ${getGradient()} rounded-full transition-all duration-500 ease-out relative`}
            style={{ width: `${percentage()}%` }}
          >
            <div class="absolute inset-0 bg-white/20 animate-pulse rounded-full"></div>
          </div>
        </div>

        {/* Warning and critical thresholds */}
        {props.warning && (
          <div
            class="absolute top-0 w-0.5 h-2 bg-yellow-400/60"
            style={{ left: `${(props.warning / props.max) * 100}%` }}
          ></div>
        )}
        {props.critical && (
          <div
            class="absolute top-0 w-0.5 h-2 bg-red-400/60"
            style={{ left: `${(props.critical / props.max) * 100}%` }}
          ></div>
        )}
      </div>

      <div class="text-xs text-neutral-600 font-mono">
        {percentage().toFixed(1)}% utilized
      </div>
    </div>
  );
};

const MiniChart: Component<{
  data: Array<{ timestamp: string; value: number }>;
  color?: string;
  height?: number;
}> = (props) => {
  const height = () => props.height || 40;
  const color = () => props.color || '#22d3ee';

  const pathData = () => {
    if (props.data.length < 2) return '';

    const width = 200;
    const maxValue = Math.max(...props.data.map((d) => d.value));
    const minValue = Math.min(...props.data.map((d) => d.value));
    const range = maxValue - minValue || 1;

    const points = props.data
      .map((point, index) => {
        const x = (index / (props.data.length - 1)) * width;
        const y = height() - ((point.value - minValue) / range) * height();
        return `${x},${y}`;
      })
      .join(' ');

    return `M ${points.replace(/,/g, ' L ')}`;
  };

  return (
    <div class="relative">
      <svg
        width="200"
        height={height()}
        class="w-full"
      >
        <defs>
          <linearGradient
            id="chartGradient"
            x1="0%"
            y1="0%"
            x2="0%"
            y2="100%"
          >
            <stop
              offset="0%"
              style={`stop-color:${color()};stop-opacity:0.3`}
            />
            <stop
              offset="100%"
              style={`stop-color:${color()};stop-opacity:0.05`}
            />
          </linearGradient>
        </defs>

        {/* Fill area */}
        <path
          d={`${pathData()} L 200,${height()} L 0,${height()} Z`}
          fill="url(#chartGradient)"
        />

        {/* Line */}
        <path
          d={pathData()}
          fill="none"
          stroke={color()}
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />

        {/* Dots for recent points */}
        {props.data.slice(-3).map((point, index) => {
          const totalIndex = props.data.length - 3 + index;
          const x = (totalIndex / (props.data.length - 1)) * 200;
          const maxValue = Math.max(...props.data.map((d) => d.value));
          const minValue = Math.min(...props.data.map((d) => d.value));
          const range = maxValue - minValue || 1;
          const y = height() - ((point.value - minValue) / range) * height();

          return (
            <circle
              cx={x}
              cy={y}
              r="2"
              fill={color()}
              class="animate-pulse"
            />
          );
        })}
      </svg>
    </div>
  );
};

export const SystemMonitor: Component = () => {
  const {
    currentMetrics,
    isMonitoring,
    connectionStatus,
    error,
    metricsHistory,
    alerts,
    criticalAlerts,
    performanceInsights,
    startMonitoring,
    stopMonitoring,
    refreshMetrics,
    clearError,
    resolveAlert,
  } = usePerformance();

  const [selectedTimeRange, setSelectedTimeRange] = createSignal<
    '5m' | '15m' | '1h' | '24h'
  >('15m');

  onMount(() => {
    // I'm starting monitoring automatically
    startMonitoring();
  });

  // I'm filtering metrics history based on selected time range
  const filteredHistory = () => {
    const history = metricsHistory();
    const now = Date.now();
    const ranges = {
      '5m': 5 * 60 * 1000,
      '15m': 15 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
    };

    const cutoff = now - ranges[selectedTimeRange()];
    return history.filter(
      (item) => new Date(item.timestamp).getTime() > cutoff,
    );
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
      {/* Header Controls */}
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 class="text-2xl font-thin text-neutral-200 mb-2">
            SYSTEM MONITOR
          </h2>
          <div class="flex items-center gap-3">
            <div
              class={`w-2 h-2 rounded-full ${
                connectionStatus() === 'connected'
                  ? 'bg-green-400'
                  : connectionStatus() === 'reconnecting'
                    ? 'bg-yellow-400 animate-pulse'
                    : 'bg-red-400'
              }`}
            ></div>
            <span class="text-sm font-mono text-neutral-500">
              {connectionStatus().toUpperCase()}
            </span>
            {isMonitoring() && (
              <span class="text-xs text-neutral-600">
                • Live monitoring active
              </span>
            )}
          </div>
        </div>

        <div class="flex items-center gap-3">
          {/* Time Range Selector */}
          <div class="flex bg-neutral-900 border border-neutral-700 rounded overflow-hidden">
            {(['5m', '15m', '1h', '24h'] as const).map((range) => (
              <button
                onClick={() => setSelectedTimeRange(range)}
                class={`px-3 py-1 text-xs font-mono transition-colors duration-200 ${
                  selectedTimeRange() === range
                    ? 'bg-neutral-700 text-neutral-100'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {range}
              </button>
            ))}
          </div>

          {/* Control Buttons */}
          <button
            onClick={refreshMetrics}
            class="px-4 py-2 bg-transparent border border-neutral-600 text-neutral-300 rounded text-sm font-mono hover:border-neutral-500 hover:text-neutral-100 transition-colors duration-200"
          >
            REFRESH
          </button>

          <button
            onClick={isMonitoring() ? stopMonitoring : startMonitoring}
            class={`px-4 py-2 rounded text-sm font-mono transition-colors duration-200 ${
              isMonitoring()
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {isMonitoring() ? 'STOP' : 'START'}
          </button>
        </div>
      </div>

      {/* Error Display */}
      <Show when={error()}>
        <Card
          variant="outlined"
          class="border-red-800 bg-red-900/10"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="text-red-400 text-xl">⚠</div>
              <div>
                <div class="text-red-400 font-mono text-sm font-semibold">
                  MONITORING ERROR
                </div>
                <div class="text-neutral-300 text-sm mt-1">{error()}</div>
              </div>
            </div>
            <button
              onClick={clearError}
              class="text-red-400 hover:text-red-300 transition-colors duration-200"
            >
              ✕
            </button>
          </div>
        </Card>
      </Show>

      {/* Critical Alerts */}
      <Show when={criticalAlerts().length > 0}>
        <Card
          variant="outlined"
          class="border-red-700 bg-red-900/20"
        >
          <div class="flex items-center gap-3 mb-4">
            <div class="text-red-400 text-xl animate-pulse">🚨</div>
            <h3 class="text-red-400 font-mono text-sm font-semibold">
              CRITICAL ALERTS ({criticalAlerts().length})
            </h3>
          </div>

          <div class="space-y-2">
            <For each={criticalAlerts().slice(0, 3)}>
              {(alert) => (
                <div class="flex items-center justify-between bg-red-900/30 rounded p-3">
                  <div class="flex-1">
                    <div class="text-red-300 text-sm font-mono">
                      {alert.message}
                    </div>
                    <div class="text-red-500 text-xs mt-1">
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                  <button
                    onClick={() => resolveAlert(alert.id)}
                    class="text-red-400 hover:text-red-300 ml-3 text-xs"
                  >
                    RESOLVE
                  </button>
                </div>
              )}
            </For>
          </div>
        </Card>
      </Show>

      {/* Loading State */}
      <Show when={!currentMetrics() && isMonitoring()}>
        <Card class="text-center py-12">
          <LoadingSpinner
            variant="pulse"
            size="lg"
            message="Collecting system metrics..."
          />
        </Card>
      </Show>

      {/* Main Metrics Display */}
      <Show when={currentMetrics()}>
        <div class="grid lg:grid-cols-3 gap-6">
          {/* Resource Utilization */}
          <div class="lg:col-span-2 space-y-6">
            <Card variant="elevated">
              <h3 class="text-lg font-mono text-neutral-300 mb-6">
                RESOURCE UTILIZATION
              </h3>

              <div class="grid md:grid-cols-2 gap-6">
                <ResourceGauge
                  label="CPU Usage"
                  value={currentMetrics()!.cpu_usage_percent}
                  max={100}
                  unit="%"
                  warning={75}
                  critical={90}
                />

                <ResourceGauge
                  label="Memory Usage"
                  value={currentMetrics()!.memory_usage_percent}
                  max={100}
                  unit="%"
                  warning={70}
                  critical={85}
                  color="text-purple-400 bg-purple-400"
                />

                <ResourceGauge
                  label="Disk Usage"
                  value={currentMetrics()!.disk_usage_percent}
                  max={100}
                  unit="%"
                  warning={80}
                  critical={90}
                  color="text-yellow-400 bg-yellow-400"
                />

                <ResourceGauge
                  label="Load Average"
                  value={currentMetrics()!.load_average_1m}
                  max={currentMetrics()!.cpu_cores * 2}
                  unit=""
                  warning={currentMetrics()!.cpu_cores}
                  critical={currentMetrics()!.cpu_cores * 1.5}
                  color="text-green-400 bg-green-400"
                />
              </div>
            </Card>

            {/* Historical Charts */}
            <Card variant="elevated">
              <h3 class="text-lg font-mono text-neutral-300 mb-6">
                PERFORMANCE TRENDS ({selectedTimeRange()})
              </h3>

              <div class="grid md:grid-cols-3 gap-6">
                <div>
                  <div class="text-sm text-neutral-400 mb-3">CPU Usage</div>
                  <MiniChart
                    data={filteredHistory().map((h) => ({
                      timestamp: h.timestamp,
                      value: h.cpu,
                    }))}
                    color="#22d3ee"
                  />
                </div>

                <div>
                  <div class="text-sm text-neutral-400 mb-3">
                    Memory Usage
                  </div>
                  <MiniChart
                    data={filteredHistory().map((h) => ({
                      timestamp: h.timestamp,
                      value: h.memory,
                    }))}
                    color="#a855f7"
                  />
                </div>

                <div>
                  <div class="text-sm text-neutral-400 mb-3">
                    Load Average
                  </div>
                  <MiniChart
                    data={filteredHistory().map((h) => ({
                      timestamp: h.timestamp,
                      value: h.load,
                    }))}
                    color="#22c55e"
                  />
                </div>
              </div>
            </Card>
          </div>

          {/* System Information */}
          <div class="space-y-6">
            <Card variant="elevated">
              <h3 class="text-lg font-mono text-neutral-300 mb-4">
                SYSTEM INFO
              </h3>

              <div class="space-y-3 text-sm">
                <div class="flex justify-between">
                  <span class="text-neutral-500">CPU Model</span>
                  <div class="text-right text-neutral-300 font-mono text-xs max-w-[150px] truncate">
                    {currentMetrics()!.cpu_model}
                  </div>
                </div>

                <div class="flex justify-between">
                  <span class="text-neutral-500">CPU Cores</span>
                  <span class="text-neutral-300 font-mono">
                    {currentMetrics()!.cpu_cores} cores /{' '}
                    {currentMetrics()!.cpu_threads} threads
                  </span>
                </div>

                <div class="flex justify-between">
                  <span class="text-neutral-500">Total Memory</span>
                  <span class="text-neutral-300 font-mono">
                    {currentMetrics()?.memory_total_gb?.toFixed(1) || '0.0'}{' '}
                    GB
                  </span>
                </div>

                <div class="flex justify-between">
                  <span class="text-neutral-500">Available Memory</span>
                  <span class="text-neutral-300 font-mono">
                    {currentMetrics()?.memory_available_gb?.toFixed(1) ||
                      '0.0'}{' '}
                    GB
                  </span>
                </div>

                <div class="flex justify-between">
                  <span class="text-neutral-500">Uptime</span>
                  <span class="text-neutral-300 font-mono">
                    {formatUptime(currentMetrics()!.uptime_seconds)}
                  </span>
                </div>

                <div class="flex justify-between">
                  <span class="text-neutral-500">Processes</span>
                  <span class="text-neutral-300 font-mono">
                    {currentMetrics()!.active_processes}
                  </span>
                </div>
              </div>
            </Card>

            {/* Performance Grade */}
            <Show when={performanceInsights()}>
              <Card variant="elevated">
                <h3 class="text-lg font-mono text-neutral-300 mb-4">
                  PERFORMANCE GRADE
                </h3>

                <div class="text-center mb-4">
                  <div class="text-4xl font-mono font-bold text-cyan-400">
                    {performanceInsights()!.grade}
                  </div>
                  <div class="text-sm text-neutral-500 mt-1">
                    {performanceInsights()?.overallScore?.toFixed(0) || '0'}
                    /100
                  </div>
                </div>

                <div class="space-y-2 text-xs">
                  <div class="flex justify-between">
                    <span class="text-neutral-500">CPU Score</span>
                    <span class="text-neutral-300 font-mono">
                      {performanceInsights()?.cpuScore?.toFixed(0) || '0'}
                    </span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-neutral-500">Memory Score</span>
                    <span class="text-neutral-300 font-mono">
                      {performanceInsights()?.memoryScore?.toFixed(0) || '0'}
                    </span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-neutral-500">Load Score</span>
                    <span class="text-neutral-300 font-mono">
                      {performanceInsights()?.loadScore?.toFixed(0) || '0'}
                    </span>
                  </div>
                </div>
              </Card>
            </Show>

            {/* Recommendations */}
            <Show when={performanceInsights()?.recommendations.length}>
              <Card
                variant="outlined"
                class="border-yellow-800 bg-yellow-900/10"
              >
                <h3 class="text-sm font-mono text-yellow-400 mb-3">
                  RECOMMENDATIONS
                </h3>

                <div class="space-y-2">
                  <For each={performanceInsights()!.recommendations}>
                    {(recommendation) => (
                      <div class="text-xs text-neutral-400 flex items-start gap-2">
                        <div class="text-yellow-400 mt-0.5">•</div>
                        <div>{recommendation}</div>
                      </div>
                    )}
                  </For>
                </div>
              </Card>
            </Show>
          </div>
        </div>
      </Show>
    </div>
  );
};
