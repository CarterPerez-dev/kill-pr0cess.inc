/*
 * Fractal information display component providing detailed mathematical and computational context for the current fractal visualization.
 * I'm implementing comprehensive fractal metadata presentation including mathematical properties, performance analysis, and theoretical background in the dark aesthetic framework.
 */

import { Component, createSignal, Show, For } from 'solid-js';
import { Card } from '../UI/Card';

interface FractalInfoProps {
  fractalType: 'mandelbrot' | 'julia';
  parameters: {
    zoom: number;
    centerX: number;
    centerY: number;
    maxIterations: number;
    juliaConstant?: { real: number; imag: number };
  };
  metadata?: {
    computationTime: number;
    pixelsComputed: number;
    pixelsPerSecond: number;
    parallelEfficiency: number;
    memoryUsage: number;
    iterationsUsed: number;
  };
  visible?: boolean;
  onToggle?: () => void;
}

export const FractalInfo: Component<FractalInfoProps> = (props) => {
  const [activeSection, setActiveSection] = createSignal<'math' | 'performance' | 'theory'>('math');

  // I'm calculating derived mathematical properties
  const getMathematicalProperties = () => {
    const { zoom, centerX, centerY, maxIterations } = props.parameters;

    const pixelSize = 4.0 / zoom;
    const escapeRadius = 2.0;
    const aspectRatio = 4.0 / 3.0; // Assuming 4:3 aspect ratio

    return {
      pixelSize,
      escapeRadius,
      aspectRatio,
      complexPlaneWidth: pixelSize * 800, // Assuming 800px width
      complexPlaneHeight: pixelSize * 600, // Assuming 600px height
      magnification: zoom,
      centerPoint: `${centerX.toFixed(10)} + ${centerY.toFixed(10)}i`,
      iterationDepth: maxIterations
    };
  };

  // I'm providing theoretical background for each fractal type
  const getTheoreticalInfo = () => {
    if (props.fractalType === 'mandelbrot') {
      return {
        title: 'The Mandelbrot Set',
        definition: 'The set of complex numbers c for which the function f(z) = z² + c does not diverge when iterated from z = 0.',
        discoverer: 'Benoit Mandelbrot (1980)',
        dimension: 'Hausdorff dimension ≈ 2',
        properties: [
          'Self-similar at different scales',
          'Connected set with intricate boundary',
          'Contains miniature copies of itself',
          'Exhibits fractal geometry'
        ],
        equation: 'z_{n+1} = z_n² + c',
        significance: 'Demonstrates how simple mathematical rules can generate infinite complexity.'
      };
    } else {
      const { real, imag } = props.parameters.juliaConstant || { real: 0, imag: 0 };
      return {
        title: 'Julia Sets',
        definition: `The set of complex numbers z for which the iteration z² + c remains bounded, where c = ${real.toFixed(4)} + ${imag.toFixed(4)}i.`,
        discoverer: 'Gaston Julia (1918)',
        dimension: 'Hausdorff dimension varies',
        properties: [
          'Connected or totally disconnected',
          'Fractal boundary structure',
          'Sensitive to parameter changes',
          'Related to Mandelbrot set'
        ],
        equation: `z_{n+1} = z_n² + (${real.toFixed(4)} + ${imag.toFixed(4)}i)`,
        significance: 'Each point in the Mandelbrot set corresponds to a connected Julia set.'
      };
    }
  };

  // I'm analyzing performance characteristics
  const getPerformanceAnalysis = () => {
    if (!props.metadata) return null;

    const { computationTime, pixelsComputed, pixelsPerSecond, parallelEfficiency, memoryUsage } = props.metadata;

    const efficiency = pixelsPerSecond > 10000 ? 'Exceptional' :
                      pixelsPerSecond > 5000 ? 'Excellent' :
                      pixelsPerSecond > 2000 ? 'Very Good' :
                      pixelsPerSecond > 1000 ? 'Good' : 'Fair';

    const parallelRating = parallelEfficiency > 0.8 ? 'Excellent' :
                          parallelEfficiency > 0.6 ? 'Good' :
                          parallelEfficiency > 0.4 ? 'Fair' : 'Poor';

    return {
      efficiency,
      parallelRating,
      computationRate: (pixelsComputed / computationTime * 1000).toFixed(0),
      memoryEfficiency: memoryUsage < 100 ? 'Excellent' : memoryUsage < 500 ? 'Good' : 'Heavy'
    };
  };

  const formatNumber = (num: number, decimals: number = 2): string => {
    if (Math.abs(num) > 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (Math.abs(num) > 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toFixed(decimals);
  };

  const mathematicalProps = getMathematicalProperties();
  const theoreticalInfo = getTheoreticalInfo();
  const performanceAnalysis = getPerformanceAnalysis();

  return (
    <Show when={props.visible}>
      <div class="fixed bottom-4 left-4 w-96 z-20">
        <Card variant="glass" padding="none" class="backdrop-blur-md border-neutral-700">
          {/* Header */}
          <div class="flex items-center justify-between p-4 border-b border-neutral-700">
            <h3 class="font-mono text-sm text-neutral-300 tracking-wide">
              FRACTAL ANALYSIS
            </h3>
            <button
              onClick={props.onToggle}
              class="text-neutral-500 hover:text-neutral-300 transition-colors duration-200"
            >
              ✕
            </button>
          </div>

          {/* Tab Navigation */}
          <div class="flex border-b border-neutral-800">
            {(['math', 'performance', 'theory'] as const).map((tab) => (
              <button
                onClick={() => setActiveSection(tab)}
                class={`flex-1 px-3 py-2 text-xs font-mono uppercase tracking-wide transition-colors duration-200 ${
                  activeSection() === tab
                    ? 'bg-neutral-800 text-neutral-200 border-b-2 border-cyan-400'
                    : 'text-neutral-500 hover:text-neutral-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Mathematical Properties */}
          <Show when={activeSection() === 'math'}>
            <div class="p-4 space-y-4">
              <div class="bg-neutral-900/50 rounded-lg p-3">
                <div class="text-xs text-neutral-500 font-mono uppercase mb-2">Complex Plane</div>
                <div class="space-y-2 text-xs">
                  <div class="flex justify-between">
                    <span class="text-neutral-600">Center:</span>
                    <span class="text-neutral-400 font-mono">{mathematicalProps.centerPoint}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-neutral-600">Magnification:</span>
                    <span class="text-neutral-400 font-mono">{formatNumber(mathematicalProps.magnification)}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-neutral-600">Pixel Size:</span>
                    <span class="text-neutral-400 font-mono">{mathematicalProps.pixelSize.toExponential(3)}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-neutral-600">Plane Width:</span>
                    <span class="text-neutral-400 font-mono">{mathematicalProps.complexPlaneWidth.toFixed(6)}</span>
                  </div>
                </div>
              </div>

              <div class="bg-neutral-900/50 rounded-lg p-3">
                <div class="text-xs text-neutral-500 font-mono uppercase mb-2">Computation</div>
                <div class="space-y-2 text-xs">
                  <div class="flex justify-between">
                    <span class="text-neutral-600">Max Iterations:</span>
                    <span class="text-neutral-400 font-mono">{mathematicalProps.iterationDepth}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-neutral-600">Escape Radius:</span>
                    <span class="text-neutral-400 font-mono">{mathematicalProps.escapeRadius}</span>
                  </div>
                  <Show when={props.parameters.juliaConstant}>
                    <div class="flex justify-between">
                      <span class="text-neutral-600">Julia Constant:</span>
                      <span class="text-neutral-400 font-mono">
                        {props.parameters.juliaConstant!.real.toFixed(4)} + {props.parameters.juliaConstant!.imag.toFixed(4)}i
                      </span>
                    </div>
                  </Show>
                </div>
              </div>

              <div class="text-xs text-neutral-600 italic leading-relaxed">
                "In the infinite complexity of fractals, we glimpse the mathematical underpinnings of chaos and beauty."
              </div>
            </div>
          </Show>

          {/* Performance Analysis */}
          <Show when={activeSection() === 'performance' && props.metadata}>
            <div class="p-4 space-y-4">
              <div class="bg-neutral-900/50 rounded-lg p-3">
                <div class="text-xs text-neutral-500 font-mono uppercase mb-2">Computation</div>
                <div class="space-y-2 text-xs">
                  <div class="flex justify-between">
                    <span class="text-neutral-600">Time:</span>
                    <span class="text-neutral-400 font-mono">{props.metadata!.computationTime}ms</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-neutral-600">Pixels:</span>
                    <span class="text-neutral-400 font-mono">{formatNumber(props.metadata!.pixelsComputed)}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-neutral-600">Rate:</span>
                    <span class="text-neutral-400 font-mono">{formatNumber(props.metadata!.pixelsPerSecond)}/sec</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-neutral-600">Efficiency:</span>
                    <span class="text-cyan-400 font-mono">{performanceAnalysis?.efficiency}</span>
                  </div>
                </div>
              </div>

              <div class="bg-neutral-900/50 rounded-lg p-3">
                <div class="text-xs text-neutral-500 font-mono uppercase mb-2">Parallel Processing</div>
                <div class="space-y-2 text-xs">
                  <div class="flex justify-between">
                    <span class="text-neutral-600">Efficiency:</span>
                    <span class="text-neutral-400 font-mono">{(props.metadata!.parallelEfficiency * 100).toFixed(1)}%</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-neutral-600">Rating:</span>
                    <span class="text-cyan-400 font-mono">{performanceAnalysis?.parallelRating}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-neutral-600">Memory:</span>
                    <span class="text-neutral-400 font-mono">{props.metadata!.memoryUsage.toFixed(1)}MB</span>
                  </div>
                </div>
              </div>

              <div class="bg-gradient-to-r from-neutral-900/50 to-cyan-900/20 rounded-lg p-3">
                <div class="text-xs text-cyan-400 font-mono uppercase mb-2">Rust Performance</div>
                <div class="text-xs text-neutral-400 leading-relaxed">
                  Zero-cost abstractions and SIMD optimization deliver mathematical precision at silicon speed.
                  Each iteration computed with memory safety guaranteed.
                </div>
              </div>
            </div>
          </Show>

          {/* Theoretical Background */}
          <Show when={activeSection() === 'theory'}>
            <div class="p-4 space-y-4">
              <div>
                <h4 class="text-sm font-mono text-neutral-300 mb-2">{theoreticalInfo.title}</h4>
                <p class="text-xs text-neutral-500 leading-relaxed mb-3">
                  {theoreticalInfo.definition}
                </p>
              </div>

              <div class="bg-neutral-900/50 rounded-lg p-3">
                <div class="text-xs text-neutral-500 font-mono uppercase mb-2">Mathematical Formula</div>
                <div class="text-sm font-mono text-neutral-300 bg-black/50 rounded p-2 text-center">
                  {theoreticalInfo.equation}
                </div>
              </div>

              <div class="bg-neutral-900/50 rounded-lg p-3">
                <div class="text-xs text-neutral-500 font-mono uppercase mb-2">Properties</div>
                <div class="space-y-1">
                  <For each={theoreticalInfo.properties}>
                    {(property) => (
                      <div class="flex items-start gap-2 text-xs">
                        <span class="text-cyan-400 mt-1">•</span>
                        <span class="text-neutral-400">{property}</span>
                      </div>
                    )}
                  </For>
                </div>
              </div>

              <div class="space-y-2 text-xs">
                <div class="flex justify-between">
                  <span class="text-neutral-600">Discovered:</span>
                  <span class="text-neutral-400">{theoreticalInfo.discoverer}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-neutral-600">Dimension:</span>
                  <span class="text-neutral-400 font-mono">{theoreticalInfo.dimension}</span>
                </div>
              </div>

              <div class="border-t border-neutral-800 pt-3">
                <p class="text-xs text-neutral-600 italic leading-relaxed">
                  {theoreticalInfo.significance}
                </p>
              </div>
            </div>
          </Show>

          {/* Footer */}
          <div class="p-3 border-t border-neutral-800 bg-neutral-900/30">
            <div class="text-xs text-neutral-600 text-center font-mono">
              "Mathematics is the language with which God has written the universe." - Galileo
            </div>
          </div>
        </Card>
      </div>
    </Show>
  );
};
