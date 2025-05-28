/// <reference types="@solidjs/start/env" />

// I'm extending the global window interface for performance tracking
declare global {
  interface Window {
    __PERFORMANCE_START__?: number;
    fs?: {
      readFile: (path: string, options?: { encoding?: string }) => Promise<Uint8Array | string>;
    };
  }

  // I'm adding environment variable types for the performance showcase
  namespace NodeJS {
    interface ProcessEnv {
      VITE_API_URL?: string;
      VITE_PERFORMANCE_ENDPOINT?: string;
      VITE_GITHUB_TOKEN?: string;
      VITE_BUILD_MODE?: string;
      NODE_ENV: 'development' | 'production' | 'test';
    }
  }

  // I'm extending the Performance API types for advanced metrics
  interface PerformanceEntry {
    hadRecentInput?: boolean;
    value?: number;
    sources?: PerformanceEntrySource[];
  }

  interface PerformanceEntrySource {
    node?: Node;
    previousRect?: DOMRectReadOnly;
    currentRect?: DOMRectReadOnly;
  }

  // I'm adding Web Vitals types for performance monitoring
  interface PerformanceObserver {
    supportedEntryTypes?: string[];
  }

  // I'm extending the Navigator interface for hardware information
  interface Navigator {
    hardwareConcurrency?: number;
    deviceMemory?: number;
    connection?: NetworkInformation;
  }

  interface NetworkInformation {
    effectiveType?: 'slow-2g' | '2g' | '3g' | '4g';
    downlink?: number;
    rtt?: number;
  }
}

// I'm defining module declarations for assets and imports
declare module '*.css' {
  const content: string;
  export default content;
}

declare module '*.scss' {
  const content: string;
  export default content;
}

declare module '*.svg' {
  const content: string;
  export default content;
}

declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*.jpg' {
  const content: string;
  export default content;
}

declare module '*.jpeg' {
  const content: string;
  export default content;
}

declare module '*.webp' {
  const content: string;
  export default content;
}

declare module '*.ico' {
  const content: string;
  export default content;
}

// I'm defining types for the performance showcase API responses
export interface ApiResponse<T = any> {
  data: T;
  timestamp: string;
  duration_ms?: number;
  pagination?: {
    current_page: number;
    total_pages: number;
    total_count: number;
    has_next_page: boolean;
    has_previous_page: boolean;
  };
}

export interface PerformanceMetrics {
  lcp?: number;
  fid?: number;
  cls?: number;
  fcp?: number;
  ttfb?: number;
  [key: string]: number | undefined;
}

export interface SystemMetrics {
  cpu_usage_percent: number;
  memory_usage_percent: number;
  uptime_seconds: number;
  cpu_cores?: number;
  cpu_threads?: number;
  memory_total_gb?: number;
  load_average_1m?: number;
}

// I'm defining fractal computation types
export interface FractalRequest {
  width: number;
  height: number;
  center_x: number;
  center_y: number;
  zoom: number;
  max_iterations: number;
  fractal_type: 'mandelbrot' | 'julia';
}

export interface FractalResponse {
  data: Uint8Array;
  width: number;
  height: number;
  computation_time_ms: number;
  zoom_level: number;
}

// I'm defining GitHub repository types
export interface Repository {
  id: number;
  name: string;
  full_name: string;
  description?: string;
  html_url: string;
  language?: string;
  stargazers_count: number;
  forks_count: number;
  watchers_count: number;
  open_issues_count: number;
  size_kb: number;
  created_at: string;
  updated_at: string;
  pushed_at?: string;
  is_private: boolean;
  is_fork: boolean;
  is_archived: boolean;
  topics: string[];
  license_name?: string;
}

export {};
