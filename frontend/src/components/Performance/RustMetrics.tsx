/*
 * ©AngelaMos | 2025
 */

import { Component, createSignal, onMount, onCleanup } from 'solid-js';

interface RustMetric {
  name: string;
  value: number | string;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  description: string;
  category: 'performance' | 'memory' | 'concurrency' | 'throughput';
  timestamp: Date;
}

interface ApiMetrics {
  request_count: number;
  avg_response_time_ms: number;
  active_connections: number;
  memory_usage_mb: number;
  cpu_usage_percent: number;
  cache_hit_rate: number;
  requests_per_second: number;
  error_rate: number;
  uptime_seconds: number;
  thread_count: number;
  gc_count?: number;
  heap_allocated_mb?: number;
}

export const RustMetrics: Component = () => {
  const [metrics, setMetrics] = createSignal<RustMetric[]>([]);
  const [isConnected, setIsConnected] = createSignal(false);
  const [lastUpdate, setLastUpdate] = createSignal<Date | null>(null);
  const [connectionError, setConnectionError] = createSignal<string | null>(null);

  let intervalId: number | undefined;
  let retryTimeout: number | undefined;

  const formatValue = (metric: RustMetric): string => {
    if (typeof metric.value === 'string') return metric.value;
    
    if (metric.unit === '%') {
      return `${(metric.value || 0).toFixed(1)}${metric.unit}`;
    }
    if (metric.unit === 'ms') {
      return `${(metric.value || 0).toFixed(1)}${metric.unit}`;
    }
    if (metric.unit === 'MB') {
      return `${(metric.value || 0).toFixed(1)}${metric.unit}`;
    }
    if (metric.unit === 'req/s') {
      return `${(metric.value || 0).toFixed(0)}${metric.unit}`;
    }
    if (metric.unit === 's') {
      const seconds = typeof metric.value === 'number' ? metric.value : 0;
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return `${hours}h ${minutes}m`;
    }
    
    return `${metric.value}${metric.unit}`;
  };

  const getTrendIcon = (trend: string): string => {
    switch (trend) {
      case 'up': return '↗';
      case 'down': return '↘';
      case 'stable': return '→';
      default: return '—';
    }
  };

  const getTrendColor = (trend: string, category: string): string => {
    // For performance metrics, up is good; for error rates, down is good
    const isGoodTrend = (category === 'performance' || category === 'throughput') 
      ? trend === 'up' 
      : trend === 'down';
    
    switch (trend) {
      case 'up': return isGoodTrend ? 'text-emerald-400' : 'text-red-400';
      case 'down': return isGoodTrend ? 'text-emerald-400' : 'text-red-400';
      case 'stable': return 'text-neutral-400';
      default: return 'text-neutral-500';
    }
  };

  const getCategoryColor = (category: string): string => {
    switch (category) {
      case 'performance': return 'border-cyan-500/30 text-cyan-400';
      case 'memory': return 'border-purple-500/30 text-purple-400';
      case 'concurrency': return 'border-orange-500/30 text-orange-400';
      case 'throughput': return 'border-emerald-500/30 text-emerald-400';
      default: return 'border-neutral-500/30 text-neutral-400';
    }
  };

  const calculateTrend = (currentValue: number, previousValue: number): 'up' | 'down' | 'stable' => {
    const threshold = 0.05; // 5% threshold for trend detection
    const change = (currentValue - previousValue) / previousValue;
    
    if (Math.abs(change) < threshold) return 'stable';
    return change > 0 ? 'up' : 'down';
  };

  const fetchMetrics = async () => {
    try {
      setConnectionError(null);
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/performance/metrics`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data: ApiMetrics = await response.json();
      const timestamp = new Date();
      
      // Store previous values for trend calculation
      const previousMetrics = metrics();
      const getPreviousValue = (name: string): number => {
        const prev = previousMetrics.find(m => m.name === name);
        return prev && typeof prev.value === 'number' ? prev.value : 0;
      };
      
      // Access nested data structure
      const appData = (data as any).application || {};
      const sysData = (data as any).system || {};
      const hwData = (data as any).hardware || {};

      const newMetrics: RustMetric[] = [
        {
          name: 'Response Time',
          value: appData.average_response_time_ms || 0,
          unit: 'ms',
          trend: calculateTrend(appData.average_response_time_ms || 0, getPreviousValue('Response Time')),
          description: 'Average API response time',
          category: 'performance',
          timestamp
        },
        {
          name: 'Requests/sec',
          value: (appData.requests_handled || 0) / 60, // Approximate requests per second
          unit: 'req/s',
          trend: calculateTrend((appData.requests_handled || 0) / 60, getPreviousValue('Requests/sec')),
          description: 'Current request throughput',
          category: 'throughput',
          timestamp
        },
        {
          name: 'Active Connections',
          value: sysData.active_processes || 0,
          unit: '',
          trend: calculateTrend(sysData.active_processes || 0, getPreviousValue('Active Connections')),
          description: 'Active system processes',
          category: 'concurrency',
          timestamp
        },
        {
          name: 'Memory Usage',
          value: appData.memory_usage_mb || sysData.memory_usage_percent || 0,
          unit: appData.memory_usage_mb ? 'MB' : '%',
          trend: calculateTrend(appData.memory_usage_mb || sysData.memory_usage_percent || 0, getPreviousValue('Memory Usage')),
          description: 'Current memory consumption',
          category: 'memory',
          timestamp
        },
        {
          name: 'CPU Usage',
          value: sysData.cpu_usage_percent || 0,
          unit: '%',
          trend: calculateTrend(sysData.cpu_usage_percent || 0, getPreviousValue('CPU Usage')),
          description: 'Current CPU utilization',
          category: 'performance',
          timestamp
        },
        {
          name: 'Cache Hit Rate',
          value: appData.cache_hit_rate || 0,
          unit: '%',
          trend: calculateTrend(appData.cache_hit_rate || 0, getPreviousValue('Cache Hit Rate')),
          description: 'Redis cache effectiveness',
          category: 'performance',
          timestamp
        },
        {
          name: 'Database Connections',
          value: appData.database_connections || 0,
          unit: '',
          trend: calculateTrend(appData.database_connections || 0, getPreviousValue('Database Connections')),
          description: 'Active database connections',
          category: 'concurrency',
          timestamp
        },
        {
          name: 'Total Requests',
          value: appData.requests_handled || 0,
          unit: '',
          trend: 'up',
          description: 'Cumulative request count',
          category: 'throughput',
          timestamp
        },
        {
          name: 'CPU Threads',
          value: hwData.cpu_threads || 0,
          unit: '',
          trend: 'stable',
          description: 'CPU thread count',
          category: 'concurrency',
          timestamp
        },
        {
          name: 'Uptime',
          value: sysData.uptime_seconds || 0,
          unit: 's',
          trend: 'up',
          description: 'System uptime duration',
          category: 'performance',
          timestamp
        }
      ];

      // Add optional metrics if available
      if (data.heap_allocated_mb !== undefined) {
        newMetrics.push({
          name: 'Heap Allocated',
          value: data.heap_allocated_mb,
          unit: 'MB',
          trend: calculateTrend(data.heap_allocated_mb, getPreviousValue('Heap Allocated')),
          description: 'Allocated heap memory',
          category: 'memory',
          timestamp
        });
      }

      if (data.gc_count !== undefined) {
        newMetrics.push({
          name: 'GC Count',
          value: data.gc_count,
          unit: '',
          trend: calculateTrend(data.gc_count, getPreviousValue('GC Count')),
          description: 'Garbage collection cycles',
          category: 'memory',
          timestamp
        });
      }
      
      setMetrics(newMetrics);
      setLastUpdate(timestamp);
      setIsConnected(true);
      
      // Clear any retry timeout
      if (retryTimeout) {
        clearTimeout(retryTimeout);
        retryTimeout = undefined;
      }
      
    } catch (error) {
      console.error('Failed to fetch Rust metrics:', error);
      setConnectionError(error instanceof Error ? error.message : 'Unknown error');
      setIsConnected(false);
      
      // Retry with exponential backoff
      if (retryTimeout) clearTimeout(retryTimeout);
      retryTimeout = setTimeout(fetchMetrics, 5000);
    }
  };

  onMount(() => {
    // Initial fetch
    fetchMetrics();
    
    // Set up polling interval
    intervalId = setInterval(fetchMetrics, 10000); // Update every 10 seconds
    
    onCleanup(() => {
      if (intervalId) clearInterval(intervalId);
      if (retryTimeout) clearTimeout(retryTimeout);
    });
  });

  const getHealthStatus = (): { status: string; color: string } => {
    if (!isConnected()) return { status: 'DISCONNECTED', color: 'text-red-400' };
    
    const errorRate = metrics().find(m => m.name === 'Error Rate')?.value as number || 0;
    const responseTime = metrics().find(m => m.name === 'Response Time')?.value as number || 0;
    const cpuUsage = metrics().find(m => m.name === 'CPU Usage')?.value as number || 0;
    
    if (errorRate > 5 || responseTime > 100 || cpuUsage > 90) {
      return { status: 'DEGRADED', color: 'text-amber-400' };
    }
    
    return { status: 'HEALTHY', color: 'text-emerald-400' };
  };

  const healthStatus = () => getHealthStatus();

  return (
    <div class="space-y-6">
      <div class="text-center">
        <div class="flex items-center justify-center gap-4 mb-4">
          <h3 class="text-xl font-mono font-light tracking-wider text-neutral-200">
            RUST BACKEND METRICS
          </h3>
          <div class={`flex items-center gap-2 px-3 py-1 rounded-full border ${
            isConnected() ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-red-500/30 bg-red-500/10'
          }`}>
            <div class={`w-2 h-2 rounded-full ${isConnected() ? 'bg-emerald-500' : 'bg-red-500'} ${
              isConnected() ? 'animate-pulse' : ''
            }`}></div>
            <span class={`text-xs font-mono ${healthStatus().color}`}>
              {healthStatus().status}
            </span>
          </div>
        </div>
        
        {connectionError() ? (
          <p class="text-sm text-red-400 mb-2">
            Connection Error: {connectionError()}
          </p>
        ) : (
          <p class="text-sm text-neutral-500">
            Real-time backend performance • Live data streaming
          </p>
        )}
        
        {lastUpdate() && (
          <p class="text-xs text-neutral-600 mt-1">
            Last updated: {lastUpdate()!.toLocaleTimeString()}
          </p>
        )}
      </div>

      {metrics().length === 0 ? (
        <div class="flex justify-center items-center h-32">
          <div class="loading-pulse w-8 h-8 rounded-full"></div>
        </div>
      ) : (
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {metrics().map((metric) => (
            <div class={`glass-effect-strong border rounded-lg p-4 hover-lift transition-all duration-500 ${getCategoryColor(metric.category)}`}>
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-2">
                  <span class="text-xs font-mono text-neutral-400 tracking-wider uppercase">
                    {metric.category}
                  </span>
                </div>
                <span class={`text-sm ${getTrendColor(metric.trend, metric.category)}`}>
                  {getTrendIcon(metric.trend)}
                </span>
              </div>

              <div class="mb-2">
                <div class="text-lg font-mono font-light text-gradient">
                  {formatValue(metric)}
                </div>
                <div class="text-sm text-neutral-300 tracking-wide">
                  {metric.name}
                </div>
              </div>

              <p class="text-xs text-neutral-500 leading-relaxed">
                {metric.description}
              </p>

              {/* Performance indicator bar */}
              <div class="mt-3 pt-2 border-t border-neutral-700/50">
                <div class="h-1 bg-neutral-800 rounded-full overflow-hidden">
                  <div 
                    class={`h-full transition-all duration-1000 ${
                      metric.category === 'performance' ? 'bg-cyan-500' :
                      metric.category === 'memory' ? 'bg-purple-500' :
                      metric.category === 'concurrency' ? 'bg-orange-500' : 'bg-emerald-500'
                    }`}
                    style={{
                      width: `${Math.min(100, Math.max(5, 
                        metric.name === 'Response Time' ? Math.min(100, (metric.value as number / 100) * 100) :
                        metric.name === 'CPU Usage' || metric.name === 'Memory Usage' ? metric.value as number :
                        metric.name === 'Cache Hit Rate' ? metric.value as number :
                        50
                      ))}%`
                    }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Performance Summary */}
      {metrics().length > 0 && (
        <div class="glass-effect border border-neutral-700/50 rounded-lg p-4">
          <div class="flex items-center justify-between mb-3">
            <h4 class="text-sm font-mono text-neutral-300 tracking-wider">PERFORMANCE SUMMARY</h4>
            <div class="flex gap-4 text-xs">
              <span class="flex items-center gap-1">
                <span class="text-cyan-400">■</span> Performance
              </span>
              <span class="flex items-center gap-1">
                <span class="text-purple-400">■</span> Memory
              </span>
              <span class="flex items-center gap-1">
                <span class="text-orange-400">■</span> Concurrency
              </span>
              <span class="flex items-center gap-1">
                <span class="text-emerald-400">■</span> Throughput
              </span>
            </div>
          </div>

          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            {['performance', 'memory', 'concurrency', 'throughput'].map(category => {
              const categoryMetrics = metrics().filter(m => m.category === category);
              const avgTrend = categoryMetrics.length > 0 ? 
                categoryMetrics.filter(m => m.trend === 'up').length / categoryMetrics.length : 0;
              
              return (
                <div>
                  <div class={`text-lg font-mono font-light ${getCategoryColor(category).split(' ')[1]}`}>
                    {((avgTrend || 0) * 100).toFixed(0)}%
                  </div>
                  <div class="text-xs text-neutral-500 capitalize">{category} ↗</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
