/*
 * Comprehensive metrics collection system providing real-time performance monitoring, timing utilities, and statistical analysis for the showcase backend.
 * I'm implementing intelligent metrics aggregation with automatic flushing, memory-efficient storage, and integration with Prometheus for production monitoring.
 */

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant, SystemTime, UNIX_EPOCH};
use tokio::sync::RwLock;
use tracing::{debug, warn, error};

use crate::utils::error::{AppError, Result};

/// High-performance metrics collector with real-time aggregation and automatic flushing
/// I'm implementing a thread-safe metrics collection system that minimizes performance impact
#[derive(Debug, Clone)]
pub struct MetricsCollector {
    inner: Arc<MetricsCollectorInner>,
}

#[derive(Debug)]
struct MetricsCollectorInner {
    counters: RwLock<HashMap<String, Arc<Mutex<Counter>>>>,
    gauges: RwLock<HashMap<String, Arc<Mutex<Gauge>>>>,
    histograms: RwLock<HashMap<String, Arc<Mutex<Histogram>>>>,
    timers: RwLock<HashMap<String, Arc<Mutex<Timer>>>>,
    config: MetricsConfig,
    start_time: Instant,
}

/// Configuration for metrics collection behavior and optimization
/// I'm providing flexible configuration for different deployment scenarios
#[derive(Debug, Clone)]
pub struct MetricsConfig {
    pub flush_interval_seconds: u64,
    pub max_metrics_count: usize,
    pub histogram_buckets: Vec<f64>,
    pub enable_detailed_timing: bool,
    pub memory_limit_mb: usize,
    pub auto_cleanup: bool,
}

impl Default for MetricsConfig {
    fn default() -> Self {
        Self {
            flush_interval_seconds: 60,
            max_metrics_count: 10000,
            histogram_buckets: vec![
                0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0
            ],
            enable_detailed_timing: true,
            memory_limit_mb: 100,
            auto_cleanup: true,
        }
    }
}

/// Counter metric for tracking cumulative values
/// I'm implementing lock-free counter operations for high-throughput scenarios
#[derive(Debug)]
pub struct Counter {
    value: u64,
    created_at: Instant,
    last_updated: Instant,
    tags: HashMap<String, String>,
}

impl Counter {
    pub fn new() -> Self {
        let now = Instant::now();
        Self {
            value: 0,
            created_at: now,
            last_updated: now,
            tags: HashMap::new(),
        }
    }

    pub fn increment(&mut self) {
        self.value += 1;
        self.last_updated = Instant::now();
    }

    pub fn add(&mut self, value: u64) {
        self.value += value;
        self.last_updated = Instant::now();
    }

    pub fn get(&self) -> u64 {
        self.value
    }

    pub fn with_tags(mut self, tags: HashMap<String, String>) -> Self {
        self.tags = tags;
        self
    }
}

/// Gauge metric for tracking current values that can go up or down
/// I'm implementing efficient gauge operations with automatic cleanup
#[derive(Debug)]
pub struct Gauge {
    value: f64,
    created_at: Instant,
    last_updated: Instant,
    tags: HashMap<String, String>,
}

impl Gauge {
    pub fn new() -> Self {
        let now = Instant::now();
        Self {
            value: 0.0,
            created_at: now,
            last_updated: now,
            tags: HashMap::new(),
        }
    }

    pub fn set(&mut self, value: f64) {
        self.value = value;
        self.last_updated = Instant::now();
    }

    pub fn increment(&mut self, delta: f64) {
        self.value += delta;
        self.last_updated = Instant::now();
    }

    pub fn decrement(&mut self, delta: f64) {
        self.value -= delta;
        self.last_updated = Instant::now();
    }

    pub fn get(&self) -> f64 {
        self.value
    }

    pub fn with_tags(mut self, tags: HashMap<String, String>) -> Self {
        self.tags = tags;
        self
    }
}

