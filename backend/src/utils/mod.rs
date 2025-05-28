/*
 * Utilities module aggregator providing common functionality, error handling, configuration management, and metrics collection for the dark performance showcase.
 * I'm organizing cross-cutting concerns like configuration parsing, error handling, performance metrics, and shared utilities into a cohesive support layer for the entire application.
 */

pub mod config;
pub mod error;
pub mod metrics;

// Re-export commonly used utilities for convenient access throughout the application
pub use config::Config;
pub use error::{AppError, Result, ErrorContext, ResultExt};
pub use metrics::{MetricsCollector, PerformanceTimer, TimingGuard};

use serde::{Deserialize, Serialize};
use std::time::{Duration, Instant, SystemTime, UNIX_EPOCH};
use chrono::{DateTime, Utc};

/// Common utility functions used across the application
/// I'm providing a collection of helper functions for common operations
pub struct Utils;

impl Utils {
    /// Generate a unique correlation ID for request tracking
    /// I'm implementing request correlation for distributed tracing
    pub fn generate_correlation_id() -> String {
        uuid::Uuid::new_v4().to_string()
    }

    /// Get current timestamp in various formats
    /// I'm providing flexible timestamp generation for different use cases
    pub fn current_timestamp() -> DateTime<Utc> {
        Utc::now()
    }

    pub fn current_unix_timestamp() -> u64 {
        SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs()
    }

    pub fn current_timestamp_millis() -> u128 {
        SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_millis()
    }

    /// Format duration in human-readable format
    /// I'm providing human-friendly duration formatting
    pub fn format_duration(duration: Duration) -> String {
        let seconds = duration.as_secs();
        let millis = duration.subsec_millis();

        if seconds >= 3600 {
            let hours = seconds / 3600;
            let minutes = (seconds % 3600) / 60;
            let secs = seconds % 60;
            format!("{}h {}m {}s", hours, minutes, secs)
        } else if seconds >= 60 {
            let minutes = seconds / 60;
            let secs = seconds % 60;
            format!("{}m {}s", minutes, secs)
        } else if seconds > 0 {
            format!("{}.{:03}s", seconds, millis)
        } else {
            format!("{}ms", millis)
        }
    }

    /// Format bytes in human-readable format
    /// I'm providing human-friendly byte size formatting
    pub fn format_bytes(bytes: u64) -> String {
        const UNITS: &[&str] = &["B", "KB", "MB", "GB", "TB", "PB"];

        if bytes == 0 {
            return "0 B".to_string();
        }

        let base = 1024_f64;
        let size = bytes as f64;
        let index = (size.ln() / base.ln()).floor() as usize;
        let index = index.min(UNITS.len() - 1);

        let size_in_unit = size / base.powi(index as i32);

        if index == 0 {
            format!("{} {}", bytes, UNITS[index])
        } else {
            format!("{:.1} {}", size_in_unit, UNITS[index])
        }
    }

    /// Parse size string (e.g., "1GB", "500MB") to bytes
    /// I'm implementing flexible size parsing for configuration
     pub fn parse_size(size_str: &str) -> std::result::Result<u64, AppError> {
        let size_str = size_str.trim().to_uppercase();

        if size_str.is_empty() {
            return Err(AppError::ConfigurationError("Empty size string".to_string()));
        }

        // Extract number and unit
        let (number_part, unit_part) = if size_str.ends_with("B") {
            let without_b = &size_str[..size_str.len() - 1];
            if let Some(pos) = without_b.chars().position(|c| c.is_alphabetic()) {
                (&without_b[..pos], &without_b[pos..])
            } else {
                (without_b, "")
            }
        } else {
            if let Some(pos) = size_str.chars().position(|c| c.is_alphabetic()) {
                (&size_str[..pos], &size_str[pos..])
            } else {
                (size_str.as_str(), "")
            }
        };

        let number: f64 = number_part.parse()
            .map_err(|_| AppError::ConfigurationError(format!("Invalid number: {}", number_part)))?;

        let multiplier = match unit_part {
            "" | "B" => 1,
            "K" | "KB" => 1024,
            "M" | "MB" => 1024 * 1024,
            "G" | "GB" => 1024 * 1024 * 1024,
            "T" | "TB" => 1024_u64.pow(4),
            "P" | "PB" => 1024_u64.pow(5),
            _ => return Err(AppError::ConfigurationError(format!("Unknown unit: {}", unit_part))),
        };

        Ok((number * multiplier as f64) as u64)
    }

