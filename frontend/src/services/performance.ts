/*
 * Performance monitoring service providing real-time metrics collection, WebSocket integration, and comprehensive system performance analysis.
 * I'm implementing intelligent data aggregation, alerting capabilities, and seamless integration with the backend performance monitoring system for live dashboard updates.
 */

import { apiClient } from './api';

interface SystemMetrics {
    timestamp: string;
    cpu_usage_percent: number;
    memory_usage_percent: number;
    memory_total_gb: number;
    memory_available_gb: number;
    disk_usage_percent: number;
    load_average_1m: number;
    load_average_5m: number;
    load_average_15m: number;
    cpu_cores: number;
    cpu_threads: number;
    cpu_model: string;
    uptime_seconds: number;
    active_processes: number;
    system_temperature?: number;
}

interface ApplicationMetrics {
    requests_handled: number;
    average_response_time_ms: number;
    fractal_computations: number;
    github_api_calls: number;
    cache_hit_rate: number;
    database_connections: number;
    memory_usage_mb: number;
}

interface PerformanceSnapshot {
    timestamp: string;
    system: SystemMetrics;
    application: ApplicationMetrics;
    hardware: {
        cpu_model: string;
        cpu_cores: number;
        cpu_threads: number;
        architecture: string;
        total_memory_gb: number;
    };
    runtime: {
        rust_version: string;
        build_type: string;
        optimization_level: string;
        features_enabled: string[];
    };
}

interface BenchmarkResult {
    benchmark_id: string;
    timestamp: string;
    total_duration_ms: number;
    system_info: any;
    benchmarks: {
        cpu: any;
        memory: any;
    };
    performance_rating: string;
}

interface MetricsHistory {
    timestamp: string;
    period_minutes: number;
    data_points: number;
    metrics: {
        cpu_usage: Array<{ timestamp: string; value: number }>;
        memory_usage: Array<{ timestamp: string; value: number }>;
        disk_usage: Array<{ timestamp: string; value: number }>;
        load_average: Array<{ timestamp: string; value: number }>;
        response_times: Array<{ timestamp: string; value: number }>;
    };
    summary: {
        average_cpu: number;
        peak_cpu: number;
        average_memory: number;
        peak_memory: number;
        incidents: number;
        uptime_percentage: number;
    };
}

interface AlertConfig {
    metric: string;
    threshold: number;
    operator: '>' | '<' | '=';
    duration: number; // milliseconds
    enabled: boolean;
}

interface Alert {
    id: string;
    timestamp: string;
    metric: string;
    value: number;
    threshold: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    acknowledged: boolean;
}

class PerformanceService {
    private wsConnection: WebSocket | null = null;
    private metricsCache: Map<string, { data: any; timestamp: number }>;
    private realTimeMetrics: SystemMetrics | null = null;
    private alertConfig: AlertConfig[];
    private activeAlerts: Map<string, Alert>;
    private metricsHistory: Array<{ timestamp: number; metrics: SystemMetrics }>;
    private subscribers: Map<string, Set<(data: any) => void>>;

    constructor() {
        this.metricsCache = new Map();
        this.alertConfig = this.getDefaultAlertConfig();
        this.activeAlerts = new Map();
        this.metricsHistory = [];
        this.subscribers = new Map();

        // I'm setting up automatic cache cleanup
        setInterval(() => this.cleanupCache(), 60000); // Every minute

        // I'm initializing real-time monitoring
        this.initializeRealTimeMonitoring();
    }

    private getDefaultAlertConfig(): AlertConfig[] {
        return [
            {
                metric: 'cpu_usage_percent',
                threshold: 85,
                operator: '>',
                duration: 30000, // 30 seconds
                enabled: true,
            },
            {
                metric: 'memory_usage_percent',
                threshold: 90,
                operator: '>',
                duration: 30000,
                enabled: true,
            },
            {
                metric: 'disk_usage_percent',
                threshold: 95,
                operator: '>',
                duration: 60000, // 1 minute
                enabled: true,
            },
            {
                metric: 'load_average_1m',
                threshold: 10,
                operator: '>',
                duration: 60000,
                enabled: true,
            },
        ];
    }

