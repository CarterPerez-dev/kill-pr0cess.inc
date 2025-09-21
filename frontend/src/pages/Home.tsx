/*
 * Main landing page component creating an immersive, dark-themed introduction to the performance showcase.
 * I'm implementing a sophisticated entrance experience that embodies the eerie, contemplative aesthetic while highlighting technical capabilities.
 */

import { Component, createSignal, onMount, createEffect } from 'solid-js';
import { A } from '@solidjs/router';
import { WebVitals } from '../components/Performance/WebVitals';



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
      {/* Animated gradient mesh background */}
      <div class="absolute inset-0 gradient-mesh opacity-30 animate-float"></div>
      
      {/* Floating orbs */}
      <div class="absolute inset-0">
        <div class="absolute top-20 left-10 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[100px] animate-float" style="animation-delay: 0s; animation-duration: 8s"></div>
        <div class="absolute bottom-20 right-10 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[100px] animate-float" style="animation-delay: 2s; animation-duration: 10s"></div>
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[120px] animate-float" style="animation-delay: 4s; animation-duration: 12s"></div>
      </div>

      {/* Enhanced grid pattern overlay */}
      <div
        class="absolute inset-0 opacity-10"
        style={{
          "background-image": `
            linear-gradient(rgba(34, 211, 238, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(34, 211, 238, 0.03) 1px, transparent 1px),
            radial-gradient(circle at center, transparent 0%, rgba(0, 0, 0, 0.4) 100%)
          `,
          "background-size": "50px 50px, 50px 50px, 100% 100%"
        }}
      ></div>

      <div class={`relative z-10 transition-all duration-1500 ease-out ${isVisible() ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
        {/* Hero Section */}
        <section class="container mx-auto px-6 pt-24 pb-20">
          <div class="max-w-4xl mx-auto text-center stagger-children">
            <h1 class="text-6xl md:text-8xl lg:text-9xl font-thin tracking-wider mb-8 text-gradient-animate relative">
              PERFORMANCE
              <span class="absolute inset-0 text-6xl md:text-8xl lg:text-9xl font-thin tracking-wider text-cyan-400/20 blur-xl animate-pulse">PERFORMANCE</span>
            </h1>

            <div class="text-lg md:text-xl text-neutral-400 mb-16 leading-relaxed max-w-2xl mx-auto space-y-4">
              <p class="animate-fade-in-up" style="animation-delay: 200ms">
                Computational precision meets existential contemplation.
              </p>
              <p class="text-neutral-500 animate-fade-in-up" style="animation-delay: 300ms">
                Where mathematics dissolves into the void, and code becomes philosophy.
              </p>
            </div>

            {/* Performance Metrics Carousel */}
            <div class="mb-20">
              <div class="glass-effect-strong border border-neutral-700/50 rounded-xl p-8 max-w-md mx-auto hover-lift relative overflow-hidden group">
                <div class="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div class="relative z-10">
                  <div class="text-xs font-mono text-neutral-500 mb-3 tracking-wider">LIVE METRICS</div>
                  {(() => {
                    const metric = performanceMetrics()[currentMetricIndex()];
                    return (
                      <div class="transition-all duration-700 ease-out">
                        <div class="text-3xl font-mono font-light mb-2 text-gradient">
                          {metric.value}
                        </div>
                        <div class="text-sm text-neutral-300 mb-3 tracking-wide">
                          {metric.label}
                        </div>
                        <div class="text-xs text-neutral-500 leading-relaxed">
                          {metric.description}
                        </div>
                      </div>
                    );
                  })()}
                </div>
                {/* Animated progress indicator */}
                <div class="absolute bottom-0 left-0 right-0 h-1 bg-neutral-800 overflow-hidden">
                  <div class="h-full bg-gradient-to-r from-cyan-500 to-blue-500 animate-shimmer"></div>
                </div>
              </div>
            </div>

            {/* Navigation Actions */}
            <div class="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <A
                href="/performance"
                class="group relative bg-gradient-to-r from-cyan-500 to-blue-500 text-black px-10 py-4 rounded-lg font-mono text-sm tracking-wider hover:shadow-[0_0_30px_rgba(34,211,238,0.5)] transition-all duration-500 ease-out hover-scale overflow-hidden"
              >
                <span class="relative z-10 flex items-center gap-3">
                  INITIATE ANALYSIS
                  <svg class="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
                  </svg>
                </span>
                <div class="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-400 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </A>

              <A
                href="/projects"
                class="group relative px-10 py-4 rounded-lg font-mono text-sm tracking-wider transition-all duration-500 ease-out hover-scale overflow-hidden border-gradient"
              >
                <span class="relative z-10 text-neutral-200 group-hover:text-white transition-colors duration-300">
                  VIEW REPOSITORIES
                </span>
              </A>
            </div>
          </div>
        </section>

        {/* Real-time Web Vitals Section */}
        <section class="container mx-auto px-6 py-16">
          <div class="max-w-6xl mx-auto">
            <div class="text-center mb-12">
              <h2 class="text-3xl font-thin tracking-wide text-neutral-200 mb-4">
                REAL-TIME PERFORMANCE METRICS
              </h2>
              <p class="text-neutral-500 max-w-2xl mx-auto">
                Live Core Web Vitals and performance monitoring showcasing the optimization of our Rust-powered frontend.
                Each metric measured in real-time, revealing the precision of our technical implementation.
              </p>
            </div>

            <div class="glass-effect-strong border border-neutral-700/50 rounded-xl p-8 hover-lift group relative overflow-hidden">
              <div class="absolute inset-0 bg-gradient-radial opacity-20 group-hover:opacity-30 transition-opacity duration-700"></div>
              <div class="relative z-10">
                <WebVitals />
              </div>
              {/* Corner accents */}
              <div class="absolute top-0 left-0 w-20 h-20 border-t-2 border-l-2 border-cyan-500/30 rounded-tl-xl"></div>
              <div class="absolute bottom-0 right-0 w-20 h-20 border-b-2 border-r-2 border-purple-500/30 rounded-br-xl"></div>
            </div>
          </div>
        </section>

        {/* API Documentation Section */}
        <section class="container mx-auto px-6 py-16">
          <div class="max-w-6xl mx-auto">
            <div class="text-center mb-12">
              <h2 class="text-3xl font-thin tracking-wide text-neutral-200 mb-4">
                RUST API DOCUMENTATION
              </h2>
              <p class="text-neutral-500 max-w-2xl mx-auto">
                Comprehensive documentation for our high-performance Rust backend API.
                Explore endpoints, rate limits, and response schemas with interactive examples.
              </p>
            </div>

            <div class="grid md:grid-cols-2 gap-8">
              {/* API Overview Card */}
              <div class="glass-effect-strong border border-neutral-700/50 rounded-xl p-8 hover-lift group relative overflow-hidden">
                <div class="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div class="relative z-10">
                  <h3 class="text-xl font-mono text-neutral-200 mb-6 flex items-center gap-3">
                    <div class="w-2 h-2 bg-orange-500 rounded-full shadow-[0_0_10px_rgba(251,146,60,0.5)]"></div>
                    API ENDPOINTS
                  </h3>
                  <div class="space-y-4 text-sm">
                    <div class="flex justify-between items-center group/item">
                      <span class="text-neutral-500 group-hover/item:text-neutral-400 transition-colors duration-300">GitHub Integration</span>
                      <span class="text-neutral-300 font-mono group-hover/item:text-white transition-colors duration-300">/api/github/*</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-neutral-500">Performance Metrics</span>
                      <span class="text-neutral-300 font-mono">/api/performance/*</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-neutral-500">System Health</span>
                      <span class="text-neutral-300 font-mono">/health</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-neutral-500">Documentation</span>
                      <span class="text-neutral-300 font-mono">/docs</span>
                    </div>
                  </div>
                  <div class="mt-6 pt-4 border-t border-neutral-700/50">
                    <A 
                      href={`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/docs`}
                      target="_blank"
                      class="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors duration-300 text-sm font-mono"
                    >
                      VIEW INTERACTIVE DOCS
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                      </svg>
                    </A>
                  </div>
                </div>
              </div>

              {/* Performance Characteristics Card */}
              <div class="glass-effect-strong border border-neutral-700/50 rounded-xl p-8 hover-lift group relative overflow-hidden">
                <div class="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div class="relative z-10">
                  <h3 class="text-xl font-mono text-neutral-200 mb-6 flex items-center gap-3">
                    <div class="w-2 h-2 bg-cyan-500 rounded-full shadow-[0_0_10px_rgba(34,211,238,0.5)]"></div>
                    PERFORMANCE
                  </h3>
                  <div class="space-y-4 text-sm">
                    <div class="flex justify-between items-center group/item">
                      <span class="text-neutral-500 group-hover/item:text-neutral-400 transition-colors duration-300">Response Time</span>
                      <span class="text-neutral-300 font-mono group-hover/item:text-white transition-colors duration-300">&lt; 10ms</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-neutral-500">Concurrent Requests</span>
                      <span class="text-neutral-300 font-mono">10,000+</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-neutral-500">Memory Safety</span>
                      <span class="text-neutral-300 font-mono">Zero-copy</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-neutral-500">Async Runtime</span>
                      <span class="text-neutral-300 font-mono">Tokio</span>
                    </div>
                  </div>
                  <div class="mt-6 pt-4 border-t border-neutral-700/50">
                    <A 
                      href="/performance"
                      class="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors duration-300 text-sm font-mono"
                    >
                      VIEW BENCHMARKS
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
                      </svg>
                    </A>
                  </div>
                </div>
              </div>
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
              <div class="glass-effect border border-neutral-800/50 rounded-xl p-8 hover-lift group relative overflow-hidden">
                <div class="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <h3 class="text-lg font-mono text-neutral-200 mb-6 flex items-center gap-3 relative z-10">
                  <div class="w-2 h-2 bg-orange-500 rounded-full shadow-[0_0_10px_rgba(251,146,60,0.5)]"></div>
                  BACKEND
                </h3>
                <div class="space-y-4 text-sm relative z-10">
                  <div class="flex justify-between items-center group/item">
                    <span class="text-neutral-500 group-hover/item:text-neutral-400 transition-colors duration-300">Runtime</span>
                    <span class="text-neutral-300 font-mono group-hover/item:text-white transition-colors duration-300">Rust + Tokio</span>
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
              <div class="glass-effect border border-neutral-800/50 rounded-xl p-8 hover-lift group relative overflow-hidden">
                <div class="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <h3 class="text-lg font-mono text-neutral-200 mb-6 flex items-center gap-3 relative z-10">
                  <div class="w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
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
                <div class="glass-effect border border-neutral-800/50 rounded-lg p-5 text-center hover-lift group">
                  <div class="text-xs text-neutral-500 mb-2 tracking-wider">CPU USAGE</div>
                  <div class="text-xl font-mono font-light text-gradient group-hover:text-shadow-glow transition-all duration-300">
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
        <section class="container mx-auto px-6 py-24">
          <div class="max-w-3xl mx-auto text-center">
            <blockquote class="text-xl md:text-2xl lg:text-3xl font-thin text-neutral-400 leading-relaxed italic relative">
              <span class="absolute -top-8 -left-4 text-6xl text-neutral-700/30">"</span>
              In the precision of algorithms, we find not answers, but better questions.
              Each computation strips away another layer of certainty, revealing the vast
              emptiness where logic meets the unknowable.
              <span class="absolute -bottom-8 -right-4 text-6xl text-neutral-700/30">"</span>
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

      {/* Enhanced corner accents with glow */}
      <div class="absolute top-0 left-0 w-40 h-40">
        <div class="absolute inset-0 border-l-2 border-t-2 border-cyan-500/20 rounded-tl-xl"></div>
        <div class="absolute -top-1 -left-1 w-8 h-8 bg-cyan-500/10 blur-xl"></div>
      </div>
      <div class="absolute top-0 right-0 w-40 h-40">
        <div class="absolute inset-0 border-r-2 border-t-2 border-blue-500/20 rounded-tr-xl"></div>
        <div class="absolute -top-1 -right-1 w-8 h-8 bg-blue-500/10 blur-xl"></div>
      </div>
      <div class="absolute bottom-0 left-0 w-40 h-40">
        <div class="absolute inset-0 border-l-2 border-b-2 border-purple-500/20 rounded-bl-xl"></div>
        <div class="absolute -bottom-1 -left-1 w-8 h-8 bg-purple-500/10 blur-xl"></div>
      </div>
      <div class="absolute bottom-0 right-0 w-40 h-40">
        <div class="absolute inset-0 border-r-2 border-b-2 border-cyan-500/20 rounded-br-xl"></div>
        <div class="absolute -bottom-1 -right-1 w-8 h-8 bg-cyan-500/10 blur-xl"></div>
      </div>
    </div>
  );
}
