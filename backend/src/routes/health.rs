/*
 * ©AngelaMos | 2025
 */

use axum::{
    response::IntoResponse,
    extract::State,
    http::StatusCode,
    Json,
    response::Json as JsonResponse,
};
use serde::{Deserialize, Serialize};
use std::time::{Duration, Instant};
use tracing::{info, warn, error};
use sqlx::Row;

use crate::{
    utils::error::{AppError, Result},
    AppState,
};

/// Comprehensive health check response for monitoring systems
/// I'm providing detailed health information for production monitoring and alerting
#[derive(Debug, Serialize)]
pub struct HealthCheckResponse {
    pub status: ServiceStatus,
    pub timestamp: chrono::DateTime<chrono::Utc>,
    pub uptime_seconds: u64,
    pub version: VersionInfo,
    pub services: ServiceHealthStatus,
    pub system: SystemHealth,
    pub performance: PerformanceMetrics,
    pub checks: Vec<HealthCheck>,
}

#[derive(Debug, Clone, Serialize)]
pub enum ServiceStatus {
    Healthy,
    Degraded,
    Unhealthy,
}

#[derive(Debug, Serialize)]
pub struct VersionInfo {
    pub version: String,
    pub build_time: String,
    pub git_commit: String,
    pub rust_version: String,
}

#[derive(Debug, Serialize)]
pub struct ServiceHealthStatus {
    pub database: ComponentStatus,
    pub redis: ComponentStatus,
    pub github_api: ComponentStatus,
    pub fractal_engine: ComponentStatus,
}

#[derive(Debug, Serialize)]
pub struct ComponentStatus {
    pub status: ServiceStatus,
    pub response_time_ms: Option<u64>,
    pub last_check: chrono::DateTime<chrono::Utc>,
    pub error_message: Option<String>,
    pub metadata: Option<serde_json::Value>,
}

#[derive(Debug, Serialize)]
pub struct SystemHealth {
    pub cpu_usage_percent: f64,
    pub memory_usage_percent: f64,
    pub disk_usage_percent: f64,
    pub active_connections: u32,
    pub load_average: Vec<f64>,
}

#[derive(Debug, Serialize)]
pub struct PerformanceMetrics {
    pub requests_per_second: f64,
    pub average_response_time_ms: f64,
    pub error_rate_percent: f64,
    pub fractal_computations_last_hour: u32,
    pub github_api_calls_last_hour: u32,
}
#[derive(Debug, Clone, Serialize)]
pub struct HealthCheck {
    pub name: String,
    pub status: ServiceStatus,
    pub duration_ms: u64,
    pub message: String,
}

/// Simple health check endpoint for load balancers
/// I'm providing a lightweight endpoint for basic availability checks
pub async fn health_check(
    State(app_state): State<AppState>,
) -> Result<JsonResponse<HealthCheckResponse>> {
    let start_time = Instant::now();
    info!("Performing comprehensive health check");

    // I'm collecting health information from all critical services
    let mut checks = Vec::new();
    let mut overall_status = ServiceStatus::Healthy;

    // Database health check
    let (database_status, database_check) = check_database_health(&app_state).await;
    checks.push(database_check);

    // Redis health check
    let (redis_status, redis_check) = check_redis_health(&app_state).await;
    checks.push(redis_check);

    // GitHub API health check
    let (github_status, github_check) = check_github_api_health(&app_state).await;
    checks.push(github_check);

    // Fractal engine health check
    let (fractal_status, fractal_check) = check_fractal_engine_health(&app_state).await;
    checks.push(fractal_check);

    // System resources check
    let (system_health_struct, system_check_item) = check_system_health(&app_state).await;
    checks.push(system_check_item.clone());

    // Determine overall service status
    overall_status = determine_overall_status(&[
        &database_status.status,
        &redis_status.status,
        &github_status.status,
        &fractal_status.status,
        &system_check_item.status,
    ]);

    // Collect performance metrics
    let performance_metrics = collect_performance_metrics(&app_state).await;

    let health_response = HealthCheckResponse {
        status: overall_status,
        timestamp: chrono::Utc::now(),
        uptime_seconds: get_uptime_seconds(),
        version: VersionInfo {
            version: env!("CARGO_PKG_VERSION").to_string(),
            build_time: env!("BUILD_TIME").to_string(),
            git_commit: env!("GIT_COMMIT").to_string(),
            rust_version: option_env!("BUILD_RUST_VERSION").unwrap_or("unknown").to_string(),
        },
        services: ServiceHealthStatus {
            database: database_status,
            redis: redis_status,
            github_api: github_status,
            fractal_engine: fractal_status,
        },
        system: system_health_struct,
        performance: performance_metrics,
        checks,
    };

    let total_check_time = start_time.elapsed();
    info!("Health check completed in {}ms with status: {:?}",
        total_check_time.as_millis(), health_response.status);

    Ok(Json(health_response))
}

