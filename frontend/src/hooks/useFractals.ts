/*
 * Fractal computation hook managing real-time mathematical visualization with performance tracking and interactive controls.
 * I'm implementing comprehensive fractal state management that bridges the gap between user interaction and high-performance Rust backend computation.
 */

import { createSignal, createResource, createMemo, onCleanup } from 'solid-js';
import { createStore, produce } from 'solid-js/store';

interface FractalRequest {
  width: number;
  height: number;
  center_x: number;
  center_y: number;
  zoom: number;
  max_iterations: number;
  fractal_type: 'mandelbrot' | 'julia';
  c_real?: number;
  c_imag?: number;
}

interface FractalResponse {
  data: number[];
  width: number;
  height: number;
  computation_time_ms: number;
  zoom_level: number;
  parameters: any;
  performance_metrics: {
    pixels_per_second: number;
    parallel_efficiency: number;
    memory_usage_mb: number;
    cpu_utilization: number;
  };
}

interface BenchmarkResult {
  benchmark_results: Array<{
    complexity: string;
    resolution: string;
    total_pixels: number;
    mandelbrot: {
      computation_time_ms: number;
      pixels_per_ms: number;
      performance_rating: string;
    };
    julia: {
      computation_time_ms: number;
      pixels_per_ms: number;
      performance_rating: string;
    };
  }>;
  system_context: {
    cpu_model: string;
    cpu_cores: number;
    memory_total_gb: number;
    rust_version: string;
    parallel_processing: boolean;
  };
  performance_analysis: {
    language: string;
    framework: string;
    optimization_level: string;
  };
}

interface PerformanceHistory {
  timestamp: string;
  computation_time: number;
  pixels_computed: number;
  zoom_level: number;
  fractal_type: string;
}

interface FractalState {
  currentFractal: FractalResponse | null;
  isGenerating: boolean;
  error: string | null;
  benchmarkResults: BenchmarkResult | null;
  performanceHistory: PerformanceHistory[];
  settings: {
    fractalType: 'mandelbrot' | 'julia';
    width: number;
    height: number;
    maxIterations: number;
    juliaConstant: { real: number; imag: number };
  };
  interactionMode: 'pan' | 'zoom' | 'parameter';
}

