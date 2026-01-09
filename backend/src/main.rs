/*
 * ©AngelaMos | 2025
 * Application initialization
 */

#![doc = "Dark Performance Showcase - High-performance Rust backend for computational demonstrations"]

use axum::{
    routing::get,
    Router,
    http::{header, Method, HeaderName},
};

use tower_http::{
    cors::{Any, CorsLayer},
    compression::CompressionLayer,
    trace::TraceLayer,
};
use tracing::{info, warn, error};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};
use tokio::signal;

use dark_performance_backend::{
    routes,
    services::{
        github_service::GitHubService,
        fractal_service::FractalService,
        cache_service::CacheService,
        performance_service::PerformanceService,
    },
    utils::{
        config::Config,
        error::{AppError, Result},
        metrics::MetricsCollector,
    },
    database::connection::create_pool,
    AppState,
};

async fn create_app_state() -> Result<AppState> {
        info!("Initializing application state");

        let config = Config::from_env()?;
        info!("Configuration loaded for environment: {:?}", config.environment);

        let db_pool = create_pool(&config.database_url).await?;
        info!("Database connection pool initialized with {} connections", db_pool.size());

        let redis_client = redis::Client::open(config.redis_url.clone())
            .map_err(|e| AppError::CacheError(format!("Failed to create Redis client: {}", e)))?;
        info!("Redis client initialized");

        let cache_service = CacheService::with_config(
            redis_client.clone(),
            "perf_showcase:".to_string(),
            config.cache_default_ttl,
        );

        match cache_service.health_check().await {
            Ok(_) => info!("Cache service health check passed"),
            Err(e) => warn!("Cache service health check failed: {}", e),
        }

        let github_service = GitHubService::new(config.github_token.clone(), cache_service.clone());
        info!("GitHub service initialized");

        let fractal_service = FractalService::new();
        info!("Fractal service initialized");

        let performance_service = PerformanceService::new(db_pool.clone());
        info!("Performance service initialized");

        let metrics = MetricsCollector::new()?;
        info!("Metrics collector initialized");

        let app_state = AppState {
            config,
            db_pool,
            redis_client,
            github_service,
            fractal_service,
            cache_service,
            performance_service,
            metrics,
        };

        info!("Application state initialized successfully");
        Ok(app_state)
}

///
/// Creates the main application router with middleware layers
///
pub fn create_app_router(app_state: AppState) -> Router {
    info!("Creating application router");
    
    let cors = CorsLayer::new()
        .allow_methods([Method::GET, Method::POST, Method::PUT, Method::DELETE, Method::HEAD, Method::OPTIONS])
        .allow_headers([
            header::CONTENT_TYPE,
            header::AUTHORIZATION,
            header::ACCEPT,
            header::USER_AGENT,
            HeaderName::from_static("x-correlation-id"),
            HeaderName::from_static("x-request-id"),
            HeaderName::from_static("x-request-start"),
        ])
        .allow_origin(Any);
    
    routes::create_versioned_router()
        .layer(cors)
        .layer(CompressionLayer::new())
        .layer(TraceLayer::new_for_http())
        .route("/metrics", get(prometheus_metrics))
        .with_state(app_state)
}


async fn prometheus_metrics() -> Result<String> {
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
        option_env!("BUILD_RUST_VERSION").unwrap_or("unknown"),
    );

    Ok(metrics)
}

///
/// Main application entry point - initializes services and starts the HTTP server
///
#[tokio::main]
pub async fn main() -> Result<()> {
    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::new(
            std::env::var("RUST_LOG").unwrap_or_else(|_| "info".into()),
        ))
        .with(tracing_subscriber::fmt::layer())
        .init();

    info!("Starting Dark Performance Showcase backend");

    let app_state = create_app_state().await?;

    info!("Running database migrations");
    match sqlx::migrate!("src/database/migrations").run(&app_state.db_pool).await {
        Ok(_) => info!("Database migrations completed successfully"),
        Err(e) => {
            if e.to_string().contains("already exists") {
                warn!("Database tables already exist, skipping migrations");
            } else {
                error!("Database migration failed: {}", e);
                return Err(AppError::DatabaseError(format!("Migration failed: {}", e)));
            }
        }
    }

    let app = create_app_router(app_state.clone());

    let addr = app_state.config.socket_addr()?;
    info!("Server starting on {}", addr);

    let listener = tokio::net::TcpListener::bind(&addr).await
        .map_err(|e| AppError::ConfigurationError(format!("Failed to bind to address {}: {}", addr, e)))?;

    info!("Performance Showcase backend is running on {}", addr);
    info!("Frontend URL: {}", app_state.config.frontend_url);
    info!("Metrics available at: http://{}/metrics", addr);
    info!("Health check available at: http://{}/health", addr);

    axum::serve(listener, app)
        .with_graceful_shutdown(shutdown_signal())
        .await
        .map_err(|e| AppError::InternalServerError(format!("Server error: {}", e)))?;

    info!("Server shutting down gracefully");
    Ok(())
}

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
