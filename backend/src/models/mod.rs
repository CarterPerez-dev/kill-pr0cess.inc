/*
 * Models module aggregator organizing all data structures and business logic entities for the dark performance showcase backend.
 * I'm providing a clean interface to GitHub repository data, fractal computation parameters, and performance metrics with comprehensive serialization and validation support.
 */

pub mod github;
pub mod fractals;
pub mod performance;

// Re-export commonly used models for convenient access throughout the application
pub use github::{
    Repository,
    RepositoryDetailed,
    RepositoryStats,
    GitHubUser,
    RepositoryFilter,
    RepositoryCollection,
    CollectionStats,
    LanguageStats,
    RateLimitInfo,
    calculate_collection_stats
};

pub use fractals::{
    FractalRequest,
    FractalResponse,
    FractalType,
    FractalParameters,
    FractalMetadata,
    FractalComputationLog,
    BenchmarkRequest,
    BenchmarkResponse
};

pub use performance::{
    PerformanceMetric,
    SystemInfo,
    BenchmarkResult,
    MetricType,
    MetricValue,
    SystemSnapshot,
    PerformanceAlert,
    ResourceUsage
};

use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};

/// Common pagination structure used across all API responses
/// I'm providing consistent pagination handling for all list endpoints
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Pagination {
    pub current_page: i32,
    pub per_page: i32,
    pub total_pages: i32,
    pub total_count: i32,
    pub has_next_page: bool,
    pub has_previous_page: bool,
}

impl Pagination {
    pub fn new(current_page: i32, per_page: i32, total_count: i32) -> Self {
        let total_pages = ((total_count as f64) / (per_page as f64)).ceil() as i32;

        Self {
            current_page,
            per_page,
            total_pages,
            total_count,
            has_next_page: current_page < total_pages,
            has_previous_page: current_page > 1,
        }
    }
}

/// Standard API response wrapper for consistent response formatting
/// I'm implementing consistent API response structure across all endpoints
#[derive(Debug, Serialize, Deserialize)]
pub struct ApiResponse<T> {
    pub data: T,
    pub pagination: Option<Pagination>,
    pub metadata: Option<serde_json::Value>,
    pub timestamp: DateTime<Utc>,
    pub request_duration_ms: Option<u128>,
}

impl<T> ApiResponse<T> {
    pub fn new(data: T) -> Self {
        Self {
            data,
            pagination: None,
            metadata: None,
            timestamp: Utc::now(),
            request_duration_ms: None,
        }
    }

    pub fn with_pagination(mut self, pagination: Pagination) -> Self {
        self.pagination = Some(pagination);
        self
    }

    pub fn with_metadata(mut self, metadata: serde_json::Value) -> Self {
        self.metadata = Some(metadata);
        self
    }

    pub fn with_duration(mut self, duration_ms: u128) -> Self {
        self.request_duration_ms = Some(duration_ms);
        self
    }
}

/// Health check response structure for system monitoring
/// I'm providing standardized health check information across all services
#[derive(Debug, Serialize, Deserialize)]
pub struct HealthCheck {
    pub status: HealthStatus,
    pub timestamp: DateTime<Utc>,
    pub version: String,
    pub uptime_seconds: u64,
    pub services: std::collections::HashMap<String, ServiceHealth>,
    pub system: Option<SystemHealth>,
}

