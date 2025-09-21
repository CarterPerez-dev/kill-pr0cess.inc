/*
 * Advanced loading spinner component providing multiple animation variants and states for asynchronous operations throughout the application.
 * I'm implementing various spinner types, sizes, and contextual loading messages that maintain the dark aesthetic while providing clear feedback during computation-intensive operations like fractal generation.
 */

import { Component, JSX, Show, createMemo } from 'solid-js';

interface LoadingSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'pulse' | 'dots' | 'bars' | 'fractal' | 'matrix';
  color?: 'primary' | 'secondary' | 'accent' | 'white';
  message?: string;
  overlay?: boolean;
  centered?: boolean;
  className?: string;
}

export const LoadingSpinner: Component<LoadingSpinnerProps> = (props) => {
  // I'm creating responsive size classes for different contexts
  const sizeClasses = createMemo(() => {
    const sizes = {
      xs: 'w-3 h-3',
      sm: 'w-4 h-4',
      md: 'w-6 h-6',
      lg: 'w-8 h-8',
      xl: 'w-12 h-12'
    };
    return sizes[props.size || 'md'];
  });

  // I'm defining color schemes that match the dark theme
  const colorClasses = createMemo(() => {
    const colors = {
      primary: 'text-cyan-400 border-cyan-400',
      secondary: 'text-indigo-400 border-indigo-400',
      accent: 'text-purple-400 border-purple-400',
      white: 'text-white border-white'
    };
    return colors[props.color || 'primary'];
  });

  // I'm implementing different spinner variants for various contexts
  const renderSpinner = () => {
    const variant = props.variant || 'default';
    const baseClasses = `${sizeClasses()} ${colorClasses()}`;

    switch (variant) {
      case 'default':
        return (
          <div class={`${baseClasses} border-2 border-t-transparent rounded-full animate-spin`}></div>
        );

      case 'pulse':
        return (
          <div class={`${baseClasses} bg-current rounded-full animate-pulse`}></div>
        );

      case 'dots':
        return (
          <div class="flex space-x-1">
            {[0, 1, 2].map((i) => (
              <div
                class={`w-2 h-2 bg-current rounded-full animate-bounce ${colorClasses()}`}
                style={{ 'animation-delay': `${i * 0.1}s` }}
              ></div>
            ))}
          </div>
        );

      case 'bars':
        return (
          <div class="flex space-x-1 items-end">
            {[0, 1, 2, 3].map((i) => (
              <div
                class={`w-1 bg-current animate-pulse ${colorClasses()}`}
                style={{
                  height: `${8 + (i % 2) * 4}px`,
                  'animation-delay': `${i * 0.15}s`,
                  'animation-duration': '0.8s'
                }}
              ></div>
            ))}
          </div>
        );

      case 'fractal':
        return (
          <div class={`${baseClasses} relative`}>
            <div class="absolute inset-0 border-2 border-t-transparent rounded-full animate-spin"></div>
            <div class="absolute inset-1 border border-r-transparent rounded-full animate-spin animation-reverse" style="animation-duration: 1.5s"></div>
            <div class="absolute inset-2 border border-b-transparent rounded-full animate-spin" style="animation-duration: 2s"></div>
          </div>
        );

      case 'matrix':
        return (
          <div class="flex flex-col space-y-1">
            {[0, 1, 2].map((row) => (
              <div class="flex space-x-1">
                {[0, 1, 2].map((col) => (
                  <div
                    class={`w-1 h-1 bg-current animate-pulse ${colorClasses()}`}
                    style={{
                      'animation-delay': `${(row * 3 + col) * 0.1}s`,
                      opacity: Math.random() > 0.5 ? 1 : 0.3
                    }}
                  ></div>
                ))}
              </div>
            ))}
          </div>
        );

      default:
        return (
          <div class={`${baseClasses} border-2 border-t-transparent rounded-full animate-spin`}></div>
        );
    }
  };

  const containerClasses = createMemo(() => {
    const baseClasses = 'flex items-center gap-3';
    const centerClasses = props.centered ? 'justify-center' : '';
    const overlayClasses = props.overlay
      ? 'fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center'
      : '';

    return [baseClasses, centerClasses, overlayClasses, props.className].filter(Boolean).join(' ');
  });

  return (
    <div class={containerClasses()}>
      <div class="flex items-center gap-3">
        {renderSpinner()}

        <Show when={props.message}>
          <div class="text-neutral-400 font-mono text-sm tracking-wide">
            {props.message}
          </div>
        </Show>
      </div>
    </div>
  );
};

