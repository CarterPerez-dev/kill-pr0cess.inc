/*
 * Comprehensive error handling system with structured error types, HTTP status mapping, and user-friendly messages.
 * I'm implementing a robust error handling framework that provides excellent debugging information while maintaining security and user experience.
 */

use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde::{Deserialize, Serialize};
use std::fmt;
use tracing::{error, warn};

/// Custom Result type for consistent error handling throughout the application
/// I'm providing a convenient alias that reduces boilerplate and ensures consistency
pub type Result<T> = std::result::Result<T, AppError>;

/// Main application error enum covering all possible error scenarios
/// I'm organizing errors by category to enable appropriate handling and logging
#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error("Database error: {0}")]
    DatabaseError(String),

    #[error("External API error: {0}")]
    ExternalApiError(String),

    #[error("Serialization error: {0}")]
    SerializationError(String),

    #[error("Configuration error: {0}")]
    ConfigurationError(String),

    #[error("Validation error: {0}")]
    ValidationError(String),

    #[error("Authentication error: {0}")]
    AuthenticationError(String),

    #[error("Authorization error: {0}")]
    AuthorizationError(String),

    #[error("Rate limit exceeded: {0}")]
    RateLimitError(String),

    #[error("Resource not found: {0}")]
    NotFoundError(String),

    #[error("Request timeout: {0}")]
    TimeoutError(String),

    #[error("Internal server error: {0}")]
    InternalServerError(String),

    #[error("Bad request: {0}")]
    BadRequestError(String),

    #[error("Service unavailable: {0}")]
    ServiceUnavailableError(String),

    #[error("Cache operation failed: {0}")]
    CacheError(String),

    #[error("Fractal computation error: {0}")]
    FractalComputationError(String),

    #[error("GitHub API error: {0}")]
    GitHubApiError(String),

    #[error("Performance monitoring error: {0}")]
    PerformanceError(String),
}

/// Structured error response for API endpoints
/// I'm providing consistent error responses with debugging information and user-friendly messages
#[derive(Debug, Serialize, Deserialize)]
pub struct ErrorResponse {
    pub error: ErrorDetails,
    pub timestamp: chrono::DateTime<chrono::Utc>,
    pub request_id: Option<String>,
    pub support_message: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ErrorDetails {
    pub code: String,
    pub message: String,
    pub category: ErrorCategory,
    pub severity: ErrorSeverity,
    pub retryable: bool,
    pub context: Option<serde_json::Value>,
}

#[derive(Debug, Serialize, Deserialize)]
pub enum ErrorCategory {
    Database,
    ExternalApi,
    Validation,
    Authentication,
    Authorization,
    RateLimit,
    NotFound,
    Timeout,
    Internal,
    Configuration,
    UserInput,
    Service,
}

#[derive(Debug, Serialize, Deserialize, PartialEq)]
pub enum ErrorSeverity {
    Low,      // Non-critical, user can continue
    Medium,   // Some functionality affected
    High,     // Major functionality impacted
    Critical, // Service is down or severely compromised
}

impl AppError {
    /// Create a new database error with context
    /// I'm providing convenient constructors for common error scenarios
    pub fn database<T: Into<String>>(message: T) -> Self {
        Self::DatabaseError(message.into())
    }

    /// Create a new validation error with field information
    pub fn validation<T: Into<String>>(message: T) -> Self {
        Self::ValidationError(message.into())
    }

    /// Create a new not found error with resource information
    pub fn not_found<T: Into<String>>(resource: T) -> Self {
        Self::NotFoundError(format!("Resource not found: {}", resource.into()))
    }

    /// Create a new bad request error with details
    pub fn bad_request<T: Into<String>>(message: T) -> Self {
        Self::BadRequestError(message.into())
    }

    /// Create a new internal server error with context
    pub fn internal<T: Into<String>>(message: T) -> Self {
        Self::InternalServerError(message.into())
    }

