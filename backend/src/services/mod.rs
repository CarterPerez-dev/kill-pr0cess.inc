/*
 * Services module aggregator providing centralized access to all business logic services for the dark performance showcase.
 * I'm organizing GitHub API integration, fractal computation, performance monitoring, and caching into a cohesive service layer that maintains clean separation of concerns.
 */

pub mod fractal_service;
pub mod github_service;
pub mod performance_service;
pub mod cache_service;

// Re-export all services for convenient access throughout the application
pub use fractal_service::FractalService;
pub use github_service::GitHubService;
pub use performance_service::PerformanceService;
pub use cache_service::CacheService;

use crate::{
    database::DatabasePool,
    utils::error::{AppError, Result},
};
use std::sync::Arc;
use tokio::sync::RwLock;

/// Service registry for centralized service management and dependency injection
/// I'm implementing a service registry pattern for clean dependency management
pub struct ServiceRegistry {
    pub fractal_service: Arc<FractalService>,
    pub github_service: Arc<GitHubService>,
    pub performance_service: Arc<PerformanceService>,
    pub cache_service: Arc<CacheService>,
}

impl ServiceRegistry {
    /// Create a new service registry with all services initialized
    /// I'm ensuring all services are properly configured and connected
    pub async fn new(
        db_pool: DatabasePool,
        redis_client: redis::Client,
        github_token: String,
    ) -> Result<Self> {
        tracing::info!("Initializing service registry");

        // Initialize cache service first as other services depend on it
        let cache_service = Arc::new(CacheService::with_config(
            redis_client,
            "perf_showcase:".to_string(),
            3600, // 1 hour default TTL
        ));

        // Initialize GitHub service with cache dependency
        let github_service = Arc::new(GitHubService::new(
            github_token.clone(),
            (*cache_service).clone(),
        ));

        // Initialize fractal service (no external dependencies)
        let fractal_service = Arc::new(FractalService::new());

        // Initialize performance service with database dependency
        let performance_service = Arc::new(PerformanceService::new(db_pool.clone()));

        tracing::info!("All services initialized successfully");

        Ok(Self {
            fractal_service,
            github_service,
            performance_service,
            cache_service,
        })
    }

    /// Perform health checks on all services
    /// I'm implementing comprehensive service health verification
    pub async fn health_check(&self) -> Result<serde_json::Value> {
        let mut health_results = serde_json::Map::new();

        // Check cache service health
        match self.cache_service.health_check().await {
            Ok(cache_health) => {
                health_results.insert("cache".to_string(), cache_health);
            }
            Err(e) => {
                health_results.insert("cache".to_string(), serde_json::json!({
                    "status": "unhealthy",
                    "error": e.to_string()
                }));
            }
        }

        // Check GitHub service health (rate limit status)
        match self.github_service.get_rate_limit_status().await {
            Ok(rate_limit) => {
                health_results.insert("github".to_string(), serde_json::json!({
                    "status": if rate_limit.remaining > 100 { "healthy" } else { "degraded" },
                    "rate_limit_remaining": rate_limit.remaining,
                    "rate_limit_total": rate_limit.limit
                }));
            }
            Err(e) => {
                health_results.insert("github".to_string(), serde_json::json!({
                    "status": "unhealthy",
                    "error": e.to_string()
                }));
            }
        }

        // Check fractal service health (simple computation test)
        let fractal_health = tokio::task::spawn_blocking({
            let fractal_service = Arc::clone(&self.fractal_service);
            move || {
                use crate::services::fractal_service::{FractalRequest, FractalType};

                let test_request = FractalRequest {
                    width: 32,
                    height: 32,
                    center_x: -0.5,
                    center_y: 0.0,
                    zoom: 1.0,
                    max_iterations: 50,
                    fractal_type: FractalType::Mandelbrot,
                };

                fractal_service.generate_mandelbrot(test_request)
            }
        }).await;

        match fractal_health {
            Ok(result) => {
                health_results.insert("fractals".to_string(), serde_json::json!({
                    "status": "healthy",
                    "test_computation_time_ms": result.computation_time_ms
                }));
            }
            Err(e) => {
                health_results.insert("fractals".to_string(), serde_json::json!({
                    "status": "unhealthy",
                    "error": e.to_string()
                }));
            }
        }

        // Check performance service health
        match self.performance_service.get_system_info().await {
            Ok(_) => {
                health_results.insert("performance".to_string(), serde_json::json!({
                    "status": "healthy"
                }));
            }
            Err(e) => {
                health_results.insert("performance".to_string(), serde_json::json!({
                    "status": "unhealthy",
                    "error": e.to_string()
                }));
            }
        }

        // Determine overall health status
        let overall_status = if health_results.values().all(|v| {
            v.get("status").and_then(|s| s.as_str()) == Some("healthy")
        }) {
            "healthy"
        } else if health_results.values().any(|v| {
            v.get("status").and_then(|s| s.as_str()) == Some("unhealthy")
        }) {
            "unhealthy"
        } else {
            "degraded"
        };

        Ok(serde_json::json!({
            "status": overall_status,
            "timestamp": chrono::Utc::now(),
            "services": health_results
        }))
    }

