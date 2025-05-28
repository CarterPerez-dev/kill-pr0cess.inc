/*
 * Performance benchmark visualization component that displays comparative analysis of system performance against industry standards.
 * I'm implementing interactive charts, statistical analysis, and benchmark execution with real-time progress tracking using the performance service.
 */

import { Component, createSignal, onMount, Show, For } from 'solid-js';
import { fractalService, BenchmarkResult } from '../../services/fractals';
import { performanceService } from '../../services/performance';

interface BenchmarkComparison {
  label: string;
  current: number;
  baseline: number;
  unit: string;
  better: 'higher' | 'lower';
}

interface BenchmarkCategory {
  name: string;
  description: string;
  results: {
    metric: string;
    value: number;
    unit: string;
    performance_rating: string;
    comparison?: number; // Percentage vs baseline
  }[];
}

export const BenchmarkChart: Component = () => {
  const [benchmarkResults, setBenchmarkResults] = createSignal<BenchmarkResult | null>(null);
  const [systemBenchmark, setSystemBenchmark] = createSignal<any>(null);
  const [isRunning, setIsRunning] = createSignal(false);
  const [progress, setProgress] = createSignal(0);
  const [currentTest, setCurrentTest] = createSignal('');
  const [error, setError] = createSignal<string | null>(null);

  onMount(() => {
    // I'm checking for any existing benchmark results
    loadExistingResults();
  });

  const loadExistingResults = async () => {
    try {
      // I'm attempting to load cached benchmark results if available
      const cached = localStorage.getItem('benchmark_results');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Date.now() - parsed.timestamp < 3600000) { // 1 hour cache
          setBenchmarkResults(parsed.data);
        }
      }
    } catch (err) {
      console.warn('Failed to load cached benchmark results:', err);
    }
  };

  const runFractalBenchmark = async () => {
    setIsRunning(true);
    setProgress(0);
    setCurrentTest('Initializing fractal benchmark suite...');
    setError(null);

    try {
      // I'm simulating progress updates for better UX
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + Math.random() * 15, 90));
      }, 500);

      setCurrentTest('Running fractal computation tests...');
      const results = await fractalService.runBenchmark();

      clearInterval(progressInterval);
      setProgress(100);
      setCurrentTest('Benchmark completed!');

      // I'm caching the results
      localStorage.setItem('benchmark_results', JSON.stringify({
        data: results,
        timestamp: Date.now()
      }));

      setBenchmarkResults(results);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Benchmark failed');
    } finally {
      setIsRunning(false);
      setTimeout(() => {
        setProgress(0);
        setCurrentTest('');
      }, 2000);
    }
  };

  const runSystemBenchmark = async () => {
    setIsRunning(true);
    setProgress(0);
    setCurrentTest('Running system performance benchmark...');
    setError(null);

    try {
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + Math.random() * 10, 85));
      }, 800);

      const results = await performanceService.runBenchmark();

      clearInterval(progressInterval);
      setProgress(100);
      setCurrentTest('System benchmark completed!');

      setSystemBenchmark(results);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'System benchmark failed');
    } finally {
      setIsRunning(false);
      setTimeout(() => {
        setProgress(0);
        setCurrentTest('');
      }, 2000);
    }
  };

  const getBenchmarkCategories = (): BenchmarkCategory[] => {
    const results = benchmarkResults();
    if (!results) return [];

    return [
      {
        name: 'Mandelbrot Generation',
        description: 'Mathematical computation performance',
        results: results.benchmark_results.map(result => ({
          metric: result.resolution,
          value: result.mandelbrot.computation_time_ms,
          unit: 'ms',
          performance_rating: result.mandelbrot.performance_rating,
          comparison: calculateComparison(result.mandelbrot.pixels_per_ms, getBaselinePixelsPerMs(result.resolution))
        }))
      },
      {
        name: 'Julia Set Generation',
        description: 'Complex number computation performance',
        results: results.benchmark_results.map(result => ({
          metric: result.resolution,
          value: result.julia.computation_time_ms,
          unit: 'ms',
          performance_rating: result.julia.performance_rating,
          comparison: calculateComparison(result.julia.pixels_per_ms, getBaselinePixelsPerMs(result.resolution))
        }))
      }
    ];
  };

  const getSystemComparisons = (): BenchmarkComparison[] => {
    const system = systemBenchmark();
    if (!system) return [];

    return [
      {
        label: 'CPU Performance',
        current: system.benchmarks?.cpu?.multi_thread?.primes_per_second || 0,
        baseline: 5000, // Baseline primes per second
        unit: 'primes/sec',
        better: 'higher'
      },
      {
        label: 'Memory Bandwidth',
        current: system.benchmarks?.memory?.sequential_read?.mb_per_second || 0,
        baseline: 10000, // Baseline MB/s
        unit: 'MB/s',
        better: 'higher'
      },
      {
        label: 'Memory Allocation',
        current: system.benchmarks?.memory?.allocation?.mb_per_second || 0,
        baseline: 5000, // Baseline allocation speed
        unit: 'MB/s',
        better: 'higher'
      }
    ];
  };

  const calculateComparison = (current: number, baseline: number): number => {
    if (baseline === 0) return 0;
    return ((current - baseline) / baseline) * 100;
  };

  const getBaselinePixelsPerMs = (resolution: string): number => {
    // I'm providing baseline performance expectations for different resolutions
    const baselines: Record<string, number> = {
      '256x256': 100,
      '512x512': 80,
      '1024x1024': 60,
      '2048x2048': 40
    };
    return baselines[resolution] || 50;
  };

  const getPerformanceColor = (rating: string) => {
    switch (rating.toLowerCase()) {
      case 'exceptional': return 'text-green-400';
      case 'excellent': return 'text-blue-400';
      case 'very good': return 'text-cyan-400';
      case 'good': return 'text-yellow-400';
      case 'fair': return 'text-orange-400';
      default: return 'text-red-400';
    }
  };

  const getComparisonColor = (comparison: number) => {
    if (comparison > 20) return 'text-green-400';
    if (comparison > 0) return 'text-blue-400';
    if (comparison > -20) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div class="space-y-6">
      {/* Header */}
      <div class="text-center mb-8">
        <h2 class="text-3xl font-thin text-neutral-200 mb-4">
          PERFORMANCE BENCHMARKS
        </h2>
        <p class="text-neutral-500 max-w-2xl mx-auto">
          Comprehensive performance testing demonstrating computational efficiency across
          mathematical operations, system resources, and parallel processing capabilities.
        </p>
      </div>

      {/* Benchmark Controls */}
      <div class="grid md:grid-cols-2 gap-4 mb-8">
        <button
          onClick={runFractalBenchmark}
          disabled={isRunning()}
          class={`p-6 rounded-lg border text-left transition-all duration-300 ${
            isRunning()
              ? 'bg-neutral-800/50 border-neutral-700 text-neutral-500 cursor-not-allowed'
              : 'bg-neutral-900/30 border-neutral-800 hover:border-neutral-600 text-neutral-100'
          }`}
        >
          <div class="text-lg font-mono mb-2">FRACTAL COMPUTATION</div>
          <div class="text-sm text-neutral-400 mb-3">
            Test mathematical computation performance with parallel processing
          </div>
          <div class="text-xs text-neutral-600">
            Mandelbrot & Julia set generation across multiple resolutions
          </div>
        </button>

        <button
          onClick={runSystemBenchmark}
          disabled={isRunning()}
          class={`p-6 rounded-lg border text-left transition-all duration-300 ${
            isRunning()
              ? 'bg-neutral-800/50 border-neutral-700 text-neutral-500 cursor-not-allowed'
              : 'bg-neutral-900/30 border-neutral-800 hover:border-neutral-600 text-neutral-100'
          }`}
        >
          <div class="text-lg font-mono mb-2">SYSTEM PERFORMANCE</div>
          <div class="text-sm text-neutral-400 mb-3">
            Test CPU, memory, and I/O performance characteristics
          </div>
          <div class="text-xs text-neutral-600">
            Prime calculation, memory bandwidth, and allocation speed
          </div>
        </button>
      </div>

      {/* Progress indicator */}
      <Show when={isRunning()}>
        <div class="bg-neutral-900/50 border border-neutral-800 rounded-lg p-6">
          <div class="flex items-center justify-between mb-3">
            <div class="text-neutral-300 font-mono text-sm">{currentTest()}</div>
            <div class="text-neutral-500 font-mono text-sm">{progress().toFixed(0)}%</div>
          </div>
          <div class="w-full bg-neutral-800 rounded-full h-2">
            <div
              class="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress()}%` }}
            ></div>
          </div>
        </div>
      </Show>

      {/* Error display */}
      <Show when={error()}>
        <div class="bg-red-900/20 border border-red-800 rounded-lg p-4">
          <div class="text-red-400 font-mono text-sm mb-2">BENCHMARK ERROR</div>
          <div class="text-neutral-300 text-sm">{error()}</div>
        </div>
      </Show>

      {/* Fractal Benchmark Results */}
      <Show when={benchmarkResults()}>
        <div class="space-y-6">
          <h3 class="text-xl font-mono text-neutral-300">FRACTAL COMPUTATION RESULTS</h3>

          <For each={getBenchmarkCategories()}>
            {(category) => (
              <div class="bg-neutral-900/30 border border-neutral-800 rounded-lg p-6">
                <div class="mb-4">
                  <h4 class="text-lg font-mono text-neutral-300 mb-1">{category.name}</h4>
                  <p class="text-sm text-neutral-500">{category.description}</p>
                </div>

                <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <For each={category.results}>
                    {(result) => (
                      <div class="bg-neutral-800/30 border border-neutral-700 rounded-sm p-4">
                        <div class="text-neutral-400 text-xs mb-1">{result.metric}</div>
                        <div class="text-xl font-mono text-neutral-100 mb-1">
                          {result.value.toLocaleString()}<span class="text-sm text-neutral-500 ml-1">{result.unit}</span>
                        </div>
                        <div class={`text-xs mb-2 ${getPerformanceColor(result.performance_rating)}`}>
                          {result.performance_rating}
                        </div>
                        <Show when={result.comparison !== undefined}>
                          <div class={`text-xs ${getComparisonColor(result.comparison!)}`}>
                            {result.comparison! > 0 ? '+' : ''}{result.comparison!.toFixed(1)}% vs baseline
                          </div>
                        </Show>
                      </div>
                    )}
                  </For>
                </div>
              </div>
            )}
          </For>

          {/* System Context */}
          <div class="bg-neutral-900/30 border border-neutral-800 rounded-lg p-6">
            <h4 class="text-lg font-mono text-neutral-300 mb-4">SYSTEM CONTEXT</h4>
            <div class="grid md:grid-cols-3 gap-6 text-sm">
              <div>
                <div class="text-neutral-500 mb-1">PROCESSOR</div>
                <div class="text-neutral-300 font-mono">
                  {benchmarkResults()!.system_context.cpu_model}
                </div>
                <div class="text-neutral-600 text-xs">
                  {benchmarkResults()!.system_context.cpu_cores} cores
                </div>
              </div>
              <div>
                <div class="text-neutral-500 mb-1">MEMORY</div>
                <div class="text-neutral-300 font-mono">
                  {benchmarkResults()!.system_context.memory_total_gb} GB
                </div>
                <div class="text-neutral-600 text-xs">Total system memory</div>
              </div>
              <div>
                <div class="text-neutral-500 mb-1">OPTIMIZATION</div>
                <div class="text-neutral-300 font-mono">
                  {benchmarkResults()!.performance_analysis.optimization_level}
                </div>
                <div class="text-neutral-600 text-xs">
                  {benchmarkResults()!.performance_analysis.language}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Show>

      {/* System Benchmark Results */}
      <Show when={systemBenchmark()}>
        <div class="space-y-6">
          <h3 class="text-xl font-mono text-neutral-300">SYSTEM PERFORMANCE RESULTS</h3>

          <div class="grid md:grid-cols-3 gap-4">
            <For each={getSystemComparisons()}>
              {(comparison) => (
                <div class="bg-neutral-900/30 border border-neutral-800 rounded-lg p-6 text-center">
                  <div class="text-neutral-400 text-sm mb-2">{comparison.label}</div>
                  <div class="text-2xl font-mono text-neutral-100 mb-1">
                    {comparison.current.toLocaleString()}
                    <span class="text-sm text-neutral-500 ml-1">{comparison.unit}</span>
                  </div>
                  <div class={`text-sm ${getComparisonColor(calculateComparison(comparison.current, comparison.baseline))}`}>
                    {calculateComparison(comparison.current, comparison.baseline) > 0 ? '+' : ''}
                    {calculateComparison(comparison.current, comparison.baseline).toFixed(1)}% vs baseline
                  </div>
                </div>
              )}
            </For>
          </div>

          <div class="text-center p-6 bg-neutral-800/30 rounded-lg">
            <div class="text-neutral-400 text-sm mb-2">OVERALL PERFORMANCE RATING</div>
            <div class={`text-3xl font-mono ${getPerformanceColor(systemBenchmark().performance_rating)}`}>
              {systemBenchmark().performance_rating}
            </div>
          </div>
        </div>
      </Show>

      {/* No results message */}
      <Show when={!benchmarkResults() && !systemBenchmark() && !isRunning()}>
        <div class="text-center py-12">
          <div class="text-6xl mb-4">⚡</div>
          <div class="text-xl text-neutral-400 mb-2">No Benchmark Results</div>
          <div class="text-sm text-neutral-600">
            Run a benchmark to see detailed performance analysis and comparison
          </div>
        </div>
      </Show>
    </div>
  );
};