    /// Get the appropriate HTTP status code for this error
    /// I'm mapping application errors to appropriate HTTP status codes
    pub fn status_code(&self) -> StatusCode {
        match self {
            AppError::DatabaseError(_) => StatusCode::INTERNAL_SERVER_ERROR,
            AppError::ExternalApiError(_) => StatusCode::BAD_GATEWAY,
            AppError::SerializationError(_) => StatusCode::UNPROCESSABLE_ENTITY,
            AppError::ConfigurationError(_) => StatusCode::INTERNAL_SERVER_ERROR,
            AppError::ValidationError(_) => StatusCode::BAD_REQUEST,
            AppError::AuthenticationError(_) => StatusCode::UNAUTHORIZED,
            AppError::AuthorizationError(_) => StatusCode::FORBIDDEN,
            AppError::RateLimitError(_) => StatusCode::TOO_MANY_REQUESTS,
            AppError::NotFoundError(_) => StatusCode::NOT_FOUND,
            AppError::TimeoutError(_) => StatusCode::REQUEST_TIMEOUT,
            AppError::InternalServerError(_) => StatusCode::INTERNAL_SERVER_ERROR,
            AppError::BadRequestError(_) => StatusCode::BAD_REQUEST,
            AppError::ServiceUnavailableError(_) => StatusCode::SERVICE_UNAVAILABLE,
            AppError::CacheError(_) => StatusCode::INTERNAL_SERVER_ERROR,
            AppError::FractalComputationError(_) => StatusCode::UNPROCESSABLE_ENTITY,
            AppError::GitHubApiError(_) => StatusCode::BAD_GATEWAY,
            AppError::PerformanceError(_) => StatusCode::INTERNAL_SERVER_ERROR,
        }
    }

    /// Get the error category for metrics and logging
    /// I'm categorizing errors for better monitoring and alerting
    pub fn category(&self) -> ErrorCategory {
        match self {
            AppError::DatabaseError(_) | AppError::CacheError(_) => ErrorCategory::Database,
            AppError::ExternalApiError(_) | AppError::GitHubApiError(_) => ErrorCategory::ExternalApi,
            AppError::SerializationError(_) => ErrorCategory::Validation,
            AppError::ConfigurationError(_) => ErrorCategory::Configuration,
            AppError::ValidationError(_) | AppError::BadRequestError(_) => ErrorCategory::UserInput,
            AppError::AuthenticationError(_) => ErrorCategory::Authentication,
            AppError::AuthorizationError(_) => ErrorCategory::Authorization,
            AppError::RateLimitError(_) => ErrorCategory::RateLimit,
            AppError::NotFoundError(_) => ErrorCategory::NotFound,
            AppError::TimeoutError(_) => ErrorCategory::Timeout,
            AppError::ServiceUnavailableError(_) => ErrorCategory::Service,
            AppError::InternalServerError(_)
            | AppError::FractalComputationError(_)
            | AppError::PerformanceError(_) => ErrorCategory::Internal,
        }
    }

    /// Get the error severity level
    /// I'm assessing error impact for appropriate alerting and response
    pub fn severity(&self) -> ErrorSeverity {
        match self {
            AppError::ValidationError(_)
            | AppError::BadRequestError(_)
            | AppError::NotFoundError(_) => ErrorSeverity::Low,

            AppError::AuthenticationError(_)
            | AppError::AuthorizationError(_)
            | AppError::RateLimitError(_)
            | AppError::FractalComputationError(_) => ErrorSeverity::Medium,

            AppError::ExternalApiError(_)
            | AppError::GitHubApiError(_)
            | AppError::TimeoutError(_)
            | AppError::SerializationError(_) => ErrorSeverity::Medium,

            AppError::DatabaseError(_)
            | AppError::CacheError(_)
            | AppError::ServiceUnavailableError(_) => ErrorSeverity::High,

            AppError::ConfigurationError(_)
            | AppError::InternalServerError(_)
            | AppError::PerformanceError(_) => ErrorSeverity::Critical,
        }
    }

