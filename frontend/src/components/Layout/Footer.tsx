/*
 * Footer component providing technical information and philosophical reflection in the dark aesthetic.
 * I'm creating a minimal, contemplative footer that reinforces the eerie atmosphere while sharing technical insights and project context.
 */

import { Component, createSignal, onMount } from 'solid-js';

interface TechStat {
  label: string;
  value: string;
  description: string;
}

interface BuildInfo {
  version: string;
  buildTime: string;
  gitCommit: string;
  rustVersion: string;
}

export const Footer: Component = () => {
  const [buildInfo, setBuildInfo] = createSignal<BuildInfo | null>(null);
  const [systemMetrics, setSystemMetrics] = createSignal<any>(null);
  const [currentTime, setCurrentTime] = createSignal(new Date());

  // I'm creating technical statistics that showcase the system capabilities
  const technicalStats = (): TechStat[] => [
    {
      label: "Runtime",
      value: "Rust + Tokio",
      description: "Async runtime for maximum concurrency"
    },
    {
      label: "Frontend",
      value: "SolidJS + TypeScript",
      description: "Fine-grained reactive UI framework"
    },
    {
      label: "Mathematics",
      value: "IEEE 754 Double",
      description: "64-bit floating point precision"
    },
    {
      label: "Parallelism",
      value: "Rayon + SIMD",
      description: "Multi-threaded computation engine"
    }
  ];

  onMount(() => {
    // I'm fetching build and system information for display
    fetchBuildInfo();
    fetchSystemMetrics();

    // Update current time every second for the system clock
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Refresh system metrics periodically
    const metricsInterval = setInterval(fetchSystemMetrics, 30000);

    return () => {
      clearInterval(timeInterval);
      clearInterval(metricsInterval);
    };
  });

  const fetchBuildInfo = async () => {
    try {
      const response = await fetch('/v1/health');
      if (response.ok) {
        const data = await response.json();
        setBuildInfo(data.version);
      }
    } catch (error) {
      console.warn('Failed to fetch build info:', error);
    }
  };

  const fetchSystemMetrics = async () => {
    try {
      const response = await fetch('/api/performance/system');
      if (response.ok) {
        const data = await response.json();
        setSystemMetrics(data);
      }
    } catch (error) {
      console.warn('Failed to fetch system metrics:', error);
    }
  };

  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  return (
    <footer class="bg-black border-t border-neutral-900 mt-auto">
      <div class="container mx-auto px-6 py-12">
        {/* Main Footer Content */}
        <div class="grid md:grid-cols-3 gap-12 mb-12">
          {/* Philosophical Statement */}
          <div class="space-y-4">
            <h3 class="text-lg font-thin text-neutral-200 tracking-wide">
              ON PRECISION
            </h3>
            <p class="text-sm text-neutral-500 leading-relaxed">
              Every algorithm is a meditation on the nature of determinism. 
              In the space between input and output lies the entire mystery 
              of computation—and perhaps existence itself.
            </p>
            <p class="text-xs text-neutral-600 leading-relaxed">
              This showcase explores the intersection of mathematical precision 
              and existential uncertainty through high-performance computation.
            </p>
          </div>

          {/* Technical Specifications */}
          <div class="space-y-4">
            <h3 class="text-lg font-thin text-neutral-200 tracking-wide">
              TECHNICAL STACK
            </h3>
            <div class="space-y-3">
              {technicalStats().map((stat) => (
                <div class="group cursor-help">
                  <div class="flex justify-between items-start">
                    <span class="text-xs text-neutral-600 tracking-wide">
                      {stat.label}
                    </span>
                    <span class="text-xs text-neutral-400 font-mono">
                      {stat.value}
                    </span>
                  </div>
                  <div class="text-xs text-neutral-700 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    {stat.description}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* System Status */}
          <div class="space-y-4">
            <h3 class="text-lg font-thin text-neutral-200 tracking-wide">
              SYSTEM STATUS
            </h3>
            <div class="space-y-3">
              <div class="flex justify-between items-center">
                <span class="text-xs text-neutral-600 tracking-wide">
                  LOCAL TIME
                </span>
                <span class="text-xs text-neutral-400 font-mono">
                  {currentTime().toLocaleTimeString('en-US', { 
                    hour12: false,
                    timeZoneName: 'short'
                  })}
                </span>
              </div>

              {systemMetrics() && (
                <>
                  <div class="flex justify-between items-center">
                    <span class="text-xs text-neutral-600 tracking-wide">
                      UPTIME
                    </span>
                    <span class="text-xs text-neutral-400 font-mono">
                      {formatUptime(systemMetrics().uptime_seconds || 0)}
                    </span>
                  </div>

                  <div class="flex justify-between items-center">
                    <span class="text-xs text-neutral-600 tracking-wide">
                      CPU USAGE
                    </span>
                    <span class="text-xs text-neutral-400 font-mono">
                      {systemMetrics().cpu_usage_percent?.toFixed(1)}%
                    </span>
                  </div>

                  <div class="flex justify-between items-center">
                    <span class="text-xs text-neutral-600 tracking-wide">
                      MEMORY
                    </span>
                    <span class="text-xs text-neutral-400 font-mono">
                      {systemMetrics().memory_usage_percent?.toFixed(1)}%
                    </span>
                  </div>
                </>
              )}

              {buildInfo() && (
                <div class="pt-3 border-t border-neutral-800">
                  <div class="flex justify-between items-center">
                    <span class="text-xs text-neutral-600 tracking-wide">
                      VERSION
                    </span>
                    <span class="text-xs text-neutral-400 font-mono">
                      {buildInfo()!.version}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Performance Metrics Bar */}
        {systemMetrics() && (
          <div class="mb-8 p-4 bg-neutral-900/30 border border-neutral-800 rounded-sm">
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div class="text-xs text-neutral-600 mb-1">THREADS</div>
                <div class="text-sm text-neutral-300 font-mono">
                  {systemMetrics().cpu_threads || 'N/A'}
                </div>
              </div>
              <div>
                <div class="text-xs text-neutral-600 mb-1">CORES</div>
                <div class="text-sm text-neutral-300 font-mono">
                  {systemMetrics().cpu_cores || 'N/A'}
                </div>
              </div>
              <div>
                <div class="text-xs text-neutral-600 mb-1">MEMORY</div>
                <div class="text-sm text-neutral-300 font-mono">
                  {systemMetrics().memory_total_gb ? `${systemMetrics().memory_total_gb}GB` : 'N/A'}
                </div>
              </div>
              <div>
                <div class="text-xs text-neutral-600 mb-1">LOAD AVG</div>
                <div class="text-sm text-neutral-300 font-mono">
                  {systemMetrics().load_average_1m?.toFixed(2) || 'N/A'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Bar */}
        <div class="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-neutral-900">
          {/* Build Information */}
          <div class="flex flex-col md:flex-row items-center gap-4 text-xs text-neutral-600">
            {buildInfo() && (
              <>
                <span class="font-mono">
                  Built: {buildInfo()?.buildTime ? new Date(buildInfo()!.buildTime).toLocaleDateString() : 'unknown'}
                </span>
                <span class="hidden md:block text-neutral-800">•</span>
                <span class="font-mono">
                  Commit: {buildInfo()?.gitCommit?.substring(0, 7) || 'unknown'}
                </span>
                <span class="hidden md:block text-neutral-800">•</span>
                <span class="font-mono">
                  Rust: {buildInfo()?.rustVersion || 'unknown'}
                </span>
              </>
            )}
          </div>

          {/* Existential Statement */}
          <div class="mt-4 md:mt-0 text-xs text-neutral-700 italic">
            "In the precision of code, we glimpse the imprecision of everything else."
          </div>
        </div>

        {/* Subtle Corner Indicators */}
        <div class="absolute bottom-0 left-0 w-16 h-16 border-l border-b border-neutral-900 opacity-20"></div>
        <div class="absolute bottom-0 right-0 w-16 h-16 border-r border-b border-neutral-900 opacity-20"></div>
      </div>

      {/* Ambient Status Bar */}
      <div class="h-px bg-gradient-to-r from-transparent via-neutral-800 to-transparent"></div>
    </footer>
  );
};