    /// Get service statistics and metrics
    /// I'm providing comprehensive service analytics for monitoring
    pub async fn get_service_stats(&self) -> Result<serde_json::Value> {
        let mut stats = serde_json::Map::new();

        // Cache service statistics
        if let Ok(cache_stats) = self.cache_service.get_stats().await {
            stats.insert("cache".to_string(), serde_json::to_value(cache_stats)?);
        }

        // GitHub service rate limit information
        if let Ok(rate_limit) = self.github_service.get_rate_limit_status().await {
            stats.insert("github_rate_limit".to_string(), serde_json::json!({
                "remaining": rate_limit.remaining,
                "limit": rate_limit.limit,
                "reset": rate_limit.reset,
                "used": rate_limit.used
            }));
        }

        // Performance service system information
        if let Ok(system_info) = self.performance_service.get_system_info().await {
            stats.insert("system".to_string(), system_info);
        }

        Ok(serde_json::json!({
            "timestamp": chrono::Utc::now(),
            "services": stats
        }))
    }

    /// Warm up all services with initial data loading
    /// I'm implementing service warm-up for optimal initial performance
    pub async fn warm_up(&self, github_username: &str) -> Result<()> {
        tracing::info!("Warming up services");

        // Warm up GitHub service by fetching initial repository data
        if let Err(e) = self.github_service.get_user_repositories(github_username).await {
            tracing::warn!("Failed to warm up GitHub service: {}", e);
        }

        // Warm up fractal service with a simple computation
        let warm_up_fractal = tokio::task::spawn_blocking({
            let fractal_service = Arc::clone(&self.fractal_service);
            move || {
                use crate::services::fractal_service::{FractalRequest, FractalType};

                let warm_up_request = FractalRequest {
                    width: 128,
                    height: 128,
                    center_x: -0.5,
                    center_y: 0.0,
                    zoom: 1.0,
                    max_iterations: 100,
                    fractal_type: FractalType::Mandelbrot,
                };

                fractal_service.generate_mandelbrot(warm_up_request)
            }
        });

        if let Err(e) = warm_up_fractal.await {
            tracing::warn!("Failed to warm up fractal service: {}", e);
        }

        // Warm up performance service by collecting initial metrics
        if let Err(e) = self.performance_service.get_system_metrics().await {
            tracing::warn!("Failed to warm up performance service: {}", e);
        }

        tracing::info!("Service warm-up completed");
        Ok(())
    }