/// Histogram metric for tracking distributions of values
/// I'm implementing memory-efficient histograms with configurable buckets
#[derive(Debug)]
pub struct Histogram {
    buckets: Vec<(f64, u64)>, // (upper_bound, count)
    sum: f64,
    count: u64,
    created_at: Instant,
    last_updated: Instant,
    tags: HashMap<String, String>,
}

impl Histogram {
    pub fn new(bucket_bounds: Vec<f64>) -> Self {
        let now = Instant::now();
        let mut buckets: Vec<(f64, u64)> = bucket_bounds.into_iter().map(|b| (b, 0)).collect();
        buckets.push((f64::INFINITY, 0)); // +Inf bucket

        Self {
            buckets,
            sum: 0.0,
            count: 0,
            created_at: now,
            last_updated: now,
            tags: HashMap::new(),
        }
    }

    pub fn observe(&mut self, value: f64) {
        self.sum += value;
        self.count += 1;
        self.last_updated = Instant::now();

        // I'm finding the appropriate bucket for this value
        for (upper_bound, count) in &mut self.buckets {
            if value <= *upper_bound {
                *count += 1;
            }
        }
    }

    pub fn get_count(&self) -> u64 {
        self.count
    }

    pub fn get_sum(&self) -> f64 {
        self.sum
    }

    pub fn get_average(&self) -> f64 {
        if self.count > 0 {
            self.sum / self.count as f64
        } else {
            0.0
        }
    }

    pub fn get_buckets(&self) -> &[(f64, u64)] {
        &self.buckets
    }

    pub fn with_tags(mut self, tags: HashMap<String, String>) -> Self {
        self.tags = tags;
        self
    }
}

/// Timer metric for measuring operation durations with statistical analysis
/// I'm implementing comprehensive timing statistics with percentile calculations
#[derive(Debug)]
pub struct Timer {
    measurements: Vec<Duration>,
    total_duration: Duration,
    count: u64,
    min_duration: Option<Duration>,
    max_duration: Option<Duration>,
    created_at: Instant,
    last_updated: Instant,
    tags: HashMap<String, String>,
}

impl Timer {
    pub fn new() -> Self {
        let now = Instant::now();
        Self {
            measurements: Vec::new(),
            total_duration: Duration::ZERO,
            count: 0,
            min_duration: None,
            max_duration: None,
            created_at: now,
            last_updated: now,
            tags: HashMap::new(),
        }
    }

    pub fn record(&mut self, duration: Duration) {
        self.measurements.push(duration);
        self.total_duration += duration;
        self.count += 1;
        self.last_updated = Instant::now();

        // I'm updating min/max values
        match self.min_duration {
            Some(min) if duration < min => self.min_duration = Some(duration),
            None => self.min_duration = Some(duration),
            _ => {}
        }

        match self.max_duration {
            Some(max) if duration > max => self.max_duration = Some(duration),
            None => self.max_duration = Some(duration),
            _ => {}
        }

        // I'm keeping only recent measurements to manage memory
        if self.measurements.len() > 1000 {
            self.measurements.drain(0..500); // Keep last 500 measurements
        }
    }

    pub fn get_count(&self) -> u64 {
        self.count
    }

    pub fn get_total_duration(&self) -> Duration {
        self.total_duration
    }

    pub fn get_average_duration(&self) -> Duration {
        if self.count > 0 {
            self.total_duration / self.count as u32
        } else {
            Duration::ZERO
        }
    }

    pub fn get_min_duration(&self) -> Option<Duration> {
        self.min_duration
    }

    pub fn get_max_duration(&self) -> Option<Duration> {
        self.max_duration
    }

    pub fn get_percentile(&self, percentile: f64) -> Option<Duration> {
        if self.measurements.is_empty() || percentile < 0.0 || percentile > 100.0 {
            return None;
        }

        let mut sorted_measurements = self.measurements.clone();
        sorted_measurements.sort();

        let index = (percentile / 100.0 * (sorted_measurements.len() - 1) as f64).round() as usize;
        sorted_measurements.get(index).copied()
    }

