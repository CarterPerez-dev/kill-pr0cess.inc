/*
 * Interactive fractal visualization component with real-time backend communication and smooth user controls.
 * I'm implementing canvas-based rendering with zoom/pan controls, performance monitoring, and seamless integration with the Rust backend API.
 */

import {
  type Component,
  createSignal,
  onMount,
  onCleanup,
  createEffect,
} from 'solid-js';
import { apiClient } from '../../services/api';

interface FractalCanvasProps {
  width?: number;
  height?: number;
  fractalType?: 'mandelbrot' | 'julia';
  onPerformanceUpdate?: (metrics: PerformanceMetrics) => void;
}

interface PerformanceMetrics {
  computationTime: number;
  networkTime: number;
  totalTime: number;
  pixelsPerSecond: number;
  zoomLevel: number;
  pixelsComputed: number;
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

export const FractalCanvas: Component<FractalCanvasProps> = (props) => {
  let canvasRef: HTMLCanvasElement | undefined;
  let animationFrameId: number | undefined;

  // Core fractal parameters - I'm setting up reactive state for smooth interaction
  const [zoom, setZoom] = createSignal(1.0);
  const [centerX, setCenterX] = createSignal(
    props.fractalType === 'julia' ? 0.0 : -0.5,
  );
  const [centerY, setCenterY] = createSignal(0.0);
  const [maxIterations, setMaxIterations] = createSignal(100);

  // Julia set specific parameters
  const [juliaC, setJuliaC] = createSignal({ real: -0.7, imag: 0.27015 });

  // Interaction state
  const [isDragging, setIsDragging] = createSignal(false);
  const [lastMousePos, setLastMousePos] = createSignal({ x: 0, y: 0 });
  const [isLoading, setIsLoading] = createSignal(false);

  // Performance tracking
  const [currentMetrics, setCurrentMetrics] =
    createSignal<PerformanceMetrics | null>(null);
  const [renderHistory, setRenderHistory] = createSignal<
    PerformanceMetrics[]
  >([]);

  const width = () => props.width || 800;
  const height = () => props.height || 600;
  const fractalType = () => props.fractalType || 'mandelbrot';

  // I'm setting up automatic re-rendering when parameters change
  createEffect(() => {
    if (canvasRef) {
      debouncedRender();
    }
  });

  onMount(() => {
    if (canvasRef) {
      initializeCanvas();
      renderFractal();
    }
  });

  onCleanup(() => {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }
  });

  const initializeCanvas = () => {
    if (!canvasRef) return;

    const ctx = canvasRef.getContext('2d');
    if (!ctx) return;

    // I'm setting up canvas with optimal settings for performance
    ctx.imageSmoothingEnabled = false;
    canvasRef.style.cursor = 'crosshair';
  };

