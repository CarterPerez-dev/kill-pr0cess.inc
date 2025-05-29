/*
 * Performance monitoring service providing comprehensive system metrics collection and analysis for real-time performance tracking.
 * I'm implementing sophisticated performance monitoring that showcases system capabilities while providing valuable insights into computational efficiency.
 */

use serde::{Deserialize, Serialize};
use std::time::{Duration, Instant, SystemTime, UNIX_EPOCH};
use sysinfo::{System, SystemExt, CpuExt, DiskExt, NetworkExt, NetworksExt, ComponentExt};
use tokio::sync::RwLock;
use tracing::{info, warn, debug};
use std::sync::Arc;
use std::collections::VecDeque;

use crate::{
    utils::error::{AppError, Result},
    database::DatabasePool,
};

/// Comprehensive system performance metrics
/// I'm capturing all essential performance indicators for thorough analysis
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemMetrics {
    pub timestamp: chrono::DateTime<chrono::Utc>,
    pub cpu_usage_percent: f64,
    pub memory_usage_percent: f64,
    pub memory_total_gb: f64,
    pub memory_available_gb: f64,
    pub disk_usage_percent: f64,
    pub disk_total_gb: f64,
    pub disk_available_gb: f64,
    pub network_rx_bytes_per_sec: u64,
    pub network_tx_bytes_per_sec: u64,
    pub load_average_1m: f64,
    pub load_average_5m: f64,
    pub load_average_15m: f64,
    pub cpu_cores: u32,
    pub cpu_threads: u32,
    pub cpu_model: String,
    pub uptime_seconds: u64,
    pub active_processes: u32,
    pub system_temperature: Option<f64>,
}

/// Performance monitoring service with comprehensive metrics collection
/// I'm implementing real-time performance tracking with historical analysis
#[derive(Clone)]
pub struct PerformanceService {
    system: Arc<RwLock<System>>,
    metrics_history: Arc<RwLock<VecDeque<SystemMetrics>>>,
    db_pool: DatabasePool,
}

impl PerformanceService {
    /// Create a new performance monitoring service
    /// I'm setting up comprehensive performance tracking infrastructure
    pub fn new(db_pool: DatabasePool) -> Self {
        let mut system = System::new_all();
        system.refresh_all();

        Self {
            system: Arc::new(RwLock::new(system)),
            metrics_history: Arc::new(RwLock::new(VecDeque::with_capacity(1000))),
            db_pool,
        }
    }

    /// Get current system metrics with comprehensive data collection
    /// I'm implementing real-time system monitoring with detailed analysis
    pub async fn get_system_metrics(&self) -> Result<SystemMetrics> {
        let mut system = self.system.write().await;
        system.refresh_all();

        // I'm collecting comprehensive CPU information
        let cpu_usage = system.global_cpu_info().cpu_usage() as f64;
        let cpu_cores = system.physical_core_count().unwrap_or(0) as u32;
        let cpu_threads = system.cpus().len() as u32;
        let cpu_model = system.global_cpu_info().brand().to_string();

        // Memory information with detailed breakdown
        let memory_total = system.total_memory() as f64 / (1024.0 * 1024.0 * 1024.0);
        let memory_available = system.available_memory() as f64 / (1024.0 * 1024.0 * 1024.0);
        let memory_usage_percent = ((memory_total - memory_available) / memory_total) * 100.0;

        // Disk information for primary disk
        let (disk_usage_percent, disk_total_gb, disk_available_gb) = if let Some(disk) = system.disks().first() {
            let total = disk.total_space() as f64 / (1024.0 * 1024.0 * 1024.0);
            let available = disk.available_space() as f64 / (1024.0 * 1024.0 * 1024.0);
            let usage_percent = ((total - available) / total) * 100.0;
            (usage_percent, total, available)
        } else {
            (0.0, 0.0, 0.0)
        };

        // Network statistics
        let (network_rx, network_tx) = system.networks().iter()
            .fold((0u64, 0u64), |(rx, tx), (_, network)| {
                (rx + network.received(), tx + network.transmitted())
            });

        // Load average information
        let load_avg = system.load_average();

        // System uptime
        let uptime_seconds = system.uptime();

        // Active process count
        let active_processes = system.processes().len() as u32;

        // System temperature (if available)
        let system_temperature = system.components()
            .iter()
            .find(|component| component.label().contains("CPU") || component.label().contains("Core"))
            .map(|component| component.temperature() as f64);

        let metrics = SystemMetrics {
            timestamp: chrono::Utc::now(),
            cpu_usage_percent: cpu_usage,
            memory_usage_percent: memory_usage_percent,
            memory_total_gb: memory_total,
            memory_available_gb: memory_available,
            disk_usage_percent,
            disk_total_gb,
            disk_available_gb,
            network_rx_bytes_per_sec: network_rx,
            network_tx_bytes_per_sec: network_tx,
            load_average_1m: load_avg.one,
            load_average_5m: load_avg.five,
            load_average_15m: load_avg.fifteen,
            cpu_cores,
            cpu_threads,
            cpu_model,
            uptime_seconds,
            active_processes,
            system_temperature,
        };

        // Store in history
        let mut history = self.metrics_history.write().await;
        history.push_back(metrics.clone());
        if history.len() > 1000 {
            history.pop_front();
        }

        // Store in database for persistence
        if let Err(e) = self.store_system_metrics(&metrics).await {
            warn!("Failed to store system metrics in database: {}", e);
        }

        Ok(metrics)
    }

