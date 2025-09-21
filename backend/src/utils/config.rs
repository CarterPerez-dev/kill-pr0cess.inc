/*
 * ©AngelaMos | 2025
 */

use serde::{Deserialize, Serialize};
use std::env;
use std::net::SocketAddr;
use tracing::{info, warn};

use crate::utils::error::{AppError, Result};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Config {
    // Server configuration
    pub host: String,
    pub port: u16,
    pub environment: Environment,

    // Database configuration
    pub database_url: String,
    pub database_max_connections: u32,
    pub database_min_connections: u32,
    pub database_connection_timeout: u64,

    // Redis configuration
    pub redis_url: String,
    pub redis_max_connections: u32,
    pub redis_connection_timeout: u64,

    // GitHub API configuration
    pub github_token: String,
    pub github_username: String,
    pub github_api_base_url: String,
    pub github_rate_limit_requests: u32,
    pub github_cache_ttl: u64,

    // Frontend configuration
    pub frontend_url: String,
    pub cors_allowed_origins: Vec<String>,

    // Performance monitoring
    pub metrics_enabled: bool,
    pub prometheus_port: u16,
    pub system_metrics_interval: u64,

    // Fractal computation limits
    pub fractal_max_width: u32,
    pub fractal_max_height: u32,
    pub fractal_max_iterations: u32,
    pub fractal_max_zoom: f64,
    pub fractal_computation_timeout: u64,

    // Logging configuration
    pub log_level: String,
    pub log_format: LogFormat,

    // Security configuration
    pub rate_limit_enabled: bool,
    pub rate_limit_requests_per_minute: u32,
    pub fractal_rate_limit_per_minute: u32,

    // Caching configuration
    pub cache_enabled: bool,
    pub cache_default_ttl: u64,
    pub github_cache_enabled: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum Environment {
    Development,
    Staging,
    Production,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum LogFormat {
    Plain,
    Json,
}

impl Config {
    /// Load configuration from environment variables with intelligent defaults
    /// I'm implementing comprehensive environment variable parsing with validation
    pub fn from_env() -> Result<Self> {
        info!("Loading configuration from environment variables");

        // Load environment type first to set appropriate defaults
        let environment = parse_environment()?;

        let config = Config {
            // Server configuration
            host: env::var("HOST").unwrap_or_else(|_| "0.0.0.0".to_string()),
            port: parse_env_var("PORT", 3001)?,
            environment: environment.clone(),

            // Database configuration with environment-specific defaults
            database_url: get_required_env("DATABASE_URL")?,
            database_max_connections: parse_env_var("DATABASE_MAX_CONNECTIONS",
                if environment == Environment::Production { 100 } else { 20 })?,
            database_min_connections: parse_env_var("DATABASE_MIN_CONNECTIONS", 5)?,
            database_connection_timeout: parse_env_var("DATABASE_CONNECTION_TIMEOUT", 30)?,

            // Redis configuration
            redis_url: get_required_env("REDIS_URL")?,
            redis_max_connections: parse_env_var("REDIS_MAX_CONNECTIONS", 10)?,
            redis_connection_timeout: parse_env_var("REDIS_CONNECTION_TIMEOUT", 5)?,

            // GitHub API configuration
            github_token: get_required_env("GITHUB_TOKEN")?,
            github_username: get_required_env("GITHUB_USERNAME")?,
            github_api_base_url: env::var("GITHUB_API_BASE_URL")
                .unwrap_or_else(|_| "https://api.github.com".to_string()),
            github_rate_limit_requests: parse_env_var("GITHUB_RATE_LIMIT_REQUESTS", 5000)?,
            github_cache_ttl: parse_env_var("GITHUB_CACHE_TTL", 1800)?,

            // Frontend configuration
            frontend_url: env::var("FRONTEND_URL").unwrap_or_else(|_| "http://localhost:4000".to_string()),
            cors_allowed_origins: parse_cors_origins()?,

            // Performance monitoring
            metrics_enabled: parse_bool_env("METRICS_ENABLED", true)?,
            prometheus_port: parse_env_var("PROMETHEUS_PORT", 9090)?,
            system_metrics_interval: parse_env_var("SYSTEM_METRICS_INTERVAL", 60)?,

            // Fractal computation limits for safety
            fractal_max_width: parse_env_var("MAX_FRACTAL_WIDTH", 4096)?,
            fractal_max_height: parse_env_var("MAX_FRACTAL_HEIGHT", 4096)?,
            fractal_max_iterations: parse_env_var("MAX_FRACTAL_ITERATIONS", 10000)?,
            fractal_max_zoom: parse_env_var("MAX_FRACTAL_ZOOM", 1e15)?,
            fractal_computation_timeout: parse_env_var("FRACTAL_COMPUTATION_TIMEOUT", 120)?,

            // Logging configuration
            log_level: env::var("RUST_LOG").unwrap_or_else(|_|
                match environment {
                    Environment::Development => "debug".to_string(),
                    Environment::Staging => "info".to_string(),
                    Environment::Production => "warn".to_string(),
                }
            ),
            log_format: parse_log_format()?,

            // Security configuration
            rate_limit_enabled: parse_bool_env("RATE_LIMIT_ENABLED", true)?,
            rate_limit_requests_per_minute: parse_env_var("RATE_LIMIT_REQUESTS_PER_MINUTE",
                if environment == Environment::Production { 60 } else { 100 })?,
            fractal_rate_limit_per_minute: parse_env_var("FRACTAL_RATE_LIMIT_PER_MINUTE", 10)?,

            // Caching configuration
            cache_enabled: parse_bool_env("CACHE_ENABLED", true)?,
            cache_default_ttl: parse_env_var("CACHE_DEFAULT_TTL", 3600)?,
            github_cache_enabled: parse_bool_env("GITHUB_CACHE_ENABLED", true)?,
        };

        // Validate configuration after loading
        config.validate()?;

        info!("Configuration loaded successfully for environment: {:?}", config.environment);
        config.log_configuration_summary();

        Ok(config)
    }

    /// Validate configuration values for consistency and safety
    /// I'm implementing comprehensive validation to catch configuration errors early
    fn validate(&self) -> Result<()> {
        // Validate server configuration
        if self.port == 0 {
            return Err(AppError::ConfigurationError("Port cannot be 0".to_string()));
        }

        // Validate database configuration
        if !self.database_url.starts_with("postgresql://") {
            return Err(AppError::ConfigurationError(
                "DATABASE_URL must be a valid PostgreSQL connection string".to_string()
            ));
        }

        if self.database_max_connections < self.database_min_connections {
            return Err(AppError::ConfigurationError(
                "DATABASE_MAX_CONNECTIONS must be >= DATABASE_MIN_CONNECTIONS".to_string()
            ));
        }

        // Validate Redis configuration
        if !self.redis_url.starts_with("redis://") {
            return Err(AppError::ConfigurationError(
                "REDIS_URL must be a valid Redis connection string".to_string()
            ));
        }

        // Validate GitHub configuration
        if self.github_token.is_empty() {
            return Err(AppError::ConfigurationError(
                "GITHUB_TOKEN is required and cannot be empty".to_string()
            ));
        }

        if self.github_username.is_empty() {
            return Err(AppError::ConfigurationError(
                "GITHUB_USERNAME is required and cannot be empty".to_string()
            ));
        }

        // Validate fractal limits for safety and performance
        if self.fractal_max_width > 8192 || self.fractal_max_height > 8192 {
            warn!("Fractal dimensions are very large, this may impact performance");
        }

        if self.fractal_max_iterations > 50000 {
            warn!("Maximum iterations is very high, this may cause slow computation");
        }

        // Validate URLs
        if !is_valid_url(&self.frontend_url) {
            return Err(AppError::ConfigurationError(
                "FRONTEND_URL must be a valid URL".to_string()
            ));
        }

        if !is_valid_url(&self.github_api_base_url) {
            return Err(AppError::ConfigurationError(
                "GITHUB_API_BASE_URL must be a valid URL".to_string()
            ));
        }

        Ok(())
    }

    /// Get server socket address for binding
    /// I'm providing a convenient method for server startup
    pub fn socket_addr(&self) -> Result<SocketAddr> {
        let addr = format!("{}:{}", self.host, self.port);
        addr.parse()
            .map_err(|e| AppError::ConfigurationError(format!("Invalid socket address: {}", e)))
    }

    /// Check if running in development mode
    /// I'm providing convenience methods for environment checking
    pub fn is_development(&self) -> bool {
        self.environment == Environment::Development
    }

    /// Check if running in production mode
    pub fn is_production(&self) -> bool {
        self.environment == Environment::Production
    }

    /// Get API base URL for documentation
    pub fn api_base_url(&self) -> String {
        format!("http://{}:{}", self.host, self.port)
    }

    /// Get database pool configuration
    /// I'm providing optimized database settings based on environment
    pub fn database_pool_config(&self) -> DatabasePoolConfig {
        DatabasePoolConfig {
            max_connections: self.database_max_connections,
            min_connections: self.database_min_connections,
            connection_timeout: std::time::Duration::from_secs(self.database_connection_timeout),
            idle_timeout: std::time::Duration::from_secs(300),
            test_before_acquire: self.is_production(),
        }
    }

    /// Log configuration summary (without sensitive data)
    /// I'm providing visibility into loaded configuration for debugging
    fn log_configuration_summary(&self) {
        info!("=== Configuration Summary ===");
        info!("Environment: {:?}", self.environment);
        info!("Server: {}:{}", self.host, self.port);
        info!("Database: {} (max_conn: {})",
            mask_connection_string(&self.database_url), self.database_max_connections);
        info!("Redis: {} (max_conn: {})",
            mask_connection_string(&self.redis_url), self.redis_max_connections);
        info!("GitHub: {} (user: {})", self.github_api_base_url, self.github_username);
        info!("Frontend: {}", self.frontend_url);
        info!("Metrics: {} (port: {})", self.metrics_enabled, self.prometheus_port);
        info!("Fractal limits: {}x{} max, {} iterations",
            self.fractal_max_width, self.fractal_max_height, self.fractal_max_iterations);
        info!("Rate limiting: {} ({} req/min)",
            self.rate_limit_enabled, self.rate_limit_requests_per_minute);
        info!("Caching: {} (TTL: {}s)", self.cache_enabled, self.cache_default_ttl);
        info!("Log level: {} (format: {:?})", self.log_level, self.log_format);
        info!("============================");
    }
}

#[derive(Debug, Clone)]
pub struct DatabasePoolConfig {
    pub max_connections: u32,
    pub min_connections: u32,
    pub connection_timeout: std::time::Duration,
    pub idle_timeout: std::time::Duration,
    pub test_before_acquire: bool,
}

// Helper functions for configuration parsing and validation

fn parse_environment() -> Result<Environment> {
    let env_str = env::var("ENVIRONMENT")
        .or_else(|_| env::var("ENV"))
        .unwrap_or_else(|_| "development".to_string());

    match env_str.to_lowercase().as_str() {
        "development" | "dev" => Ok(Environment::Development),
        "staging" | "stage" => Ok(Environment::Staging),
        "production" | "prod" => Ok(Environment::Production),
        _ => Err(AppError::ConfigurationError(
            format!("Invalid environment: {}. Must be development, staging, or production", env_str)
        )),
    }
}

fn get_required_env(key: &str) -> Result<String> {
    env::var(key)
        .map_err(|_| AppError::ConfigurationError(
            format!("Required environment variable {} is not set", key)
        ))
}

fn parse_env_var<T>(key: &str, default: T) -> Result<T>
where
    T: std::str::FromStr,
    T::Err: std::fmt::Display,
{
    match env::var(key) {
        Ok(value) => value.parse().map_err(|e| {
            AppError::ConfigurationError(
                format!("Invalid value for {}: {}. Error: {}", key, value, e)
            )
        }),
        Err(_) => Ok(default),
    }
}

fn parse_bool_env(key: &str, default: bool) -> Result<bool> {
    match env::var(key) {
        Ok(value) => match value.to_lowercase().as_str() {
            "true" | "1" | "yes" | "on" => Ok(true),
            "false" | "0" | "no" | "off" => Ok(false),
            _ => Err(AppError::ConfigurationError(
                format!("Invalid boolean value for {}: {}. Use true/false, 1/0, yes/no, or on/off", key, value)
            )),
        },
        Err(_) => Ok(default),
    }
}

fn parse_cors_origins() -> Result<Vec<String>> {
    let origins_str = env::var("CORS_ALLOWED_ORIGINS")
        .unwrap_or_else(|_| "http://localhost:4000,http://localhost:8000".to_string());

    let origins: Vec<String> = origins_str
        .split(',')
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
        .collect();

    // Validate each origin URL
    for origin in &origins {
        if !is_valid_url(origin) && origin != "*" {
            return Err(AppError::ConfigurationError(
                format!("Invalid CORS origin URL: {}", origin)
            ));
        }
    }

    Ok(origins)
}

fn parse_log_format() -> Result<LogFormat> {
    let format_str = env::var("LOG_FORMAT").unwrap_or_else(|_| "plain".to_string());

    match format_str.to_lowercase().as_str() {
        "plain" | "text" => Ok(LogFormat::Plain),
        "json" => Ok(LogFormat::Json),
        _ => Err(AppError::ConfigurationError(
            format!("Invalid log format: {}. Must be 'plain' or 'json'", format_str)
        )),
    }
}

fn is_valid_url(url: &str) -> bool {
    // Simple URL validation - in production you might want to use a proper URL parsing library
    url.starts_with("http://") || url.starts_with("https://")
}

fn mask_connection_string(connection_string: &str) -> String {
    // I'm masking sensitive information in connection strings for logging
    if let Some(at_pos) = connection_string.find('@') {
        if let Some(colon_pos) = connection_string[..at_pos].rfind(':') {
            let mut masked = connection_string.to_string();
            let password_start = colon_pos + 1;
            let password_end = at_pos;

            if password_end > password_start {
                masked.replace_range(password_start..password_end, "****");
            }

            return masked;
        }
    }

    connection_string.to_string()
}

/// Configuration builder for testing and advanced use cases
/// I'm providing a builder pattern for flexible configuration construction
pub struct ConfigBuilder {
    config: Config,
}

impl ConfigBuilder {
    pub fn new() -> Self {
        Self {
            config: Config {
                host: "localhost".to_string(),
                port: 3001,
                environment: Environment::Development,
                database_url: "postgresql://localhost/test".to_string(),
                database_max_connections: 10,
                database_min_connections: 1,
                database_connection_timeout: 30,
                redis_url: "redis://localhost:6379".to_string(),
                redis_max_connections: 10,
                redis_connection_timeout: 5,
                github_token: "test_token".to_string(),
                github_username: "testuser".to_string(),
                github_api_base_url: "https://api.github.com".to_string(),
                github_rate_limit_requests: 5000,
                github_cache_ttl: 1800,
                frontend_url: "http://localhost:4000".to_string(),
                cors_allowed_origins: vec!["http://localhost:4000".to_string()],
                metrics_enabled: true,
                prometheus_port: 9090,
                system_metrics_interval: 60,
                fractal_max_width: 4096,
                fractal_max_height: 4096,
                fractal_max_iterations: 10000,
                fractal_max_zoom: 1e15,
                fractal_computation_timeout: 120,
                log_level: "info".to_string(),
                log_format: LogFormat::Plain,
                rate_limit_enabled: true,
                rate_limit_requests_per_minute: 100,
                fractal_rate_limit_per_minute: 10,
                cache_enabled: true,
                cache_default_ttl: 3600,
                github_cache_enabled: true,
            },
        }
    }

    pub fn database_url(mut self, url: &str) -> Self {
        self.config.database_url = url.to_string();
        self
    }

    pub fn github_token(mut self, token: &str) -> Self {
        self.config.github_token = token.to_string();
        self
    }

    pub fn environment(mut self, env: Environment) -> Self {
        self.config.environment = env;
        self
    }

    pub fn build(self) -> Result<Config> {
        self.config.validate()?;
        Ok(self.config)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_config_builder() {
        let config = ConfigBuilder::new()
            .database_url("postgresql://test:test@localhost/testdb")
            .github_token("ghp_test_token")
            .environment(Environment::Development)
            .build()
            .unwrap();

        assert_eq!(config.environment, Environment::Development);
        assert_eq!(config.github_token, "ghp_test_token");
    }

    #[test]
    fn test_environment_parsing() {
        std::env::set_var("ENVIRONMENT", "production");
        let env = parse_environment().unwrap();
        assert_eq!(env, Environment::Production);
    }

    #[test]
    fn test_boolean_parsing() {
        assert_eq!(parse_bool_env("NONEXISTENT_VAR", true).unwrap(), true);
        std::env::set_var("TEST_BOOL", "true");
        assert_eq!(parse_bool_env("TEST_BOOL", false).unwrap(), true);
    }
}
