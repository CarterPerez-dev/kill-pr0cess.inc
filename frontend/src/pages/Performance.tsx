/*
 * Performance demonstration page showcasing real-time metrics, fractal computation, and system benchmarks with live updates and interactive controls.
 * I'm integrating all performance monitoring components, fractal rendering, and benchmark execution into a comprehensive showcase that demonstrates the system's computational capabilities.
 */

import {
  type Component,
  createSignal,
  createEffect,
  onMount,
  onCleanup,
  Show,
  For,
} from 'solid-js';
import { FractalCanvas } from '../components/Fractals/FractalCanvas';
import { WebVitals } from '../components/Performance/WebVitals';
import { RustMetrics } from '../components/Performance/RustMetrics';
import {
  performanceService,
  type SystemMetrics,
  type Alert,
} from '../services/performance';
import { fractalService, type BenchmarkResult } from '../services/fractals';

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
  const [systemMetrics, setSystemMetrics] =
    createSignal<SystemMetrics | null>(null);
  const [hardwareInfo, setHardwareInfo] = createSignal<{
    cpu_cores: number;
    cpu_threads: number;
    cpu_model: string;
  } | null>(null);
  const [benchmarkResults, setBenchmarkResults] =
    createSignal<BenchmarkResult | null>(null);
  const [alerts, setAlerts] = createSignal<Alert[]>([]);
  const [isRunningBenchmark, setIsRunningBenchmark] = createSignal(false);
  const [cpuHistory, setCpuHistory] = createSignal<ChartDataPoint[]>([]);
  const [memoryHistory, setMemoryHistory] = createSignal<ChartDataPoint[]>(
    [],
  );
  const [fractalMetrics, setFractalMetrics] = createSignal<any>(null);

  // I'm defining the performance tabs for organized content presentation
  const performanceTabs: PerformanceTab[] = [
    {
      id: 'overview',
      label: 'OVERVIEW',
      description: 'Real-time system metrics and health status',
    },
    {
      id: 'fractal',
      label: 'FRACTAL ENGINE',
      description: 'Interactive mathematical computation showcase',
    },
    {
      id: 'benchmarks',
      label: 'BENCHMARKS',
      description: 'Comprehensive performance testing and comparison',
    },
    {
      id: 'analytics',
      label: 'ANALYTICS',
      description: 'Historical performance analysis and trends',
    },
  ];

  let performanceSubscription: (() => void) | null = null;
  let alertSubscription: (() => void) | null = null;
  let metricsInterval: number | null = null;

  onMount(() => {
    // I'm setting up entrance animation
    setTimeout(() => setIsVisible(true), 20);

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
    performanceSubscription = performanceService.subscribe(
      'metrics',
      (metrics: SystemMetrics) => {
        setSystemMetrics(metrics);
        updateHistoricalData(metrics);
      },
    );

    // I'm subscribing to alert notifications
    alertSubscription = performanceService.subscribe(
      'alert',
      (alert: Alert) => {
        setAlerts((prev) => [...prev, alert]);
      },
    );

    metricsInterval = setInterval(async () => {
      try {
        const snapshot = await performanceService.getCurrentMetrics();
        const hw = hardwareInfo() || {
          cpu_cores: snapshot.hardware?.cpu_cores || 0,
          cpu_threads: snapshot.hardware?.cpu_threads || 0,
          cpu_model: snapshot.hardware?.cpu_model || 'Unknown',
        };
        const mergedMetrics = { ...snapshot.system, ...hw };
        setSystemMetrics(mergedMetrics as SystemMetrics);
        updateHistoricalData(snapshot.system);
      } catch (error) {
        console.warn('Failed to fetch metrics:', error);
      }
    }, 5000);
  };

  const updateHistoricalData = (metrics: SystemMetrics) => {
    const timestamp = new Date().toISOString();

    // I'm maintaining historical data for charts
    setCpuHistory((prev) => {
      const updated = [
        ...prev,
        { timestamp, value: metrics.cpu_usage_percent || 0 },
      ];
      return updated.slice(-50); // Keep last 50 points
    });

    setMemoryHistory((prev) => {
      const updated = [
        ...prev,
        { timestamp, value: metrics.memory_usage_percent || 0 },
      ];
      return updated.slice(-50); // Keep last 50 points
    });
  };

  const loadInitialData = async () => {
    try {
      const [snapshot, systemInfo] = await Promise.all([
        performanceService.getCurrentMetrics(),
        performanceService.getSystemInfo(),
      ]);

      const hw = {
        cpu_cores: snapshot.hardware?.cpu_cores || 0,
        cpu_threads: snapshot.hardware?.cpu_threads || 0,
        cpu_model: snapshot.hardware?.cpu_model || 'Unknown',
      };
      setHardwareInfo(hw);

      const mergedMetrics = {
        ...snapshot.system,
        ...hw,
      };
      setSystemMetrics(mergedMetrics as SystemMetrics);

      const now = new Date().toISOString();
      setCpuHistory([
        { timestamp: now, value: snapshot.system.cpu_usage_percent || 0 },
      ]);
      setMemoryHistory([
        { timestamp: now, value: snapshot.system.memory_usage_percent || 0 },
      ]);
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

  const getPerformanceRating = (
    value: number,
    thresholds: { excellent: number; good: number; fair: number },
  ) => {
    if (value <= thresholds.excellent)
      return { rating: 'excellent', color: 'text-green-400' };
    if (value <= thresholds.good)
      return { rating: 'good', color: 'text-blue-400' };
    if (value <= thresholds.fair)
      return { rating: 'fair', color: 'text-[#C15F3C]' };
    return { rating: 'attention', color: 'text-[hsl(0,0%,53.7%)]' };
  };

  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const formatDuration = (ms: number | undefined, us?: number): string => {
    if (ms === undefined && us === undefined) return '0ms';
    if (us !== undefined && us > 0 && (ms === undefined || ms < 1)) {
      if (us < 1000) return `${us}µs`;
      return `${(us / 1000).toFixed(2)}ms`;
    }
    if (ms !== undefined) {
      if (ms < 0.01) return '<0.01ms';
      if (ms < 1) return `${(ms * 1000).toFixed(0)}µs`;
      if (ms < 10) return `${ms.toFixed(2)}ms`;
      return `${Math.round(ms)}ms`;
    }
    return '0ms';
  };

  return (
    <div class="min-h-screen pt-14">
      <div
        class={`transition-all duration-200 ${isVisible() ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
      >
        <section
          class="py-16"
          style={{
            'background-color': 'hsl(0, 0%, 7.1%)',
            'background-image':
              'radial-gradient(circle, hsl(0, 0%, 11%) 1px, transparent 1px)',
            'background-size': '22px 22px',
          }}
        >
          <div class="container-custom text-center mb-10">
            <div class="inline-block mb-6">
              <span class="px-2.5 py-1 bg-[hsl(0,0%,12.2%)] border border-[hsl(0,0%,18%)] rounded text-xs font-mono text-[hsl(0,0%,53.7%)]">
                Real-time Metrics
              </span>
            </div>
            <h1 class="text-2xl md:text-3xl font-semibold text-[hsl(0,0%,98%)] mb-4">
              Performance
            </h1>
            <p class="text-sm text-[hsl(0,0%,70.6%)] max-w-xl mx-auto leading-relaxed">
              Live system monitoring, benchmarks, and computational analysis
              powered by Rust.
            </p>
          </div>

          {/* System Status Overview */}
          <Show when={systemMetrics()}>
            <div class="container-custom">
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div class="bg-[hsl(0,0%,12.2%)] border border-[hsl(0,0%,18%)] rounded-md p-4 text-center">
                  <div class="text-lg font-mono font-semibold text-[hsl(0,0%,98%)] mb-1">
                    {systemMetrics()?.cpu_usage_percent?.toFixed(1) || '0.0'}
                    %
                  </div>
                  <div class="text-xs text-[hsl(0,0%,53.7%)]">CPU Usage</div>
                  <div
                    class={`text-xs mt-1 ${getPerformanceRating(systemMetrics()?.cpu_usage_percent || 0, { excellent: 50, good: 70, fair: 85 }).color}`}
                  >
                    {
                      getPerformanceRating(
                        systemMetrics()?.cpu_usage_percent || 0,
                        { excellent: 50, good: 70, fair: 85 },
                      ).rating
                    }
                  </div>
                </div>

                <div class="bg-[hsl(0,0%,12.2%)] border border-[hsl(0,0%,18%)] rounded-md p-4 text-center">
                  <div class="text-lg font-mono font-semibold text-[hsl(0,0%,98%)] mb-1">
                    {systemMetrics()?.memory_usage_percent?.toFixed(1) ||
                      '0.0'}
                    %
                  </div>
                  <div class="text-xs text-[hsl(0,0%,53.7%)]">Memory</div>
                  <div
                    class={`text-xs mt-1 ${getPerformanceRating(systemMetrics()?.memory_usage_percent || 0, { excellent: 60, good: 75, fair: 85 }).color}`}
                  >
                    {
                      getPerformanceRating(
                        systemMetrics()?.memory_usage_percent || 0,
                        { excellent: 60, good: 75, fair: 85 },
                      ).rating
                    }
                  </div>
                </div>

                <div class="bg-[hsl(0,0%,12.2%)] border border-[hsl(0,0%,18%)] rounded-md p-4 text-center">
                  <div class="text-lg font-mono font-semibold text-[hsl(0,0%,98%)] mb-1">
                    {systemMetrics()?.load_average_1m?.toFixed(2) || '0.00'}
                  </div>
                  <div class="text-xs text-[hsl(0,0%,53.7%)]">Load Avg</div>
                  <div class="text-xs text-[hsl(0,0%,30.2%)] mt-1">
                    {systemMetrics()?.cpu_cores || '-'} cores
                  </div>
                </div>

                <div class="bg-[hsl(0,0%,12.2%)] border border-[hsl(0,0%,18%)] rounded-md p-4 text-center">
                  <div class="text-lg font-mono font-semibold text-[hsl(0,0%,98%)] mb-1">
                    {systemMetrics()?.uptime_seconds
                      ? formatUptime(systemMetrics()!.uptime_seconds)
                      : '0m'}
                  </div>
                  <div class="text-xs text-[hsl(0,0%,53.7%)]">Uptime</div>
                  <div class="text-xs text-green-400 mt-1">stable</div>
                </div>
              </div>
            </div>
          </Show>

          {/* Active Alerts */}
          <Show when={alerts().length > 0}>
            <div class="container-custom mt-6">
              <div class="bg-[hsl(0,0%,12.2%)] border border-[hsl(0,0%,18%)] rounded-md p-4">
                <div class="text-[#C15F3C] font-mono text-xs mb-3">
                  Alerts ({alerts().length})
                </div>
                <div class="space-y-2">
                  <For each={alerts().slice(0, 3)}>
                    {(alert) => (
                      <div class="flex items-center justify-between text-xs">
                        <span class="text-[hsl(0,0%,70.6%)]">
                          {alert.message}
                        </span>
                        <span class="px-1.5 py-0.5 bg-[hsl(0,0%,14.1%)] border border-[hsl(0,0%,18%)] rounded font-mono text-[hsl(0,0%,53.7%)]">
                          {alert.severity}
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
        <section
          class="border-t border-[hsl(0,0%,18%)]"
          style={{
            'background-color': 'hsl(0, 0%, 9%)',
            'background-image':
              'radial-gradient(circle, hsl(0, 0%, 12.2%) 1px, transparent 1px)',
            'background-size': '20px 20px',
          }}
        >
          <div class="container-custom py-6">
            <div class="bg-[hsl(0,0%,12.2%)] border border-[hsl(0,0%,18%)] rounded-md overflow-hidden">
              <div class="flex flex-wrap justify-center border-b border-[hsl(0,0%,18%)]">
                <For each={performanceTabs}>
                  {(tab) => (
                    <button
                      onClick={() => setActiveTab(tab.id)}
                      class={`px-4 py-3 text-xs font-mono transition-colors duration-100 border-b-2 ${
                        activeTab() === tab.id
                          ? 'border-[#C15F3C] text-[hsl(0,0%,98%)] bg-[hsl(0,0%,14.1%)]'
                          : 'border-transparent text-[hsl(0,0%,53.7%)] hover:text-[hsl(0,0%,98%)] hover:bg-[hsl(0,0%,14.1%)]'
                      }`}
                    >
                      <div>{tab.label}</div>
                      <div class="text-xs text-[hsl(0,0%,30.2%)] mt-0.5 font-normal hidden md:block">
                        {tab.description}
                      </div>
                    </button>
                  )}
                </For>
              </div>

              <div class="p-4">
                {/* Overview Tab */}
                <Show when={activeTab() === 'overview'}>
                  <div class="space-y-4">
                    {/* Web Vitals Section */}
                    <div class="bg-[hsl(0,0%,7.1%)] border border-[hsl(0,0%,18%)] rounded-md p-4">
                      <h3 class="text-sm font-medium text-[hsl(0,0%,98%)] mb-4">
                        Frontend Metrics
                      </h3>
                      <WebVitals />
                    </div>

                    {/* Rust Backend Metrics Section */}
                    <div class="bg-[hsl(0,0%,7.1%)] border border-[hsl(0,0%,18%)] rounded-md p-4">
                      <h3 class="text-sm font-medium text-[hsl(0,0%,98%)] mb-4">
                        Backend Metrics
                      </h3>
                      <RustMetrics />
                    </div>

                    {/* Real-time Charts */}
                    <div class="grid md:grid-cols-2 gap-4">
                      <div class="bg-[hsl(0,0%,7.1%)] border border-[hsl(0,0%,18%)] rounded-md p-4">
                        <h3 class="text-sm font-medium text-[hsl(0,0%,98%)] mb-3">
                          CPU History
                        </h3>
                        <div class="h-32 relative">
                          <Show when={cpuHistory().length > 1}>
                            <svg
                              class="w-full h-full"
                              viewBox="0 0 100 100"
                              preserveAspectRatio="none"
                            >
                              <polyline
                                fill="none"
                                stroke="#C15F3C"
                                stroke-width="1.5"
                                vector-effect="non-scaling-stroke"
                                points={cpuHistory()
                                  .map((point, index) => {
                                    const x =
                                      (index / (cpuHistory().length - 1)) *
                                      100;
                                    const y = 100 - point.value;
                                    return `${x},${y}`;
                                  })
                                  .join(' ')}
                              />
                            </svg>
                          </Show>
                          <div class="absolute inset-0 flex items-center justify-center text-[hsl(0,0%,30.2%)] text-xs">
                            <Show when={cpuHistory().length <= 1}>
                              Collecting...
                            </Show>
                          </div>
                        </div>
                      </div>

                      <div class="bg-[hsl(0,0%,7.1%)] border border-[hsl(0,0%,18%)] rounded-md p-4">
                        <h3 class="text-sm font-medium text-[hsl(0,0%,98%)] mb-3">
                          Memory History
                        </h3>
                        <div class="h-32 relative">
                          <Show when={memoryHistory().length > 1}>
                            <svg
                              class="w-full h-full"
                              viewBox="0 0 100 100"
                              preserveAspectRatio="none"
                            >
                              <polyline
                                fill="none"
                                stroke="#C15F3C"
                                stroke-width="1.5"
                                vector-effect="non-scaling-stroke"
                                points={memoryHistory()
                                  .map((point, index) => {
                                    const x =
                                      (index /
                                        (memoryHistory().length - 1)) *
                                      100;
                                    const y = 100 - point.value;
                                    return `${x},${y}`;
                                  })
                                  .join(' ')}
                              />
                            </svg>
                          </Show>
                          <div class="absolute inset-0 flex items-center justify-center text-[hsl(0,0%,30.2%)] text-xs">
                            <Show when={memoryHistory().length <= 1}>
                              Collecting...
                            </Show>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* System Information */}
                    <Show when={systemMetrics()}>
                      <div class="bg-[hsl(0,0%,7.1%)] border border-[hsl(0,0%,18%)] rounded-md p-4">
                        <h3 class="text-sm font-medium text-[hsl(0,0%,98%)] mb-3">
                          System Info
                        </h3>
                        <div class="grid md:grid-cols-3 gap-4 text-xs">
                          <div>
                            <div class="text-[hsl(0,0%,53.7%)] mb-1">
                              Processor
                            </div>
                            <div class="text-[hsl(0,0%,70.6%)] font-mono">
                              {systemMetrics()?.cpu_model || 'Unknown'}
                            </div>
                            <div class="text-[hsl(0,0%,30.2%)] mt-1">
                              {systemMetrics()?.cpu_cores || '-'} cores,{' '}
                              {systemMetrics()?.cpu_threads || '-'} threads
                            </div>
                          </div>
                          <div>
                            <div class="text-[hsl(0,0%,53.7%)] mb-1">
                              Memory
                            </div>
                            <div class="text-[hsl(0,0%,70.6%)] font-mono">
                              {systemMetrics()?.memory_total_gb?.toFixed(
                                1,
                              ) || '0.0'}{' '}
                              GB
                            </div>
                            <div class="text-[hsl(0,0%,30.2%)] mt-1">
                              {systemMetrics()?.memory_available_gb?.toFixed(
                                1,
                              ) || '0.0'}{' '}
                              GB available
                            </div>
                          </div>
                          <div>
                            <div class="text-[hsl(0,0%,53.7%)] mb-1">
                              Processes
                            </div>
                            <div class="text-[hsl(0,0%,70.6%)] font-mono">
                              {systemMetrics()!.active_processes}
                            </div>
                            <div class="text-[hsl(0,0%,30.2%)] mt-1">
                              Active processes
                            </div>
                          </div>
                        </div>
                      </div>
                    </Show>
                  </div>
                </Show>

                {/* Fractal Engine Tab */}
                <Show when={activeTab() === 'fractal'}>
                  <div class="space-y-4">
                    <div class="text-center mb-6">
                      <h3 class="text-sm font-medium text-[hsl(0,0%,98%)] mb-2">
                        Fractal Computation
                      </h3>
                      <p class="text-xs text-[hsl(0,0%,53.7%)] max-w-lg mx-auto">
                        Real-time fractal generation with parallel
                        processing.
                      </p>
                    </div>

                    <div class="max-w-3xl mx-auto">
                      <FractalCanvas
                        width={800}
                        height={500}
                        onPerformanceUpdate={handleFractalPerformanceUpdate}
                      />
                    </div>

                    <Show when={fractalMetrics()}>
                      <div class="bg-[hsl(0,0%,7.1%)] border border-[hsl(0,0%,18%)] rounded-md p-4">
                        <h4 class="text-sm font-medium text-[hsl(0,0%,98%)] mb-3">
                          Metrics
                        </h4>
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                          <div class="text-center">
                            <div class="text-lg font-mono text-[#C15F3C] mb-1">
                              {fractalMetrics().computationTime}ms
                            </div>
                            <div class="text-[hsl(0,0%,53.7%)]">Backend</div>
                          </div>
                          <div class="text-center">
                            <div class="text-lg font-mono text-[hsl(0,0%,70.6%)] mb-1">
                              {Math.round(
                                fractalMetrics().pixelsPerSecond,
                              ).toLocaleString()}
                            </div>
                            <div class="text-[hsl(0,0%,53.7%)]">
                              Pixels/sec
                            </div>
                          </div>
                          <div class="text-center">
                            <div class="text-lg font-mono text-[hsl(0,0%,70.6%)] mb-1">
                              {fractalMetrics().zoomLevel.toExponential(2)}
                            </div>
                            <div class="text-[hsl(0,0%,53.7%)]">Zoom</div>
                          </div>
                          <div class="text-center">
                            <div class="text-lg font-mono text-[hsl(0,0%,70.6%)] mb-1">
                              {Math.round(fractalMetrics().totalTime)}ms
                            </div>
                            <div class="text-[hsl(0,0%,53.7%)]">Total</div>
                          </div>
                        </div>
                      </div>
                    </Show>
                  </div>
                </Show>

                {/* Benchmarks Tab */}
                <Show when={activeTab() === 'benchmarks'}>
                  <div class="space-y-4">
                    <div class="text-center mb-6">
                      <h3 class="text-sm font-medium text-[hsl(0,0%,98%)] mb-2">
                        Benchmarks
                      </h3>
                      <p class="text-xs text-[hsl(0,0%,53.7%)] max-w-lg mx-auto mb-4">
                        CPU, memory, and computation performance testing.
                      </p>

                      <button
                        onClick={runBenchmark}
                        disabled={isRunningBenchmark()}
                        class={`btn ${isRunningBenchmark() ? 'btn-secondary opacity-50 cursor-not-allowed' : 'btn-primary'}`}
                      >
                        {isRunningBenchmark()
                          ? 'Running...'
                          : 'Run Benchmark'}
                      </button>
                    </div>

                    <Show when={isRunningBenchmark()}>
                      <div class="text-center py-10">
                        <div class="w-10 h-10 border-2 border-[hsl(0,0%,18%)] border-t-[#C15F3C] rounded-full animate-spin mx-auto mb-3"></div>
                        <div class="text-[hsl(0,0%,53.7%)] font-mono text-xs">
                          Running tests...
                        </div>
                      </div>
                    </Show>

                    <Show when={benchmarkResults()}>
                      <div class="bg-[hsl(0,0%,7.1%)] border border-[hsl(0,0%,18%)] rounded-md p-4">
                        <h4 class="text-sm font-medium text-[hsl(0,0%,98%)] mb-4">
                          Results
                        </h4>

                        <div class="grid md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <div class="text-xs text-[hsl(0,0%,53.7%)] mb-2">
                              CPU
                            </div>
                            <div class="space-y-1.5 text-xs">
                              <div class="flex justify-between">
                                <span class="text-[hsl(0,0%,30.2%)]">
                                  Single Thread
                                </span>
                                <span class="text-[hsl(0,0%,70.6%)] font-mono">
                                  {formatDuration(
                                    benchmarkResults()!.benchmarks.cpu
                                      .single_thread?.duration_ms,
                                    benchmarkResults()!.benchmarks.cpu
                                      .single_thread?.duration_us,
                                  )}
                                </span>
                              </div>
                              <div class="flex justify-between">
                                <span class="text-[hsl(0,0%,30.2%)]">
                                  Multi Thread
                                </span>
                                <span class="text-[hsl(0,0%,70.6%)] font-mono">
                                  {formatDuration(
                                    benchmarkResults()!.benchmarks.cpu
                                      .multi_thread?.duration_ms,
                                    benchmarkResults()!.benchmarks.cpu
                                      .multi_thread?.duration_us,
                                  )}
                                </span>
                              </div>
                              <div class="flex justify-between">
                                <span class="text-[hsl(0,0%,30.2%)]">
                                  Efficiency
                                </span>
                                <span class="text-[#C15F3C] font-mono">
                                  {benchmarkResults()?.benchmarks?.cpu
                                    ?.parallel_efficiency
                                    ? (
                                        benchmarkResults()!.benchmarks.cpu
                                          .parallel_efficiency * 100
                                      ).toFixed(1)
                                    : '0.0'}
                                  %
                                </span>
                              </div>
                            </div>
                          </div>

                          <div>
                            <div class="text-xs text-[hsl(0,0%,53.7%)] mb-2">
                              Memory
                            </div>
                            <div class="space-y-1.5 text-xs">
                              <div class="flex justify-between">
                                <span class="text-[hsl(0,0%,30.2%)]">
                                  Read
                                </span>
                                <span class="text-[hsl(0,0%,70.6%)] font-mono">
                                  {benchmarkResults()?.benchmarks?.memory?.sequential_read?.mb_per_second?.toFixed(
                                    0,
                                  ) || '0'}{' '}
                                  MB/s
                                </span>
                              </div>
                              <div class="flex justify-between">
                                <span class="text-[hsl(0,0%,30.2%)]">
                                  Write
                                </span>
                                <span class="text-[hsl(0,0%,70.6%)] font-mono">
                                  {benchmarkResults()?.benchmarks?.memory?.sequential_write?.mb_per_second?.toFixed(
                                    0,
                                  ) || '0'}{' '}
                                  MB/s
                                </span>
                              </div>
                              <div class="flex justify-between">
                                <span class="text-[hsl(0,0%,30.2%)]">
                                  Allocation
                                </span>
                                <span class="text-[hsl(0,0%,70.6%)] font-mono">
                                  {benchmarkResults()?.benchmarks?.memory?.allocation?.mb_per_second?.toFixed(
                                    0,
                                  ) || '0'}{' '}
                                  MB/s
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div class="text-center p-3 bg-[hsl(0,0%,5.9%)] border border-[hsl(0,0%,18%)] rounded">
                          <div class="text-xs text-[hsl(0,0%,53.7%)] mb-1">
                            Rating
                          </div>
                          <div class="text-lg font-mono text-[#C15F3C]">
                            {benchmarkResults()!.performance_rating}
                          </div>
                        </div>
                      </div>
                    </Show>
                  </div>
                </Show>

                {/* Analytics Tab */}
                <Show when={activeTab() === 'analytics'}>
                  <div class="space-y-4">
                    <div class="text-center mb-6">
                      <h3 class="text-sm font-medium text-[hsl(0,0%,98%)] mb-2">
                        Analytics
                      </h3>
                      <p class="text-xs text-[hsl(0,0%,53.7%)] max-w-lg mx-auto">
                        Historical data analysis and trend visualization.
                      </p>
                    </div>

                    <div class="bg-[hsl(0,0%,7.1%)] border border-[hsl(0,0%,18%)] rounded-md p-6">
                      <div class="text-center text-[hsl(0,0%,53.7%)] py-8">
                        <svg
                          class="w-12 h-12 mx-auto mb-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width={1}
                            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                          />
                        </svg>
                        <div class="text-sm mb-1">Analytics Coming Soon</div>
                        <div class="text-xs text-[hsl(0,0%,30.2%)]">
                          Historical data collection in progress
                        </div>
                      </div>
                    </div>
                  </div>
                </Show>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <section
          class="border-t border-[hsl(0,0%,18%)]"
          style={{
            'background-color': 'hsl(0, 0%, 5.9%)',
            'background-image':
              'radial-gradient(circle, hsl(0, 0%, 9%) 1px, transparent 1px)',
            'background-size': '22px 22px',
          }}
        >
          <div class="container-custom py-10 text-center">
            <p class="text-xs text-[hsl(0,0%,30.2%)] max-w-lg mx-auto italic">
              Performance is precision meets efficiency.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
