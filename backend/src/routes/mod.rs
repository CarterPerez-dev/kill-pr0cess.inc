/*
 * Routes module aggregator organizing all HTTP endpoints with consistent structure and middleware integration.
 * I'm implementing clean route organization that enables easy expansion while maintaining performance and security standards.
 */

pub mod github;
pub mod fractals;
pub mod performance;
pub mod health;

// Re-export all route handlers for convenient access from main.rs
pub use github::*;
pub use fractals::*;
pub use performance::*;
pub use health::*;

use axum::{
    Router,
    response::IntoResponse,
    routing::{get, post, Route},
    http::{Method, HeaderValue},
};
use tower_http::{
    cors::{CorsLayer, Any},
    compression::CompressionLayer,
    trace::TraceLayer,
    timeout::TimeoutLayer,
    limit::RequestBodyLimitLayer,
};
use std::time::Duration;
use tracing::info;

use crate::{
    AppState,
    utils::error::AppError,
};

/// Create the complete application router with all endpoints and middleware
/// I'm implementing a comprehensive routing structure with performance optimization and security
pub fn create_router() -> Router<AppState> {
    info!("Creating application router with all endpoints");

    Router::new()
    // Health and monitoring endpoints
    .route("/health", get(health::health_check))
    .route("/health/ready", get(health::readiness_check))
    .route("/health/live", get(health::liveness_check))

    // GitHub API integration endpoints
    .route("/api/github/repos", get(github::get_repositories))
    .route("/api/github/repo/:owner/:name", get(github::get_repository_details))
    .route("/api/github/repo/:owner/:name/stats", get(github::get_repository_stats))
    .route("/api/github/language-distribution", get(github::get_language_distribution))

    // Fractal generation endpoints
    .route("/api/fractals/mandelbrot", post(fractals::generate_mandelbrot))
    .route("/api/fractals/julia", post(fractals::generate_julia))
    .route("/api/fractals/benchmark", post(fractals::benchmark_generation))

    // Performance monitoring endpoints
    .route("/api/performance/metrics", get(performance::get_current_metrics))
    .route("/api/performance/system", get(performance::get_system_info))
    .route("/api/performance/benchmark", post(performance::run_benchmark))
    .route("/api/performance/history", get(performance::get_metrics_history))

    // Apply middleware stack in order of importance
    .layer(create_middleware_stack())
}

/// Build the common middleware stack applied to every route.
///
/// Layers included:
/// - CORS
/// - Compression
/// - Timeout
/// - Trace (high-level request/response logging)
/// - Request body size limit
///
/// Additional layers (e.g. rate-limiting) can be appended later.
fn create_middleware_stack() -> impl tower::Layer<Route> + Clone {
    use tower::ServiceBuilder;

    ServiceBuilder::new()
        .layer(create_cors_layer())
        .layer(CompressionLayer::new())
        .layer(TimeoutLayer::new(Duration::from_secs(30)))
        .layer(RequestBodyLimitLayer::new(10 * 1024 * 1024)) // 10 MiB max body
        .layer(TraceLayer::new_for_http())
}

/// Create CORS layer with appropriate configuration for different environments
/// I'm implementing flexible CORS that supports development while maintaining security in production
fn create_cors_layer() -> CorsLayer {
    CorsLayer::new()
    .allow_methods([
        Method::GET,
        Method::POST,
        Method::PUT,
        Method::DELETE,
        Method::HEAD,
        Method::OPTIONS,
    ])
    .allow_headers([
        axum::http::header::CONTENT_TYPE,
        axum::http::header::AUTHORIZATION,
        axum::http::header::ACCEPT,
        axum::http::header::USER_AGENT,
    ])
    .allow_origin(Any) // In production, this should be more restrictive
    .allow_credentials(false)
    .max_age(Duration::from_secs(3600))
}