/// Readiness probe endpoint for Kubernetes deployments
/// I'm providing a readiness check that indicates when the service is ready to accept traffic
pub async fn readiness_check(
    State(app_state): State<AppState>,
) -> Result<JsonResponse<serde_json::Value>> {
    info!("Performing readiness check");

    // I'm checking only critical services needed for request handling
    let database_ready = check_database_readiness(&app_state).await;
    let redis_ready = check_redis_readiness(&app_state).await;
    let config_ready = check_configuration_readiness(&app_state).await;

    let is_ready = database_ready && redis_ready && config_ready;

    let readiness_response = serde_json::json!({
        "ready": is_ready,
        "timestamp": chrono::Utc::now(),
        "checks": {
            "database": database_ready,
            "redis": redis_ready,
            "configuration": config_ready
        }
    });

    if is_ready {
        info!("Service is ready to accept traffic");
        Ok(Json(readiness_response))
    } else {
        warn!("Service is not ready - some dependencies are unavailable");
        Err(AppError::ServiceUnavailableError("Service not ready".to_string()))
    }
}

/// Liveness probe endpoint for Kubernetes deployments
/// I'm providing a liveness check to detect if the service needs to be restarted
pub async fn liveness_check() -> Result<JsonResponse<serde_json::Value>> {
    // I'm implementing a simple liveness check that verifies basic service operation
    let liveness_response = serde_json::json!({
        "alive": true,
        "timestamp": chrono::Utc::now(),
        "uptime_seconds": get_uptime_seconds()
    });

    Ok(Json(liveness_response))
}

// Helper functions for individual service health checks

async fn check_database_health(app_state: &AppState) -> (ComponentStatus, HealthCheck) {
    let start_time = Instant::now();
    let check_name = "database_connection".to_string();

    match sqlx::query("SELECT 1 as health_check, pg_database_size(current_database()) as db_size")
        .fetch_one(&app_state.db_pool)
        .await
    {
        Ok(row) => {
            let duration = start_time.elapsed();
            let db_size: i64 = row.try_get("db_size").unwrap_or(0);

            let status = ComponentStatus {
                status: ServiceStatus::Healthy,
                response_time_ms: Some(duration.as_millis() as u64),
                last_check: chrono::Utc::now(),
                error_message: None,
                metadata: Some(serde_json::json!({
                    "database_size_bytes": db_size,
                    "pool_size": app_state.db_pool.size(),
                    "idle_connections": app_state.db_pool.num_idle()
                })),
            };

            let check = HealthCheck {
                name: check_name,
                status: ServiceStatus::Healthy,
                duration_ms: duration.as_millis() as u64,
                message: "Database connection successful".to_string(),
            };

            (status, check)
        }
        Err(e) => {
            let duration = start_time.elapsed();

            let status = ComponentStatus {
                status: ServiceStatus::Unhealthy,
                response_time_ms: Some(duration.as_millis() as u64),
                last_check: chrono::Utc::now(),
                error_message: Some(e.to_string()),
                metadata: None,
            };

            let check = HealthCheck {
                name: check_name,
                status: ServiceStatus::Unhealthy,
                duration_ms: duration.as_millis() as u64,
                message: format!("Database connection failed: {}", e),
            };

            (status, check)
        }
    }
}

async fn check_redis_health(app_state: &AppState) -> (ComponentStatus, HealthCheck) {
    let start_time = Instant::now();
    let check_name = "redis_connection".to_string();

    match app_state.redis_client.get_async_connection().await {
        Ok(mut conn) => {
            match redis::cmd("PING").query_async::<_, String>(&mut conn).await {
                Ok(response) if response == "PONG" => {
                    let duration = start_time.elapsed();

                    let status = ComponentStatus {
                        status: ServiceStatus::Healthy,
                        response_time_ms: Some(duration.as_millis() as u64),
                        last_check: chrono::Utc::now(),
                        error_message: None,
                        metadata: Some(serde_json::json!({
                            "ping_response": response
                        })),
                    };

                    let check = HealthCheck {
                        name: check_name,
                        status: ServiceStatus::Healthy,
                        duration_ms: duration.as_millis() as u64,
                        message: "Redis connection successful".to_string(),
                    };

                    (status, check)
                }
                Ok(unexpected_response) => {
                    let duration = start_time.elapsed();

                    let status = ComponentStatus {
                        status: ServiceStatus::Degraded,
                        response_time_ms: Some(duration.as_millis() as u64),
                        last_check: chrono::Utc::now(),
                        error_message: Some(format!("Unexpected Redis response: {}", unexpected_response)),
                        metadata: None,
                    };

                    let check = HealthCheck {
                        name: check_name,
                        status: ServiceStatus::Degraded,
                        duration_ms: duration.as_millis() as u64,
                        message: format!("Redis returned unexpected response: {}", unexpected_response),
                    };

                    (status, check)
                }
                Err(e) => {
                    let duration = start_time.elapsed();

                    let status = ComponentStatus {
                        status: ServiceStatus::Unhealthy,
                        response_time_ms: Some(duration.as_millis() as u64),
                        last_check: chrono::Utc::now(),
                        error_message: Some(e.to_string()),
                        metadata: None,
                    };

                    let check = HealthCheck {
                        name: check_name,
                        status: ServiceStatus::Unhealthy,
                        duration_ms: duration.as_millis() as u64,
                        message: format!("Redis PING failed: {}", e),
                    };

                    (status, check)
                }
            }
        }
        Err(e) => {
            let duration = start_time.elapsed();

            let status = ComponentStatus {
                status: ServiceStatus::Unhealthy,
                response_time_ms: Some(duration.as_millis() as u64),
                last_check: chrono::Utc::now(),
                error_message: Some(e.to_string()),
                metadata: None,
            };

            let check = HealthCheck {
                name: check_name,
                status: ServiceStatus::Unhealthy,
                duration_ms: duration.as_millis() as u64,
                message: format!("Redis connection failed: {}", e),
            };

            (status, check)
        }
    }
}