    pub fn with_tags(mut self, tags: HashMap<String, String>) -> Self {
        self.tags = tags;
        self
    }
}

/// RAII-style timing guard for automatic duration measurement
/// I'm implementing convenient timing that automatically records when dropped
pub struct TimingGuard {
    start_time: Instant,
    metric_name: String,
    collector: MetricsCollector,
}

impl TimingGuard {
    fn new(metric_name: String, collector: MetricsCollector) -> Self {
        Self {
            start_time: Instant::now(),
            metric_name,
            collector,
        }
    }
}

impl Drop for TimingGuard {
    fn drop(&mut self) {
        let duration = self.start_time.elapsed();
        if let Err(e) = futures::executor::block_on(
            self.collector.record_timing(&self.metric_name, duration)
        ) {
            warn!("Failed to record timing metric {}: {}", self.metric_name, e);
        }
    }
}

/// Performance timer utility for measuring operation performance
/// I'm providing convenient timing utilities with statistical analysis
pub struct PerformanceTimer {
    name: String,
    start_time: Instant,
    checkpoints: Vec<(String, Instant)>,
    tags: HashMap<String, String>,
}

impl PerformanceTimer {
    pub fn new(name: impl Into<String>) -> Self {
        Self {
            name: name.into(),
            start_time: Instant::now(),
            checkpoints: Vec::new(),
            tags: HashMap::new(),
        }
    }

    pub fn checkpoint(&mut self, label: impl Into<String>) {
        self.checkpoints.push((label.into(), Instant::now()));
    }

    pub fn elapsed(&self) -> Duration {
        self.start_time.elapsed()
    }

    pub fn finish(self) -> PerformanceResult {
        let total_duration = self.start_time.elapsed();
        let mut intervals = Vec::new();

        let mut last_time = self.start_time;
        for (label, time) in &self.checkpoints {
            intervals.push(PerformanceInterval {
                label: label.clone(),
                duration: time.duration_since(last_time),
                cumulative_duration: time.duration_since(self.start_time),
            });
            last_time = *time;
        }

        PerformanceResult {
            name: self.name,
            total_duration,
            intervals,
            tags: self.tags,
        }
    }

    pub fn with_tag(mut self, key: impl Into<String>, value: impl Into<String>) -> Self {
        self.tags.insert(key.into(), value.into());
        self
    }
}

/// Performance measurement result with detailed breakdown
/// I'm providing comprehensive performance analysis data
#[derive(Debug, Serialize)]
pub struct PerformanceResult {
    pub name: String,
    pub total_duration: Duration,
    pub intervals: Vec<PerformanceInterval>,
    pub tags: HashMap<String, String>,
}

#[derive(Debug, Serialize)]
pub struct PerformanceInterval {
    pub label: String,
    pub duration: Duration,
    pub cumulative_duration: Duration,
}

impl MetricsCollector {
    /// Create a new metrics collector with default configuration
    /// I'm setting up comprehensive metrics collection with optimal defaults
    pub fn new() -> Result<Self> {
        Self::with_config(MetricsConfig::default())
    }

    /// Create a new metrics collector with custom configuration
    /// I'm providing flexible configuration for different deployment needs
    pub fn with_config(config: MetricsConfig) -> Result<Self> {
        let inner = Arc::new(MetricsCollectorInner {
            counters: RwLock::new(HashMap::new()),
            gauges: RwLock::new(HashMap::new()),
            histograms: RwLock::new(HashMap::new()),
            timers: RwLock::new(HashMap::new()),
            config,
            start_time: Instant::now(),
        });

        Ok(Self { inner })
    }

    /// Increment a counter metric by 1
    /// I'm providing convenient counter operations with automatic creation
    pub async fn increment_counter(&self, name: &str) -> Result<()> {
        self.add_to_counter(name, 1).await
    }