#[derive(Debug, Serialize, Deserialize)]
pub enum HealthStatus {
    Healthy,
    Degraded,
    Unhealthy,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ServiceHealth {
    pub status: HealthStatus,
    pub response_time_ms: Option<u64>,
    pub last_check: DateTime<Utc>,
    pub error_message: Option<String>,
    pub metadata: Option<serde_json::Value>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SystemHealth {
    pub cpu_usage_percent: f64,
    pub memory_usage_percent: f64,
    pub disk_usage_percent: f64,
    pub active_connections: u32,
    pub load_average: f64,
}

/// Common sorting and filtering structures
/// I'm providing reusable sorting and filtering functionality across different entity types
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SortOptions {
    pub field: String,
    pub direction: SortDirection,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SortDirection {
    Asc,
    Desc,
}

impl Default for SortDirection {
    fn default() -> Self {
        Self::Desc
    }
}

/// Query parameters for list endpoints
/// I'm standardizing query parameter handling across all list operations
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ListQuery {
    pub page: Option<i32>,
    pub per_page: Option<i32>,
    pub sort: Option<SortOptions>,
    pub search: Option<String>,
    pub filters: Option<serde_json::Value>,
}

impl ListQuery {
    pub fn page(&self) -> i32 {
        self.page.unwrap_or(1).max(1)
    }

    pub fn per_page(&self) -> i32 {
        self.per_page.unwrap_or(20).clamp(1, 100)
    }

    pub fn offset(&self) -> i32 {
        (self.page() - 1) * self.per_page()
    }
}

/// Audit log structure for tracking changes and operations
/// I'm implementing comprehensive audit logging for security and debugging
#[derive(Debug, Serialize, Deserialize)]
pub struct AuditLog {
    pub id: uuid::Uuid,
    pub entity_type: String,
    pub entity_id: Option<String>,
    pub action: AuditAction,
    pub user_id: Option<String>,
    pub ip_address: Option<String>,
    pub user_agent: Option<String>,
    pub timestamp: DateTime<Utc>,
    pub changes: Option<serde_json::Value>,
    pub metadata: Option<serde_json::Value>,
}

#[derive(Debug, Serialize, Deserialize)]
pub enum AuditAction {
    Create,
    Read,
    Update,
    Delete,
    Execute,
    Login,
    Logout,
    Error,
}

/// Cache metadata for intelligent caching strategies
/// I'm providing comprehensive cache metadata for optimization
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CacheMetadata {
    pub key: String,
    pub created_at: DateTime<Utc>,
    pub expires_at: DateTime<Utc>,
    pub last_accessed: DateTime<Utc>,
    pub access_count: u64,
    pub size_bytes: u64,
    pub tags: Vec<String>,
    pub dependencies: Vec<String>,
}

impl CacheMetadata {
    pub fn new(key: String, ttl_seconds: u64) -> Self {
        let now = Utc::now();
        Self {
            key,
            created_at: now,
            expires_at: now + chrono::Duration::seconds(ttl_seconds as i64),
            last_accessed: now,
            access_count: 0,
            size_bytes: 0,
            tags: Vec::new(),
            dependencies: Vec::new(),
        }
    }

    pub fn is_expired(&self) -> bool {
        Utc::now() > self.expires_at
    }

    pub fn touch(&mut self) {
        self.last_accessed = Utc::now();
        self.access_count += 1;
    }
}

/// Model validation trait for consistent data validation
/// I'm implementing standardized validation across all models
pub trait Validate {
    type Error;

    fn validate(&self) -> Result<(), Self::Error>;
}

/// Model transformation trait for data conversion
/// I'm providing consistent data transformation patterns
pub trait Transform<T> {
    fn transform(self) -> T;
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_pagination_calculation() {
        let pagination = Pagination::new(2, 10, 95);

        assert_eq!(pagination.current_page, 2);
        assert_eq!(pagination.total_pages, 10);
        assert!(pagination.has_next_page);
        assert!(pagination.has_previous_page);
    }

    #[test]
    fn test_list_query_defaults() {
        let query = ListQuery {
            page: None,
            per_page: None,
            sort: None,
            search: None,
            filters: None,
        };

        assert_eq!(query.page(), 1);
        assert_eq!(query.per_page(), 20);
        assert_eq!(query.offset(), 0);
    }

    #[test]
    fn test_cache_metadata_expiration() {
        let mut metadata = CacheMetadata::new("test_key".to_string(), 1);

        assert!(!metadata.is_expired());

        // Simulate time passing
        metadata.expires_at = Utc::now() - chrono::Duration::seconds(1);
        assert!(metadata.is_expired());
    }
}