export function useFractals() {
  // I'm setting up comprehensive fractal state management
  const [state, setState] = createStore<FractalState>({
    currentFractal: null,
    isGenerating: false,
    error: null,
    benchmarkResults: null,
    performanceHistory: [],
    settings: {
      fractalType: 'mandelbrot',
      width: 800,
      height: 600,
      maxIterations: 100,
      juliaConstant: { real: -0.7, imag: 0.27015 },
    },
    interactionMode: 'zoom',
  });

  // I'm implementing performance tracking signals
  const [generationCount, setGenerationCount] = createSignal(0);
  const [totalComputationTime, setTotalComputationTime] = createSignal(0);
  const [averageGenerationTime, setAverageGenerationTime] = createSignal(0);

  // Fractal generation resource
  const [fractalResource] = createResource(
    () => ({ 
      request: buildFractalRequest(), 
      count: generationCount() 
    }),
    async ({ request }) => {
      setState('isGenerating', true);
      setState('error', null);

      try {
        const endpoint = request.fractal_type === 'mandelbrot' 
          ? '/api/fractals/mandelbrot' 
          : '/api/fractals/julia';

        const params = new URLSearchParams();
        params.append('width', request.width.toString());
        params.append('height', request.height.toString());
        params.append('center_x', request.center_x.toString());
        params.append('center_y', request.center_y.toString());
        params.append('zoom', request.zoom.toString());
        params.append('max_iterations', request.max_iterations.toString());
        
        if (request.fractal_type === 'julia') {
          params.append('c_real', (request.c_real || -0.7).toString());
          params.append('c_imag', (request.c_imag || 0.27015).toString());
        }

        const response = await fetch(`${endpoint}?${params}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data: FractalResponse = await response.json();
        
        // Update performance tracking
        const newCount = generationCount() + 1;
        const newTotal = totalComputationTime() + data.computation_time_ms;
        setGenerationCount(newCount);
        setTotalComputationTime(newTotal);
        setAverageGenerationTime(newTotal / newCount);

        // Add to performance history
        setState('performanceHistory', produce(history => {
          history.unshift({
            timestamp: new Date().toISOString(),
            computation_time: data.computation_time_ms,
            pixels_computed: data.width * data.height,
            zoom_level: data.zoom_level,
            fractal_type: request.fractal_type,
          });
          
          // Keep only last 50 entries
          if (history.length > 50) {
            history.splice(50);
          }
        }));

        setState('currentFractal', data);
        return data;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Fractal generation failed';
        setState('error', errorMessage);
        throw error;
      } finally {
        setState('isGenerating', false);
      }
    }
  );

  // Benchmark resource for performance testing
  const [benchmarkResource] = createResource(
    () => null, // Manual trigger
    async () => {
      try {
        setState('isGenerating', true);
        
        const response = await fetch('/api/fractals/benchmark', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data: BenchmarkResult = await response.json();
        setState('benchmarkResults', data);
        return data;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Benchmark failed';
        setState('error', errorMessage);
        throw error;
      } finally {
        setState('isGenerating', false);
      }
    }
  );

  // I'm implementing computed values for enhanced analytics
  const performanceStats = createMemo(() => {
    const history = state.performanceHistory;
    if (history.length === 0) return null;

    const totalPixels = history.reduce((sum, entry) => sum + entry.pixels_computed, 0);
    const totalTime = history.reduce((sum, entry) => sum + entry.computation_time, 0);
    const averagePixelsPerMs = totalPixels / totalTime;

    const mandelbrotEntries = history.filter(entry => entry.fractal_type === 'mandelbrot');
    const juliaEntries = history.filter(entry => entry.fractal_type === 'julia');

    return {
      totalGenerations: history.length,
      totalPixelsComputed: totalPixels,
      totalComputationTime: totalTime,
      averagePixelsPerMs,
      averageComputationTime: totalTime / history.length,
      mandelbrotCount: mandelbrotEntries.length,
      juliaCount: juliaEntries.length,
      fastestGeneration: Math.min(...history.map(entry => entry.computation_time)),
      slowestGeneration: Math.max(...history.map(entry => entry.computation_time)),
      averageZoomLevel: history.reduce((sum, entry) => sum + entry.zoom_level, 0) / history.length,
    };
  });

  const currentPerformance = createMemo(() => {
    const current = state.currentFractal;
    if (!current) return null;

    return {
      computationTime: current.computation_time_ms,
      pixelsPerSecond: current.performance_metrics.pixels_per_second,
      parallelEfficiency: current.performance_metrics.parallel_efficiency,
      memoryUsage: current.performance_metrics.memory_usage_mb,
      cpuUtilization: current.performance_metrics.cpu_utilization,
      pixelsComputed: current.width * current.height,
      zoomLevel: current.zoom_level,
      performanceRating: getPerformanceRating(current.performance_metrics.pixels_per_second),
    };
  });

  // Helper function to build fractal request from current state
  function buildFractalRequest(): Omit<FractalRequest, 'center_x' | 'center_y' | 'zoom'> {
    return {
      width: state.settings.width,
      height: state.settings.height,
      max_iterations: state.settings.maxIterations,
      fractal_type: state.settings.fractalType,
      ...(state.settings.fractalType === 'julia' && {
        c_real: state.settings.juliaConstant.real,
        c_imag: state.settings.juliaConstant.imag,
      }),
    };
  }

  // Actions for fractal management
  const actions = {
    // Generate fractal with specific parameters
    async generateFractal(params: {
      center_x: number;
      center_y: number;
      zoom: number;
      width?: number;
      height?: number;
      max_iterations?: number;
    }): Promise<FractalResponse | null> {
      const request: FractalRequest = {
        ...buildFractalRequest(),
        center_x: params.center_x,
        center_y: params.center_y,
        zoom: params.zoom,
        width: params.width || state.settings.width,
        height: params.height || state.settings.height,
        max_iterations: params.max_iterations || state.settings.maxIterations,
      };

      try {
        const endpoint = request.fractal_type === 'mandelbrot' 
          ? '/api/fractals/mandelbrot' 
          : '/api/fractals/julia';

        const urlParams = new URLSearchParams({
          width: request.width.toString(),
          height: request.height.toString(),
          center_x: request.center_x.toString(),
          center_y: request.center_y.toString(),
          zoom: request.zoom.toString(),
          max_iterations: request.max_iterations.toString(),
        });

        if (request.fractal_type === 'julia') {
          urlParams.append('c_real', (request.c_real || -0.7).toString());
          urlParams.append('c_imag', (request.c_imag || 0.27015).toString());
        }

        const response = await fetch(`${endpoint}?${urlParams}`, {
          method: 'POST',
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data: FractalResponse = await response.json();
        setState('currentFractal', data);
        
        // Update performance tracking
        const newCount = generationCount() + 1;
        const newTotal = totalComputationTime() + data.computation_time_ms;
        setGenerationCount(newCount);
        setTotalComputationTime(newTotal);
        setAverageGenerationTime(newTotal / newCount);

        return data;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Fractal generation failed';
        setState('error', errorMessage);
        return null;
      }
    },

    // Run comprehensive benchmark
    async runBenchmark(): Promise<void> {
      benchmarkResource.refetch();
    },

    // Update fractal settings
    updateSettings(newSettings: Partial<FractalState['settings']>) {
      setState('settings', produce(current => Object.assign(current, newSettings)));
      
      // Trigger regeneration if we have current parameters
      if (state.currentFractal) {
        setGenerationCount(prev => prev + 1);
      }
    },

    // Set fractal type
    setFractalType(type: 'mandelbrot' | 'julia') {
      setState('settings', 'fractalType', type);
      
      // Adjust iterations based on fractal type
      if (type === 'julia' && state.settings.maxIterations < 150) {
        setState('settings', 'maxIterations', 150);
      } else if (type === 'mandelbrot' && state.settings.maxIterations > 1000) {
        setState('settings', 'maxIterations', 200);
      }
    },

    // Update Julia constant
    setJuliaConstant(real: number, imag: number) {
      setState('settings', 'juliaConstant', { real, imag });
      
      if (state.settings.fractalType === 'julia') {
        setGenerationCount(prev => prev + 1);
      }
    },

    // Set resolution
    setResolution(width: number, height: number) {
      setState('settings', produce(settings => {
        settings.width = Math.max(64, Math.min(4096, width));
        settings.height = Math.max(64, Math.min(4096, height));
      }));
    },

    // Set maximum iterations
    setMaxIterations(iterations: number) {
      setState('settings', 'maxIterations', Math.max(50, Math.min(10000, iterations)));
    },

    // Set interaction mode
    setInteractionMode(mode: 'pan' | 'zoom' | 'parameter') {
      setState('interactionMode', mode);
    },

    // Clear error state
    clearError() {
      setState('error', null);
    },

    // Clear performance history
    clearHistory() {
      setState('performanceHistory', []);
      setGenerationCount(0);
      setTotalComputationTime(0);
      setAverageGenerationTime(0);
    },

    // Export fractal data
    exportFractalData() {
      const current = state.currentFractal;
      if (!current) return null;

      return {
        fractal_data: current,
        settings: state.settings,
        performance_stats: performanceStats(),
        generation_history: state.performanceHistory.slice(0, 10), // Last 10 generations
        export_timestamp: new Date().toISOString(),
      };
    },

    // Get optimal iterations for zoom level
    getOptimalIterations(zoomLevel: number): number {
      const baseIterations = state.settings.fractalType === 'mandelbrot' ? 100 : 150;
      const zoomFactor = Math.log10(Math.max(1, zoomLevel));
      const optimalIterations = Math.floor(baseIterations + (zoomFactor * 50));
      
      return Math.max(50, Math.min(2000, optimalIterations));
    },
  };

  // I'm implementing automatic cleanup
  onCleanup(() => {
    // Clear any pending requests or timers
  });

  // Helper functions
  function getPerformanceRating(pixelsPerSecond: number): string {
    if (pixelsPerSecond > 10000) return 'Exceptional';
    if (pixelsPerSecond > 5000) return 'Excellent';
    if (pixelsPerSecond > 2000) return 'Very Good';
    if (pixelsPerSecond > 1000) return 'Good';
    if (pixelsPerSecond > 500) return 'Fair';
    return 'Needs Optimization';
  }

  return {
    // State
    currentFractal: () => state.currentFractal,
    isGenerating: () => state.isGenerating,
    error: () => state.error,
    settings: () => state.settings,
    interactionMode: () => state.interactionMode,
    
    // Performance data
    performanceHistory: () => state.performanceHistory,
    performanceStats,
    currentPerformance,
    benchmarkResults: () => state.benchmarkResults,
    
    // Metrics
    generationCount,
    averageGenerationTime,
    totalComputationTime,
    
    // Resources
    fractalResource,
    benchmarkResource,
    
    // Actions
    ...actions,
  };
}

export type { FractalRequest, FractalResponse, BenchmarkResult, PerformanceHistory };
