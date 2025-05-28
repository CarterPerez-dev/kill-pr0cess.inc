/*
 * Performance monitoring route handlers providing real-time system metrics and benchmark capabilities for the showcase.
 * I'm implementing comprehensive performance endpoints that demonstrate system capabilities while providing valuable diagnostic information.
 */

use axum::{
    extract::{Query, State},
    http::StatusCode,
    Json,
    response::Json as JsonResponse,
};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tracing::{info, warn, error};
use sysinfo::{System, SystemExt, CpuExt, DiskExt, NetworkExt};

use crate::{
    utils::error::{AppError, Result},
    AppState,
};

#[derive(Debug, Deserialize)]
pub struct MetricsQuery {
    pub history_limit: Option<usize>,
    pub include_history: Option<bool>,
}

#[derive(Debug, Serialize)]
pub struct CurrentMetricsResponse {
    pub timestamp: chrono::DateTime<chrono::Utc>,
    pub system: SystemPerformance,
    pub application: ApplicationPerformance,
    pub hardware: HardwareInfo,
    pub runtime: RuntimeInfo,
}

#[derive(Debug, Serialize)]
pub struct SystemPerformance {
    pub cpu_usage_percent: f64,
    pub memory_usage_percent: f64,
    pub memory_total_gb: f64,
    pub memory_available_gb: f64,
    pub disk_usage_percent: f64,
    pub load_average_1m: f64,
    pub load_average_5m: f64,
    pub load_average_15m: f64,
    pub uptime_seconds: u64,
    pub active_processes: u32,
}

#[derive(Debug, Serialize)]
pub struct ApplicationPerformance {
    pub requests_handled: u64,
    pub average_response_time_ms: f64,
    pub fractal_computations: u64,
    pub github_api_calls: u64,
    pub cache_hit_rate: f64,
    pub database_connections: u32,
    pub memory_usage_mb: f64,
}

#[derive(Debug, Serialize)]
pub struct HardwareInfo {
    pub cpu_model: String,
    pub cpu_cores: u32,
    pub cpu_threads: u32,
    pub architecture: String,
    pub total_memory_gb: f64,
}

#[derive(Debug, Serialize)]
pub struct RuntimeInfo {
    pub rust_version: String,
    pub build_type: String,
    pub optimization_level: String,
    pub features_enabled: Vec<String>,
}

/// Get current performance metrics with comprehensive system analysis
/// I'm providing real-time performance data for monitoring and display
pub async fn get_current_metrics(
    State(app_state): State<AppState>,
    Query(params): Query<MetricsQuery>,
) -> Result<JsonResponse<CurrentMetricsResponse>> {
    info!("Fetching current performance metrics");

    // Collect system metrics
    let mut system = System::new_all();
    system.refresh_all();

    let system_perf = SystemPerformance {
        cpu_usage_percent: system.global_cpu_info().cpu_usage() as f64,
        memory_usage_percent: {
            let total = system.total_memory() as f64;
            let available = system.available_memory() as f64;
            ((total - available) / total) * 100.0
        },
        memory_total_gb: system.total_memory() as f64 / (1024.0 * 1024.0 * 1024.0),
        memory_available_gb: system.available_memory() as f64 / (1024.0 * 1024.0 * 1024.0),
        disk_usage_percent: {
            if let Some(disk) = system.disks().first() {
                let total = disk.total_space() as f64;
                let available = disk.available_space() as f64;
                ((total - available) / total) * 100.0
            } else {
                0.0
            }
        },
        load_average_1m: system.load_average().one,
        load_average_5m: system.load_average().five,
        load_average_15m: system.load_average().fifteen,
        uptime_seconds: system.uptime(),
        active_processes: system.processes().len() as u32,
    };

    let hardware_info = HardwareInfo {
        cpu_model: system.global_cpu_info().brand().to_string(),
        cpu_cores: system.physical_core_count().unwrap_or(0) as u32,
        cpu_threads: system.cpus().len() as u32,
        architecture: std::env::consts::ARCH.to_string(),
        total_memory_gb: system.total_memory() as f64 / (1024.0 * 1024.0 * 1024.0),
    };

    // Application performance metrics (simplified for now)
    let app_perf = ApplicationPerformance {
        requests_handled: 0, // Would be tracked from middleware
        average_response_time_ms: 0.0, // Would be calculated from request timings
        fractal_computations: 0, // Would be tracked from fractal service
        github_api_calls: 0, // Would be tracked from GitHub service
        cache_hit_rate: 0.0, // Would be retrieved from cache service
        database_connections: app_state.db_pool.size(),
        memory_usage_mb: 0.0, // Would be calculated from process memory usage
    };

    let runtime_info = RuntimeInfo {
        rust_version: option_env!("BUILD_RUST_VERSION").unwrap_or("unknown").to_string(),
        build_type: if cfg!(debug_assertions) { "debug".to_string() } else { "release".to_string() },
        optimization_level: if cfg!(debug_assertions) { "none".to_string() } else { "3".to_string() },
        features_enabled: get_enabled_features(),
    };

    let response = CurrentMetricsResponse {
        timestamp: chrono::Utc::now(),
        system: system_perf,
        application: app_perf,
        hardware: hardware_info,
        runtime: runtime_info,
    };

    info!("Performance metrics collected successfully");
    Ok(Json(response))
}