    /// Truncate string to specified length with ellipsis
    /// I'm providing string truncation for display purposes
    pub fn truncate_string(s: &str, max_len: usize) -> String {
        if s.len() <= max_len {
            s.to_string()
        } else if max_len <= 3 {
            "...".to_string()
        } else {
            format!("{}...", &s[..max_len - 3])
        }
    }

    /// Sanitize string for safe logging
    /// I'm implementing string sanitization for security
    pub fn sanitize_for_log(s: &str) -> String {
        s.chars()
            .map(|c| if c.is_control() { '�' } else { c })
            .collect()
    }

    /// Calculate percentile from a sorted vector
    /// I'm implementing percentile calculation for statistics
    pub fn calculate_percentile(sorted_values: &[f64], percentile: f64) -> Option<f64> {
        if sorted_values.is_empty() || percentile < 0.0 || percentile > 100.0 {
            return None;
        }

        if sorted_values.len() == 1 {
            return Some(sorted_values[0]);
        }

        let index = (percentile / 100.0) * (sorted_values.len() - 1) as f64;
        let lower_index = index.floor() as usize;
        let upper_index = index.ceil() as usize;

        if lower_index == upper_index {
            Some(sorted_values[lower_index])
        } else {
            let lower_value = sorted_values[lower_index];
            let upper_value = sorted_values[upper_index];
            let weight = index - lower_index as f64;
            Some(lower_value + weight * (upper_value - lower_value))
        }
    }

    /// Generate secure random string
    /// I'm implementing secure random string generation
    pub fn generate_random_string(length: usize) -> String {
        use rand::Rng;
        const CHARSET: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        let mut rng = rand::thread_rng();

        (0..length)
            .map(|_| {
                let idx = rng.gen_range(0..CHARSET.len());
                CHARSET[idx] as char
            })
            .collect()
    }

    /// Hash string using SHA-256
    /// I'm providing secure hashing functionality
    pub fn hash_string(input: &str) -> String {
        use sha2::{Sha256, Digest};
        let mut hasher = Sha256::new();
        hasher.update(input.as_bytes());
        format!("{:x}", hasher.finalize())
    }

    /// Validate email address format
    /// I'm implementing basic email validation
    pub fn is_valid_email(email: &str) -> bool {
        email.contains('@') && email.contains('.') && email.len() > 5
    }

    /// Validate URL format
    /// I'm implementing basic URL validation
    pub fn is_valid_url(url: &str) -> bool {
        url.starts_with("http://") || url.starts_with("https://")
    }

    /// Rate limiter utility
    /// I'm implementing a simple rate limiter for API protection
    pub fn create_rate_limiter(max_requests: u32, window_seconds: u64) -> RateLimiter {
        RateLimiter::new(max_requests, Duration::from_secs(window_seconds))
    }
}

/// Simple rate limiter implementation
/// I'm providing basic rate limiting functionality
pub struct RateLimiter {
    max_requests: u32,
    window: Duration,
    requests: std::sync::Mutex<Vec<Instant>>,
}

impl RateLimiter {
    pub fn new(max_requests: u32, window: Duration) -> Self {
        Self {
            max_requests,
            window,
            requests: std::sync::Mutex::new(Vec::new()),
        }
    }