async fn check_github_api_health(app_state: &AppState) -> (ComponentStatus, HealthCheck) {
    let start_time = Instant::now();
    let check_name = "github_api".to_string();

    // I'm checking GitHub API rate limit status as a health indicator
    match app_state.github_service.get_rate_limit_status().await {
        Ok(rate_limit) => {
            let duration = start_time.elapsed();
            let remaining_percentage = (rate_limit.remaining as f64 / rate_limit.limit as f64) * 100.0;

            let status = if remaining_percentage < 10.0 {
                ServiceStatus::Degraded
            } else {
                ServiceStatus::Healthy
            };

            let component_status = ComponentStatus {
                status: status.clone(),
                response_time_ms: Some(duration.as_millis() as u64),
                last_check: chrono::Utc::now(),
                error_message: None,
                metadata: Some(serde_json::json!({
                    "rate_limit_remaining": rate_limit.remaining,
                    "rate_limit_total": rate_limit.limit,
                    "rate_limit_percentage": remaining_percentage,
                    "reset_time": chrono::DateTime::from_timestamp(rate_limit.reset as i64, 0)
                })),
            };

            let check = HealthCheck {
                name: check_name,
                status,
                duration_ms: duration.as_millis() as u64,
                message: format!("GitHub API accessible, {}/{} requests remaining",
                    rate_limit.remaining, rate_limit.limit),
            };

            (component_status, check)
        }
        Err(e) => {
            let duration = start_time.elapsed();

            let status = ComponentStatus {
                status: ServiceStatus::Degraded, // GitHub API issues shouldn't make the whole service unhealthy
                response_time_ms: Some(duration.as_millis() as u64),
                last_check: chrono::Utc::now(),
                error_message: Some(e.to_string()),
                metadata: None,
            };

            let check = HealthCheck {
                name: check_name,
                status: ServiceStatus::Degraded,
                duration_ms: duration.as_millis() as u64,
                message: format!("GitHub API check failed: {}", e),
            };

            (status, check)
        }
    }
}

async fn check_fractal_engine_health(app_state: &AppState) -> (ComponentStatus, HealthCheck) {
    let start_time = Instant::now();
    let check_name = "fractal_engine".to_string();

    // I'm performing a quick fractal computation test to verify the engine
    let test_request = crate::services::fractal_service::FractalRequest {
        width: 32,
        height: 32,
        center_x: -0.5,
        center_y: 0.0,
        zoom: 1.0,
        max_iterations: 50,
        fractal_type: crate::services::fractal_service::FractalType::Mandelbrot,
    };

    let computation_result = tokio::task::spawn_blocking(move || {
        let service = crate::services::fractal_service::FractalService::new();
        service.generate_mandelbrot(test_request)
    }).await;

    match computation_result {
        Ok(result) => {
            let duration = start_time.elapsed();

            let status = ComponentStatus {
                status: ServiceStatus::Healthy,
                response_time_ms: Some(duration.as_millis() as u64),
                last_check: chrono::Utc::now(),
                error_message: None,
                metadata: Some(serde_json::json!({
                    "test_computation_time_ms": result.computation_time_ms,
                    "pixels_computed": result.width * result.height,
                    "engine_version": "rayon-parallel"
                })),
            };

            let check = HealthCheck {
                name: check_name,
                status: ServiceStatus::Healthy,
                duration_ms: duration.as_millis() as u64,
                message: format!("Fractal engine healthy, test computation took {}ms", result.computation_time_ms),
            };

            (status, check)
        }
        Err(e) => {
            let duration = start_time.elapsed();

            let status = ComponentStatus {
                status: ServiceStatus::Unhealthy,
                response_time_ms: Some(duration.as_millis() as u64),
                last_check: chrono::Utc::now(),
                error_message: Some(e.to_string()),
                metadata: None,
            };

            let check = HealthCheck {
                name: check_name,
                status: ServiceStatus::Unhealthy,
                duration_ms: duration.as_millis() as u64,
                message: format!("Fractal engine test failed: {}", e),
            };

            (status, check)
        }
    }
}

