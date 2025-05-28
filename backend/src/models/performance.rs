/*
 * Performance monitoring models defining comprehensive system metrics, benchmark structures, and analytical data for the showcase backend.
 * I'm implementing detailed performance tracking with time-series data, alerting capabilities, and resource utilization monitoring that showcases the application's computational efficiency.
 */

use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use chrono::{DateTime, Utc};
use std::collections::HashMap;
use validator::{Validate, ValidationError};

/// Comprehensive system performance metrics snapshot
/// I'm capturing all essential system performance indicators for real-time monitoring
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemInfo {
    pub timestamp: DateTime<Utc>,
    pub cpu_model: String,
    pub cpu_cores: u32,
    pub cpu_threads: u32,
    pub cpu_usage_percent: f64,
    pub cpu_frequency_mhz: Option<u32>,
    pub memory_total_mb: u64,
    pub memory_available_mb: u64,
    pub memory_usage_percent: f64,
    pub swap_total_mb: u64,
    pub swap_used_mb: u64,
    pub disk_total_gb: f64,
    pub disk_available_gb: f64,
    pub disk_usage_percent: f64,
    pub network_interfaces: Vec<NetworkInterface>,
    pub load_average_1m: f64,
    pub load_average_5m: f64,
    pub load_average_15m: f64,
    pub uptime_seconds: u64,
    pub active_processes: u32,
    pub system_temperature: Option<f64>,
    pub power_consumption: Option<PowerMetrics>,
}

/// Network interface performance metrics
/// I'm tracking network performance for comprehensive system monitoring
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkInterface {
    pub name: String,
    pub bytes_sent: u64,
    pub bytes_received: u64,
    pub packets_sent: u64,
    pub packets_received: u64,
    pub errors_in: u64,
    pub errors_out: u64,
    pub speed_mbps: Option<u32>,
}

/// Power consumption and efficiency metrics
/// I'm monitoring power usage for sustainability insights
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PowerMetrics {
    pub total_watts: f64,
    pub cpu_watts: Option<f64>,
    pub gpu_watts: Option<f64>,
    pub efficiency_score: f64,
}

/// Individual performance metric with metadata and context
/// I'm implementing flexible metric tracking with rich metadata support
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct PerformanceMetric {
    pub id: uuid::Uuid,
    pub metric_type: String,
    pub metric_name: String,
    pub metric_value: f64,
    pub metric_unit: String,
    pub tags: serde_json::Value,
    pub timestamp: DateTime<Utc>,
    pub endpoint: Option<String>,
    pub user_agent: Option<String>,
    pub ip_address: Option<std::net::IpAddr>,
    pub session_id: Option<uuid::Uuid>,
    pub server_instance: Option<String>,
    pub environment: String,
}

impl PerformanceMetric {
    pub fn new(
        metric_type: impl Into<String>,
        metric_name: impl Into<String>,
        value: f64,
        unit: impl Into<String>,
    ) -> Self {
        Self {
            id: uuid::Uuid::new_v4(),
            metric_type: metric_type.into(),
            metric_name: metric_name.into(),
            metric_value: value,
            metric_unit: unit.into(),
            tags: serde_json::json!({}),
            timestamp: Utc::now(),
            endpoint: None,
            user_agent: None,
            ip_address: None,
            session_id: None,
            server_instance: None,
            environment: "production".to_string(),
        }
    }

    pub fn with_tags(mut self, tags: serde_json::Value) -> Self {
        self.tags = tags;
        self
    }

    pub fn with_context(
        mut self,
        endpoint: Option<String>,
        session_id: Option<uuid::Uuid>,
        server_instance: Option<String>,
    ) -> Self {
        self.endpoint = endpoint;
        self.session_id = session_id;
        self.server_instance = server_instance;
        self
    }
}

/// Metric type enumeration for standardized categorization
/// I'm providing type-safe metric categorization for consistent monitoring
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum MetricType {
    System,
    Application,
    Network,
    Database,
    Cache,
    Request,
    Error,
    Business,
    Security,
}

impl MetricType {
    pub fn as_str(&self) -> &'static str {
        match self {
            MetricType::System => "system",
            MetricType::Application => "application",
            MetricType::Network => "network",
            MetricType::Database => "database",
            MetricType::Cache => "cache",
            MetricType::Request => "request",
            MetricType::Error => "error",
            MetricType::Business => "business",
            MetricType::Security => "security",
        }
    }
}

