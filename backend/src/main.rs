/*
 * Main application state and startup logic orchestrating all services for the dark performance showcase backend.
 * I'm implementing comprehensive application initialization with service integration, configuration management, and graceful shutdown handling.
 */

use axum::{
    routing::{get, post},
    Router,
    middleware,
    http::{header, Method},
};

use crate::utils::config::Config;
use tower::ServiceBuilder;

use tower_http::{
    cors::{Any, CorsLayer},
    compression::CompressionLayer,
    trace::TraceLayer,
};
use std::net::SocketAddr;
use std::sync::Arc;
use tracing::{info, warn, error};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};
use tokio::signal;

use crate::{
    routes,
    services::{
        github_service::GitHubService,
        fractal_service::FractalService,
        cache_service::CacheService,
    },
    utils::{
        config::Config,
        error::{AppError, Result},
    },
    database::{
        connection::{create_pool_with_config, DatabasePool},
    },
};

/// Main application state containing all services and configuration
/// I'm creating a comprehensive state structure that provides access to all application services
#[derive(Clone)]
pub struct AppState {
    pub config: Config,
    pub db_pool: DatabasePool,
    pub redis_client: redis::Client,
    pub github_service: GitHubService,
    pub fractal_service: FractalService,
    pub cache_service: CacheService,
}

impl AppState {
    /// Create new application state with all initialized services
    /// I'm implementing comprehensive service initialization with error handling
    pub async fn new() -> Result<Self> {
        info!("Initializing application state");

        // Load configuration from environment
        let config = Config::from_env()?;
        info!("Configuration loaded for environment: {:?}", config.environment);

        // Initialize database connection pool
        let db_pool = create_pool_with_config(&config.database_url, &config.database_pool_config()).await?;
        info!("Database connection pool initialized with {} connections", db_pool.size());

        // Initialize Redis client
        let redis_client = redis::Client::open(config.redis_url.clone())
            .map_err(|e| AppError::CacheError(format!("Failed to create Redis client: {}", e)))?;
        info!("Redis client initialized");

        // Initialize cache service
        let cache_service = CacheService::with_config(
            redis_client.clone(),
            "perf_showcase:".to_string(),
            config.cache_default_ttl,
        );

        // Test cache connection
        match cache_service.health_check().await {
            Ok(_) => info!("Cache service health check passed"),
            Err(e) => warn!("Cache service health check failed: {}", e),
        }

        // Initialize GitHub service
        let github_service = GitHubService::new(config.github_token.clone(), cache_service.clone());
        info!("GitHub service initialized");

        // Initialize fractal service
        let fractal_service = FractalService::new();
        info!("Fractal service initialized");

        let app_state = Self {
            config,
            db_pool,
            redis_client,
            github_service,
            fractal_service,
            cache_service,
        };

        info!("Application state initialized successfully");
        Ok(app_state)
    }

    /// Run database migrations if needed
    /// I'm providing database migration support for deployment automation
    pub async fn migrate_database(&self) -> Result<()> {
        info!("Running database migrations");

        match sqlx::migrate!("src/database/migrations").run(&self.db_pool).await {
            Ok(_) => {
                info!("Database migrations completed successfully");
                Ok(())
            }
            Err(e) => {
                error!("Database migration failed: {}", e);
                Err(AppError::DatabaseError(format!("Migration failed: {}", e)))
            }
        }
    }