async fn check_system_health(_app_state: &AppState) -> (SystemHealth, HealthCheck) {
    let start_time = Instant::now();

    // I'm collecting system resource information
    use sysinfo::{System, SystemExt, CpuExt, DiskExt};
    let mut sys = System::new_all();
    sys.refresh_all();

    let cpu_usage = sys.global_cpu_info().cpu_usage() as f64;
    let memory_usage = (sys.used_memory() as f64 / sys.total_memory() as f64) * 100.0;

    // Calculate disk usage (taking the root filesystem)
    let disk_usage = if let Some(disk) = sys.disks().first() {
        let used = disk.total_space() - disk.available_space();
        (used as f64 / disk.total_space() as f64) * 100.0
    } else {
        0.0
    };

    let load_average = sys.load_average();
    let load_avg_vec = vec![load_average.one, load_average.five, load_average.fifteen];

    // Determine system health status
    let system_status = if cpu_usage > 90.0 || memory_usage > 95.0 || disk_usage > 95.0 {
        ServiceStatus::Unhealthy
    } else if cpu_usage > 70.0 || memory_usage > 80.0 || disk_usage > 80.0 {
        ServiceStatus::Degraded
    } else {
        ServiceStatus::Healthy
    };

    let system_health = SystemHealth {
        cpu_usage_percent: cpu_usage,
        memory_usage_percent: memory_usage,
        disk_usage_percent: disk_usage,
        active_connections: 0, // This would need to be implemented based on your connection tracking
        load_average: load_avg_vec,
    };

    let duration = start_time.elapsed();
    let check = HealthCheck {
        name: "system_resources".to_string(),
        status: system_status,
        duration_ms: duration.as_millis() as u64,
        message: format!("CPU: {:.1}%, Memory: {:.1}%, Disk: {:.1}%",
            cpu_usage, memory_usage, disk_usage),
    };

    (system_health, check)
}

// Helper functions for readiness checks

async fn check_database_readiness(app_state: &AppState) -> bool {
    sqlx::query("SELECT 1")
        .fetch_one(&app_state.db_pool)
        .await
        .is_ok()
}

async fn check_redis_readiness(app_state: &AppState) -> bool {
    match app_state.redis_client.get_async_connection().await {
        Ok(mut conn) => {
            redis::cmd("PING")
                .query_async::<_, String>(&mut conn)
                .await
                .map(|response| response == "PONG")
                .unwrap_or(false)
        }
        Err(_) => false,
    }
}

async fn check_configuration_readiness(app_state: &AppState) -> bool {
    // I'm checking that essential configuration is present
    !app_state.config.github_token.is_empty()
        && !app_state.config.github_username.is_empty()
        && !app_state.config.database_url.is_empty()
        && !app_state.config.redis_url.is_empty()
}

// Helper functions for metrics and status determination

async fn collect_performance_metrics(_app_state: &AppState) -> PerformanceMetrics {
    // I'm implementing basic performance metrics collection
    // In a production system, you'd want to integrate with your metrics collection system
    PerformanceMetrics {
        requests_per_second: 0.0, // TODO: Implement actual metrics collection
        average_response_time_ms: 0.0,
        error_rate_percent: 0.0,
        fractal_computations_last_hour: 0,
        github_api_calls_last_hour: 0,
    }
}

fn determine_overall_status(statuses: &[&ServiceStatus]) -> ServiceStatus {
    // I'm implementing a conservative approach to overall status determination
    if statuses.iter().any(|&status| matches!(status, ServiceStatus::Unhealthy)) {
        ServiceStatus::Unhealthy
    } else if statuses.iter().any(|&status| matches!(status, ServiceStatus::Degraded)) {
        ServiceStatus::Degraded
    } else {
        ServiceStatus::Healthy
    }
}

fn get_uptime_seconds() -> u64 {
    // I'm implementing a simple uptime calculation
    // In a production system, you'd want to track this more accurately
    static START_TIME: std::sync::OnceLock<std::time::Instant> = std::sync::OnceLock::new();
    let start = START_TIME.get_or_init(|| std::time::Instant::now());
    start.elapsed().as_secs()
}
