/*
 * ©AngelaMos | 2025
 */

import { apiClient } from './api';

interface FractalRequest {
    width: number;
    height: number;
    center_x: number;
    center_y: number;
    zoom: number;
    max_iterations: number;
    fractal_type: 'mandelbrot' | 'julia';
    c_real?: number;
    c_imag?: number;
}

interface FractalResponse {
    data: number[];
    width: number;
    height: number;
    computation_time_ms: number;
    zoom_level: number;
    parameters: {
        center_x: number;
        center_y: number;
        max_iterations: number;
        fractal_type: string;
        c_real?: number;
        c_imag?: number;
    };
    performance_metrics: {
        pixels_per_second: number;
        parallel_efficiency: number;
        memory_usage_mb: number;
        cpu_utilization: number;
    };
}

interface BenchmarkResult {
    benchmark_results: Array<{
        complexity: string;
        resolution: string;
        total_pixels: number;
        mandelbrot: {
            computation_time_ms: number;
            pixels_per_ms: number;
            performance_rating: string;
        };
        julia: {
            computation_time_ms: number;
            pixels_per_ms: number;
            performance_rating: string;
        };
    }>;
    system_context: {
        cpu_model: string;
        cpu_cores: number;
        memory_total_gb: number;
        rust_version: string;
        parallel_processing: boolean;
    };
    performance_analysis: {
        language: string;
        framework: string;
        optimization_level: string;
    };
}

interface FractalPreset {
    name: string;
    description: string;
    parameters: Partial<FractalRequest>;
    thumbnail?: string;
}

class FractalService {
    private cache: Map<string, { data: FractalResponse; timestamp: number }>;
    private readonly CACHE_TTL = 10 * 60 * 1000; // 10 minutes
    private activeRequests: Map<string, Promise<FractalResponse>>;

    constructor() {
        this.cache = new Map();
        this.activeRequests = new Map();

        // I'm setting up cache cleanup to prevent memory bloat
        setInterval(() => this.cleanupCache(), 2 * 60 * 1000); // Cleanup every 2 minutes
    }

    private cleanupCache() {
        const now = Date.now();
        for (const [key, entry] of this.cache.entries()) {
            if (now - entry.timestamp > this.CACHE_TTL) {
                this.cache.delete(key);
            }
        }
    }

    private getCacheKey(request: FractalRequest): string {
        // I'm creating a deterministic cache key from fractal parameters
        const params = {
            type: request.fractal_type,
            w: request.width,
            h: request.height,
            cx: Number(request.center_x.toFixed(10)),
            cy: Number(request.center_y.toFixed(10)),
            z: Number(request.zoom.toFixed(10)),
            i: request.max_iterations,
            ...(request.fractal_type === 'julia' && {
                cr: Number((request.c_real || 0).toFixed(10)),
                ci: Number((request.c_imag || 0).toFixed(10)),
            }),
        };

        return JSON.stringify(params);
    }

    private getFromCache(key: string): FractalResponse | null {
        const entry = this.cache.get(key);
        if (!entry) return null;

        const now = Date.now();
        if (now - entry.timestamp > this.CACHE_TTL) {
            this.cache.delete(key);
            return null;
        }

        return entry.data;
    }