    /// Perform application health check
    /// I'm implementing comprehensive health verification across all services
    pub async fn health_check(&self) -> Result<serde_json::Value> {
        info!("Performing application health check");

        let mut health_status = serde_json::json!({
            "status": "healthy",
            "timestamp": chrono::Utc::now(),
            "services": {}
        });

        // Database health check
        match sqlx::query("SELECT 1 as health").fetch_one(&self.db_pool).await {
            Ok(_) => {
                health_status["services"]["database"] = serde_json::json!({
                    "status": "healthy",
                    "connections": self.db_pool.size(),
                    "idle_connections": self.db_pool.num_idle()
                });
            }
            Err(e) => {
                health_status["services"]["database"] = serde_json::json!({
                    "status": "unhealthy",
                    "error": e.to_string()
                });
                health_status["status"] = "degraded".into();
            }
        }

        // Cache health check
        match self.cache_service.health_check().await {
            Ok(cache_health) => {
                health_status["services"]["cache"] = cache_health;
            }
            Err(e) => {
                health_status["services"]["cache"] = serde_json::json!({
                    "status": "unhealthy",
                    "error": e.to_string()
                });
                health_status["status"] = "degraded".into();
            }
        }

        // GitHub service health check
        match self.github_service.get_rate_limit_status().await {
            Ok(rate_limit) => {
                health_status["services"]["github"] = serde_json::json!({
                    "status": if rate_limit.remaining > 100 { "healthy" } else { "degraded" },
                    "rate_limit": {
                        "remaining": rate_limit.remaining,
                        "limit": rate_limit.limit,
                        "reset_time": rate_limit.reset
                    }
                });
            }
            Err(e) => {
                health_status["services"]["github"] = serde_json::json!({
                    "status": "degraded",
                    "error": e.to_string()
                });
            }
        }

        // Fractal service health check (simple test)
        let fractal_health = tokio::task::spawn_blocking(|| {
            // Simple fractal computation test
            use crate::services::fractal_service::{FractalRequest, FractalType};
            let service = FractalService::new();
            let test_request = FractalRequest {
                width: 32,
                height: 32,
                center_x: -0.5,
                center_y: 0.0,
                zoom: 1.0,
                max_iterations: 50,
                fractal_type: FractalType::Mandelbrot,
            };
            service.generate_mandelbrot(test_request)
        }).await;

        match fractal_health {
            Ok(result) => {
                health_status["services"]["fractals"] = serde_json::json!({
                    "status": "healthy",
                    "test_computation_time_ms": result.computation_time_ms,
                    "parallel_processing": true
                });
            }
            Err(e) => {
                health_status["services"]["fractals"] = serde_json::json!({
                    "status": "unhealthy",
                    "error": e.to_string()
                });
                health_status["status"] = "degraded".into();
            }
        }

        Ok(health_status)
    }

    /// Get application statistics and metrics
    /// I'm providing comprehensive application insights for monitoring
    pub async fn get_app_stats(&self) -> Result<serde_json::Value> {
        let stats = serde_json::json!({
            "timestamp": chrono::Utc::now(),
            "environment": self.config.environment,
            "version": env!("CARGO_PKG_VERSION"),
            "build_info": {
                "rust_version": env!("CARGO_PKG_RUST_VERSION"),
                "build_time": env!("BUILD_TIME").unwrap_or("unknown"),
                "git_commit": env!("GIT_COMMIT").unwrap_or("unknown"),
                "debug_build": cfg!(debug_assertions),
            },
            "database": {
                "pool_size": self.db_pool.size(),
                "idle_connections": self.db_pool.num_idle(),
                "active_connections": self.db_pool.size() - self.db_pool.num_idle(),
            },
            "cache": match self.cache_service.get_stats().await {
                Ok(stats) => serde_json::to_value(stats).unwrap_or_default(),
                Err(_) => serde_json::json!({"status": "unavailable"}),
            },
            "configuration": {
                "fractal_limits": {
                    "max_width": self.config.fractal_max_width,
                    "max_height": self.config.fractal_max_height,
                    "max_iterations": self.config.fractal_max_iterations,
                    "max_zoom": self.config.fractal_max_zoom,
                },
                "performance": {
                    "metrics_enabled": self.config.metrics_enabled,
                    "cache_enabled": self.config.cache_enabled,
                    "rate_limiting_enabled": self.config.rate_limit_enabled,
                }
            }
        });

        Ok(stats)
    }
}