  const renderFractal = async () => {
    if (!canvasRef || isLoading()) return;

    setIsLoading(true);
    const startTime = performance.now();

    try {
      // I'm building the API request with current parameters
      const requestData = {
        width: width(),
        height: height(),
        center_x: centerX(),
        center_y: centerY(),
        zoom: zoom(),
        max_iterations: maxIterations(),
        ...(fractalType() === 'julia' && {
          c_real: juliaC().real,
          c_imag: juliaC().imag,
        }),
      };

      const endpoint =
        fractalType() === 'mandelbrot'
          ? '/api/fractals/mandelbrot'
          : '/api/fractals/julia';

      const fractalData: FractalResponse = await apiClient.post(
        endpoint,
        requestData,
      );
      const networkTime = performance.now() - startTime;

      // I'm converting the response data to ImageData for canvas rendering
      await renderToCanvas(fractalData);

      // Update performance metrics
      const metrics: PerformanceMetrics = {
        computationTime: fractalData.computation_time_ms,
        networkTime: networkTime - fractalData.computation_time_ms,
        totalTime: networkTime,
        pixelsPerSecond: fractalData.performance_metrics.pixels_per_second,
        zoomLevel: zoom(),
        pixelsComputed: fractalData.width * fractalData.height,
      };

      setCurrentMetrics(metrics);
      updateRenderHistory(metrics);

      // Notify parent component if callback provided
      props.onPerformanceUpdate?.(metrics);
    } catch (error) {
      console.error('Fractal generation failed:', error);
      displayError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const renderToCanvas = async (fractalData: FractalResponse) => {
    if (!canvasRef) return;

    const ctx = canvasRef.getContext('2d');
    if (!ctx) return;

    // I'm converting the raw RGBA data from the backend into ImageData
    const imageData = new ImageData(
      new Uint8ClampedArray(fractalData.data),
      fractalData.width,
      fractalData.height,
    );

    // Clear canvas and render the fractal
    ctx.clearRect(0, 0, width(), height());
    ctx.putImageData(imageData, 0, 0);
  };

  const displayError = (message: string) => {
    if (!canvasRef) return;

    const ctx = canvasRef.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, width(), height());

    ctx.fillStyle = '#ef4444';
    ctx.font = '16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`Error: ${  message}`, width() / 2, height() / 2);
  };

  // I'm implementing smooth debounced rendering to prevent excessive API calls
  let renderTimeout: number | undefined;
  const debouncedRender = () => {
    if (renderTimeout) clearTimeout(renderTimeout);
    renderTimeout = setTimeout(renderFractal, 150);
  };

  // Mouse and touch interaction handlers
  const handleWheel = (e: WheelEvent) => {
    e.preventDefault();

    const rect = canvasRef!.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // I'm implementing smooth zoom with cursor-centered scaling
    const zoomFactor = e.deltaY > 0 ? 0.8 : 1.25;
    const newZoom = zoom() * zoomFactor;

    // Prevent extreme zoom levels that could cause performance issues
    if (newZoom < 0.1 || newZoom > 1e12) return;

    // Calculate new center point to zoom toward cursor
    const scale = 4.0 / zoom();
    const mouseWorldX =
      centerX() + ((mouseX - width() / 2) * scale) / width();
    const mouseWorldY =
      centerY() + ((mouseY - height() / 2) * scale) / height();

    const newScale = 4.0 / newZoom;
    const newCenterX =
      mouseWorldX - ((mouseX - width() / 2) * newScale) / width();
    const newCenterY =
      mouseWorldY - ((mouseY - height() / 2) * newScale) / height();

    setZoom(newZoom);
    setCenterX(newCenterX);
    setCenterY(newCenterY);

    // Adjust iteration count based on zoom for optimal detail vs performance
    const optimalIterations = Math.min(
      100 + Math.floor(Math.log10(newZoom) * 50),
      2000,
    );
    setMaxIterations(Math.max(50, optimalIterations));
  };

  const handleMouseDown = (e: MouseEvent) => {
    setIsDragging(true);
    setLastMousePos({ x: e.clientX, y: e.clientY });
    canvasRef!.style.cursor = 'grabbing';
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging()) return;

    const deltaX = e.clientX - lastMousePos().x;
    const deltaY = e.clientY - lastMousePos().y;

    const scale = 4.0 / zoom();
    const worldDeltaX = (-deltaX * scale) / width();
    const worldDeltaY = (-deltaY * scale) / height();

    setCenterX(centerX() + worldDeltaX);
    setCenterY(centerY() + worldDeltaY);
    setLastMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    canvasRef!.style.cursor = 'crosshair';
  };

  // Touch support for mobile devices
  const handleTouchStart = (e: TouchEvent) => {
    e.preventDefault();
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      handleMouseDown({
        clientX: touch.clientX,
        clientY: touch.clientY,
      } as MouseEvent);
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    e.preventDefault();
    if (e.touches.length === 1 && isDragging()) {
      const touch = e.touches[0];
      handleMouseMove({
        clientX: touch.clientX,
        clientY: touch.clientY,
      } as MouseEvent);
    }
  };

  const updateRenderHistory = (metrics: PerformanceMetrics) => {
    setRenderHistory((prev) => {
      const updated = [...prev, metrics];
      return updated.slice(-50); // Keep last 50 renders for analysis
    });
  };

  const getAveragePerformance = () => {
    const history = renderHistory();
    if (history.length === 0) return null;

    const avg = history.reduce(
      (acc, curr) => ({
        computationTime: acc.computationTime + curr.computationTime,
        networkTime: acc.networkTime + curr.networkTime,
        totalTime: acc.totalTime + curr.totalTime,
        pixelsPerSecond: acc.pixelsPerSecond + curr.pixelsPerSecond,
      }),
      {
        computationTime: 0,
        networkTime: 0,
        totalTime: 0,
        pixelsPerSecond: 0,
      },
    );

    return {
      computationTime: avg.computationTime / history.length,
      networkTime: avg.networkTime / history.length,
      totalTime: avg.totalTime / history.length,
      pixelsPerSecond: avg.pixelsPerSecond / history.length,
    };
  };