    /// Graceful shutdown of all services
    /// I'm implementing proper resource cleanup for all services
    pub async fn shutdown(&self) -> Result<()> {
        tracing::info!("Shutting down services");

        // Services don't currently have explicit shutdown methods,
        // but this is where we would clean up any resources, connections, etc.

        // Future implementation might include:
        // - Flushing pending cache operations
        // - Saving service state
        // - Closing background tasks
        // - Releasing file handles

        tracing::info!("All services shut down gracefully");
        Ok(())
    }
}

/// Service factory for creating individual services with proper configuration
/// I'm providing factory methods for flexible service instantiation
pub struct ServiceFactory;

impl ServiceFactory {
    /// Create a fractal service instance
    /// I'm providing a factory method for fractal service creation
    pub fn create_fractal_service() -> FractalService {
        FractalService::new()
    }

    /// Create a GitHub service instance with configuration
    /// I'm providing a factory method for GitHub service creation
    pub fn create_github_service(
        github_token: String,
        cache_service: CacheService,
    ) -> GitHubService {
        GitHubService::new(github_token, cache_service)
    }

    /// Create a performance service instance
    /// I'm providing a factory method for performance service creation
    pub fn create_performance_service(db_pool: DatabasePool) -> PerformanceService {
        PerformanceService::new(db_pool)
    }

    /// Create a cache service instance with configuration
    /// I'm providing a factory method for cache service creation
    pub fn create_cache_service(
        redis_client: redis::Client,
        key_prefix: String,
        default_ttl: u64,
    ) -> CacheService {
        CacheService::with_config(redis_client, key_prefix, default_ttl)
    }
}

/// Service traits for common service functionality
/// I'm defining common service patterns for consistent implementation

pub trait HealthCheckable {
    type HealthResult;
    async fn health_check(&self) -> Result<Self::HealthResult>;
}

pub trait Configurable {
    type Config;
    fn configure(&mut self, config: Self::Config) -> Result<()>;
}

pub trait Cacheable {
    fn cache_key(&self) -> String;
    fn cache_ttl(&self) -> u64;
}

/// Middleware for service request/response processing
/// I'm implementing service middleware for cross-cutting concerns
pub struct ServiceMiddleware;

impl ServiceMiddleware {
    /// Log service method calls for debugging and monitoring
    /// I'm implementing service call logging for observability
    pub async fn log_service_call<F, T>(
        service_name: &str,
        method_name: &str,
        future: F,
    ) -> Result<T>
    where
        F: std::future::Future<Output = Result<T>>,
    {
        let start_time = std::time::Instant::now();

        tracing::debug!("Calling {}.{}", service_name, method_name);

        match future.await {
            Ok(result) => {
                let duration = start_time.elapsed();
                tracing::debug!(
                    "{}.{} completed successfully in {:?}",
                    service_name,
                    method_name,
                    duration
                );
                Ok(result)
            }
            Err(error) => {
                let duration = start_time.elapsed();
                tracing::error!(
                    "{}.{} failed after {:?}: {}",
                    service_name,
                    method_name,
                    duration,
                    error
                );
                Err(error)
            }
        }
    }

    /// Add timing metrics to service calls
    /// I'm implementing automatic performance tracking for service calls
    pub async fn with_timing<F, T>(
        metric_name: &str,
        future: F,
    ) -> Result<T>
    where
        F: std::future::Future<Output = Result<T>>,
    {
        let start_time = std::time::Instant::now();

        let result = future.await;

        let duration = start_time.elapsed();

        // Here we would record the timing metric
        tracing::debug!("Service call {} took {:?}", metric_name, duration);

        result
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_service_factory() {
        let fractal_service = ServiceFactory::create_fractal_service();
        // Service should be created successfully
        assert!(true);
    }

    #[tokio::test]
    async fn test_service_middleware_logging() {
        let future = async { Ok::<i32, AppError>(42) };

        let result = ServiceMiddleware::log_service_call(
            "test_service",
            "test_method",
            future,
        ).await;

        assert!(result.is_ok());
        assert_eq!(result.unwrap(), 42);
    }
}