    /// Check if this error type is retryable
    /// I'm identifying which errors might succeed on retry
    pub fn is_retryable(&self) -> bool {
        match self {
            AppError::ExternalApiError(_)
            | AppError::GitHubApiError(_)
            | AppError::TimeoutError(_)
            | AppError::ServiceUnavailableError(_)
            | AppError::CacheError(_) => true,

            AppError::DatabaseError(_) => true, // Database might recover

            AppError::ValidationError(_)
            | AppError::BadRequestError(_)
            | AppError::AuthenticationError(_)
            | AppError::AuthorizationError(_)
            | AppError::NotFoundError(_)
            | AppError::ConfigurationError(_) => false,

            AppError::RateLimitError(_) => true, // Can retry after delay

            _ => false,
        }
    }

    /// Get user-friendly error message
    /// I'm providing clean, understandable messages for end users
    pub fn user_message(&self) -> String {
        match self {
            AppError::DatabaseError(_) => "We're experiencing technical difficulties. Please try again later.".to_string(),
            AppError::ExternalApiError(_) => "External service is temporarily unavailable. Please try again.".to_string(),
            AppError::ValidationError(msg) => format!("Invalid input: {}", msg),
            AppError::AuthenticationError(_) => "Authentication required. Please check your credentials.".to_string(),
            AppError::AuthorizationError(_) => "You don't have permission to access this resource.".to_string(),
            AppError::RateLimitError(_) => "Too many requests. Please wait a moment and try again.".to_string(),
            AppError::NotFoundError(msg) => msg.clone(),
            AppError::TimeoutError(_) => "Request timed out. Please try again.".to_string(),
            AppError::BadRequestError(msg) => msg.clone(),
            AppError::ServiceUnavailableError(_) => "Service is temporarily unavailable. Please try again later.".to_string(),
            AppError::FractalComputationError(msg) => format!("Fractal computation failed: {}", msg),
            AppError::GitHubApiError(_) => "GitHub service is temporarily unavailable.".to_string(),
            _ => "An unexpected error occurred. Please try again.".to_string(),
        }
    }

    /// Get error code for tracking and debugging
    /// I'm providing unique error codes for easier support and debugging
    pub fn error_code(&self) -> String {
        match self {
            AppError::DatabaseError(_) => "DB_ERROR".to_string(),
            AppError::ExternalApiError(_) => "EXT_API_ERROR".to_string(),
            AppError::SerializationError(_) => "SERIAL_ERROR".to_string(),
            AppError::ConfigurationError(_) => "CONFIG_ERROR".to_string(),
            AppError::ValidationError(_) => "VALIDATION_ERROR".to_string(),
            AppError::AuthenticationError(_) => "AUTH_ERROR".to_string(),
            AppError::AuthorizationError(_) => "AUTHZ_ERROR".to_string(),
            AppError::RateLimitError(_) => "RATE_LIMIT_ERROR".to_string(),
            AppError::NotFoundError(_) => "NOT_FOUND_ERROR".to_string(),
            AppError::TimeoutError(_) => "TIMEOUT_ERROR".to_string(),
            AppError::InternalServerError(_) => "INTERNAL_ERROR".to_string(),
            AppError::BadRequestError(_) => "BAD_REQUEST_ERROR".to_string(),
            AppError::ServiceUnavailableError(_) => "SERVICE_UNAVAIL_ERROR".to_string(),
            AppError::CacheError(_) => "CACHE_ERROR".to_string(),
            AppError::FractalComputationError(_) => "FRACTAL_ERROR".to_string(),
            AppError::GitHubApiError(_) => "GITHUB_API_ERROR".to_string(),
            AppError::PerformanceError(_) => "PERF_ERROR".to_string(),
        }
    }

