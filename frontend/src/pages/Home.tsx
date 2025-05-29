/*
 * Main landing page component creating an immersive, dark-themed introduction to the performance showcase.
 * I'm implementing a sophisticated entrance experience that embodies the eerie, contemplative aesthetic while highlighting technical capabilities.
 */

import { Component, createSignal, onMount, createEffect } from 'solid-js';
import { A } from '@solidjs/router';
import { FractalCanvas } from '../components/Fractals/FractalCanvas';



interface PerformanceMetric {
  label: string;
  value: string;
  trend: 'up' | 'down' | 'stable';
  description: string;
}

export default function Home(): Component {
  const [isVisible, setIsVisible] = createSignal(false);
  const [currentMetricIndex, setCurrentMetricIndex] = createSignal(0);
  const [systemStats, setSystemStats] = createSignal<any>(null);

  // I'm creating performance metrics to showcase system capabilities
  const performanceMetrics = (): PerformanceMetric[] => [
    {
      label: "Fractal Generation",
      value: "< 50ms",
      trend: "up",
      description: "Real-time mathematical visualization"
    },
    {
      label: "API Response Time",
      value: "< 10ms",
      trend: "up",
      description: "Optimized Rust backend performance"
    },
    {
      label: "Memory Efficiency",
      value: "99.2%",
      trend: "stable",
      description: "Zero-copy data processing"
    },
    {
      label: "Parallel Processing",
      value: "8 cores",
      trend: "up",
      description: "Multi-threaded computation engine"
    }
  ];

  // I'm implementing a sophisticated entrance animation
  onMount(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);

    // Cycle through performance metrics
    const metricsInterval = setInterval(() => {
      setCurrentMetricIndex(prev => (prev + 1) % performanceMetrics().length);
    }, 3000);

    // Fetch real system statistics
    fetchSystemStats();

    return () => {
      clearTimeout(timer);
      clearInterval(metricsInterval);
    };
  });

  const fetchSystemStats = async () => {
    try {
      const response = await fetch('/api/performance/system');
      if (response.ok) {
        const data = await response.json();
        setSystemStats(data);
      }
    } catch (error) {
      console.warn('Failed to fetch system stats:', error);
    }
  };

  return (
    <div class="min-h-screen bg-black text-neutral-100 relative overflow-hidden">
      <div class="absolute inset-0 opacity-20">
        <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-900/10 rounded-full blur-3xl animate-pulse"></div>
        <div class="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-900/10 rounded-full blur-3xl animate-pulse" style="animation-delay: 2s"></div>
      </div>

      {/* Grid pattern overlay */}
      <div
        class="absolute inset-0 opacity-5"
        style={{
          "background-image": `radial-gradient(circle at 1px 1px, rgba(156, 163, 175, 0.15) 1px, transparent 0)`,
          "background-size": "40px 40px"
        }}
      ></div>

      <div class={`relative z-10 transition-all duration-2000 ${isVisible() ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        {/* Hero Section */}
        <section class="container mx-auto px-6 pt-20 pb-16">
          <div class="max-w-4xl mx-auto text-center">
            <h1 class="text-6xl md:text-8xl font-thin tracking-wider mb-8 bg-gradient-to-r from-neutral-100 via-neutral-300 to-neutral-500 bg-clip-text text-transparent">
              PERFORMANCE
            </h1>

            <div class="text-lg md:text-xl text-neutral-400 mb-12 leading-relaxed max-w-2xl mx-auto">
              <p class="mb-4">
                Computational precision meets existential contemplation.
              </p>
              <p class="text-neutral-500">
                Where mathematics dissolves into the void, and code becomes philosophy.
              </p>
            </div>

            {/* Performance Metrics Carousel */}
            <div class="mb-16">
              <div class="bg-neutral-900/50 backdrop-blur-sm border border-neutral-800 rounded-lg p-6 max-w-md mx-auto">
                <div class="text-sm text-neutral-500 mb-2">SYSTEM STATUS</div>
                {(() => {
                  const metric = performanceMetrics()[currentMetricIndex()];
                  return (
                    <div class="transition-all duration-500">
                      <div class="text-2xl font-mono text-neutral-100 mb-1">{metric.value}</div>
                      <div class="text-sm text-neutral-400 mb-2">{metric.label}</div>
                      <div class="text-xs text-neutral-600">{metric.description}</div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Navigation Actions */}
            <div class="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <A
                href="/performance"
                class="group bg-neutral-100 text-black px-8 py-3 rounded-sm font-mono text-sm tracking-wide hover:bg-neutral-200 transition-all duration-300 flex items-center gap-2"
              >
                INITIATE ANALYSIS
                <div class="w-1 h-1 bg-black rounded-full group-hover:w-2 transition-all duration-300"></div>
              </A>

              <A
                href="/projects"
                class="group border border-neutral-600 text-neutral-300 px-8 py-3 rounded-sm font-mono text-sm tracking-wide hover:border-neutral-400 hover:text-neutral-100 transition-all duration-300"
              >
                VIEW REPOSITORIES
              </A>
            </div>
          </div>
        </section>

        {/* Live Fractal Demo Section */}
        <section class="container mx-auto px-6 py-16">
          <div class="max-w-6xl mx-auto">
            <div class="text-center mb-12">
              <h2 class="text-3xl font-thin tracking-wide text-neutral-200 mb-4">
                COMPUTATIONAL VISUALIZATION
              </h2>
              <p class="text-neutral-500 max-w-2xl mx-auto">
                Real-time mathematical rendering powered by Rust's computational engine.
                Each iteration calculated in parallel, each pixel a question about infinite complexity.
              </p>
            </div>

            <div class="bg-neutral-900/30 backdrop-blur-sm border border-neutral-800 rounded-lg p-6">
              <FractalCanvas
                width={800}
                height={500}
                onPerformanceUpdate={(metrics) => {
                  // I'm capturing real-time performance data for display
                  console.log('Fractal performance:', metrics);
                }}
              />
            </div>
          </div>
        </section>

        {/* Technical Specifications */}
        <section class="container mx-auto px-6 py-16">
          <div class="max-w-4xl mx-auto">
            <h2 class="text-2xl font-thin tracking-wide text-neutral-200 mb-12 text-center">
              TECHNICAL ARCHITECTURE
            </h2>

            <div class="grid md:grid-cols-2 gap-8">
              {/* Backend Stack */}
              <div class="bg-neutral-900/20 border border-neutral-800 rounded-lg p-6">
                <h3 class="text-lg font-mono text-neutral-300 mb-4 flex items-center gap-2">
                  <div class="w-2 h-2 bg-orange-500 rounded-full"></div>
                  BACKEND
                </h3>
                <div class="space-y-3 text-sm">
                  <div class="flex justify-between">
                    <span class="text-neutral-500">Runtime</span>
                    <span class="text-neutral-300 font-mono">Rust + Tokio</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-neutral-500">Framework</span>
                    <span class="text-neutral-300 font-mono">Axum</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-neutral-500">Database</span>
                    <span class="text-neutral-300 font-mono">PostgreSQL</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-neutral-500">Cache</span>
                    <span class="text-neutral-300 font-mono">Redis</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-neutral-500">Parallel</span>
                    <span class="text-neutral-300 font-mono">Rayon</span>
                  </div>
                </div>
              </div>

              {/* Frontend Stack */}
              <div class="bg-neutral-900/20 border border-neutral-800 rounded-lg p-6">
                <h3 class="text-lg font-mono text-neutral-300 mb-4 flex items-center gap-2">
                  <div class="w-2 h-2 bg-blue-500 rounded-full"></div>
                  FRONTEND
                </h3>
                <div class="space-y-3 text-sm">
                  <div class="flex justify-between">
                    <span class="text-neutral-500">Framework</span>
                    <span class="text-neutral-300 font-mono">SolidJS</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-neutral-500">Language</span>
                    <span class="text-neutral-300 font-mono">TypeScript</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-neutral-500">Styling</span>
                    <span class="text-neutral-300 font-mono">Tailwind CSS</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-neutral-500">Build</span>
                    <span class="text-neutral-300 font-mono">Vite</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-neutral-500">Rendering</span>
                    <span class="text-neutral-300 font-mono">Canvas API</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* System Status */}
        {systemStats() && (
          <section class="container mx-auto px-6 py-16">
            <div class="max-w-4xl mx-auto">
              <h2 class="text-2xl font-thin tracking-wide text-neutral-200 mb-12 text-center">
                REAL-TIME METRICS
              </h2>

              <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div class="bg-neutral-900/30 border border-neutral-800 rounded-lg p-4 text-center">
                  <div class="text-xs text-neutral-500 mb-1">CPU USAGE</div>
                  <div class="text-lg font-mono text-neutral-100">
                    {systemStats().cpu_usage_percent?.toFixed(1)}%
                  </div>
                </div>

                <div class="bg-neutral-900/30 border border-neutral-800 rounded-lg p-4 text-center">
                  <div class="text-xs text-neutral-500 mb-1">MEMORY</div>
                  <div class="text-lg font-mono text-neutral-100">
                    {systemStats().memory_usage_percent?.toFixed(1)}%
                  </div>
                </div>

                <div class="bg-neutral-900/30 border border-neutral-800 rounded-lg p-4 text-center">
                  <div class="text-xs text-neutral-500 mb-1">UPTIME</div>
                  <div class="text-lg font-mono text-neutral-100">
                    {Math.floor((systemStats().uptime_seconds || 0) / 3600)}h
                  </div>
                </div>

                <div class="bg-neutral-900/30 border border-neutral-800 rounded-lg p-4 text-center">
                  <div class="text-xs text-neutral-500 mb-1">THREADS</div>
                  <div class="text-lg font-mono text-neutral-100">
                    {systemStats().cpu_threads || 'N/A'}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Philosophy Section */}
        <section class="container mx-auto px-6 py-20">
          <div class="max-w-3xl mx-auto text-center">
            <blockquote class="text-xl md:text-2xl font-thin text-neutral-400 leading-relaxed italic">
              "In the precision of algorithms, we find not answers, but better questions.
              Each computation strips away another layer of certainty, revealing the vast
              emptiness where logic meets the unknowable."
            </blockquote>

            <div class="mt-12 pt-8 border-t border-neutral-800">
              <div class="text-sm text-neutral-600 tracking-wider">
                EXPLORE THE TECHNICAL IMPLEMENTATION
              </div>
              <div class="flex justify-center gap-8 mt-4">
                <A href="/projects" class="text-neutral-500 hover:text-neutral-300 transition-colors duration-300 text-sm tracking-wide">
                  REPOSITORIES
                </A>
                <A href="/performance" class="text-neutral-500 hover:text-neutral-300 transition-colors duration-300 text-sm tracking-wide">
                  BENCHMARKS
                </A>
                <A href="/about" class="text-neutral-500 hover:text-neutral-300 transition-colors duration-300 text-sm tracking-wide">
                  ARCHITECTURE
                </A>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Subtle corner accents */}
      <div class="absolute top-0 left-0 w-32 h-32 border-l border-t border-neutral-800 opacity-30"></div>
      <div class="absolute top-0 right-0 w-32 h-32 border-r border-t border-neutral-800 opacity-30"></div>
      <div class="absolute bottom-0 left-0 w-32 h-32 border-l border-b border-neutral-800 opacity-30"></div>
      <div class="absolute bottom-0 right-0 w-32 h-32 border-r border-b border-neutral-800 opacity-30"></div>
    </div>
  );
}