/// Custom rate limiting middleware (example implementation)
/// I'm providing a foundation for rate limiting that can be expanded based on requirements
#[allow(dead_code)]
async fn rate_limiting_middleware<B>(
    request: axum::http::Request<B>,
    next: axum::middleware::Next,
) -> Result<axum::response::Response, AppError> {
    // Get client IP address
    let client_ip = request
    .headers()
    .get("x-forwarded-for")
    .or_else(|| request.headers().get("x-real-ip"))
    .and_then(|hv| hv.to_str().ok())
    .unwrap_or("unknown");

    // Check rate limit based on endpoint
    let path = request.uri().path();
    let rate_limit = get_rate_limit_for_path(path);

    // In a real implementation, you'd check against a rate limiting store (Redis, in-memory, etc.)
    // For now, we'll just pass through
    tracing::debug!("Rate limiting check for {} accessing {}: {:?}", client_ip, path, rate_limit);

    Ok(next.run(request).await)
}

/// Rate limiting configuration for different endpoint types
/// I'm categorizing endpoints by their computational cost and security requirements
#[derive(Debug, Clone, serde::Serialize)]
struct RateLimit {
    requests_per_minute: u32,
    burst_size: u32,
}

fn get_rate_limit_for_path(path: &str) -> RateLimit {
    match path {
        // Fractal endpoints are computationally expensive
        p if p.starts_with("/api/fractals/") => RateLimit {
            requests_per_minute: 10,
            burst_size: 3,
        },

        // Performance endpoints return cached data mostly
        p if p.starts_with("/api/performance/") => RateLimit {
            requests_per_minute: 60,
            burst_size: 10,
        },

        // GitHub endpoints depend on external API
        p if p.starts_with("/api/github/") => RateLimit {
            requests_per_minute: 30,
            burst_size: 5,
        },

        // Health checks should be very permissive
        "/health" | "/health/ready" | "/health/live" => RateLimit {
            requests_per_minute: 200,
            burst_size: 50,
        },

        // Default rate limit for other endpoints
        _ => RateLimit {
            requests_per_minute: 100,
            burst_size: 20,
        },
    }
}

/// Custom error handler for route-level errors
/// I'm implementing consistent error responses across all endpoints
pub async fn handle_404() -> axum::response::Response {
    let error_response = serde_json::json!({
        "error": {
            "code": "NOT_FOUND",
            "message": "The requested endpoint does not exist",
            "timestamp": chrono::Utc::now(),
                                           "available_endpoints": [
                                               "/health",
                                               "/api/github/repos",
                                               "/api/fractals/mandelbrot",
                                               "/api/performance/metrics"
                                           ]
        }
    });

    (
        axum::http::StatusCode::NOT_FOUND,
     axum::Json(error_response),
    )
    .into_response()
}

/// Create router with API versioning support
/// I'm implementing API versioning for backward compatibility and evolution
pub fn create_versioned_router() -> Router<AppState> {
    Router::new()
    // Mount current API version
    .nest("/v1", create_router())

    // Health endpoints at root level (no versioning needed)
    .route("/health", get(health::health_check))
    .route("/health/ready", get(health::readiness_check))
    .route("/health/live", get(health::liveness_check))

    // Default to current version for convenience
    .nest("/api", create_api_routes())

    // Fallback handler for undefined routes
    .fallback(handle_404)
}

/// Create just the API routes without health endpoints
/// I'm separating API routes for cleaner organization
fn create_api_routes() -> Router<AppState> {
    Router::new()
    // GitHub API integration endpoints
    .route("/github/repos", get(github::get_repositories))
    .route("/github/repo/:owner/:name", get(github::get_repository_details))
    .route("/github/repo/:owner/:name/stats", get(github::get_repository_stats))
    .route("/github/language-distribution", get(github::get_language_distribution))

    // Fractal generation endpoints
    .route("/fractals/mandelbrot", post(fractals::generate_mandelbrot))
    .route("/fractals/julia", post(fractals::generate_julia))
    .route("/fractals/benchmark", post(fractals::benchmark_generation))

    // Performance monitoring endpoints
    .route("/performance/metrics", get(performance::get_current_metrics))
    .route("/performance/system", get(performance::get_system_info))
    .route("/performance/benchmark", post(performance::run_benchmark))
    .route("/performance/history", get(performance::get_metrics_history))
}