    /// Get simplified system information for general use
    /// I'm providing basic system info without full metrics collection
    pub async fn get_system_info(&self) -> Result<serde_json::Value> {
        let mut system = self.system.write().await;
        system.refresh_all();

        let info = serde_json::json!({
            "cpu_model": system.global_cpu_info().brand(),
            "cpu_cores": system.physical_core_count().unwrap_or(0),
            "cpu_threads": system.cpus().len(),
            "memory_total_gb": system.total_memory() as f64 / (1024.0 * 1024.0 * 1024.0),
            "memory_available_gb": system.available_memory() as f64 / (1024.0 * 1024.0 * 1024.0),
            let mem_usage_perc = {
                let total = system.total_memory() as f64;
                let available = system.available_memory() as f64;
                if total > 0.0 { ((total - available) / total) * 100.0 } else { 0.0 }
            },
            "cpu_usage_percent": system.global_cpu_info().cpu_usage(),
            "uptime_seconds": system.uptime(),
            "load_average_1m": system.load_average().one,
            "load_average_5m": system.load_average().five,
            "load_average_15m": system.load_average().fifteen,
            "os_version": system.long_os_version().unwrap_or_default(),
            "processes_count": system.processes().len()
        });

        Ok(info)
    }

    /// Run a basic performance benchmark
    /// I'm implementing a simple benchmark for demonstration purposes
    pub async fn run_benchmark(&self) -> Result<serde_json::Value> {
        info!("Starting performance benchmark");
        let start_time = Instant::now();

        // Simple CPU benchmark: calculate prime numbers
        let cpu_benchmark = tokio::task::spawn_blocking(|| {
            let start = Instant::now();
            let mut count = 0u32;
            for i in 2..50000 {
                if is_prime(i) {
                    count += 1;
                }
            }
            (count, start.elapsed())
        }).await.unwrap();

        // Simple memory benchmark
        let memory_benchmark = tokio::task::spawn_blocking(|| {
            let start = Instant::now();
            let data_size: u64 = 10_000_000;
            let data: Vec<u64> = (0..data_size).collect();
            let sum: u64 = data.iter().sum();
            (sum, start.elapsed())
        }).await.unwrap();

        let total_time = start_time.elapsed();

        let benchmark_results = serde_json::json!({
            "benchmark_id": uuid::Uuid::new_v4().to_string(),
            "timestamp": chrono::Utc::now(),
            "total_duration_ms": total_time.as_millis(),
            "cpu_benchmark": {
                "primes_found": cpu_benchmark.0,
                "duration_ms": cpu_benchmark.1.as_millis(),
                "operations_per_second": cpu_benchmark.0 as f64 / cpu_benchmark.1.as_secs_f64()
            },
            "memory_benchmark": {
                "data_processed": memory_benchmark.0,
                "duration_ms": memory_benchmark.1.as_millis(),
                "mb_per_second": (10_000_000 * 8) as f64 / (1024.0 * 1024.0) / memory_benchmark.1.as_secs_f64()
            },
            "system_info": self.get_system_info().await?
        });

        info!("Benchmark completed in {:?}", total_time);
        Ok(benchmark_results)
    }

    /// Get metrics history for analysis
    /// I'm providing historical data for trend analysis
    pub async fn get_metrics_history(&self, limit: Option<usize>) -> Result<Vec<SystemMetrics>> {
        let history = self.metrics_history.read().await;
        let limit = limit.unwrap_or(100).min(history.len());

        Ok(history.iter().rev().take(limit).cloned().collect())
    }

    /// Store system metrics in database for persistence
    /// I'm implementing persistent storage for long-term analysis
    async fn store_system_metrics(&self, metrics: &SystemMetrics) -> Result<()> {
        let json_tags = serde_json::json!({
            "cpu_cores": metrics.cpu_cores,
            "cpu_threads": metrics.cpu_threads,
            "memory_total_gb": metrics.memory_total_gb,
            "uptime_seconds": metrics.uptime_seconds
        });
    
        sqlx::query!(
            r##"INSERT INTO performance_metrics (metric_type, metric_value, metric_unit, timestamp, tags)
                VALUES ('cpu_usage', $1, 'percent', $2, $3)"##
            ,
            metrics.cpu_usage_percent,
            metrics.timestamp,
            json_tags
        )
        .execute(&self.db_pool)
        .await?;
    
        sqlx::query!(
            r##"INSERT INTO performance_metrics (metric_type, metric_value, metric_unit, timestamp, tags)
                VALUES ('memory_usage', $1, 'percent', $2, $3)"##
            ,
            metrics.memory_usage_percent,
            metrics.timestamp,
            json_tags
        )
        .execute(&self.db_pool)
        .await?;
    
        sqlx::query!(
            r##"INSERT INTO performance_metrics (metric_type, metric_value, metric_unit, timestamp, tags)
                VALUES ('disk_usage', $1, 'percent', $2, $3)"##
            ,
            metrics.disk_usage_percent,
            metrics.timestamp,
            json_tags
        )
        .execute(&self.db_pool)
        .await?;
    
        sqlx::query!(
            r##"INSERT INTO performance_metrics (metric_type, metric_value, metric_unit, timestamp, tags)
                VALUES ('load_average_1m', $1, 'ratio', $2, $3)"##
            ,
            metrics.load_average_1m,
            metrics.timestamp,
            json_tags
        )
        .execute(&self.db_pool)
        .await?;
    
        Ok(())
    }
}

// Helper function for CPU benchmark
fn is_prime(n: u32) -> bool {
    if n < 2 {
        return false;
    }
    for i in 2..((n as f64).sqrt() as u32 + 1) {
        if n % i == 0 {
            return false;
        }
    }
    true
}