    private cleanupCache() {
        const now = Date.now();
        const maxAge = 5 * 60 * 1000; // 5 minutes

        for (const [key, entry] of this.metricsCache.entries()) {
            if (now - entry.timestamp > maxAge) {
                this.metricsCache.delete(key);
            }
        }

        // I'm also cleaning up old metrics history
        const maxHistoryAge = 60 * 60 * 1000; // 1 hour
        this.metricsHistory = this.metricsHistory.filter(
            entry => now - entry.timestamp < maxHistoryAge
        );
    }

    private initializeRealTimeMonitoring() {
        // I'm starting with a 15-second polling interval, will upgrade to WebSocket later
        setInterval(async () => {
            try {
                const metrics = await this.getCurrentMetrics();
                this.processRealTimeMetrics(metrics.system);
            } catch (error) {
                console.warn('Failed to fetch real-time metrics:', error);
            }
        }, 15000);
    }

    private processRealTimeMetrics(metrics: SystemMetrics) {
        this.realTimeMetrics = metrics;

        // I'm storing metrics in history for trend analysis
        this.metricsHistory.push({
            timestamp: Date.now(),
                                 metrics,
        });

        // I'm checking for alert conditions
        this.checkAlerts(metrics);

        // I'm notifying subscribers
        this.notifySubscribers('metrics', metrics);
    }

    private checkAlerts(metrics: SystemMetrics) {
        for (const config of this.alertConfig) {
            if (!config.enabled) continue;

            const value = (metrics as any)[config.metric];
            if (typeof value !== 'number') continue;

            const alertId = `${config.metric}_${config.threshold}`;
            const shouldAlert = this.evaluateAlertCondition(value, config.threshold, config.operator);

            if (shouldAlert && !this.activeAlerts.has(alertId)) {
                // I'm creating a new alert
                const alert: Alert = {
                    id: alertId,
                    timestamp: new Date().toISOString(),
                    metric: config.metric,
                    value,
                    threshold: config.threshold,
                    severity: this.calculateAlertSeverity(config.metric, value, config.threshold),
                    message: this.generateAlertMessage(config.metric, value, config.threshold),
                    acknowledged: false,
                };

                this.activeAlerts.set(alertId, alert);
                this.notifySubscribers('alert', alert);

            } else if (!shouldAlert && this.activeAlerts.has(alertId)) {
                // I'm clearing resolved alerts
                this.activeAlerts.delete(alertId);
                this.notifySubscribers('alert_cleared', { id: alertId });
            }
        }
    }

    private evaluateAlertCondition(value: number, threshold: number, operator: string): boolean {
        switch (operator) {
            case '>': return value > threshold;
            case '<': return value < threshold;
            case '=': return Math.abs(value - threshold) < 0.01;
            default: return false;
        }
    }

    private calculateAlertSeverity(metric: string, value: number, threshold: number): Alert['severity'] {
        const excess = Math.abs(value - threshold) / threshold;

        if (excess > 0.3) return 'critical';
        if (excess > 0.2) return 'high';
        if (excess > 0.1) return 'medium';
        return 'low';
    }

    private generateAlertMessage(metric: string, value: number, threshold: number): string {
        const metricNames: Record<string, string> = {
            cpu_usage_percent: 'CPU usage',
            memory_usage_percent: 'Memory usage',
            disk_usage_percent: 'Disk usage',
            load_average_1m: 'Load average',
        };

        const friendlyName = metricNames[metric] || metric;
        return `${friendlyName} is ${value.toFixed(1)}%, exceeding threshold of ${threshold}%`;
    }

    // Public API methods