    /// Log error with appropriate level and context
    /// I'm implementing intelligent error logging based on severity
    pub fn log_error(&self, context: Option<&str>) {
        let context_info = context.map(|c| format!(" [{}]", c)).unwrap_or_default();

        match self.severity() {
            ErrorSeverity::Critical => {
                error!("CRITICAL ERROR{}: {} - {}", context_info, self.error_code(), self);
            }
            ErrorSeverity::High => {
                error!("HIGH SEVERITY{}: {} - {}", context_info, self.error_code(), self);
            }
            ErrorSeverity::Medium => {
                warn!("MEDIUM SEVERITY{}: {} - {}", context_info, self.error_code(), self);
            }
            ErrorSeverity::Low => {
                // I'm using debug level for low severity errors to avoid log noise
                tracing::debug!("LOW SEVERITY{}: {} - {}", context_info, self.error_code(), self);
            }
        }
    }
}

/// Implementation of IntoResponse for automatic HTTP response conversion
/// I'm enabling seamless error handling in Axum route handlers
impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let status_code = self.status_code();

        // Log the error with appropriate severity
        self.log_error(None);

        // Create structured error response
        let error_response = ErrorResponse {
            error: ErrorDetails {
                code: self.error_code(),
                message: self.user_message(),
                category: self.category(),
                severity: self.severity(),
                retryable: self.is_retryable(),
                context: None, // Could be populated with additional context in the future
            },
            timestamp: chrono::Utc::now(),
            request_id: None, // Could be populated from request middleware
            support_message: format!(
                "If this problem persists, please contact support with error code: {}",
                self.error_code()
            ),
        };

        (status_code, Json(error_response)).into_response()
    }
}

/// Conversion from sqlx::Error to AppError
/// I'm implementing automatic error conversion for database operations
impl From<sqlx::Error> for AppError {
    fn from(err: sqlx::Error) -> Self {
        match err {
            sqlx::Error::RowNotFound => AppError::NotFoundError("Database record not found".to_string()),
            sqlx::Error::Database(db_err) => {
                // I'm extracting useful information from database errors
                let message = format!("Database operation failed: {}", db_err.message());
                AppError::DatabaseError(message)
            }
            sqlx::Error::PoolTimedOut => AppError::TimeoutError("Database connection pool timeout".to_string()),
            sqlx::Error::PoolClosed => AppError::ServiceUnavailableError("Database pool is closed".to_string()),
            _ => AppError::DatabaseError(format!("Database error: {}", err)),
        }
    }
}

/// Conversion from reqwest::Error to AppError
/// I'm implementing automatic error conversion for HTTP client operations
impl From<reqwest::Error> for AppError {
    fn from(err: reqwest::Error) -> Self {
        if err.is_timeout() {
            AppError::TimeoutError(format!("HTTP request timeout: {}", err))
        } else if err.is_connect() {
            AppError::ExternalApiError(format!("Connection failed: {}", err))
        } else if err.is_status() {
            AppError::ExternalApiError(format!("HTTP error: {}", err))
        } else {
            AppError::ExternalApiError(format!("HTTP client error: {}", err))
        }
    }
}

/// Conversion from serde_json::Error to AppError
/// I'm implementing automatic error conversion for JSON operations
impl From<serde_json::Error> for AppError {
    fn from(err: serde_json::Error) -> Self {
        AppError::SerializationError(format!("JSON error: {}", err))
    }
}

/// Conversion from redis::RedisError to AppError
/// I'm implementing automatic error conversion for Redis operations
impl From<redis::RedisError> for AppError {
    fn from(err: redis::RedisError) -> Self {
        match err.kind() {
            redis::ErrorKind::ResponseError => AppError::CacheError(format!("Redis response error: {}", err)),
            redis::ErrorKind::AuthenticationFailed => AppError::AuthenticationError("Redis authentication failed".to_string()),
            redis::ErrorKind::TypeError => AppError::SerializationError(format!("Redis type error: {}", err)),
            redis::ErrorKind::ExecAbortError => AppError::CacheError("Redis transaction aborted".to_string()),
            redis::ErrorKind::BusyLoadingError => AppError::ServiceUnavailableError("Redis is loading data".to_string()),
            redis::ErrorKind::NoScriptError => AppError::CacheError("Redis script not found".to_string()),
            redis::ErrorKind::InvalidClientConfig => AppError::ConfigurationError("Invalid Redis client configuration".to_string()),
            _ => AppError::CacheError(format!("Redis error: {}", err)),
        }
    }
}