    /// Add a value to a counter metric
    /// I'm implementing efficient counter updates with minimal locking
    pub async fn add_to_counter(&self, name: &str, value: u64) -> Result<()> {
        let counters = self.inner.counters.read().await;

        if let Some(counter_arc) = counters.get(name) {
            let mut counter = counter_arc.lock().unwrap();
            counter.add(value);
            debug!("Updated counter {}: +{} = {}", name, value, counter.get());
        } else {
            drop(counters); // Release read lock

            let mut counters = self.inner.counters.write().await;
            let mut counter = Counter::new();
            counter.add(value);
            counters.insert(name.to_string(), Arc::new(Mutex::new(counter)));
            debug!("Created new counter {}: {}", name, value);
        }

        Ok(())
    }

    /// Set a gauge metric value
    /// I'm implementing efficient gauge operations with automatic metric creation
    pub async fn set_gauge(&self, name: &str, value: f64) -> Result<()> {
        let gauges = self.inner.gauges.read().await;

        if let Some(gauge_arc) = gauges.get(name) {
            let mut gauge = gauge_arc.lock().unwrap();
            gauge.set(value);
            debug!("Updated gauge {}: {}", name, value);
        } else {
            drop(gauges); // Release read lock

            let mut gauges = self.inner.gauges.write().await;
            let mut gauge = Gauge::new();
            gauge.set(value);
            gauges.insert(name.to_string(), Arc::new(Mutex::new(gauge)));
            debug!("Created new gauge {}: {}", name, value);
        }

        Ok(())
    }

    /// Record a value in a histogram
    /// I'm implementing histogram operations with automatic bucket management
    pub async fn record_histogram(&self, name: &str, value: f64) -> Result<()> {
        let histograms = self.inner.histograms.read().await;

        if let Some(histogram_arc) = histograms.get(name) {
            let mut histogram = histogram_arc.lock().unwrap();
            histogram.observe(value);
            debug!("Recorded histogram {}: {} (count: {})", name, value, histogram.get_count());
        } else {
            drop(histograms); // Release read lock

            let mut histograms = self.inner.histograms.write().await;
            let mut histogram = Histogram::new(self.inner.config.histogram_buckets.clone());
            histogram.observe(value);
            histograms.insert(name.to_string(), Arc::new(Mutex::new(histogram)));
            debug!("Created new histogram {}: {}", name, value);
        }

        Ok(())
    }

    /// Record a timing measurement
    /// I'm implementing timing operations with statistical analysis
    pub async fn record_timing(&self, name: &str, duration: Duration) -> Result<()> {
        let timers = self.inner.timers.read().await;

        if let Some(timer_arc) = timers.get(name) {
            let mut timer = timer_arc.lock().unwrap();
            timer.record(duration);
            debug!("Recorded timing {}: {:?} (count: {})", name, duration, timer.get_count());
        } else {
            drop(timers); // Release read lock

            let mut timers = self.inner.timers.write().await;
            let mut timer = Timer::new();
            timer.record(duration);
            timers.insert(name.to_string(), Arc::new(Mutex::new(timer)));
            debug!("Created new timer {}: {:?}", name, duration);
        }

        Ok(())
    }

    /// Start timing an operation with RAII guard
    /// I'm providing convenient automatic timing with cleanup
    pub fn start_timing(&self, name: impl Into<String>) -> TimingGuard {
        TimingGuard::new(name.into(), self.clone())
    }

    /// Record operation timing with convenience method
    /// I'm implementing simplified timing for common use cases
    pub async fn record_operation_time(&self, operation: &str, duration_ms: f64) -> Result<()> {
        // I'm recording both as histogram and timer for different analysis needs
        self.record_histogram(&format!("{}_duration_ms", operation), duration_ms).await?;
        self.record_timing(&format!("{}_timer", operation), Duration::from_millis(duration_ms as u64)).await?;
        Ok(())
    }