    async getCurrentMetrics(): Promise<PerformanceSnapshot> {
        const cacheKey = 'current_metrics';
        const cached = this.metricsCache.get(cacheKey);

        if (cached && Date.now() - cached.timestamp < 5000) { // 5 second cache
            return cached.data;
        }

        try {
            const response = await apiClient.get<PerformanceSnapshot>('/api/performance/metrics');

            this.metricsCache.set(cacheKey, {
                data: response,
                timestamp: Date.now(),
            });

            return response;

        } catch (error) {
            console.error('Failed to fetch current metrics:', error);
            throw error;
        }
    }

    async getSystemInfo(): Promise<any> {
        const cacheKey = 'system_info';
        const cached = this.metricsCache.get(cacheKey);

        if (cached && Date.now() - cached.timestamp < 60000) { // 1 minute cache
            return cached.data;
        }

        try {
            const response = await apiClient.get('/api/performance/system');

            this.metricsCache.set(cacheKey, {
                data: response,
                timestamp: Date.now(),
            });

            return response;

        } catch (error) {
            console.error('Failed to fetch system info:', error);
            throw error;
        }
    }

    async runBenchmark(): Promise<BenchmarkResult> {
        try {
            console.log('Starting performance benchmark');

            const response = await apiClient.post<BenchmarkResult>(
                '/api/performance/benchmark',
                {},
                { timeout: 120000 } // 2 minute timeout
            );

            // I'm notifying subscribers about benchmark completion
            this.notifySubscribers('benchmark_complete', response);

            return response;

        } catch (error) {
            console.error('Benchmark execution failed:', error);
            throw error;
        }
    }

    async getMetricsHistory(limitMinutes: number = 60): Promise<MetricsHistory> {
        try {
            const response = await apiClient.get<MetricsHistory>(
                `/api/performance/history?limit=${Math.floor(limitMinutes / 5)}` // 5-minute intervals
            );

            return response;

        } catch (error) {
            console.error('Failed to fetch metrics history:', error);
            throw error;
        }
    }

    // Real-time data subscription system
    subscribe(event: string, callback: (data: any) => void): () => void {
        if (!this.subscribers.has(event)) {
            this.subscribers.set(event, new Set());
        }

        this.subscribers.get(event)!.add(callback);

        // I'm returning an unsubscribe function
        return () => {
            const eventSubscribers = this.subscribers.get(event);
            if (eventSubscribers) {
                eventSubscribers.delete(callback);
            }
        };
    }