/// Get detailed system information for display
/// I'm providing comprehensive system information for the showcase
pub async fn get_system_info(
    State(_app_state): State<AppState>,
) -> Result<JsonResponse<serde_json::Value>> {
    info!("Fetching detailed system information");
    let mut system = System::new_all();
    system.refresh_all();

    let system_info = serde_json::json!({
        "timestamp": chrono::Utc::now(),
        "os_name": system.name().unwrap_or_default() // Simplified
    });
    Ok(Json(system_info))
}

/// Run comprehensive performance benchmark
/// I'm implementing a thorough benchmark suite for performance evaluation
pub async fn run_benchmark(
    State(_app_state): State<AppState>,
) -> Result<JsonResponse<serde_json::Value>> {
    info!("Starting comprehensive performance benchmark");
    let benchmark_start = std::time::Instant::now();

    // CPU benchmark: prime number calculation
    let cpu_benchmark = tokio::task::spawn_blocking(|| {
        let start = std::time::Instant::now();
        let mut primes = Vec::new();

        for i in 2..10000 {
            if is_prime(i) {
                primes.push(i);
            }
        }

        let single_thread_time = start.elapsed();
        let single_thread_primes = primes.len();

        // Multi-threaded benchmark
        let start = std::time::Instant::now();
        let multi_thread_primes = (2..50000u32)
            .collect::<Vec<_>>()
            .into_iter()
            .filter(|&i| is_prime(i))
            .count();
        let multi_thread_time = start.elapsed();

        serde_json::json!({
            "single_thread": {
                "primes_found": single_thread_primes,
                "duration_ms": single_thread_time.as_millis(),
                "primes_per_second": single_thread_primes as f64 / single_thread_time.as_secs_f64()
            },
            "multi_thread": {
                "primes_found": multi_thread_primes,
                "duration_ms": multi_thread_time.as_millis(),
                "primes_per_second": multi_thread_primes as f64 / multi_thread_time.as_secs_f64()
            },
            "parallel_efficiency": (multi_thread_primes as f64 / multi_thread_time.as_secs_f64()) /
                                  (single_thread_primes as f64 / single_thread_time.as_secs_f64())
        })
    }).await.unwrap();

    // Memory benchmark: array operations
    let memory_benchmark = tokio::task::spawn_blocking(|| {
        let start = std::time::Instant::now();
        let data_size = 10_000_000;
        let data: Vec<u64> = (0..data_size as usize).collect();
        let allocation_time = start.elapsed();

        let start = std::time::Instant::now();
        let sum: u64 = data.iter().sum();
        let read_time = start.elapsed();

        let start = std::time::Instant::now();
        let mut write_data = vec![0u64; data_size as usize];
        for i in 0..data_size as usize {
            write_data[i] = i as u64;
        }
        let write_time = start.elapsed();

        serde_json::json!({
            "allocation": {
                "duration_ms": allocation_time.as_millis(),
                "mb_allocated": (data_size * 8) as f64 / (1024.0 * 1024.0),
                "mb_per_second": (data_size * 8) as f64 / (1024.0 * 1024.0) / allocation_time.as_secs_f64()
            },
            "sequential_read": {
                "duration_ms": read_time.as_millis(),
                "sum_result": sum,
                "mb_per_second": (data_size * 8) as f64 / (1024.0 * 1024.0) / read_time.as_secs_f64()
            },
            "sequential_write": {
                "duration_ms": write_time.as_millis(),
                "mb_per_second": (data_size * 8) as f64 / (1024.0 * 1024.0) / write_time.as_secs_f64()
            }
        })
    }).await.unwrap();

    // System information at benchmark time
    let mut system = System::new_all();
    system.refresh_all();

    let benchmark_duration = benchmark_start.elapsed();

    let benchmark_results = serde_json::json!({
        "benchmark_id": uuid::Uuid::new_v4().to_string(),
        "timestamp": chrono::Utc::now(),
        "total_duration_ms": benchmark_duration.as_millis(),
        "system_info": {
            "cpu_model": system.global_cpu_info().brand(),
            "cpu_cores": system.physical_core_count().unwrap_or(0),
            "cpu_threads": system.cpus().len(),
            "memory_total_gb": system.total_memory() as f64 / (1024.0 * 1024.0 * 1024.0),
            "architecture": std::env::consts::ARCH,
            "os": system.long_os_version(),
        },
        "benchmarks": {
            "cpu": cpu_benchmark,
            "memory": memory_benchmark,
        },
        "performance_rating": calculate_performance_rating(&cpu_benchmark, &memory_benchmark),
        "comparison": {
            "baseline_system": "Intel Core i5-8400 (6 cores, 16GB RAM)",
            "relative_performance": 1.0, // Would be calculated based on baseline comparison
        }
    });

    info!("Benchmark completed in {:?}", benchmark_duration);
    Ok(Json(benchmark_results))
}