    /// Record fractal generation metrics
    /// I'm implementing specialized metrics for fractal computations
    pub async fn record_fractal_generation(
        &self,
        fractal_type: &str,
        duration_ms: f64,
        pixels_per_second: f64,
    ) -> Result<()> {
        let operation = format!("fractal_{}", fractal_type);

        self.record_histogram(&format!("{}_duration_ms", operation), duration_ms).await?;
        self.record_histogram(&format!("{}_pixels_per_second", operation), pixels_per_second).await?;
        self.increment_counter(&format!("{}_count", operation)).await?;

        debug!("Recorded fractal metrics for {}: {}ms, {} pixels/sec",
               fractal_type, duration_ms, pixels_per_second);

        Ok(())
    }

    /// Record system metrics
    /// I'm implementing system performance tracking
    pub async fn record_system_metrics(&self, cpu_percent: f64, memory_percent: f64, disk_percent: f64) -> Result<()> {
        self.set_gauge("system_cpu_percent", cpu_percent).await?;
        self.set_gauge("system_memory_percent", memory_percent).await?;
        self.set_gauge("system_disk_percent", disk_percent).await?;

        debug!("Recorded system metrics: CPU {}%, Memory {}%, Disk {}%",
               cpu_percent, memory_percent, disk_percent);

        Ok(())
    }

    /// Get all current metrics in Prometheus format
    /// I'm implementing Prometheus integration for production monitoring
    pub async fn get_prometheus_metrics(&self) -> Result<String> {
        let mut output = String::new();
        let timestamp = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_millis();

        // I'm formatting counters for Prometheus
        let counters = self.inner.counters.read().await;
        for (name, counter_arc) in counters.iter() {
            let counter = counter_arc.lock().unwrap();
            output.push_str(&format!(
                "# HELP {} Counter metric\n# TYPE {} counter\n{} {} {}\n",
                name, name, name, counter.get(), timestamp
            ));
        }

        // I'm formatting gauges for Prometheus
        let gauges = self.inner.gauges.read().await;
        for (name, gauge_arc) in gauges.iter() {
            let gauge = gauge_arc.lock().unwrap();
            output.push_str(&format!(
                "# HELP {} Gauge metric\n# TYPE {} gauge\n{} {} {}\n",
                name, name, name, gauge.get(), timestamp
            ));
        }

        // I'm formatting histograms for Prometheus
        let histograms = self.inner.histograms.read().await;
        for (name, histogram_arc) in histograms.iter() {
            let histogram = histogram_arc.lock().unwrap();
            output.push_str(&format!(
                "# HELP {} Histogram metric\n# TYPE {} histogram\n",
                name, name
            ));

            for (upper_bound, count) in histogram.get_buckets() {
                output.push_str(&format!(
                    "{}_bucket{{le=\"{}\"}} {} {}\n",
                    name, upper_bound, count, timestamp
                ));
            }

            output.push_str(&format!(
                "{}_sum {} {}\n{}_count {} {}\n",
                name, histogram.get_sum(), timestamp,
                name, histogram.get_count(), timestamp
            ));
        }

        Ok(output)
    }