    pub fn is_allowed(&self) -> bool {
        let now = Instant::now();
        let mut requests = self.requests.lock().unwrap();

        // Remove old requests outside the window
        requests.retain(|&request_time| now.duration_since(request_time) < self.window);

        if requests.len() < self.max_requests as usize {
            requests.push(now);
            true
        } else {
            false
        }
    }

    pub fn remaining_requests(&self) -> u32 {
        let now = Instant::now();
        let mut requests = self.requests.lock().unwrap();

        // Remove old requests outside the window
        requests.retain(|&request_time| now.duration_since(request_time) < self.window);

        self.max_requests.saturating_sub(requests.len() as u32)
    }

    pub fn reset_time(&self) -> Option<Instant> {
        let requests = self.requests.lock().unwrap();
        requests.first().map(|&first_request| first_request + self.window)
    }
}

/// Environment detection utilities
/// I'm providing environment detection for configuration
pub struct Environment;

impl Environment {
    pub fn is_development() -> bool {
        matches!(
            std::env::var("ENVIRONMENT").as_deref(),
            Ok("development") | Ok("dev")
        ) || cfg!(debug_assertions)
    }

    pub fn is_production() -> bool {
        matches!(
            std::env::var("ENVIRONMENT").as_deref(),
            Ok("production") | Ok("prod")
        )
    }

    pub fn is_testing() -> bool {
        matches!(
            std::env::var("ENVIRONMENT").as_deref(),
            Ok("test") | Ok("testing")
        ) || cfg!(test)
    }

    pub fn get_environment() -> String {
        std::env::var("ENVIRONMENT")
            .unwrap_or_else(|_| {
                if cfg!(debug_assertions) {
                    "development".to_string()
                } else {
                    "production".to_string()
                }
            })
    }
}

/// Retry utility for resilient operations
/// I'm implementing retry logic with exponential backoff
pub struct RetryConfig {
    pub max_attempts: u32,
    pub initial_delay: Duration,
    pub max_delay: Duration,
    pub multiplier: f64,
}

impl Default for RetryConfig {
    fn default() -> Self {
        Self {
            max_attempts: 3,
            initial_delay: Duration::from_millis(100),
            max_delay: Duration::from_secs(30),
            multiplier: 2.0,
        }
    }
}

pub async fn retry_with_backoff<F, T, E>(
    operation: F,
    config: RetryConfig,
) -> std::result::Result<T, E>
where
    F: Fn() -> std::pin::Pin<Box<dyn std::future::Future<Output = std::result::Result<T, E>> + Send>>,
    E: std::fmt::Debug,
{
    let mut current_delay = config.initial_delay;

    for attempt in 1..=config.max_attempts {
        match operation().await {
            Ok(result) => return Ok(result),
            Err(error) => {
                if attempt == config.max_attempts {
                    return Err(error);
                }

                tracing::warn!("Operation failed (attempt {}/{}): {:?}", attempt, config.max_attempts, error);

                tokio::time::sleep(current_delay).await;

                current_delay = Duration::from_millis(
                    ((current_delay.as_millis() as f64) * config.multiplier) as u64
                ).min(config.max_delay);
            }
        }
    }

    unreachable!()
}

/// Circuit breaker pattern implementation
/// I'm implementing circuit breaker for service resilience
#[derive(Debug, Clone)]
pub enum CircuitState {
    Closed,
    Open,
    HalfOpen,
}

pub struct CircuitBreaker {
    state: std::sync::Mutex<CircuitState>,
    failure_count: std::sync::Mutex<u32>,
    last_failure_time: std::sync::Mutex<Option<Instant>>,
    failure_threshold: u32,
    timeout: Duration,
}

impl CircuitBreaker {
    pub fn new(failure_threshold: u32, timeout: Duration) -> Self {
        Self {
            state: std::sync::Mutex::new(CircuitState::Closed),
            failure_count: std::sync::Mutex::new(0),
            last_failure_time: std::sync::Mutex::new(None),
            failure_threshold,
            timeout,
        }
    }

