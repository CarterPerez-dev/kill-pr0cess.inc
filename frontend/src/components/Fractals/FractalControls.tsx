/*
 * Interactive fractal parameter controls providing real-time adjustment of mathematical visualization parameters with immediate visual feedback.
 * I'm implementing comprehensive controls for zoom, center position, iterations, and fractal-specific parameters while maintaining the dark, eerie aesthetic throughout the control interface.
 */

import { Component, createSignal, createEffect, Show, For } from 'solid-js';
import { Card } from '../UI/Card';

interface FractalControlsProps {
  fractalType: 'mandelbrot' | 'julia';
  parameters: {
    zoom: number;
    centerX: number;
    centerY: number;
    maxIterations: number;
    juliaConstant?: { real: number; imag: number };
  };
  onParameterChange: (params: Partial<FractalControlsProps['parameters']>) => void;
  isGenerating?: boolean;
  performanceMetrics?: {
    computationTime: number;
    pixelsPerSecond: number;
    parallelEfficiency: number;
  };
}

export const FractalControls: Component<FractalControlsProps> = (props) => {
  const [isExpanded, setIsExpanded] = createSignal(true);
  const [activeTab, setActiveTab] = createSignal<'basic' | 'advanced' | 'presets'>('basic');

  // I'm creating preset configurations for common fractal views
  const presets = () => [
    {
      name: 'Classic Mandelbrot',
      type: 'mandelbrot' as const,
      params: { zoom: 1.0, centerX: -0.5, centerY: 0.0, maxIterations: 100 }
    },
    {
      name: 'Seahorse Valley',
      type: 'mandelbrot' as const,
      params: { zoom: 1000, centerX: -0.743643887037151, centerY: 0.13182590420533, maxIterations: 300 }
    },
    {
      name: 'Lightning',
      type: 'mandelbrot' as const,
      params: { zoom: 100, centerX: -1.8, centerY: 0, maxIterations: 250 }
    },
    {
      name: 'Classic Julia',
      type: 'julia' as const,
      params: { zoom: 1.0, centerX: 0.0, centerY: 0.0, maxIterations: 150, juliaConstant: { real: -0.7, imag: 0.27015 } }
    },
    {
      name: 'Dragon Julia',
      type: 'julia' as const,
      params: { zoom: 1.0, centerX: 0.0, centerY: 0.0, maxIterations: 200, juliaConstant: { real: -0.8, imag: 0.156 } }
    }
  ];

  const formatNumber = (num: number, decimals: number = 6): string => {
    if (Math.abs(num) > 1000) {
      return num.toExponential(3);
    }
    return num.toFixed(decimals);
  };

  const getPerformanceRating = (pixelsPerSecond: number): string => {
    if (pixelsPerSecond > 10000) return 'Exceptional';
    if (pixelsPerSecond > 5000) return 'Excellent';
    if (pixelsPerSecond > 2000) return 'Very Good';
    if (pixelsPerSecond > 1000) return 'Good';
    if (pixelsPerSecond > 500) return 'Fair';
    return 'Needs Optimization';
  };

  return (
    <div class="fixed top-4 right-4 w-80 z-20">
      <Card variant="glass" padding="none" class="backdrop-blur-md border-neutral-700">
        {/* Header */}
        <div class="flex items-center justify-between p-4 border-b border-neutral-700">
          <h3 class="font-mono text-sm text-neutral-300 tracking-wide">
            FRACTAL CONTROLS
          </h3>
          <button
            onClick={() => setIsExpanded(!isExpanded())}
            class="text-neutral-500 hover:text-neutral-300 transition-colors duration-200"
          >
            {isExpanded() ? '−' : '+'}
          </button>
        </div>

        <Show when={isExpanded()}>
          {/* Tab Navigation */}
          <div class="flex border-b border-neutral-800">
            {(['basic', 'advanced', 'presets'] as const).map((tab) => (
              <button
                onClick={() => setActiveTab(tab)}
                class={`flex-1 px-3 py-2 text-xs font-mono uppercase tracking-wide transition-colors duration-200 ${
                  activeTab() === tab
                    ? 'bg-neutral-800 text-neutral-200 border-b-2 border-cyan-400'
                    : 'text-neutral-500 hover:text-neutral-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Basic Controls */}
          <Show when={activeTab() === 'basic'}>
            <div class="p-4 space-y-4">
              {/* Zoom Control */}
              <div>
                <div class="flex justify-between items-center mb-2">
                  <label class="text-xs text-neutral-500 font-mono uppercase">Zoom</label>
                  <span class="text-xs text-neutral-400 font-mono">
                    {formatNumber(props.parameters.zoom)}
                  </span>
                </div>
                <input
                  type="range"
                  min={Math.log10(0.1)}
                  max={Math.log10(1e12)}
                  step="0.1"
                  value={Math.log10(props.parameters.zoom)}
                  onInput={(e) => props.onParameterChange({
                    zoom: Math.pow(10, parseFloat(e.currentTarget.value))
                  })}
                  class="w-full h-2 bg-neutral-800 rounded-lg appearance-none slider cursor-pointer"
                  disabled={props.isGenerating}
                />
              </div>

              {/* Center X Control */}
              <div>
                <div class="flex justify-between items-center mb-2">
                  <label class="text-xs text-neutral-500 font-mono uppercase">Center X</label>
                  <span class="text-xs text-neutral-400 font-mono">
                    {formatNumber(props.parameters.centerX)}
                  </span>
                </div>
                <input
                  type="range"
                  min="-2"
                  max="2"
                  step="0.001"
                  value={props.parameters.centerX}
                  onInput={(e) => props.onParameterChange({
                    centerX: parseFloat(e.currentTarget.value)
                  })}
                  class="w-full h-2 bg-neutral-800 rounded-lg appearance-none slider cursor-pointer"
                  disabled={props.isGenerating}
                />
              </div>

              {/* Center Y Control */}
              <div>
                <div class="flex justify-between items-center mb-2">
                  <label class="text-xs text-neutral-500 font-mono uppercase">Center Y</label>
                  <span class="text-xs text-neutral-400 font-mono">
                    {formatNumber(props.parameters.centerY)}
                  </span>
                </div>
                <input
                  type="range"
                  min="-2"
                  max="2"
                  step="0.001"
                  value={props.parameters.centerY}
                  onInput={(e) => props.onParameterChange({
                    centerY: parseFloat(e.currentTarget.value)
                  })}
                  class="w-full h-2 bg-neutral-800 rounded-lg appearance-none slider cursor-pointer"
                  disabled={props.isGenerating}
                />
              </div>

              {/* Max Iterations */}
              <div>
                <div class="flex justify-between items-center mb-2">
                  <label class="text-xs text-neutral-500 font-mono uppercase">Iterations</label>
                  <span class="text-xs text-neutral-400 font-mono">
                    {props.parameters.maxIterations}
                  </span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="2000"
                  step="10"
                  value={props.parameters.maxIterations}
                  onInput={(e) => props.onParameterChange({
                    maxIterations: parseInt(e.currentTarget.value)
                  })}
                  class="w-full h-2 bg-neutral-800 rounded-lg appearance-none slider cursor-pointer"
                  disabled={props.isGenerating}
                />
              </div>

              {/* Julia Constant Controls */}
              <Show when={props.fractalType === 'julia'}>
                <div class="pt-3 border-t border-neutral-800">
                  <div class="text-xs text-neutral-500 font-mono uppercase mb-3">Julia Constant</div>

                  <div class="space-y-3">
                    <div>
                      <div class="flex justify-between items-center mb-2">
                        <label class="text-xs text-neutral-600">Real</label>
                        <span class="text-xs text-neutral-400 font-mono">
                          {formatNumber(props.parameters.juliaConstant?.real || 0, 4)}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="-2"
                        max="2"
                        step="0.01"
                        value={props.parameters.juliaConstant?.real || 0}
                        onInput={(e) => props.onParameterChange({
                          juliaConstant: {
                            real: parseFloat(e.currentTarget.value),
                            imag: props.parameters.juliaConstant?.imag || 0
                          }
                        })}
                        class="w-full h-2 bg-neutral-800 rounded-lg appearance-none slider cursor-pointer"
                        disabled={props.isGenerating}
                      />
                    </div>

                    <div>
                      <div class="flex justify-between items-center mb-2">
                        <label class="text-xs text-neutral-600">Imaginary</label>
                        <span class="text-xs text-neutral-400 font-mono">
                          {formatNumber(props.parameters.juliaConstant?.imag || 0, 4)}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="-2"
                        max="2"
                        step="0.01"
                        value={props.parameters.juliaConstant?.imag || 0}
                        onInput={(e) => props.onParameterChange({
                          juliaConstant: {
                            real: props.parameters.juliaConstant?.real || 0,
                            imag: parseFloat(e.currentTarget.value)
                          }
                        })}
                        class="w-full h-2 bg-neutral-800 rounded-lg appearance-none slider cursor-pointer"
                        disabled={props.isGenerating}
                      />
                    </div>
                  </div>
                </div>
              </Show>
            </div>
          </Show>

          {/* Advanced Controls */}
          <Show when={activeTab() === 'advanced'}>
            <div class="p-4 space-y-4">
              {/* Performance Metrics */}
              <Show when={props.performanceMetrics}>
                <div class="bg-neutral-900/50 rounded-lg p-3 space-y-2">
                  <div class="text-xs text-neutral-500 font-mono uppercase mb-2">Performance</div>

                  <div class="flex justify-between text-xs">
                    <span class="text-neutral-600">Computation:</span>
                    <span class="text-neutral-400 font-mono">
                      {props.performanceMetrics!.computationTime}ms
                    </span>
                  </div>

                  <div class="flex justify-between text-xs">
                    <span class="text-neutral-600">Pixels/sec:</span>
                    <span class="text-neutral-400 font-mono">
                      {Math.round(props.performanceMetrics!.pixelsPerSecond).toLocaleString()}
                    </span>
                  </div>

                  <div class="flex justify-between text-xs">
                    <span class="text-neutral-600">Parallel Eff:</span>
                    <span class="text-neutral-400 font-mono">
                      {(props.performanceMetrics!.parallelEfficiency * 100).toFixed(1)}%
                    </span>
                  </div>

                  <div class="flex justify-between text-xs">
                    <span class="text-neutral-600">Rating:</span>
                    <span class="text-cyan-400 font-mono text-xs">
                      {getPerformanceRating(props.performanceMetrics!.pixelsPerSecond)}
                    </span>
                  </div>
                </div>
              </Show>

              {/* Manual Input Fields */}
              <div class="space-y-3">
                <div class="text-xs text-neutral-500 font-mono uppercase">Manual Input</div>

                <div class="grid grid-cols-2 gap-2">
                  <div>
                    <label class="text-xs text-neutral-600 block mb-1">Center X</label>
                    <input
                      type="number"
                      step="0.000001"
                      value={props.parameters.centerX}
                      onInput={(e) => props.onParameterChange({
                        centerX: parseFloat(e.currentTarget.value)
                      })}
                      class="w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs font-mono text-neutral-300 focus:border-cyan-400 focus:outline-none"
                      disabled={props.isGenerating}
                    />
                  </div>

                  <div>
                    <label class="text-xs text-neutral-600 block mb-1">Center Y</label>
                    <input
                      type="number"
                      step="0.000001"
                      value={props.parameters.centerY}
                      onInput={(e) => props.onParameterChange({
                        centerY: parseFloat(e.currentTarget.value)
                      })}
                      class="w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs font-mono text-neutral-300 focus:border-cyan-400 focus:outline-none"
                      disabled={props.isGenerating}
                    />
                  </div>
                </div>

                <div>
                  <label class="text-xs text-neutral-600 block mb-1">Zoom Level</label>
                  <input
                    type="number"
                    step="0.1"
                    value={props.parameters.zoom}
                    onInput={(e) => props.onParameterChange({
                      zoom: parseFloat(e.currentTarget.value)
                    })}
                    class="w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs font-mono text-neutral-300 focus:border-cyan-400 focus:outline-none"
                    disabled={props.isGenerating}
                  />
                </div>
              </div>

              {/* Reset Button */}
              <button
                onClick={() => props.onParameterChange({
                  zoom: 1.0,
                  centerX: props.fractalType === 'mandelbrot' ? -0.5 : 0.0,
                  centerY: 0.0,
                  maxIterations: props.fractalType === 'mandelbrot' ? 100 : 150
                })}
                class="w-full mt-4 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 border border-neutral-600 text-neutral-300 rounded text-xs font-mono uppercase tracking-wide transition-colors duration-200"
                disabled={props.isGenerating}
              >
                Reset to Default
              </button>
            </div>
          </Show>

          {/* Presets */}
          <Show when={activeTab() === 'presets'}>
            <div class="p-4 space-y-2">
              <For each={presets().filter(p => p.type === props.fractalType)}>
                {(preset) => (
                  <button
                    onClick={() => props.onParameterChange(preset.params)}
                    class="w-full text-left p-3 bg-neutral-900/30 hover:bg-neutral-800/50 border border-neutral-800 hover:border-neutral-700 rounded transition-colors duration-200"
                    disabled={props.isGenerating}
                  >
                    <div class="text-xs font-mono text-neutral-300 mb-1">
                      {preset.name}
                    </div>
                    <div class="text-xs text-neutral-600">
                      Zoom: {preset.params.zoom} • Iterations: {preset.params.maxIterations}
                    </div>
                  </button>
                )}
              </For>
            </div>
          </Show>

          {/* Generation Status */}
          <Show when={props.isGenerating}>
            <div class="p-4 border-t border-neutral-800">
              <div class="flex items-center gap-2 text-xs text-neutral-500">
                <div class="w-3 h-3 border border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                <span class="font-mono">Computing fractal...</span>
              </div>
            </div>
          </Show>
        </Show>
      </Card>
    </div>
  );
};