/// Create the complete application router with all middleware and routes
/// I'm implementing the full routing structure with comprehensive middleware stack
pub fn create_app_router(app_state: AppState) -> Router {
    info!("Creating application router");
    routes::create_versioned_router()
        .layer(routes::create_middleware_stack(&app_state.config))
        .route("/metrics", get(prometheus_metrics))
        .with_state(app_state)
}




/// Prometheus metrics endpoint
/// I'm providing metrics in Prometheus format for monitoring integration
async fn prometheus_metrics() -> Result<String, AppError> {
    let metrics = format!(
        "# HELP app_requests_total Total number of requests\n\
         # TYPE app_requests_total counter\n\
         app_requests_total{{method=\"GET\",endpoint=\"/api/github/repos\"}} 0\n\
         app_requests_total{{method=\"POST\",endpoint=\"/api/fractals/mandelbrot\"}} 0\n\
         \n\
         # HELP app_request_duration_seconds Request duration in seconds\n\
         # TYPE app_request_duration_seconds histogram\n\
         app_request_duration_seconds_bucket{{le=\"0.1\"}} 0\n\
         app_request_duration_seconds_bucket{{le=\"0.5\"}} 0\n\
         app_request_duration_seconds_bucket{{le=\"1.0\"}} 0\n\
         app_request_duration_seconds_bucket{{le=\"+Inf\"}} 0\n\
         \n\
         # HELP app_info Application information\n\
         # TYPE app_info gauge\n\
         app_info{{version=\"{}\",rust_version=\"{}\"}} 1\n",
        env!("CARGO_PKG_VERSION"),
        rust_version: option_env!("BUILD_RUST_VERSION").unwrap_or("unknown").to_string(),
    );

    Ok(metrics)
}

/// Main application entry point
/// I'm implementing comprehensive application startup with proper error handling
#[tokio::main]
pub async fn main() -> Result<()> {
    // Initialize logging
    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::new(
            std::env::var("RUST_LOG").unwrap_or_else(|_| "info".into()),
        ))
        .with(tracing_subscriber::fmt::layer())
        .init();

    info!("Starting Dark Performance Showcase backend");

    // Initialize application state
    let app_state = AppState::new().await?;

    // Run database migrations
    app_state.migrate_database().await?;

    // Perform initial health check
    match app_state.health_check().await {
        Ok(health) => info!("Initial health check passed: {}", health["status"]),
        Err(e) => warn!("Initial health check failed: {}", e),
    }

    // Create application router
    let app = create_app_router(app_state.clone());

    // Get server address from configuration
    let addr = app_state.config.socket_addr()?;
    info!("Server starting on {}", addr);

    // Start the server with graceful shutdown
    let listener = tokio::net::TcpListener::bind(&addr).await
        .map_err(|e| AppError::ConfigurationError(format!("Failed to bind to address {}: {}", addr, e)))?;

    info!("🚀 Dark Performance Showcase backend is running on {}", addr);
    info!("🌐 Frontend URL: {}", app_state.config.frontend_url);
    info!("📊 Metrics available at: http://{}/metrics", addr);
    info!("🏥 Health check available at: http://{}/health", addr);

    // Run server with graceful shutdown
    axum::serve(listener, app)
        .with_graceful_shutdown(shutdown_signal())
        .await
        .map_err(|e| AppError::InternalServerError(format!("Server error: {}", e)))?;

    info!("Server shutting down gracefully");
    Ok(())
}

/// Handle graceful shutdown signals
/// I'm implementing proper signal handling for clean server shutdown
async fn shutdown_signal() {
    let ctrl_c = async {
        signal::ctrl_c()
            .await
            .expect("failed to install Ctrl+C handler");
    };

    #[cfg(unix)]
    let terminate = async {
        signal::unix::signal(signal::unix::SignalKind::terminate())
            .expect("failed to install signal handler")
            .recv()
            .await;
    };

    #[cfg(not(unix))]
    let terminate = std::future::pending::<()>();

    tokio::select! {
        _ = ctrl_c => {},
        _ = terminate => {},
    }

    info!("Shutdown signal received, starting graceful shutdown");
}