  return (
    <div class="relative overflow-hidden rounded-lg border border-neutral-800 bg-black">
      {/* Main fractal canvas */}
      <canvas
        ref={canvasRef}
        width={width()}
        height={height()}
        class="block"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleMouseUp}
      />

      {/* Loading overlay */}
      <div
        class={`absolute inset-0 bg-black/80 flex items-center justify-center transition-opacity duration-300 ${
          isLoading() ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div class="text-center text-neutral-300">
          <div class="w-12 h-12 border-2 border-neutral-600 border-t-neutral-300 rounded-full animate-spin mx-auto mb-3"></div>
          <div class="text-sm font-mono">Computing fractal...</div>
          <div class="text-xs text-neutral-500 mt-1">
            {zoom() > 1000 ? 'Deep zoom - please wait' : 'Processing'}
          </div>
        </div>
      </div>

      {/* Performance metrics overlay */}
      <div class="absolute top-3 left-3 bg-black/90 backdrop-blur-sm rounded border border-neutral-700 p-3 text-xs font-mono text-neutral-300 min-w-[200px]">
        <div class="text-neutral-400 font-semibold mb-2 text-sm">
          PERFORMANCE
        </div>
        {currentMetrics() && (
          <div class="space-y-1">
            <div class="flex justify-between">
              <span>Backend:</span>
              <span class="text-green-400">
                {currentMetrics()!.computationTime}ms
              </span>
            </div>
            <div class="flex justify-between">
              <span>Network:</span>
              <span class="text-yellow-400">
                {Math.round(currentMetrics()!.networkTime)}ms
              </span>
            </div>
            <div class="flex justify-between">
              <span>Zoom:</span>
              <span class="text-purple-400">{zoom().toExponential(2)}</span>
            </div>
            <div class="flex justify-between">
              <span>Pixels/sec:</span>
              <span class="text-cyan-400">
                {Math.round(
                  currentMetrics()!.pixelsPerSecond,
                ).toLocaleString()}
              </span>
            </div>
            <div class="flex justify-between">
              <span>Resolution:</span>
              <span class="text-neutral-400">
                {width()}×{height()}
              </span>
            </div>
          </div>
        )}
        {getAveragePerformance() && (
          <div class="mt-3 pt-2 border-t border-neutral-700">
            <div class="text-neutral-500 text-xs mb-1">
              Average ({renderHistory().length} renders)
            </div>
            <div class="flex justify-between text-xs">
              <span>Backend:</span>
              <span class="text-green-400">
                {Math.round(getAveragePerformance()!.computationTime)}ms
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Julia set controls (if applicable) */}
      {fractalType() === 'julia' && (
        <div class="absolute top-3 right-3 bg-black/90 backdrop-blur-sm rounded border border-neutral-700 p-3 text-xs font-mono text-neutral-300">
          <div class="text-neutral-400 font-semibold mb-2">
            JULIA PARAMETERS
          </div>
          <div class="space-y-2">
            <div>
              <label class="block text-neutral-500 mb-1">C Real</label>
              <input
                type="range"
                min="-2"
                max="2"
                step="0.01"
                value={juliaC().real}
                onInput={(e) =>
                  setJuliaC((prev) => ({
                    ...prev,
                    real: parseFloat(e.currentTarget.value),
                  }))
                }
                class="w-full h-1 bg-neutral-700 rounded appearance-none slider"
              />
              <div class="text-xs text-neutral-400 mt-1">
                {juliaC().real.toFixed(3)}
              </div>
            </div>
            <div>
              <label class="block text-neutral-500 mb-1">C Imaginary</label>
              <input
                type="range"
                min="-2"
                max="2"
                step="0.01"
                value={juliaC().imag}
                onInput={(e) =>
                  setJuliaC((prev) => ({
                    ...prev,
                    imag: parseFloat(e.currentTarget.value),
                  }))
                }
                class="w-full h-1 bg-neutral-700 rounded appearance-none slider"
              />
              <div class="text-xs text-neutral-400 mt-1">
                {juliaC().imag.toFixed(3)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Control instructions */}
      <div class="absolute bottom-3 right-3 bg-black/90 backdrop-blur-sm rounded border border-neutral-700 p-3 text-xs text-neutral-400">
        <div class="space-y-1">
          <div>Scroll: Zoom • Drag: Pan</div>
          <div class="text-neutral-500">
            Powered by <span class="text-orange-400">Rust</span> +{' '}
            <span class="text-blue-400">Axum</span>
          </div>
        </div>
      </div>
    </div>
  );
};