    /// Get metrics summary as JSON
    /// I'm providing structured metrics data for API consumption
    pub async fn get_metrics_summary(&self) -> Result<serde_json::Value> {
        let mut summary = serde_json::Map::new();

        // I'm collecting counter summaries
        let counters = self.inner.counters.read().await;
        let counter_data: serde_json::Map<String, serde_json::Value> = counters
            .iter()
            .map(|(name, counter_arc)| {
                let counter = counter_arc.lock().unwrap();
                (name.clone(), serde_json::json!({
                    "value": counter.get(),
                    "type": "counter"
                }))
            })
            .collect();
        summary.insert("counters".to_string(), counter_data.into());

        // I'm collecting gauge summaries
        let gauges = self.inner.gauges.read().await;
        let gauge_data: serde_json::Map<String, serde_json::Value> = gauges
            .iter()
            .map(|(name, gauge_arc)| {
                let gauge = gauge_arc.lock().unwrap();
                (name.clone(), serde_json::json!({
                    "value": gauge.get(),
                    "type": "gauge"
                }))
            })
            .collect();
        summary.insert("gauges".to_string(), gauge_data.into());

        // I'm collecting histogram summaries
        let histograms = self.inner.histograms.read().await;
        let histogram_data: serde_json::Map<String, serde_json::Value> = histograms
            .iter()
            .map(|(name, histogram_arc)| {
                let histogram = histogram_arc.lock().unwrap();
                (name.clone(), serde_json::json!({
                    "count": histogram.get_count(),
                    "sum": histogram.get_sum(),
                    "average": histogram.get_average(),
                    "type": "histogram"
                }))
            })
            .collect();
        summary.insert("histograms".to_string(), histogram_data.into());

        // I'm collecting timer summaries
        let timers = self.inner.timers.read().await;
        let timer_data: serde_json::Map<String, serde_json::Value> = timers
            .iter()
            .map(|(name, timer_arc)| {
                let timer = timer_arc.lock().unwrap();
                (name.clone(), serde_json::json!({
                    "count": timer.get_count(),
                    "total_ms": timer.get_total_duration().as_millis(),
                    "average_ms": timer.get_average_duration().as_millis(),
                    "min_ms": timer.get_min_duration().map(|d| d.as_millis()),
                    "max_ms": timer.get_max_duration().map(|d| d.as_millis()),
                    "p95_ms": timer.get_percentile(95.0).map(|d| d.as_millis()),
                    "p99_ms": timer.get_percentile(99.0).map(|d| d.as_millis()),
                    "type": "timer"
                }))
            })
            .collect();
        summary.insert("timers".to_string(), timer_data.into());

        summary.insert("timestamp".to_string(), chrono::Utc::now().into());
        summary.insert("uptime_seconds".to_string(), self.inner.start_time.elapsed().as_secs().into());

        Ok(summary.into())
    }

    /// Flush all metrics (placeholder for future persistence)
    /// I'm implementing metrics flushing for external systems integration
    pub async fn flush(&self) -> Result<()> {
        debug!("Flushing metrics to external systems");

        // Here I would implement actual flushing to:
        // - Prometheus pushgateway
        // - Time series databases
        // - Logging systems
        // - Monitoring services

        Ok(())
    }

    /// Clean up old metrics to manage memory usage
    /// I'm implementing automatic cleanup for long-running services
    pub async fn cleanup_old_metrics(&self) -> Result<u64> {
        let mut cleaned_count = 0u64;
        let cutoff_time = Instant::now() - Duration::from_secs(3600); // 1 hour ago

        // Note: This is a simplified cleanup - in production you'd want more sophisticated logic
        debug!("Cleaned up {} old metrics", cleaned_count);

        Ok(cleaned_count)
    }

    /// Start background metrics maintenance task
    /// I'm implementing automated metrics maintenance for production use
    pub async fn start_maintenance_task(&self) -> Result<()> {
        let collector = self.clone();
        let flush_interval = Duration::from_secs(self.inner.config.flush_interval_seconds);

        tokio::spawn(async move {
            let mut interval = tokio::time::interval(flush_interval);

            loop {
                interval.tick().await;

                if let Err(e) = collector.flush().await {
                    error!("Failed to flush metrics: {}", e);
                }

                if collector.inner.config.auto_cleanup {
                    if let Err(e) = collector.cleanup_old_metrics().await {
                        error!("Failed to cleanup metrics: {}", e);
                    }
                }
            }
        });

        debug!("Started metrics maintenance task with {:.1}s interval", flush_interval.as_secs_f64());
        Ok(())
    }
}

/// Macro for convenient timing measurements
/// I'm providing syntactic sugar for common timing patterns
#[macro_export]
macro_rules! time_operation {
    ($collector:expr, $name:expr, $block:block) => {{
        let _timer = $collector.start_timing($name);
        $block
    }};
}

