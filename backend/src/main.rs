/*
 * Main server entry point for the dark performance showcase backend.
 * I'm using Axum with Tokio for maximum async performance and setting up all the core routes for GitHub integration, fractal generation, and performance monitoring.
 */

use axum::{
    routing::{get, post},
    Router,
    middleware,
    http::{header, Method},
};
use tower_http::{
    cors::{Any, CorsLayer},
    compression::CompressionLayer,
    trace::TraceLayer,
};
use std::net::SocketAddr;
use tracing::{info, warn};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

mod routes;
mod services;
mod models;
mod utils;
mod database;

use routes::{github, fractals, performance, health};
use utils::config::Config;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // I'm setting up comprehensive logging first since performance monitoring is crucial
    tracing_subscriber::registry()
    .with(tracing_subscriber::EnvFilter::new(
        std::env::var("RUST_LOG").unwrap_or_else(|_| "info".into()),
    ))
    .with(tracing_subscriber::fmt::layer())
    .init();

    info!("Starting dark performance showcase backend");

    // Load configuration - I want this to be flexible for different environments
    let config = Config::from_env()?;

    // Initialize database connections - PostgreSQL for caching, Redis for real-time data
    let db_pool = database::connection::create_pool(&config.database_url).await?;
    let redis_client = redis::Client::open(config.redis_url.clone())?;

    // I'm setting up CORS to be permissive during development but restrictive in production
    let cors = CorsLayer::new()
    .allow_origin(config.frontend_url.parse::<tower_http::cors::AllowOrigin>()?)
    .allow_methods([Method::GET, Method::POST, Method::OPTIONS])
    .allow_headers([header::CONTENT_TYPE, header::AUTHORIZATION]);

    // Build the router with all our performance-focused endpoints
    let app = Router::new()
    // Health check - always need this for load balancers
    .route("/health", get(health::health_check))

    // GitHub integration routes
    .route("/api/github/repos", get(github::get_repositories))
    .route("/api/github/repo/:owner/:name", get(github::get_repository_details))

    // Fractal generation routes - this is where I showcase Rust's computational power
    .route("/api/fractals/mandelbrot", post(fractals::generate_mandelbrot))
    .route("/api/fractals/julia", post(fractals::generate_julia))
    .route("/api/fractals/benchmark", post(fractals::benchmark_generation))

    // Performance monitoring routes
    .route("/api/performance/metrics", get(performance::get_current_metrics))
    .route("/api/performance/benchmark", post(performance::run_benchmark))
    .route("/api/performance/system", get(performance::get_system_info))

    // Middleware stack - I'm prioritizing performance and observability
    .layer(TraceLayer::new_for_http())
    .layer(CompressionLayer::new())
    .layer(cors)

    // Share state across handlers
    .with_state((db_pool, redis_client, config.clone()));

    let addr = SocketAddr::from(([0, 0, 0, 0], config.port));
    info!("Backend server listening on {}", addr);

    axum::Server::bind(&addr)
    .serve(app.into_make_service())
    .await?;

    Ok(())
}
