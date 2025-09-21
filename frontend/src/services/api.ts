/*
 * ©AngelaMos | 2025
 */

interface ApiResponse<T> {
    data: T;
    timestamp: string;
    status: number;
}

interface ApiError {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
}

interface RequestConfig {
    timeout?: number;
    retries?: number;
    retryDelay?: number;
    skipCache?: boolean;
    requireAuth?: boolean;
}

class ApiClient {
    private baseURL: string;
    private defaultTimeout: number;
    private requestInterceptors: ((config: RequestInit) => RequestInit)[];
    private responseInterceptors: ((response: Response) => Promise<Response>)[];
    private circuitBreaker: Map<string, { failures: number; lastFailure: number; isOpen: boolean }>;

    constructor() {
        this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        this.defaultTimeout = 30000; // 30 seconds default timeout
        this.requestInterceptors = [];
        this.responseInterceptors = [];
        this.circuitBreaker = new Map();

        this.setupDefaultInterceptors();
    }

    private setupDefaultInterceptors() {
        this.addRequestInterceptor((config: RequestInit) => {
            const correlationId = crypto.randomUUID();

            return {
                ...config,
                headers: {
                    'Content-Type': 'application/json',
                    'X-Correlation-ID': correlationId,
                    'X-Request-Start': Date.now().toString(),
                                   ...config.headers,
                },
            };
        });

        this.addResponseInterceptor(async (response: Response) => {
            const requestStart = response.headers.get('X-Request-Start');
            if (requestStart) {
                const duration = Date.now() - parseInt(requestStart);
                console.debug(`API Request completed in ${duration}ms`, {
                    url: response.url,
                    status: response.status,
                    duration,
                });
            }

            return response;
        });
    }

    addRequestInterceptor(interceptor: (config: RequestInit) => RequestInit) {
        this.requestInterceptors.push(interceptor);
    }

    addResponseInterceptor(interceptor: (response: Response) => Promise<Response>) {
        this.responseInterceptors.push(interceptor);
    }

    private checkCircuitBreaker(endpoint: string): boolean {
        const circuit = this.circuitBreaker.get(endpoint);
        if (!circuit) return true;

        if (circuit.isOpen && Date.now() - circuit.lastFailure > 30000) {
            circuit.isOpen = false;
            circuit.failures = 0;
        }

        return !circuit.isOpen;
    }

    private recordFailure(endpoint: string) {
        const circuit = this.circuitBreaker.get(endpoint) || { failures: 0, lastFailure: 0, isOpen: false };
        circuit.failures++;
        circuit.lastFailure = Date.now();

        // Open circuit after 2 failures
        if (circuit.failures >= 2) {
            circuit.isOpen = true;
            console.warn(`Circuit breaker opened for ${endpoint} after ${circuit.failures} failures`);
        }

        this.circuitBreaker.set(endpoint, circuit);
    }

    private recordSuccess(endpoint: string) {
        this.circuitBreaker.delete(endpoint);
    }