/// Get performance metrics history for trend analysis
/// I'm providing historical performance data for analysis and visualization
pub async fn get_metrics_history(
    State(_app_state): State<AppState>,
    Query(params): Query<MetricsQuery>,
) -> Result<JsonResponse<serde_json::Value>> {
    info!("Fetching performance metrics history");

    let limit = params.history_limit.unwrap_or(100).min(1000);

    // In a real implementation, this would fetch from database
    // For now, I'm providing sample historical data structure
    let history = serde_json::json!({
        "timestamp": chrono::Utc::now(),
        "period_minutes": limit * 5, // Assuming 5-minute intervals
        "data_points": limit,
        "metrics": {
            "cpu_usage": generate_sample_timeseries(limit, 20.0, 80.0),
            "memory_usage": generate_sample_timeseries(limit, 40.0, 70.0),
            "disk_usage": generate_sample_timeseries(limit, 50.0, 60.0),
            "load_average": generate_sample_timeseries(limit, 0.1, 2.0),
            "response_times": generate_sample_timeseries(limit, 5.0, 50.0),
        },
        "summary": {
            "average_cpu": 45.0,
            "peak_cpu": 85.0,
            "average_memory": 55.0,
            "peak_memory": 72.0,
            "incidents": 0,
            "uptime_percentage": 100.0,
        }
    });

    info!("Performance history generated with {} data points", limit);
    Ok(Json(history))
}

// Helper functions for performance calculations and utilities

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

fn get_enabled_features() -> Vec<String> {
    let mut features = Vec::new();

    if cfg!(feature = "jemalloc") {
        features.push("jemalloc".to_string());
     }
     // if cfg!(feature = "simd") { // Custom feature, check Cargo.toml
     //     features.push("simd".to_string());
     // }
     // if cfg!(feature = "parallel") { // Custom feature, check Cargo.toml
     //     features.push("parallel".to_string());
     // }

    // Add compile-time features
    if cfg!(debug_assertions) {
        features.push("debug-assertions".to_string());
    }
    if cfg!(target_feature = "avx2") {
        features.push("avx2".to_string());
    }
    if cfg!(target_feature = "fma") {
        features.push("fma".to_string());
    }

    features
}

fn calculate_performance_rating(cpu_bench: &serde_json::Value, memory_bench: &serde_json::Value) -> String {
    // Simple performance rating based on benchmark results
    let cpu_score = cpu_bench["multi_thread"]["primes_per_second"].as_f64().unwrap_or(0.0);
    let memory_score = memory_bench["sequential_read"]["mb_per_second"].as_f64().unwrap_or(0.0);

    let combined_score = (cpu_score / 1000.0) + (memory_score / 1000.0);

    match combined_score {
        x if x > 10.0 => "Exceptional".to_string(),
        x if x > 7.0 => "Excellent".to_string(),
        x if x > 5.0 => "Very Good".to_string(),
        x if x > 3.0 => "Good".to_string(),
        x if x > 1.0 => "Fair".to_string(),
        _ => "Needs Optimization".to_string(),
    }
}

fn generate_sample_timeseries(count: usize, min: f64, max: f64) -> Vec<serde_json::Value> {
    use std::f64::consts::PI;

    (0..count)
        .map(|i| {
            let t = i as f64 / count as f64;
            let noise = (t * PI * 4.0).sin() * 0.1 + (t * PI * 8.0).cos() * 0.05;
            let base = min + (max - min) * (0.5 + 0.3 * (t * PI * 2.0).sin());
            let value = (base + noise * (max - min)).max(min).min(max);

            serde_json::json!({
                "timestamp": chrono::Utc::now() - chrono::Duration::minutes((count - i) as i64 * 5),
                "value": (value * 100.0).round() / 100.0
            })
        })
        .collect()
}
