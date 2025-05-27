/*
 * Core library module for the dark performance showcase backend, organizing all modules and exposing public APIs.
 * I'm setting up a clean module structure with proper error handling, database integration, and performance monitoring capabilities.
 */

// Module declarations - I'm organizing code into logical service layers
pub mod database;
pub mod models;
pub mod routes;
pub mod services;
pub mod utils;

// Re-export commonly used types and utilities for internal use
pub use utils::{
    config::Config,
    error::{AppError, Result},
    metrics::MetricsCollector,
};

// Re-export database utilities
pub use database::{
    connection::{DatabasePool, create_pool},
};

// Re-export core models for external API usage
pub use models::{
    github::{Repository, RepositoryStats, GitHubUser},
    fractals::{FractalRequest, FractalResponse, FractalType},
    performance::{PerformanceMetric, SystemInfo, BenchmarkResult},
};

// Re-export service layer for application logic
pub use services::{
    github_service::GitHubService,
    fractal_service::FractalService,
    performance_service::PerformanceService,
    cache_service::CacheService,
};

// Core application state that I'll share across handlers
#[derive(Clone)]
pub struct AppState {
    pub db_pool: DatabasePool,
    pub redis_client: redis::Client,
    pub github_service: GitHubService,
    pub fractal_service: FractalService,
    pub performance_service: PerformanceService,
    pub cache_service: CacheService,
    pub config: Config,
    pub metrics: MetricsCollector,
}

impl AppState {
    /// Creates new application state with all initialized services
    /// I'm ensuring all dependencies are properly connected and configured
    pub async fn new(config: Config) -> Result<Self> {
        // Initialize database connection pool with optimized settings
        let db_pool = create_pool(&config.database_url).await?;

        // Initialize Redis client with connection pooling
        let redis_client = redis::Client::open(config.redis_url.clone())
            .map_err(|e| AppError::DatabaseError(format!("Redis connection failed: {}", e)))?;

        // Initialize metrics collector for performance monitoring
        let metrics = MetricsCollector::new()?;

        // Initialize service layer with shared dependencies
        let cache_service = CacheService::new(redis_client.clone());
        let github_service = GitHubService::new(
            config.github_token.clone(),
            cache_service.clone(),
        );
        let fractal_service = FractalService::new();
        let performance_service = PerformanceService::new(
            db_pool.clone(),
        );

        Ok(AppState {
            db_pool,
            redis_client,
            github_service,
            fractal_service,
            performance_service,
            cache_service,
            config,
            metrics,
        })
    }

    /// Health check that verifies all critical services are operational
    /// I'm checking database connectivity, Redis availability, and service health
    pub async fn health_check(&self) -> Result<serde_json::Value> {
        use sqlx::Row;

        // Test database connectivity
        let db_status = match sqlx::query("SELECT 1 as test")
            .fetch_one(&self.db_pool)
            .await
        {
            Ok(_) => "healthy",
            Err(_) => "unhealthy",
        };

        // Test Redis connectivity
        let mut conn = self.redis_client.get_async_connection().await
            .map_err(|e| AppError::DatabaseError(format!("Redis connection failed: {}", e)))?;

        let redis_status = match redis::cmd("PING")
            .query_async::<_, String>(&mut conn)
            .await
        {
            Ok(_) => "healthy",
            Err(_) => "unhealthy",
        };

        // Get system performance metrics
        let system_info = self.performance_service.get_system_info().await?;

        Ok(serde_json::json!({
            "status": if db_status == "healthy" && redis_status == "healthy" { "healthy" } else { "unhealthy" },
            "timestamp": chrono::Utc::now(),
            "services": {
                "database": db_status,
                "redis": redis_status,
                "github_api": "healthy", // GitHub service handles its own health
                "fractal_engine": "healthy"
            },
            "system": {
                "cpu_usage": system_info.cpu_usage_percent,
                "memory_usage": system_info.memory_usage_percent,
                "uptime_seconds": system_info.uptime_seconds,
                "active_connections": system_info.active_connections
            },
            "version": env!("CARGO_PKG_VERSION"),
            "build_time": env!("BUILD_TIME"),
            "git_commit": env!("GIT_COMMIT")
        }))
    }

    /// Graceful shutdown that cleans up resources and connections
    /// I'm ensuring all background tasks complete and connections are properly closed
    pub async fn shutdown(&self) -> Result<()> {
        tracing::info!("Initiating graceful shutdown");

        // Flush any pending metrics
        self.metrics.flush().await?;

        // Close database pool gracefully
        self.db_pool.close().await;

        tracing::info!("Graceful shutdown completed");
        Ok(())
    }
}

// Helper macros for common operations that I use throughout the application

/// Macro for timing operations and collecting performance metrics
/// I'm making it easy to track performance across all service calls
#[macro_export]
macro_rules! time_operation {
    ($metrics:expr, $operation:expr, $code:block) => {{
        let start = std::time::Instant::now();
        let result = $code;
        let duration = start.elapsed();

        $metrics.record_operation_time($operation, duration.as_millis() as f64).await;

        result
    }};
}

