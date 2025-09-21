/*
 * Performance demonstration page showcasing real-time metrics, fractal computation, and system benchmarks with live updates and interactive controls.
 * I'm integrating all performance monitoring components, fractal rendering, and benchmark execution into a comprehensive showcase that demonstrates the system's computational capabilities.
 */

import { Component, createSignal, createEffect, onMount, onCleanup, Show, For } from 'solid-js';
import { FractalCanvas } from '../components/Fractals/FractalCanvas';
import { WebVitals } from '../components/Performance/WebVitals';
import { RustMetrics } from '../components/Performance/RustMetrics';
import { performanceService, SystemMetrics, Alert } from '../services/performance';
import { fractalService, BenchmarkResult } from '../services/fractals';

interface PerformanceTab {
  id: string;
  label: string;
  description: string;
}

interface ChartDataPoint {
  timestamp: string;
  value: number;
}

export default function Performance(): Component {
  const [isVisible, setIsVisible] = createSignal(false);
  const [activeTab, setActiveTab] = createSignal('overview');
  const [systemMetrics, setSystemMetrics] = createSignal<SystemMetrics | null>(null);
  const [benchmarkResults, setBenchmarkResults] = createSignal<BenchmarkResult | null>(null);
  const [alerts, setAlerts] = createSignal<Alert[]>([]);
  const [isRunningBenchmark, setIsRunningBenchmark] = createSignal(false);
  const [cpuHistory, setCpuHistory] = createSignal<ChartDataPoint[]>([]);
  const [memoryHistory, setMemoryHistory] = createSignal<ChartDataPoint[]>([]);
  const [fractalMetrics, setFractalMetrics] = createSignal<any>(null);

  // I'm defining the performance tabs for organized content presentation
  const performanceTabs: PerformanceTab[] = [
    {
      id: 'overview',
      label: 'OVERVIEW',
      description: 'Real-time system metrics and health status'
    },
    {
      id: 'fractal',
      label: 'FRACTAL ENGINE',
      description: 'Interactive mathematical computation showcase'
    },
    {
      id: 'benchmarks',
      label: 'BENCHMARKS',
      description: 'Comprehensive performance testing and comparison'
    },
    {
      id: 'analytics',
      label: 'ANALYTICS',
      description: 'Historical performance analysis and trends'
    }
  ];

  let performanceSubscription: (() => void) | null = null;
  let alertSubscription: (() => void) | null = null;
  let metricsInterval: number | null = null;

  onMount(() => {
    // I'm setting up entrance animation
    setTimeout(() => setIsVisible(true), 100);

    // I'm initializing real-time performance monitoring
    initializePerformanceMonitoring();
    
    // I'm fetching initial data
    loadInitialData();
  });

  onCleanup(() => {
    // I'm cleaning up subscriptions and intervals
    if (performanceSubscription) performanceSubscription();
    if (alertSubscription) alertSubscription();
    if (metricsInterval) clearInterval(metricsInterval);
  });

  const initializePerformanceMonitoring = () => {
    // I'm subscribing to real-time performance updates
    performanceSubscription = performanceService.subscribe('metrics', (metrics: SystemMetrics) => {
      setSystemMetrics(metrics);
      updateHistoricalData(metrics);
    });

    // I'm subscribing to alert notifications
    alertSubscription = performanceService.subscribe('alert', (alert: Alert) => {
      setAlerts(prev => [...prev, alert]);
    });

    // I'm setting up periodic metrics fetching as fallback
    metricsInterval = setInterval(async () => {
      try {
        const snapshot = await performanceService.getCurrentMetrics();
        setSystemMetrics(snapshot.system);
        updateHistoricalData(snapshot.system);
      } catch (error) {
        console.warn('Failed to fetch metrics:', error);
      }
    }, 5000);
  };

  const updateHistoricalData = (metrics: SystemMetrics) => {
    const timestamp = new Date().toISOString();

    // I'm maintaining historical data for charts
    setCpuHistory(prev => {
      const updated = [...prev, { timestamp, value: metrics.cpu_usage_percent || 0 }];
      return updated.slice(-50); // Keep last 50 points
    });

    setMemoryHistory(prev => {
      const updated = [...prev, { timestamp, value: metrics.memory_usage_percent || 0 }];
      return updated.slice(-50); // Keep last 50 points
    });
  };

  const loadInitialData = async () => {
    try {
      // I'm loading system information and initial metrics
      const [snapshot, systemInfo] = await Promise.all([
        performanceService.getCurrentMetrics(),
        performanceService.getSystemInfo(),
      ]);

      setSystemMetrics(snapshot.system);
      
      // I'm initializing historical data
      const now = new Date().toISOString();
      setCpuHistory([{ timestamp: now, value: snapshot.system.cpu_usage_percent || 0 }]);
      setMemoryHistory([{ timestamp: now, value: snapshot.system.memory_usage_percent || 0 }]);

    } catch (error) {
      console.error('Failed to load initial performance data:', error);
    }
  };

  const runBenchmark = async () => {
    setIsRunningBenchmark(true);
    try {
      const results = await performanceService.runBenchmark();
      setBenchmarkResults(results);
    } catch (error) {
      console.error('Benchmark failed:', error);
    } finally {
      setIsRunningBenchmark(false);
    }
  };

  const handleFractalPerformanceUpdate = (metrics: any) => {
    setFractalMetrics(metrics);
  };

  const getPerformanceRating = (value: number, thresholds: { excellent: number; good: number; fair: number }) => {
    if (value <= thresholds.excellent) return { rating: 'EXCELLENT', color: 'text-green-400' };
    if (value <= thresholds.good) return { rating: 'GOOD', color: 'text-blue-400' };
    if (value <= thresholds.fair) return { rating: 'FAIR', color: 'text-yellow-400' };
    return { rating: 'NEEDS ATTENTION', color: 'text-red-400' };
  };

  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  return (
    <div class="min-h-screen bg-black text-neutral-100">
      {/* Atmospheric background */}
      <div class="absolute inset-0 opacity-5">
        <div class="absolute top-1/4 left-1/3 w-96 h-96 bg-cyan-900/10 rounded-full blur-3xl animate-pulse" style="animation-duration: 8s"></div>
        <div class="absolute bottom-1/3 right-1/4 w-64 h-64 bg-purple-900/10 rounded-full blur-3xl animate-pulse" style="animation-duration: 12s; animation-delay: 4s"></div>
      </div>

      <div class={`relative z-10 transition-all duration-1000 ${isVisible() ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        {/* Header Section */}
        <section class="container mx-auto px-6 pt-24 pb-8">
          <div class="max-w-6xl mx-auto text-center mb-8">
            <h1 class="text-5xl md:text-7xl font-thin tracking-wider mb-6 text-neutral-100">
              PERFORMANCE
            </h1>
            <p class="text-lg text-neutral-400 max-w-3xl mx-auto leading-relaxed">
              Real-time computational analysis. Where mathematics meets machine precision,
              and every calculation becomes a meditation on the nature of computational efficiency.
            </p>
          </div>

          {/* System Status Overview */}
          <Show when={systemMetrics()}>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div class="bg-neutral-900/30 border border-neutral-800 rounded-sm p-4 text-center">
                <div class="text-2xl font-mono text-neutral-100 mb-1">
                  {systemMetrics()?.cpu_usage_percent?.toFixed(1) || '0.0'}%
                </div>
                <div class="text-xs text-neutral-500 tracking-wide">CPU USAGE</div>
                <div class={`text-xs mt-1 ${getPerformanceRating(systemMetrics()?.cpu_usage_percent || 0, { excellent: 50, good: 70, fair: 85 }).color}`}>
                  {getPerformanceRating(systemMetrics()?.cpu_usage_percent || 0, { excellent: 50, good: 70, fair: 85 }).rating}
                </div>
              </div>

              <div class="bg-neutral-900/30 border border-neutral-800 rounded-sm p-4 text-center">
                <div class="text-2xl font-mono text-neutral-100 mb-1">
                  {systemMetrics()?.memory_usage_percent?.toFixed(1) || '0.0'}%
                </div>
                <div class="text-xs text-neutral-500 tracking-wide">MEMORY</div>
                <div class={`text-xs mt-1 ${getPerformanceRating(systemMetrics()?.memory_usage_percent || 0, { excellent: 60, good: 75, fair: 85 }).color}`}>
                  {getPerformanceRating(systemMetrics()?.memory_usage_percent || 0, { excellent: 60, good: 75, fair: 85 }).rating}
                </div>
              </div>

              <div class="bg-neutral-900/30 border border-neutral-800 rounded-sm p-4 text-center">
                <div class="text-2xl font-mono text-neutral-100 mb-1">
                  {systemMetrics()?.load_average_1m?.toFixed(2) || '0.00'}
                </div>
                <div class="text-xs text-neutral-500 tracking-wide">LOAD AVG</div>
                <div class="text-xs text-neutral-400 mt-1">
                  {systemMetrics()?.cpu_cores || '0'} CORES
                </div>
              </div>

              <div class="bg-neutral-900/30 border border-neutral-800 rounded-sm p-4 text-center">
                <div class="text-2xl font-mono text-neutral-100 mb-1">
                  {systemMetrics()?.uptime_seconds ? formatUptime(systemMetrics()!.uptime_seconds) : '0m'}
                </div>
                <div class="text-xs text-neutral-500 tracking-wide">UPTIME</div>
                <div class="text-xs text-green-400 mt-1">STABLE</div>
              </div>
            </div>
          </Show>

          {/* Active Alerts */}
          <Show when={alerts().length > 0}>
            <div class="mb-8">
              <div class="bg-red-900/20 border border-red-800 rounded-lg p-4">
                <div class="text-red-400 font-mono text-sm mb-3">ACTIVE ALERTS ({alerts().length})</div>
                <div class="space-y-2">
                  <For each={alerts().slice(0, 3)}>
                    {(alert) => (
                      <div class="flex items-center justify-between text-sm">
                        <span class="text-neutral-300">{alert.message}</span>
                        <span class={`text-xs px-2 py-1 rounded-sm ${
                          alert.severity === 'critical' ? 'bg-red-900 text-red-300' :
                          alert.severity === 'high' ? 'bg-orange-900 text-orange-300' :
                          alert.severity === 'medium' ? 'bg-yellow-900 text-yellow-300' :
                          'bg-blue-900 text-blue-300'
                        }`}>
                          {alert.severity.toUpperCase()}
                        </span>
                      </div>
                    )}
                  </For>
                </div>
              </div>
            </div>
          </Show>
        </section>

        {/* Performance Tabs */}
        <section class="container mx-auto px-6 mb-8">
          <div class="bg-neutral-900/20 border border-neutral-800 rounded-lg">
            <div class="flex flex-wrap border-b border-neutral-800">
              <For each={performanceTabs}>
                {(tab) => (
                  <button
                    onClick={() => setActiveTab(tab.id)}
                    class={`px-6 py-4 text-sm font-mono tracking-wide transition-colors duration-200 border-b-2 ${
                      activeTab() === tab.id
                        ? 'border-neutral-300 text-neutral-100 bg-neutral-800/30'
                        : 'border-transparent text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/10'
                    }`}
                  >
                    <div>{tab.label}</div>
                    <div class="text-xs text-neutral-600 mt-1 font-normal">{tab.description}</div>
                  </button>
                )}
              </For>
            </div>

            <div class="p-6">
              {/* Overview Tab */}
              <Show when={activeTab() === 'overview'}>
                <div class="space-y-8">
                  {/* Web Vitals Section */}
                  <div class="bg-neutral-900/30 border border-neutral-800 rounded-lg p-6">
                    <h3 class="text-lg font-mono text-neutral-300 mb-6">FRONTEND PERFORMANCE METRICS</h3>
                    <WebVitals />
                  </div>

                  {/* Rust Backend Metrics Section */}
                  <div class="bg-neutral-900/30 border border-neutral-800 rounded-lg p-6">
                    <h3 class="text-lg font-mono text-neutral-300 mb-6">RUST BACKEND METRICS</h3>
                    <RustMetrics />
                  </div>

                  {/* Real-time Charts */}
                  <div class="grid md:grid-cols-2 gap-6">
                    <div class="bg-neutral-900/30 border border-neutral-800 rounded-lg p-6">
                      <h3 class="text-lg font-mono text-neutral-300 mb-4">CPU USAGE HISTORY</h3>
                      <div class="h-48 relative">
                        <Show when={cpuHistory().length > 1}>
                          <svg class="w-full h-full">
                            <polyline
                              fill="none"
                              stroke="#22d3ee"
                              stroke-width="2"
                              points={cpuHistory().map((point, index) => {
                                const x = (index / (cpuHistory().length - 1)) * 100;
                                const y = 100 - point.value;
                                return `${x},${y}`;
                              }).join(' ')}
                            />
                          </svg>
                        </Show>
                        <div class="absolute inset-0 flex items-center justify-center text-neutral-600">
                          <Show when={cpuHistory().length <= 1}>
                            Collecting data...
                          </Show>
                        </div>
                      </div>
                    </div>

                    <div class="bg-neutral-900/30 border border-neutral-800 rounded-lg p-6">
                      <h3 class="text-lg font-mono text-neutral-300 mb-4">MEMORY USAGE HISTORY</h3>
                      <div class="h-48 relative">
                        <Show when={memoryHistory().length > 1}>
                          <svg class="w-full h-full">
                            <polyline
                              fill="none"
                              stroke="#a855f7"
                              stroke-width="2"
                              points={memoryHistory().map((point, index) => {
                                const x = (index / (memoryHistory().length - 1)) * 100;
                                const y = 100 - point.value;
                                return `${x},${y}`;
                              }).join(' ')}
                            />
                          </svg>
                        </Show>
                        <div class="absolute inset-0 flex items-center justify-center text-neutral-600">
                          <Show when={memoryHistory().length <= 1}>
                            Collecting data...
                          </Show>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* System Information */}
                  <Show when={systemMetrics()}>
                    <div class="bg-neutral-900/30 border border-neutral-800 rounded-lg p-6">
                      <h3 class="text-lg font-mono text-neutral-300 mb-4">SYSTEM CONFIGURATION</h3>
                      <div class="grid md:grid-cols-3 gap-6 text-sm">
                        <div>
                          <div class="text-neutral-500 mb-2">PROCESSOR</div>
                          <div class="text-neutral-300 font-mono">{systemMetrics()!.cpu_model}</div>
                          <div class="text-neutral-500 text-xs mt-1">
                            {systemMetrics()!.cpu_cores} cores, {systemMetrics()!.cpu_threads} threads
                          </div>
                        </div>
                        <div>
                          <div class="text-neutral-500 mb-2">MEMORY</div>
                          <div class="text-neutral-300 font-mono">{systemMetrics()?.memory_total_gb?.toFixed(1) || '0.0'} GB</div>
                          <div class="text-neutral-500 text-xs mt-1">
                            {systemMetrics()?.memory_available_gb?.toFixed(1) || '0.0'} GB available
                          </div>
                        </div>
                        <div>
                          <div class="text-neutral-500 mb-2">PROCESSES</div>
                          <div class="text-neutral-300 font-mono">{systemMetrics()!.active_processes}</div>
                          <div class="text-neutral-500 text-xs mt-1">
                            Active system processes
                          </div>
                        </div>
                      </div>
                    </div>
                  </Show>
                </div>
              </Show>

              {/* Fractal Engine Tab */}
              <Show when={activeTab() === 'fractal'}>
                <div class="space-y-8">
                  <div class="text-center mb-8">
                    <h3 class="text-2xl font-thin text-neutral-200 mb-4">
                      MATHEMATICAL COMPUTATION ENGINE
                    </h3>
                    <p class="text-neutral-500 max-w-2xl mx-auto">
                      Real-time fractal generation showcasing parallel processing capabilities.
                      Each pixel calculated in parallel, demonstrating computational efficiency.
                    </p>
                  </div>

                  <div class="max-w-4xl mx-auto">
                    <FractalCanvas
                      width={800}
                      height={500}
                      onPerformanceUpdate={handleFractalPerformanceUpdate}
                    />
                  </div>

                  <Show when={fractalMetrics()}>
                    <div class="bg-neutral-900/30 border border-neutral-800 rounded-lg p-6">
                      <h4 class="text-lg font-mono text-neutral-300 mb-4">COMPUTATION METRICS</h4>
                      <div class="grid md:grid-cols-4 gap-6 text-sm">
                        <div class="text-center">
                          <div class="text-2xl font-mono text-green-400 mb-1">
                            {fractalMetrics().computationTime}ms
                          </div>
                          <div class="text-neutral-500">Backend Processing</div>
                        </div>
                        <div class="text-center">
                          <div class="text-2xl font-mono text-cyan-400 mb-1">
                            {Math.round(fractalMetrics().pixelsPerSecond).toLocaleString()}
                          </div>
                          <div class="text-neutral-500">Pixels/Second</div>
                        </div>
                        <div class="text-center">
                          <div class="text-2xl font-mono text-purple-400 mb-1">
                            {fractalMetrics().zoomLevel.toExponential(2)}
                          </div>
                          <div class="text-neutral-500">Zoom Level</div>
                        </div>
                        <div class="text-center">
                          <div class="text-2xl font-mono text-yellow-400 mb-1">
                            {Math.round(fractalMetrics().totalTime)}ms
                          </div>
                          <div class="text-neutral-500">Total Time</div>
                        </div>
                      </div>
                    </div>
                  </Show>
                </div>
              </Show>

              {/* Benchmarks Tab */}
              <Show when={activeTab() === 'benchmarks'}>
                <div class="space-y-8">
                  <div class="text-center mb-8">
                    <h3 class="text-2xl font-thin text-neutral-200 mb-4">
                      PERFORMANCE BENCHMARKS
                    </h3>
                    <p class="text-neutral-500 max-w-2xl mx-auto mb-6">
                      Comprehensive performance testing across CPU, memory, and mathematical computation.
                      Results demonstrate system capabilities under various workloads.
                    </p>
                    
                    <button
                      onClick={runBenchmark}
                      disabled={isRunningBenchmark()}
                      class={`px-8 py-3 rounded-sm font-mono text-sm tracking-wide transition-all duration-300 ${
                        isRunningBenchmark()
                          ? 'bg-neutral-700 text-neutral-500 cursor-not-allowed'
                          : 'bg-neutral-100 text-black hover:bg-neutral-200'
                      }`}
                    >
                      {isRunningBenchmark() ? 'RUNNING BENCHMARK...' : 'RUN COMPREHENSIVE BENCHMARK'}
                    </button>
                  </div>

                  <Show when={isRunningBenchmark()}>
                    <div class="text-center py-12">
                      <div class="w-16 h-16 border-2 border-neutral-600 border-t-neutral-300 rounded-full animate-spin mx-auto mb-4"></div>
                      <div class="text-neutral-400 font-mono text-sm">
                        Executing performance tests...
                      </div>
                      <div class="text-neutral-600 text-xs mt-2">
                        This may take up to 2 minutes
                      </div>
                    </div>
                  </Show>

                  <Show when={benchmarkResults()}>
                    <div class="bg-neutral-900/30 border border-neutral-800 rounded-lg p-6">
                      <h4 class="text-lg font-mono text-neutral-300 mb-6">BENCHMARK RESULTS</h4>
                      
                      <div class="grid md:grid-cols-2 gap-6 mb-6">
                        <div>
                          <div class="text-neutral-400 text-sm mb-3">CPU PERFORMANCE</div>
                          <div class="space-y-2 text-sm">
                            <div class="flex justify-between">
                              <span class="text-neutral-500">Single Thread:</span>
                              <span class="text-neutral-300 font-mono">
                                {benchmarkResults()!.benchmarks.cpu.single_thread?.duration_ms}ms
                              </span>
                            </div>
                            <div class="flex justify-between">
                              <span class="text-neutral-500">Multi Thread:</span>
                              <span class="text-neutral-300 font-mono">
                                {benchmarkResults()!.benchmarks.cpu.multi_thread?.duration_ms}ms
                              </span>
                            </div>
                            <div class="flex justify-between">
                              <span class="text-neutral-500">Efficiency:</span>
                              <span class="text-green-400 font-mono">
                                {benchmarkResults()?.benchmarks?.cpu?.parallel_efficiency ? (benchmarkResults()!.benchmarks.cpu.parallel_efficiency * 100).toFixed(1) : '0.0'}%
                              </span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <div class="text-neutral-400 text-sm mb-3">MEMORY PERFORMANCE</div>
                          <div class="space-y-2 text-sm">
                            <div class="flex justify-between">
                              <span class="text-neutral-500">Read Speed:</span>
                              <span class="text-neutral-300 font-mono">
                                {benchmarkResults()?.benchmarks?.memory?.sequential_read?.mb_per_second?.toFixed(0) || '0'} MB/s
                              </span>
                            </div>
                            <div class="flex justify-between">
                              <span class="text-neutral-500">Write Speed:</span>
                              <span class="text-neutral-300 font-mono">
                                {benchmarkResults()?.benchmarks?.memory?.sequential_write?.mb_per_second?.toFixed(0) || '0'} MB/s
                              </span>
                            </div>
                            <div class="flex justify-between">
                              <span class="text-neutral-500">Allocation:</span>
                              <span class="text-cyan-400 font-mono">
                                {benchmarkResults()?.benchmarks?.memory?.allocation?.mb_per_second?.toFixed(0) || '0'} MB/s
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div class="text-center p-4 bg-neutral-800/30 rounded-sm">
                        <div class="text-neutral-400 text-sm mb-2">OVERALL PERFORMANCE RATING</div>
                        <div class="text-2xl font-mono text-green-400">
                          {benchmarkResults()!.performance_rating}
                        </div>
                      </div>
                    </div>
                  </Show>
                </div>
              </Show>

              {/* Analytics Tab */}
              <Show when={activeTab() === 'analytics'}>
                <div class="space-y-8">
                  <div class="text-center mb-8">
                    <h3 class="text-2xl font-thin text-neutral-200 mb-4">
                      PERFORMANCE ANALYTICS
                    </h3>
                    <p class="text-neutral-500 max-w-2xl mx-auto">
                      Historical performance analysis and trend identification.
                      Data-driven insights into system behavior and optimization opportunities.
                    </p>
                  </div>

                  <div class="bg-neutral-900/30 border border-neutral-800 rounded-lg p-6">
                    <div class="text-center text-neutral-500 py-12">
                      <div class="text-6xl mb-4">📊</div>
                      <div class="text-lg mb-2">Advanced Analytics</div>
                      <div class="text-sm">
                        Historical data analysis and trend visualization will be available
                        as the system continues to collect performance metrics.
                      </div>
                    </div>
                  </div>
                </div>
              </Show>
            </div>
          </div>
        </section>

        {/* Footer Message */}
        <section class="container mx-auto px-6 py-12 text-center">
          <blockquote class="text-xl md:text-2xl font-thin text-neutral-400 leading-relaxed italic max-w-3xl mx-auto">
            "Performance is not just about speed—it's about the elegant dance between
            precision and efficiency, where every millisecond matters and every optimization
            reveals deeper truths about the nature of computation itself."
          </blockquote>
        </section>
      </div>
    </div>
  );
}