    private async executeRequest<T>(
        endpoint: string,
        config: RequestInit = {},
        options: RequestConfig = {}
    ): Promise<T> {
        // Check circuit breaker first
        if (!this.checkCircuitBreaker(endpoint)) {
            throw new Error(`Circuit breaker is open for ${endpoint}. Too many recent failures.`);
        }

        const {
            timeout = this.defaultTimeout,
            retries = 2, // Reduced from 3 to 2
            retryDelay = 1000,
            skipCache = false,
        } = options;

        let lastError: Error | null = null;

        // I'm implementing exponential backoff retry logic
        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                // Apply request interceptors
                let finalConfig = { ...config };
                for (const interceptor of this.requestInterceptors) {
                    finalConfig = interceptor(finalConfig);
                }

                // Add cache control if specified
                if (skipCache) {
                    finalConfig.headers = {
                        ...finalConfig.headers,
                        'Cache-Control': 'no-cache',
                    };
                }

                // I'm setting up timeout handling with AbortController
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), timeout);

                finalConfig.signal = controller.signal;

                const response = await fetch(`${this.baseURL}${endpoint}`, finalConfig);
                clearTimeout(timeoutId);

                // Apply response interceptors
                let finalResponse = response;
                for (const interceptor of this.responseInterceptors) {
                    finalResponse = await interceptor(finalResponse);
                }

                if (!finalResponse.ok) {
                    throw await this.createApiError(finalResponse);
                }

                const data = await finalResponse.json();
                this.recordSuccess(endpoint);
                return data;

            } catch (error) {
                lastError = error instanceof Error ? error : new Error('Unknown error');

                // Don't retry on client errors (4xx) or abort errors
                if (error instanceof Error) {
                    if (error.name === 'AbortError') {
                        throw new Error(`Request timeout after ${timeout}ms`);
                    }

                    if (error.message.includes('4')) {
                        throw error; // Client errors shouldn't be retried
                    }
                }

                // I'm implementing exponential backoff for retries
                if (attempt < retries) {
                    const delay = retryDelay * Math.pow(2, attempt);
                    console.warn(`API request failed (attempt ${attempt + 1}/${retries + 1}), retrying in ${delay}ms`, {
                        endpoint,
                        error: lastError.message,
                    });
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }

        this.recordFailure(endpoint);
        throw lastError || new Error('Max retries exceeded');
    }

    private async createApiError(response: Response): Promise<ApiError> {
        let errorData: any = {};

        try {
            errorData = await response.json();
        } catch {
            // If response isn't JSON, create a generic error
            errorData = {
                message: response.statusText || 'Unknown error',
                code: `HTTP_${response.status}`,
            };
        }

        return {
            code: errorData.code || `HTTP_${response.status}`,
            message: errorData.message || response.statusText || 'Request failed',
            details: errorData.details,
            timestamp: new Date().toISOString(),
        };
    }

    // I'm implementing all the HTTP methods with consistent error handling
    async get<T>(endpoint: string, options?: RequestConfig): Promise<T> {
        return this.executeRequest<T>(endpoint, { method: 'GET' }, options);
    }

    async post<T>(endpoint: string, data?: any, options?: RequestConfig): Promise<T> {
        return this.executeRequest<T>(
            endpoint,
            {
                method: 'POST',
                body: data ? JSON.stringify(data) : undefined,
            },
            options
        );
    }

    async put<T>(endpoint: string, data?: any, options?: RequestConfig): Promise<T> {
        return this.executeRequest<T>(
            endpoint,
            {
                method: 'PUT',
                body: data ? JSON.stringify(data) : undefined,
            },
            options
        );
    }

    async delete<T>(endpoint: string, options?: RequestConfig): Promise<T> {
        return this.executeRequest<T>(endpoint, { method: 'DELETE' }, options);
    }

    async patch<T>(endpoint: string, data?: any, options?: RequestConfig): Promise<T> {
        return this.executeRequest<T>(
            endpoint,
            {
                method: 'PATCH',
                body: data ? JSON.stringify(data) : undefined,
            },
            options
        );
    }

    // I'm adding WebSocket support for real-time updates
    createWebSocket(endpoint: string, protocols?: string[]): WebSocket {
        const wsUrl = this.baseURL.replace(/^https?/, 'ws') + endpoint;
        return new WebSocket(wsUrl, protocols);
    }

    // I'm providing health check functionality
    async healthCheck(): Promise<{ status: string; timestamp: string }> {
        try {
            const health = await this.get<{ status: string; timestamp: string }>('/health');
            return health;
        } catch (error) {
            return {
                status: 'unhealthy',
                timestamp: new Date().toISOString(),
            };
        }
    }

    // I'm adding performance monitoring utilities
    async getPerformanceMetrics(): Promise<any> {
        return this.get('/api/performance/metrics');
    }

    async getSystemInfo(): Promise<any> {
        return this.get('/api/performance/system');
    }

    async runBenchmark(): Promise<any> {
        return this.post('/api/performance/benchmark', {}, { timeout: 120000 }); // 2 minute timeout for benchmarks
    }
}

// I'm creating a singleton instance for use throughout the application
export const apiClient = new ApiClient();

// I'm exporting types for use in other modules
export type { ApiResponse, ApiError, RequestConfig };

// I'm providing utility functions for common operations
export const createApiUrl = (endpoint: string, params?: Record<string, string | number>): string => {
    const url = new URL(endpoint, apiClient['baseURL']);

    if (params) {
        Object.entries(params).forEach(([key, value]) => {
            url.searchParams.append(key, value.toString());
        });
    }

    return url.toString();
};

export const isApiError = (error: any): error is ApiError => {
    return error && typeof error === 'object' && 'code' in error && 'message' in error;
};

// I'm adding development utilities
if (import.meta.env.DEV) {
    // Add debug logging in development
    apiClient.addRequestInterceptor((config) => {
        console.debug('API Request:', config);
        return config;
    });

    apiClient.addResponseInterceptor(async (response) => {
        console.debug('API Response:', {
            url: response.url,
            status: response.status,
            headers: Object.fromEntries(response.headers.entries()),
        });
        return response;
    });
}