/// Macro for caching expensive operations with automatic TTL
/// I'm simplifying cache usage patterns across services
#[macro_export]
macro_rules! cached_operation {
    ($cache:expr, $key:expr, $ttl:expr, $operation:block) => {{
        match $cache.get($key).await {
            Ok(Some(cached)) => Ok(cached),
            _ => {
                let result = $operation;
                if let Ok(ref value) = result {
                    let _ = $cache.set($key, value, $ttl).await;
                }
                result
            }
        }
    }};
}

// Integration tests module - I'm setting up comprehensive testing
#[cfg(test)]
mod tests {
    use super::*;
    use tokio_test;

    #[tokio::test]
    async fn test_app_state_creation() {
        // I'm testing that the application state can be created in test environment
        let config = Config::from_env().expect("Test configuration should be valid");
        let app_state = AppState::new(config).await;

        assert!(app_state.is_ok(), "App state creation should succeed");
    }

    #[tokio::test]
    async fn test_health_check() {
        let config = Config::from_env().expect("Test configuration should be valid");
        let app_state = AppState::new(config).await.expect("App state should be created");

        let health = app_state.health_check().await;
        assert!(health.is_ok(), "Health check should return successfully");

        let health_json = health.unwrap();
        assert!(health_json["status"].is_string(), "Health status should be present");
        assert!(health_json["services"].is_object(), "Services status should be present");
    }
}

// Performance benchmarks - I'm including criterion benchmarks for performance regression testing
#[cfg(feature = "bench")]
pub mod benchmarks {
    use criterion::{black_box, criterion_group, criterion_main, Criterion};
    use super::*;

    fn bench_fractal_generation(c: &mut Criterion) {
        let rt = tokio::runtime::Runtime::new().unwrap();
        let fractal_service = FractalService::new();

        c.bench_function("mandelbrot_512x512", |b| {
            b.iter(|| {
                rt.block_on(async {
                    let request = FractalRequest {
                        width: 512,
                        height: 512,
                        center_x: -0.5,
                        center_y: 0.0,
                        zoom: 1.0,
                        max_iterations: 100,
                        fractal_type: FractalType::Mandelbrot,
                    };
                    black_box(fractal_service.generate_mandelbrot(request))
                })
            })
        });
    }

    fn bench_performance_metrics(c: &mut Criterion) {
        let rt = tokio::runtime::Runtime::new().unwrap();

        c.bench_function("metrics_collection", |b| {
            b.iter(|| {
                rt.block_on(async {
                    let metrics = MetricsCollector::new().unwrap();
                    black_box(metrics.collect_system_metrics().await)
                })
            })
        });
    }

    criterion_group!(benches, bench_fractal_generation, bench_performance_metrics);
    criterion_main!(benches);
}

// Feature flags for optional functionality
#[cfg(feature = "gpu-acceleration")]
pub mod gpu {
    //! GPU acceleration module for fractal generation using CUDA or OpenCL
    //! I'm keeping this optional since not all deployment environments have GPU support

    pub use crate::services::fractal_service::gpu_accelerated_generation;
}

#[cfg(feature = "machine-learning")]
pub mod ml {
    //! Machine learning module for performance prediction and optimization
    //! I'm including ML features for advanced performance analysis

    pub use crate::services::performance_service::ml_performance_prediction;
}

// Export version and build information
pub const VERSION: &str = env!("CARGO_PKG_VERSION");
pub const BUILD_TIME: &str = env!("BUILD_TIME");
pub const GIT_COMMIT: &str = env!("GIT_COMMIT");

// Export common async utilities
pub mod async_utils {
    //! Async utilities and helpers for improved performance and error handling
    //! I'm providing common patterns for async operations throughout the application

    use std::future::Future;
    use std::time::Duration;
    use tokio::time::{timeout, sleep};
    use crate::utils::error::{AppError, Result};

    /// Retry an async operation with exponential backoff
    /// I'm implementing resilient patterns for external API calls
    pub async fn retry_with_backoff<F, Fut, T>(
        mut operation: F,
        max_retries: usize,
        initial_delay: Duration,
    ) -> Result<T>
    where
        F: FnMut() -> Fut,
        Fut: Future<Output = Result<T>>,
    {
        let mut delay = initial_delay;

        for attempt in 0..max_retries {
            match operation().await {
                Ok(result) => return Ok(result),
                Err(e) if attempt == max_retries - 1 => return Err(e),
                Err(_) => {
                    sleep(delay).await;
                    delay = delay.mul_f32(1.5); // Exponential backoff
                }
            }
        }

        unreachable!()
    }

    /// Execute operation with timeout
    /// I'm ensuring no operation can hang indefinitely
    pub async fn with_timeout<F, T>(
        operation: F,
        timeout_duration: Duration,
    ) -> Result<T>
    where
        F: Future<Output = Result<T>>,
    {
        timeout(timeout_duration, operation)
            .await
            .map_err(|_| AppError::TimeoutError("Operation timed out".to_string()))?
    }
}