// I'm creating specialized loading components for different contexts
export const FractalLoader: Component<{
  message?: string;
  progress?: number;
}> = (props) => {
  return (
    <div class="flex flex-col items-center gap-4 p-8">
      <LoadingSpinner
        variant="fractal"
        size="xl"
        color="primary"
      />

      <div class="text-center">
        <div class="text-neutral-300 font-mono text-sm mb-2">
          {props.message || "Computing fractal..."}
        </div>

        <Show when={props.progress !== undefined}>
          <div class="w-64 h-1 bg-neutral-800 rounded-full overflow-hidden">
            <div
              class="h-full bg-gradient-to-r from-cyan-400 to-indigo-400 rounded-full transition-all duration-300"
              style={{ width: `${props.progress}%` }}
            ></div>
          </div>
          <div class="text-xs text-neutral-500 font-mono mt-1">
            {props.progress?.toFixed(1)}%
          </div>
        </Show>
      </div>
    </div>
  );
};

export const SystemLoader: Component<{
  systems: Array<{ name: string; status: 'loading' | 'complete' | 'error' }>;
}> = (props) => {
  return (
    <div class="space-y-3">
      {props.systems.map((system) => (
        <div class="flex items-center gap-3 p-3 bg-neutral-900/30 rounded border border-neutral-800">
          <div class="flex-shrink-0">
            {system.status === 'loading' && (
              <LoadingSpinner size="sm" variant="dots" />
            )}
            {system.status === 'complete' && (
              <div class="w-4 h-4 text-green-400">✓</div>
            )}
            {system.status === 'error' && (
              <div class="w-4 h-4 text-red-400">✕</div>
            )}
          </div>

          <div class="flex-1">
            <div class="text-sm font-mono text-neutral-300">
              {system.name}
            </div>
          </div>

          <div class="text-xs font-mono text-neutral-500">
            {system.status.toUpperCase()}
          </div>
        </div>
      ))}
    </div>
  );
};

export const BenchmarkLoader: Component<{
  currentTest?: string;
  completed: number;
  total: number;
}> = (props) => {
  const progress = () => (props.completed / props.total) * 100;

  return (
    <div class="text-center space-y-6 p-8">
      <LoadingSpinner
        variant="bars"
        size="lg"
        color="accent"
      />

      <div>
        <h3 class="text-lg font-mono text-neutral-200 mb-2">
          RUNNING BENCHMARK SUITE
        </h3>

        <Show when={props.currentTest}>
          <p class="text-sm text-neutral-400 mb-4">
            Currently testing: <span class="text-neutral-300 font-mono">{props.currentTest}</span>
          </p>
        </Show>

        <div class="space-y-2">
          <div class="flex justify-between text-xs font-mono text-neutral-500">
            <span>Progress</span>
            <span>{props.completed} / {props.total}</span>
          </div>

          <div class="w-80 h-2 bg-neutral-800 rounded-full overflow-hidden mx-auto">
            <div
              class="h-full bg-gradient-to-r from-purple-400 to-pink-400 rounded-full transition-all duration-500"
              style={{ width: `${progress()}%` }}
            ></div>
          </div>
        </div>
      </div>

      <p class="text-xs text-neutral-600 italic max-w-sm mx-auto">
        Performance testing requires precision. Each measurement brings us closer to computational truth.
      </p>
    </div>
  );
};

export const NetworkLoader: Component<{
  endpoint?: string;
  timeout?: number;
}> = (props) => {
  return (
    <div class="flex items-center gap-3 p-4">
      <LoadingSpinner
        variant="pulse"
        size="sm"
        color="secondary"
      />

      <div class="text-sm text-neutral-400">
        <Show when={props.endpoint} fallback="Loading...">
          Connecting to <span class="font-mono text-neutral-300">{props.endpoint}</span>
        </Show>

        <Show when={props.timeout}>
          <div class="text-xs text-neutral-600 mt-1">
            Timeout: {props.timeout}ms
          </div>
        </Show>
      </div>
    </div>
  );
};

// I'm adding custom CSS animations for the spinner variants
export const injectSpinnerStyles = () => {
  const style = document.createElement('style');
  style.textContent = `
    .animation-reverse {
      animation-direction: reverse;
    }

    @keyframes matrix-flicker {
      0%, 100% { opacity: 0.3; }
      50% { opacity: 1; }
    }

    .matrix-flicker {
      animation: matrix-flicker 0.5s ease-in-out infinite;
    }

    @keyframes fractal-spin {
      0% { transform: rotate(0deg) scale(1); }
      50% { transform: rotate(180deg) scale(1.1); }
      100% { transform: rotate(360deg) scale(1); }
    }

    .fractal-spin {
      animation: fractal-spin 2s linear infinite;
    }
  `;

  if (!document.getElementById('spinner-styles')) {
    style.id = 'spinner-styles';
    document.head.appendChild(style);
  }
};