    private notifySubscribers(event: string, data: any) {
        const eventSubscribers = this.subscribers.get(event);
        if (eventSubscribers) {
            eventSubscribers.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error('Error in performance subscriber callback:', error);
                }
            });
        }
    }

    // Alert management
    getActiveAlerts(): Alert[] {
        return Array.from(this.activeAlerts.values());
    }

    acknowledgeAlert(alertId: string) {
        const alert = this.activeAlerts.get(alertId);
        if (alert) {
            alert.acknowledged = true;
            this.notifySubscribers('alert_acknowledged', alert);
        }
    }

    clearAlert(alertId: string) {
        if (this.activeAlerts.delete(alertId)) {
            this.notifySubscribers('alert_cleared', { id: alertId });
        }
    }

    updateAlertConfig(config: AlertConfig[]) {
        this.alertConfig = config;
    }

    // Performance analysis utilities
    analyzePerformance(metrics: SystemMetrics): {
        overall_health: 'excellent' | 'good' | 'fair' | 'poor';
        bottlenecks: string[];
        recommendations: string[];
        score: number;
    } {
        let score = 100;
        const bottlenecks: string[] = [];
        const recommendations: string[] = [];

        // I'm analyzing CPU performance
        if (metrics.cpu_usage_percent > 80) {
            score -= 20;
            bottlenecks.push('High CPU usage');
            recommendations.push('Consider optimizing CPU-intensive operations');
        }

        // I'm analyzing memory performance
        if (metrics.memory_usage_percent > 85) {
            score -= 15;
            bottlenecks.push('High memory usage');
            recommendations.push('Monitor memory leaks and optimize memory usage');
        }

        // I'm analyzing disk usage
        if (metrics.disk_usage_percent > 90) {
            score -= 10;
            bottlenecks.push('Low disk space');
            recommendations.push('Clean up disk space or add more storage');
        }

        // I'm analyzing load average
        if (metrics.load_average_1m > metrics.cpu_cores * 2) {
            score -= 15;
            bottlenecks.push('High system load');
            recommendations.push('Reduce concurrent processes or scale resources');
        }

        let overall_health: 'excellent' | 'good' | 'fair' | 'poor';
        if (score >= 90) overall_health = 'excellent';
        else if (score >= 75) overall_health = 'good';
        else if (score >= 60) overall_health = 'fair';
        else overall_health = 'poor';

        return {
            overall_health,
            bottlenecks,
            recommendations,
            score: Math.max(0, score),
        };
    }

    // Performance comparison utilities
    compareWithHistorical(current: SystemMetrics, historicalPeriodMinutes: number = 60): {
        cpu_trend: 'improving' | 'stable' | 'degrading';
        memory_trend: 'improving' | 'stable' | 'degrading';
        performance_delta: number;
    } {
        const cutoffTime = Date.now() - (historicalPeriodMinutes * 60 * 1000);
        const historicalMetrics = this.metricsHistory
        .filter(entry => entry.timestamp > cutoffTime)
        .map(entry => entry.metrics);

        if (historicalMetrics.length === 0) {
            return {
                cpu_trend: 'stable',
                memory_trend: 'stable',
                performance_delta: 0,
            };
        }

        const avgCpu = historicalMetrics.reduce((sum, m) => sum + m.cpu_usage_percent, 0) / historicalMetrics.length;
        const avgMemory = historicalMetrics.reduce((sum, m) => sum + m.memory_usage_percent, 0) / historicalMetrics.length;

        const cpuDelta = current.cpu_usage_percent - avgCpu;
        const memoryDelta = current.memory_usage_percent - avgMemory;

        return {
            cpu_trend: cpuDelta > 5 ? 'degrading' : cpuDelta < -5 ? 'improving' : 'stable',
            memory_trend: memoryDelta > 5 ? 'degrading' : memoryDelta < -5 ? 'improving' : 'stable',
            performance_delta: (cpuDelta + memoryDelta) / 2,
        };
    }

    // Utility methods
    getRealTimeMetrics(): SystemMetrics | null {
        return this.realTimeMetrics;
    }

    getCacheStats() {
        return {
            entries: this.metricsCache.size,
            alerts: this.activeAlerts.size,
            subscribers: Array.from(this.subscribers.entries()).reduce(
                (total, [_, subs]) => total + subs.size, 0
            ),
            historyPoints: this.metricsHistory.length,
        };
    }

    clearCache() {
        this.metricsCache.clear();
    }

    // Export functionality
    exportMetrics(format: 'json' | 'csv' = 'json'): string {
        const data = {
            current: this.realTimeMetrics,
            history: this.metricsHistory.slice(-100), // Last 100 points
            alerts: Array.from(this.activeAlerts.values()),
            timestamp: new Date().toISOString(),
        };

        if (format === 'json') {
            return JSON.stringify(data, null, 2);
        } else {
            // I'm creating CSV format for data analysis
            const csvLines = [
                'timestamp,cpu_usage,memory_usage,disk_usage,load_average',
                ...this.metricsHistory.slice(-100).map(entry =>
                `${new Date(entry.timestamp).toISOString()},${entry.metrics.cpu_usage_percent},${entry.metrics.memory_usage_percent},${entry.metrics.disk_usage_percent},${entry.metrics.load_average_1m}`
                ),
            ];

            return csvLines.join('\n');
        }
    }
}

// I'm creating and exporting a singleton instance
export const performanceService = new PerformanceService();

// I'm exporting types for use in other modules
export type {
    SystemMetrics,
    ApplicationMetrics,
    PerformanceSnapshot,
    BenchmarkResult,
    MetricsHistory,
    Alert,
    AlertConfig
};
