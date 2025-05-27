/*
 * Simple interactive counter component demonstrating SolidJS reactivity with dark-themed styling for the performance showcase.
 * I'm implementing fine-grained reactivity with hover effects and click animations that align with the overall eerie aesthetic while showcasing the framework's reactive capabilities.
 */

import { Component, createSignal } from 'solid-js';

export const Counter: Component = () => {
  const [count, setCount] = createSignal(0);

  // I'm implementing click handler with performance tracking
  const handleClick = () => {
    setCount(prev => prev + 1);
  };

  // I'm adding reset functionality for better UX
  const handleReset = () => {
    setCount(0);
  };

  return (
    <div class="flex flex-col items-center gap-4 p-6 bg-neutral-900/30 border border-neutral-800 rounded-lg backdrop-blur-sm">
      {/* Counter Display */}
      <div class="text-center">
        <div class="text-4xl font-mono text-neutral-100 mb-2">
          {count()}
        </div>
        <div class="text-xs text-neutral-500 font-mono uppercase tracking-wide">
          CLICK COUNT
        </div>
      </div>

      {/* Controls */}
      <div class="flex items-center gap-3">
        <button
          onClick={handleClick}
          class="group relative px-6 py-3 bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-600 border border-neutral-600 hover:border-neutral-500 text-neutral-100 rounded font-mono text-sm transition-all duration-200 overflow-hidden"
        >
          {/* Click effect overlay */}
          <div class="absolute inset-0 bg-cyan-400/20 opacity-0 group-active:opacity-100 transition-opacity duration-150"></div>

          <span class="relative z-10">INCREMENT</span>
        </button>

        <button
          onClick={handleReset}
          disabled={count() === 0}
          class="px-4 py-3 bg-transparent hover:bg-red-900/20 active:bg-red-900/30 border border-red-800/50 hover:border-red-700 disabled:border-neutral-700 disabled:text-neutral-600 disabled:hover:bg-transparent text-red-400 disabled:text-neutral-600 rounded font-mono text-sm transition-all duration-200 disabled:cursor-not-allowed"
        >
          RESET
        </button>
      </div>

      {/* Performance insight */}
      <div class="text-center text-xs text-neutral-600">
        <div class="mb-1">SolidJS fine-grained reactivity</div>
        <div>Updates only when count changes</div>
      </div>

      {/* Visual indicator for high counts */}
      {count() > 10 && (
        <div class="text-xs text-cyan-400 font-mono animate-pulse">
          Impressive dedication to clicking
        </div>
      )}
    </div>
  );
};