    pub fn call<F, T, E>(&self, operation: F) -> std::result::Result<T, E>
    where
        F: FnOnce() -> std::result::Result<T, E>,
        E: From<AppError>,
    {
        let state = {
            let mut current_state_guard = self.state.lock().unwrap();
            let mut failure_count = self.failure_count.lock().unwrap();
            let mut last_failure_time = self.last_failure_time.lock().unwrap();

            match *state {
                CircuitState::Open => {
                    if let Some(last_failure) = *last_failure_time {
                        if Instant::now().duration_since(last_failure) > self.timeout {
                            *state = CircuitState::HalfOpen;
                            CircuitState::HalfOpen
                        } else {
                            return Err(AppError::ServiceUnavailableError(
                                "Circuit breaker is OPEN".to_string()
                            ).into());
                        }
                    } else {
                        CircuitState::Open
                    }
                }
                _ => state.clone(),
            }
        };

        match operation() {
            Ok(result) => {
                // Reset on success
                *self.failure_count.lock().unwrap() = 0;
                *self.state.lock().unwrap() = CircuitState::Closed;
                Ok(result)
            }
            Err(error) => {
                let mut failure_count = self.failure_count.lock().unwrap();
                let mut state = self.state.lock().unwrap();
                let mut last_failure_time = self.last_failure_time.lock().unwrap();

                *failure_count += 1;
                *last_failure_time = Some(Instant::now());

                if *failure_count >= self.failure_threshold {
                    *state = CircuitState::Open;
                }

                Err(error)
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_format_bytes() {
        assert_eq!(Utils::format_bytes(0), "0 B");
        assert_eq!(Utils::format_bytes(1024), "1.0 KB");
        assert_eq!(Utils::format_bytes(1048576), "1.0 MB");
        assert_eq!(Utils::format_bytes(1073741824), "1.0 GB");
    }

    #[test]
    fn test_parse_size() {
        assert_eq!(Utils::parse_size("1024").unwrap(), 1024);
        assert_eq!(Utils::parse_size("1KB").unwrap(), 1024);
        assert_eq!(Utils::parse_size("1MB").unwrap(), 1048576);
        assert_eq!(Utils::parse_size("1GB").unwrap(), 1073741824);
    }

    #[test]
    fn test_truncate_string() {
        assert_eq!(Utils::truncate_string("hello", 10), "hello");
        assert_eq!(Utils::truncate_string("hello world", 8), "hello...");
        assert_eq!(Utils::truncate_string("hi", 2), "hi");
    }

    #[test]
    fn test_calculate_percentile() {
        let values = vec![1.0, 2.0, 3.0, 4.0, 5.0];
        assert_eq!(Utils::calculate_percentile(&values, 50.0), Some(3.0));
        assert_eq!(Utils::calculate_percentile(&values, 0.0), Some(1.0));
        assert_eq!(Utils::calculate_percentile(&values, 100.0), Some(5.0));
    }

    #[test]
    fn test_rate_limiter() {
        let limiter = RateLimiter::new(2, Duration::from_secs(1));

        assert!(limiter.is_allowed());
        assert!(limiter.is_allowed());
        assert!(!limiter.is_allowed()); // Should be rate limited
    }

    #[test]
    fn test_email_validation() {
        assert!(Utils::is_valid_email("test@example.com"));
        assert!(!Utils::is_valid_email("invalid-email"));
        assert!(!Utils::is_valid_email("@example.com"));
    }

    #[test]
    fn test_url_validation() {
        assert!(Utils::is_valid_url("https://example.com"));
        assert!(Utils::is_valid_url("http://example.com"));
        assert!(!Utils::is_valid_url("ftp://example.com"));
        assert!(!Utils::is_valid_url("example.com"));
    }
}