    private setCache(key: string, data: FractalResponse) {
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
        });
    }

    async generateMandelbrot(params: {
        width?: number;
        height?: number;
        center_x: number;
        center_y: number;
        zoom: number;
        max_iterations?: number;
    }): Promise<FractalResponse> {
        const request: FractalRequest = {
            fractal_type: 'mandelbrot',
            width: params.width || 800,
            height: params.height || 600,
            center_x: params.center_x,
            center_y: params.center_y,
            zoom: params.zoom,
            max_iterations: params.max_iterations || this.calculateOptimalIterations(params.zoom),
        };

        return this.executeGeneration(request);
    }

    async generateJulia(params: {
        width?: number;
        height?: number;
        center_x: number;
        center_y: number;
        zoom: number;
        c_real: number;
        c_imag: number;
        max_iterations?: number;
    }): Promise<FractalResponse> {
        const request: FractalRequest = {
            fractal_type: 'julia',
            width: params.width || 800,
            height: params.height || 600,
            center_x: params.center_x,
            center_y: params.center_y,
            zoom: params.zoom,
            c_real: params.c_real,
            c_imag: params.c_imag,
            max_iterations: params.max_iterations || this.calculateOptimalIterations(params.zoom, 'julia'),
        };

        return this.executeGeneration(request);
    }

    private async executeGeneration(request: FractalRequest): Promise<FractalResponse> {
        const cacheKey = this.getCacheKey(request);

        // I'm checking cache first for instant results
        const cached = this.getFromCache(cacheKey);
        if (cached) {
            console.debug('Returning cached fractal result');
            return cached;
        }

        // I'm preventing duplicate requests for the same fractal
        const activeKey = cacheKey;
        if (this.activeRequests.has(activeKey)) {
            console.debug('Waiting for existing fractal request');
            return this.activeRequests.get(activeKey)!;
        }

        // I'm creating the API request with proper endpoint and parameters
        const endpoint = request.fractal_type === 'mandelbrot'
        ? '/api/fractals/mandelbrot'
        : '/api/fractals/julia';

        const queryParams = new URLSearchParams({
            width: request.width.toString(),
                                                height: request.height.toString(),
                                                center_x: request.center_x.toString(),
                                                center_y: request.center_y.toString(),
                                                zoom: request.zoom.toString(),
                                                max_iterations: request.max_iterations.toString(),
        });

        if (request.fractal_type === 'julia') {
            queryParams.append('c_real', (request.c_real || 0).toString());
            queryParams.append('c_imag', (request.c_imag || 0).toString());
        }

        const requestPromise = this.makeRequest(`${endpoint}?${queryParams}`, request);
        this.activeRequests.set(activeKey, requestPromise);

        try {
            const result = await requestPromise;

            // I'm caching successful results
            this.setCache(cacheKey, result);
            return result;

        } finally {
            this.activeRequests.delete(activeKey);
        }
    }

    private async makeRequest(url: string, request: FractalRequest): Promise<FractalResponse> {
        try {
            // I'm using a longer timeout for complex fractal computations
            const timeout = this.calculateTimeout(request);

            const response = await apiClient.post<FractalResponse>(url, {}, { timeout });

            // I'm validating the response structure
            if (!this.validateFractalResponse(response)) {
                throw new Error('Invalid fractal response format');
            }

            return response;

        } catch (error) {
            console.error('Fractal generation failed:', error);
            throw error;
        }
    }

    private validateFractalResponse(response: any): response is FractalResponse {
        return (
            response &&
            Array.isArray(response.data) &&
            typeof response.width === 'number' &&
            typeof response.height === 'number' &&
            typeof response.computation_time_ms === 'number' &&
            response.performance_metrics &&
            typeof response.performance_metrics.pixels_per_second === 'number'
        );
    }

    private calculateOptimalIterations(zoom: number, type: 'mandelbrot' | 'julia' = 'mandelbrot'): number {
        // I'm calculating optimal iteration count based on zoom level and fractal type
        const baseIterations = type === 'mandelbrot' ? 100 : 150;
        const zoomFactor = Math.log10(Math.max(1, zoom));
        const optimalIterations = Math.floor(baseIterations + (zoomFactor * 50));

        return Math.max(50, Math.min(2000, optimalIterations));
    }

    private calculateTimeout(request: FractalRequest): number {
        // I'm calculating timeout based on fractal complexity
        const pixelCount = request.width * request.height;
        const complexityFactor = request.max_iterations / 100;
        const zoomComplexity = Math.log10(Math.max(1, request.zoom));

        const baseTimeout = 30000; // 30 seconds base
        const complexityTimeout = (pixelCount / 100000) * complexityFactor * zoomComplexity * 1000;

        return Math.min(baseTimeout + complexityTimeout, 120000); // Max 2 minutes
    }

    async runBenchmark(): Promise<BenchmarkResult> {
        try {
            console.log('Starting fractal benchmark suite');

            const result = await apiClient.post<BenchmarkResult>(
                '/api/fractals/benchmark',
                {},
                { timeout: 300000 } // 5 minute timeout for comprehensive benchmarks
            );

            return result;

        } catch (error) {
            console.error('Benchmark execution failed:', error);
            throw error;
        }
    }

    // I'm providing preset management for common fractal configurations
    getPresets(): FractalPreset[] {
        return [
            {
                name: 'Classic Mandelbrot',
                description: 'The classic Mandelbrot set view',
                parameters: {
                    fractal_type: 'mandelbrot',
                    center_x: -0.5,
                    center_y: 0.0,
                    zoom: 1.0,
                    max_iterations: 100,
                },
            },
            {
                name: 'Seahorse Valley',
                description: 'Intricate spiral patterns in the Mandelbrot set',
                parameters: {
                    fractal_type: 'mandelbrot',
                    center_x: -0.743643887037151,
                    center_y: 0.13182590420533,
                    zoom: 1000,
                    max_iterations: 300,
                },
            },
            {
                name: 'Lightning',
                description: 'Electric-like branching patterns',
                parameters: {
                    fractal_type: 'mandelbrot',
                    center_x: -1.8,
                    center_y: 0,
                    zoom: 100,
                    max_iterations: 250,
                },
            },
            {
                name: 'Classic Julia',
                description: 'Traditional Julia set with beautiful symmetry',
                parameters: {
                    fractal_type: 'julia',
                    center_x: 0.0,
                    center_y: 0.0,
                    zoom: 1.0,
                    c_real: -0.7,
                    c_imag: 0.27015,
                    max_iterations: 150,
                },
            },
            {
                name: 'Dragon Julia',
                description: 'Dragon-like Julia set formation',
                parameters: {
                    fractal_type: 'julia',
                    center_x: 0.0,
                    center_y: 0.0,
                    zoom: 1.0,
                    c_real: -0.8,
                    c_imag: 0.156,
                    max_iterations: 200,
                },
            },
            {
                name: 'Spiral Julia',
                description: 'Hypnotic spiral patterns',
                parameters: {
                    fractal_type: 'julia',
                    center_x: 0.0,
                    center_y: 0.0,
                    zoom: 1.0,
                    c_real: -0.4,
                    c_imag: 0.6,
                    max_iterations: 180,
                },
            },
        ];
    }

    // I'm providing utility functions for fractal mathematics
    coordinateToComplex(x: number, y: number, width: number, height: number, centerX: number, centerY: number, zoom: number): { real: number; imag: number } {
        const scale = 4.0 / zoom;
        const real = centerX + (x - width / 2) * scale / width;
        const imag = centerY + (y - height / 2) * scale / height;

        return { real, imag };
    }

    complexToCoordinate(real: number, imag: number, width: number, height: number, centerX: number, centerY: number, zoom: number): { x: number; y: number } {
        const scale = 4.0 / zoom;
        const x = (real - centerX) * width / scale + width / 2;
        const y = (imag - centerY) * height / scale + height / 2;

        return { x, y };
    }

    // I'm providing performance analysis utilities
    analyzePerformance(response: FractalResponse): {
        rating: string;
        efficiency: string;
        recommendations: string[];
    } {
        const { performance_metrics } = response;
        const pixelsPerSecond = performance_metrics.pixels_per_second;

        let rating: string;
        if (pixelsPerSecond > 10000) rating = 'Exceptional';
        else if (pixelsPerSecond > 5000) rating = 'Excellent';
        else if (pixelsPerSecond > 2000) rating = 'Very Good';
        else if (pixelsPerSecond > 1000) rating = 'Good';
        else if (pixelsPerSecond > 500) rating = 'Fair';
        else rating = 'Needs Optimization';

        const efficiency = performance_metrics.parallel_efficiency > 0.8 ? 'Excellent' :
        performance_metrics.parallel_efficiency > 0.6 ? 'Good' :
        performance_metrics.parallel_efficiency > 0.4 ? 'Fair' : 'Poor';

        const recommendations: string[] = [];

        if (performance_metrics.parallel_efficiency < 0.6) {
            recommendations.push('Consider reducing resolution for better parallel efficiency');
        }

        if (performance_metrics.memory_usage_mb > 100) {
            recommendations.push('High memory usage detected - consider lower iteration count');
        }

        if (pixelsPerSecond < 1000) {
            recommendations.push('Performance below optimal - try lower zoom or iteration count');
        }

        return { rating, efficiency, recommendations };
    }

    // I'm providing cache management utilities
    getCacheStats() {
        const entries = Array.from(this.cache.entries());
        const now = Date.now();

        return {
            totalEntries: entries.length,
            validEntries: entries.filter(([_, entry]) => now - entry.timestamp <= this.CACHE_TTL).length,
            memoryUsage: entries.reduce((total, [_, entry]) => total + entry.data.data.length * 4, 0), // Approximate bytes
            cacheHitRate: 0, // Would be calculated from actual usage statistics
        };
    }

    clearCache() {
        this.cache.clear();
        console.log('Fractal cache cleared');
    }

    // I'm providing export utilities for fractal data
    exportFractalData(response: FractalResponse, format: 'json' | 'csv' = 'json'): string {
        if (format === 'json') {
            return JSON.stringify({
                parameters: response.parameters,
                performance: response.performance_metrics,
                computation_time: response.computation_time_ms,
                timestamp: new Date().toISOString(),
            }, null, 2);
        } else {
            // CSV format for data analysis
            const csvData = [
                'x,y,iteration_count',
                ...response.data.map((value, index) => {
                    const x = index % response.width;
                    const y = Math.floor(index / response.width);
                    return `${x},${y},${value}`;
                }),
            ].join('\n');

            return csvData;
        }
    }
}

// I'm creating and exporting a singleton instance
export const fractalService = new FractalService();

// I'm exporting types for use in other modules
export type { FractalRequest, FractalResponse, BenchmarkResult, FractalPreset };