/// Error context builder for adding additional information to errors
/// I'm providing a way to enrich errors with context during error propagation
pub struct ErrorContext {
    operation: String,
    metadata: serde_json::Map<String, serde_json::Value>,
}

impl ErrorContext {
    pub fn new(operation: &str) -> Self {
        Self {
            operation: operation.to_string(),
            metadata: serde_json::Map::new(),
        }
    }

    pub fn with_metadata<K, V>(mut self, key: K, value: V) -> Self
    where
    K: Into<String>,
    V: Into<serde_json::Value>,
    {
        self.metadata.insert(key.into(), value.into());
        self
    }

    pub fn wrap_error(self, error: AppError) -> AppError {
        // I'm preserving the original error type while adding context
        // In a more sophisticated implementation, this could create a new error variant
        // that contains the original error plus context
        tracing::error!("Error in operation '{}': {} (metadata: {:?})",
                        self.operation, error, self.metadata);
        error
    }
}

/// Trait for adding context to Result types
/// I'm providing a convenient way to add context to errors
pub trait ResultExt<T> {
    fn with_context<F>(self, f: F) -> Result<T>
    where
    F: FnOnce() -> ErrorContext;
}

impl<T, E> ResultExt<T> for std::result::Result<T, E>
where
E: Into<AppError>,
{
    fn with_context<F>(self, f: F) -> Result<T>
    where
    F: FnOnce() -> ErrorContext,
    {
        self.map_err(|e| f().wrap_error(e.into()))
    }
}

/// Macro for creating error contexts quickly
/// I'm providing syntactic sugar for common error context patterns
#[macro_export]
macro_rules! error_context {
    ($operation:expr) => {
        $crate::utils::error::ErrorContext::new($operation)
    };
    ($operation:expr, $($key:expr => $value:expr),*) => {
        {
            let mut context = $crate::utils::error::ErrorContext::new($operation);
            $(
                context = context.with_metadata($key, $value);
            )*
            context
        }
    };
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_error_status_codes() {
        assert_eq!(AppError::NotFoundError("test".to_string()).status_code(), StatusCode::NOT_FOUND);
        assert_eq!(AppError::ValidationError("test".to_string()).status_code(), StatusCode::BAD_REQUEST);
        assert_eq!(AppError::DatabaseError("test".to_string()).status_code(), StatusCode::INTERNAL_SERVER_ERROR);
    }

    #[test]
    fn test_error_categories() {
        assert!(matches!(AppError::DatabaseError("test".to_string()).category(), ErrorCategory::Database));
        assert!(matches!(AppError::ValidationError("test".to_string()).category(), ErrorCategory::UserInput));
        assert!(matches!(AppError::ExternalApiError("test".to_string()).category(), ErrorCategory::ExternalApi));
    }

    #[test]
    fn test_error_severity() {
        assert_eq!(AppError::ValidationError("test".to_string()).severity(), ErrorSeverity::Low);
        assert_eq!(AppError::DatabaseError("test".to_string()).severity(), ErrorSeverity::High);
        assert_eq!(AppError::ConfigurationError("test".to_string()).severity(), ErrorSeverity::Critical);
    }

    #[test]
    fn test_error_retryability() {
        assert!(AppError::ExternalApiError("test".to_string()).is_retryable());
        assert!(!AppError::ValidationError("test".to_string()).is_retryable());
        assert!(AppError::RateLimitError("test".to_string()).is_retryable());
    }

    #[test]
    fn test_error_context() {
        let context = ErrorContext::new("database_operation")
        .with_metadata("table", "users")
        .with_metadata("operation", "insert");

        let error = AppError::DatabaseError("Connection failed".to_string());
        let _wrapped_error = context.wrap_error(error);
        // The wrapped error should contain the original error
        // In a real implementation, we might want to verify the context is preserved
    }
}