/// Typed metric value with units and metadata
/// I'm implementing strongly typed metric values for better data integrity
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum MetricValue {
    Counter(u64),
    Gauge(f64),
    Histogram {
        buckets: Vec<HistogramBucket>,
        sum: f64,
        count: u64,
    },
    Summary {
        quantiles: Vec<Quantile>,
        sum: f64,
        count: u64,
    },
    Timer {
        duration_ms: f64,
        start_time: DateTime<Utc>,
        end_time: DateTime<Utc>,
    },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HistogramBucket {
    pub upper_bound: f64,
    pub cumulative_count: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Quantile {
    pub quantile: f64,
    pub value: f64,
}

/// Comprehensive system performance snapshot with historical context
/// I'm providing detailed system state capture for trend analysis
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemSnapshot {
    pub id: uuid::Uuid,
    pub timestamp: DateTime<Utc>,
    pub system_info: SystemInfo,
    pub application_metrics: ApplicationMetrics,
    pub resource_usage: ResourceUsage,
    pub performance_score: PerformanceScore,
    pub alerts: Vec<PerformanceAlert>,
    pub metadata: HashMap<String, serde_json::Value>,
}

/// Application-specific performance metrics
/// I'm tracking application performance beyond system metrics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApplicationMetrics {
    pub requests_per_second: f64,
    pub average_response_time_ms: f64,
    pub error_rate_percent: f64,
    pub active_connections: u32,
    pub database_query_time_ms: f64,
    pub cache_hit_rate_percent: f64,
    pub memory_usage_mb: f64,
    pub garbage_collection_time_ms: Option<f64>,
    pub thread_pool_utilization: f64,
    pub async_tasks_queued: u32,
}

/// Resource utilization breakdown with detailed analysis
/// I'm providing granular resource usage tracking
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ResourceUsage {
    pub cpu: CpuUsage,
    pub memory: MemoryUsage,
    pub disk: DiskUsage,
    pub network: NetworkUsage,
    pub files: FileSystemUsage,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CpuUsage {
    pub overall_percent: f64,
    pub per_core_percent: Vec<f64>,
    pub user_percent: f64,
    pub system_percent: f64,
    pub idle_percent: f64,
    pub iowait_percent: f64,
    pub steal_percent: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MemoryUsage {
    pub total_mb: u64,
    pub used_mb: u64,
    pub available_mb: u64,
    pub usage_percent: f64,
    pub cached_mb: u64,
    pub buffers_mb: u64,
    pub swap_usage_mb: u64,
    pub page_faults: Option<u64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiskUsage {
    pub total_gb: f64,
    pub used_gb: f64,
    pub available_gb: f64,
    pub usage_percent: f64,
    pub read_iops: Option<u64>,
    pub write_iops: Option<u64>,
    pub read_throughput_mbps: Option<f64>,
    pub write_throughput_mbps: Option<f64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkUsage {
    pub total_bytes_sent: u64,
    pub total_bytes_received: u64,
    pub throughput_mbps: f64,
    pub packets_per_second: u64,
    pub error_rate_percent: f64,
    pub connections_active: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileSystemUsage {
    pub open_files: u32,
    pub max_files: u32,
    pub file_descriptors_used: u32,
    pub inode_usage_percent: f64,
}

/// Performance score calculation with detailed breakdown
/// I'm implementing comprehensive performance assessment
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PerformanceScore {
    pub overall_score: f64,
    pub grade: PerformanceGrade,
    pub component_scores: HashMap<String, f64>,
    pub bottlenecks: Vec<String>,
    pub recommendations: Vec<String>,
    pub trend: PerformanceTrend,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum PerformanceGrade {
    A, // Excellent (90-100)
    B, // Good (80-89)
    C, // Fair (70-79)
    D, // Poor (60-69)
    F, // Critical (<60)
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum PerformanceTrend {
    Improving,
    Stable,
    Degrading,
}

/// Performance alert with severity and context
/// I'm implementing intelligent performance alerting
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PerformanceAlert {
    pub id: uuid::Uuid,
    pub alert_type: AlertType,
    pub severity: AlertSeverity,
    pub title: String,
    pub message: String,
    pub metric_name: String,
    pub current_value: f64,
    pub threshold_value: f64,
    pub timestamp: DateTime<Utc>,
    pub resolved: bool,
    pub resolved_at: Option<DateTime<Utc>>,
    pub context: serde_json::Value,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AlertType {
    Threshold,
    Anomaly,
    Trend,
    Availability,
    Error,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, PartialOrd)]
pub enum AlertSeverity {
    Info,
    Warning,
    Error,
    Critical,
}

impl PerformanceAlert {
    pub fn new(
        alert_type: AlertType,
        severity: AlertSeverity,
        title: impl Into<String>,
        message: impl Into<String>,
        metric_name: impl Into<String>,
        current_value: f64,
        threshold_value: f64,
    ) -> Self {
        Self {
            id: uuid::Uuid::new_v4(),
            alert_type,
            severity,
            title: title.into(),
            message: message.into(),
            metric_name: metric_name.into(),
            current_value,
            threshold_value,
            timestamp: Utc::now(),
            resolved: false,
            resolved_at: None,
            context: serde_json::json!({}),
        }
    }

    pub fn resolve(&mut self) {
        self.resolved = true;
        self.resolved_at = Some(Utc::now());
    }
}

/// Comprehensive benchmark result with detailed analysis
/// I'm providing thorough benchmark analysis for performance evaluation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BenchmarkResult {
    pub id: uuid::Uuid,
    pub name: String,
    pub description: String,
    pub timestamp: DateTime<Utc>,
    pub duration_ms: u128,
    pub iterations: u32,
    pub success: bool,
    pub error_message: Option<String>,
    pub results: HashMap<String, BenchmarkMetric>,
    pub system_context: SystemInfo,
    pub comparison: Option<BenchmarkComparison>,
    pub analysis: BenchmarkAnalysis,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BenchmarkMetric {
    pub name: String,
    pub value: f64,
    pub unit: String,
    pub better_direction: BenchmarkDirection,
    pub variance: Option<f64>,
    pub percentiles: Option<HashMap<String, f64>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum BenchmarkDirection {
    Higher, // Higher values are better
    Lower,  // Lower values are better
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BenchmarkComparison {
    pub baseline_name: String,
    pub baseline_timestamp: DateTime<Utc>,
    pub performance_delta: f64,
    pub regression_detected: bool,
    pub significant_changes: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BenchmarkAnalysis {
    pub performance_grade: PerformanceGrade,
    pub bottlenecks: Vec<String>,
    pub strengths: Vec<String>,
    pub recommendations: Vec<String>,
    pub optimization_opportunities: Vec<String>,
}

/// Time-series data structure for performance trends
/// I'm implementing time-series analysis for performance monitoring
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TimeSeriesData {
    pub metric_name: String,
    pub data_points: Vec<TimeSeriesPoint>,
    pub aggregation: TimeSeriesAggregation,
    pub time_range: TimeRange,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TimeSeriesPoint {
    pub timestamp: DateTime<Utc>,
    pub value: f64,
    pub tags: HashMap<String, String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TimeSeriesAggregation {
    pub function: AggregationFunction,
    pub interval_seconds: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AggregationFunction {
    Average,
    Sum,
    Min,
    Max,
    Count,
    Percentile(f64),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TimeRange {
    pub start: DateTime<Utc>,
    pub end: DateTime<Utc>,
}

/// Helper functions for performance calculations and analysis

impl SystemInfo {
    /// Calculate overall system health score
    /// I'm implementing comprehensive system health assessment
    pub fn calculate_health_score(&self) -> f64 {
        let mut score: f64 = 100.0;

        // CPU usage impact
        if self.cpu_usage_percent > 90.0 {
            score -= 30.0;
        } else if self.cpu_usage_percent > 80.0 {
            score -= 20.0;
        } else if self.cpu_usage_percent > 70.0 {
            score -= 10.0;
        }

        // Memory usage impact
        if self.memory_usage_percent > 95.0 {
            score -= 25.0;
        } else if self.memory_usage_percent > 85.0 {
            score -= 15.0;
        } else if self.memory_usage_percent > 75.0 {
            score -= 8.0;
        }

        // Disk usage impact
        if self.disk_usage_percent > 95.0 {
            score -= 20.0;
        } else if self.disk_usage_percent > 90.0 {
            score -= 10.0;
        } else if self.disk_usage_percent > 80.0 {
            score -= 5.0;
        }

        // Load average impact
        let load_ratio = self.load_average_1m / self.cpu_cores as f64;
        if load_ratio > 2.0 {
            score -= 20.0;
        } else if load_ratio > 1.5 {
            score -= 10.0;
        } else if load_ratio > 1.0 {
            score -= 5.0;
        }

        score.max(0.0)
    }

    pub fn get_performance_grade(&self) -> PerformanceGrade {
        let score = self.calculate_health_score();
        match score {
            x if x >= 90.0 => PerformanceGrade::A,
            x if x >= 80.0 => PerformanceGrade::B,
            x if x >= 70.0 => PerformanceGrade::C,
            x if x >= 60.0 => PerformanceGrade::D,
            _ => PerformanceGrade::F,
        }
    }
}

impl PerformanceScore {
    pub fn calculate(system_info: &SystemInfo, app_metrics: &ApplicationMetrics) -> Self {
        let mut component_scores = HashMap::new();
        let mut bottlenecks = Vec::new();
        let mut recommendations = Vec::new();

        // Calculate component scores
        let cpu_score = calculate_cpu_score(system_info.cpu_usage_percent);
        let memory_score = calculate_memory_score(system_info.memory_usage_percent);
        let response_time_score = calculate_response_time_score(app_metrics.average_response_time_ms);
        let error_rate_score = calculate_error_rate_score(app_metrics.error_rate_percent);

        component_scores.insert("cpu".to_string(), cpu_score);
        component_scores.insert("memory".to_string(), memory_score);
        component_scores.insert("response_time".to_string(), response_time_score);
        component_scores.insert("error_rate".to_string(), error_rate_score);

        // Identify bottlenecks
        if cpu_score < 70.0 {
            bottlenecks.push("High CPU utilization".to_string());
            recommendations.push("Consider optimizing CPU-intensive operations".to_string());
        }
        if memory_score < 70.0 {
            bottlenecks.push("High memory usage".to_string());
            recommendations.push("Review memory usage and implement cleanup".to_string());
        }
        if response_time_score < 70.0 {
            bottlenecks.push("Slow response times".to_string());
            recommendations.push("Optimize database queries and caching".to_string());
        }
        if error_rate_score < 70.0 {
            bottlenecks.push("High error rate".to_string());
            recommendations.push("Investigate and fix error sources".to_string());
        }

        let overall_score = component_scores.values().sum::<f64>() / component_scores.len() as f64;
        let grade = match overall_score {
            x if x >= 90.0 => PerformanceGrade::A,
            x if x >= 80.0 => PerformanceGrade::B,
            x if x >= 70.0 => PerformanceGrade::C,
            x if x >= 60.0 => PerformanceGrade::D,
            _ => PerformanceGrade::F,
        };

        Self {
            overall_score,
            grade,
            component_scores,
            bottlenecks,
            recommendations,
            trend: PerformanceTrend::Stable, // Would be calculated from historical data
        }
    }
}

// Helper functions for score calculations
fn calculate_cpu_score(cpu_percent: f64) -> f64 {
    (100.0 - cpu_percent).max(0.0)
}

fn calculate_memory_score(memory_percent: f64) -> f64 {
    (100.0 - memory_percent).max(0.0)
}

fn calculate_response_time_score(response_time_ms: f64) -> f64 {
    if response_time_ms <= 100.0 {
        100.0
    } else if response_time_ms <= 500.0 {
        100.0 - ((response_time_ms - 100.0) / 4.0)
    } else {
        0.0
    }
}

fn calculate_error_rate_score(error_rate_percent: f64) -> f64 {
    (100.0 - (error_rate_percent * 10.0)).max(0.0)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_performance_grade_calculation() {
        let system_info = SystemInfo {
            timestamp: Utc::now(),
            cpu_model: "Test CPU".to_string(),
            cpu_cores: 8,
            cpu_threads: 16,
            cpu_usage_percent: 50.0,
            cpu_frequency_mhz: Some(3000),
            memory_total_mb: 16384,
            memory_available_mb: 8192,
            memory_usage_percent: 50.0,
            swap_total_mb: 4096,
            swap_used_mb: 0,
            disk_total_gb: 1000.0,
            disk_available_gb: 500.0,
            disk_usage_percent: 50.0,
            network_interfaces: vec![],
            load_average_1m: 4.0,
            load_average_5m: 3.5,
            load_average_15m: 3.0,
            uptime_seconds: 86400,
            active_processes: 150,
            system_temperature: Some(65.0),
            power_consumption: None,
        };

        let grade = system_info.get_performance_grade();
        assert!(matches!(grade, PerformanceGrade::A | PerformanceGrade::B));
    }

    #[test]
    fn test_performance_alert_creation() {
        let mut alert = PerformanceAlert::new(
            AlertType::Threshold,
            AlertSeverity::Warning,
            "High CPU Usage",
            "CPU usage is above threshold",
            "cpu_usage_percent",
            85.0,
            80.0,
        );

        assert!(!alert.resolved);
        alert.resolve();
        assert!(alert.resolved);
        assert!(alert.resolved_at.is_some());
    }

    #[test]
    fn test_metric_value_types() {
        let counter = MetricValue::Counter(100);
        let gauge = MetricValue::Gauge(75.5);

        match counter {
            MetricValue::Counter(val) => assert_eq!(val, 100),
            _ => panic!("Expected Counter"),
        }

        match gauge {
            MetricValue::Gauge(val) => assert_eq!(val, 75.5),
            _ => panic!("Expected Gauge"),
        }
    }
}