/// Route information for API documentation
/// I'm providing structured route information for documentation generation
#[derive(Debug, serde::Serialize)]
pub struct RouteInfo {
    pub path: String,
    pub method: String,
    pub description: String,
    pub parameters: Vec<RouteParameter>,
    pub response_type: String,
    pub rate_limit: RateLimit,
}

#[derive(Debug, serde::Serialize)]
pub struct RouteParameter {
    pub name: String,
    pub param_type: String,
    pub required: bool,
    pub description: String,
}

/// Get all available routes with their documentation
/// I'm providing comprehensive API documentation support
pub fn get_route_documentation() -> Vec<RouteInfo> {
    vec![
        RouteInfo {
            path: "/health".to_string(),
            method: "GET".to_string(),
            description: "Comprehensive health check with system status".to_string(),
            parameters: vec![],
            response_type: "HealthCheckResponse".to_string(),
            rate_limit: get_rate_limit_for_path("/health"),
        },
        RouteInfo {
            path: "/api/github/repos".to_string(),
            method: "GET".to_string(),
            description: "Get paginated list of repositories with filtering".to_string(),
            parameters: vec![
                RouteParameter {
                    name: "page".to_string(),
                    param_type: "query".to_string(),
                    required: false,
                    description: "Page number (default: 1)".to_string(),
                },
                RouteParameter {
                    name: "per_page".to_string(),
                    param_type: "query".to_string(),
                    required: false,
                    description: "Items per page (default: 20, max: 100)".to_string(),
                },
                RouteParameter {
                    name: "language".to_string(),
                    param_type: "query".to_string(),
                    required: false,
                    description: "Filter by programming language".to_string(),
                },
            ],
            response_type: "RepositoryResponse".to_string(),
            rate_limit: get_rate_limit_for_path("/api/github/repos"),
        },
        RouteInfo {
            path: "/api/fractals/mandelbrot".to_string(),
            method: "POST".to_string(),
            description: "Generate Mandelbrot fractal with real-time performance metrics".to_string(),
            parameters: vec![
                RouteParameter {
                    name: "width".to_string(),
                    param_type: "query".to_string(),
                    required: false,
                    description: "Image width in pixels (default: 800, max: 4096)".to_string(),
                },
                RouteParameter {
                    name: "height".to_string(),
                    param_type: "query".to_string(),
                    required: false,
                    description: "Image height in pixels (default: 600, max: 4096)".to_string(),
                },
                RouteParameter {
                    name: "zoom".to_string(),
                    param_type: "query".to_string(),
                    required: false,
                    description: "Zoom level (default: 1.0)".to_string(),
                },
            ],
            response_type: "FractalApiResponse".to_string(),
            rate_limit: get_rate_limit_for_path("/api/fractals/mandelbrot"),
        },
        RouteInfo {
            path: "/api/performance/metrics".to_string(),
            method: "GET".to_string(),
            description: "Get current system performance metrics".to_string(),
            parameters: vec![],
            response_type: "PerformanceMetrics".to_string(),
            rate_limit: get_rate_limit_for_path("/api/performance/metrics"),
        },
    ]
}

/// Export route testing utilities
/// I'm providing testing support for route handlers
#[cfg(test)]
pub mod test_utils {
    use super::*;
    use axum::body::Body;
    use axum::http::{Request, StatusCode};
    use tower::ServiceExt;

    pub async fn test_health_endpoint(app: Router<AppState>) -> Result<(), Box<dyn std::error::Error>> {
        let response = app
        .oneshot(Request::builder().uri("/health").body(Body::empty())?)
        .await?;

        assert_eq!(response.status(), StatusCode::OK);
        Ok(())
    }

    pub async fn test_404_handler(app: Router<AppState>) -> Result<(), Box<dyn std::error::Error>> {
        let response = app
        .oneshot(Request::builder().uri("/nonexistent").body(Body::empty())?)
        .await?;

        assert_eq!(response.status(), StatusCode::NOT_FOUND);
        Ok(())
    }
}