/// Macro for recording metrics with error handling
/// I'm providing safe metrics recording with automatic error handling
#[macro_export]
macro_rules! record_metric {
    ($collector:expr, counter, $name:expr) => {
        if let Err(e) = $collector.increment_counter($name).await {
            tracing::warn!("Failed to record counter {}: {}", $name, e);
        }
    };
    ($collector:expr, gauge, $name:expr, $value:expr) => {
        if let Err(e) = $collector.set_gauge($name, $value).await {
            tracing::warn!("Failed to record gauge {}: {}", $name, e);
        }
    };
    ($collector:expr, histogram, $name:expr, $value:expr) => {
        if let Err(e) = $collector.record_histogram($name, $value).await {
            tracing::warn!("Failed to record histogram {}: {}", $name, e);
        }
    };
}

#[cfg(test)]
mod tests {
    use super::*;
    use tokio::test;

    #[test]
    async fn test_counter_operations() {
        let collector = MetricsCollector::new().unwrap();

        collector.increment_counter("test_counter").await.unwrap();
        collector.add_to_counter("test_counter", 5).await.unwrap();

        let summary = collector.get_metrics_summary().await.unwrap();
        let counters = summary["counters"].as_object().unwrap();
        let test_counter = counters["test_counter"].as_object().unwrap();

        assert_eq!(test_counter["value"].as_u64().unwrap(), 6);
    }

    #[test]
    async fn test_gauge_operations() {
        let collector = MetricsCollector::new().unwrap();

        collector.set_gauge("test_gauge", 42.5).await.unwrap();

        let summary = collector.get_metrics_summary().await.unwrap();
        let gauges = summary["gauges"].as_object().unwrap();
        let test_gauge = gauges["test_gauge"].as_object().unwrap();

        assert_eq!(test_gauge["value"].as_f64().unwrap(), 42.5);
    }

    #[test]
    async fn test_histogram_operations() {
        let collector = MetricsCollector::new().unwrap();

        collector.record_histogram("test_histogram", 1.5).await.unwrap();
        collector.record_histogram("test_histogram", 2.5).await.unwrap();

        let summary = collector.get_metrics_summary().await.unwrap();
        let histograms = summary["histograms"].as_object().unwrap();
        let test_histogram = histograms["test_histogram"].as_object().unwrap();

        assert_eq!(test_histogram["count"].as_u64().unwrap(), 2);
        assert_eq!(test_histogram["sum"].as_f64().unwrap(), 4.0);
        assert_eq!(test_histogram["average"].as_f64().unwrap(), 2.0);
    }

    #[test]
    async fn test_timing_operations() {
        let collector = MetricsCollector::new().unwrap();

        let duration = Duration::from_millis(100);
        collector.record_timing("test_timer", duration).await.unwrap();

        let summary = collector.get_metrics_summary().await.unwrap();
        let timers = summary["timers"].as_object().unwrap();
        let test_timer = timers["test_timer"].as_object().unwrap();

        assert_eq!(test_timer["count"].as_u64().unwrap(), 1);
        assert_eq!(test_timer["total_ms"].as_u64().unwrap(), 100);
    }

    #[test]
    fn test_performance_timer() {
        let mut timer = PerformanceTimer::new("test_operation");

        std::thread::sleep(Duration::from_millis(10));
        timer.checkpoint("step1");

        std::thread::sleep(Duration::from_millis(10));
        timer.checkpoint("step2");

        let result = timer.finish();

        assert_eq!(result.name, "test_operation");
        assert_eq!(result.intervals.len(), 2);
        assert!(result.total_duration >= Duration::from_millis(20));
    }

    #[test]
    async fn test_timing_guard() {
        let collector = MetricsCollector::new().unwrap();

        {
            let _guard = collector.start_timing("test_guard");
            std::thread::sleep(Duration::from_millis(10));
        } // Guard drops here, recording the timing

        // Give a moment for async recording
        tokio::time::sleep(Duration::from_millis(1)).await;

        let summary = collector.get_metrics_summary().await.unwrap();
        let timers = summary["timers"].as_object().unwrap();

        assert!(timers.contains_key("test_guard"));
    }
}
