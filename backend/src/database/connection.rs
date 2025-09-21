/*
 * Database connection pool management with optimized settings, health monitoring, and automatic recovery.
 * I'm implementing robust PostgreSQL connection handling with performance optimization and comprehensive error recovery mechanisms.
 */

use sqlx::{
    postgres::{PgPool, PgPoolOptions, PgConnectOptions, PgSslMode},
    ConnectOptions, Row,
};
use std::time::Duration;
use tracing::{info, warn, error, debug};
use std::str::FromStr;

use crate::{
    utils::{
        error::{AppError, Result},
        config::{Config, DatabasePoolConfig},
    },
};

/// Type alias for our PostgreSQL connection pool
/// I'm providing a convenient type alias used throughout the application
pub type DatabasePool = PgPool;

/// Database connection manager with health monitoring and optimization
/// I'm implementing comprehensive database management with performance tracking
pub struct DatabaseManager {
    pool: DatabasePool,
    config: DatabasePoolConfig,
    health_check_query: String,
}

impl DatabaseManager {
    /// Create a new database manager with the provided pool
    /// I'm setting up comprehensive database management with health monitoring
    pub fn new(pool: DatabasePool, config: DatabasePoolConfig) -> Self {
        Self {
            pool,
            config,
            health_check_query: "SELECT 1 as health_check".to_string(),
        }
    }

    /// Get a reference to the connection pool
    /// I'm providing access to the underlying pool for queries
    pub fn pool(&self) -> &DatabasePool {
        &self.pool
    }

    /// Perform a health check on the database connection
    /// I'm implementing comprehensive health verification
    pub async fn health_check(&self) -> Result<DatabaseHealthStatus> {
        let start_time = std::time::Instant::now();

        match sqlx::query(&self.health_check_query)
        .fetch_one(&self.pool)
        .await
        {
            Ok(row) => {
                let response_time = start_time.elapsed();
                let health_value: i32 = row.try_get("health_check")?;

                if health_value == 1 {
                    Ok(DatabaseHealthStatus {
                        healthy: true,
                        response_time_ms: response_time.as_millis() as u64,
                       active_connections: self.get_active_connections().await.unwrap_or(0),
                       pool_size: self.pool.size(),
                       idle_connections: self.get_idle_connections().await.unwrap_or(0),
                       error_message: None,
                    })
                } else {
                    Err(AppError::DatabaseError("Health check returned unexpected value".to_string()))
                }
            }
            Err(e) => {
                let response_time = start_time.elapsed();
                Ok(DatabaseHealthStatus {
                    healthy: false,
                    response_time_ms: response_time.as_millis() as u64,
                   active_connections: 0,
                   pool_size: self.pool.size(),
                   idle_connections: 0,
                   error_message: Some(e.to_string()),
                })
            }
        }
    }

    /// Get the number of active connections
    /// I'm providing pool monitoring capabilities for performance analysis
    async fn get_active_connections(&self) -> Result<u32> {
        let result = sqlx::query(
            "SELECT count(*) as active_connections FROM pg_stat_activity WHERE state = 'active'"
        )
        .fetch_one(&self.pool)
        .await?;

        let count: i64 = result.try_get("active_connections")?;
        Ok(count as u32)
    }

    /// Get the number of idle connections
    /// I'm tracking connection pool efficiency
    async fn get_idle_connections(&self) -> Result<u32> {
        let result = sqlx::query(
            "SELECT count(*) as idle_connections FROM pg_stat_activity WHERE state = 'idle'"
        )
        .fetch_one(&self.pool)
        .await?;

        let count: i64 = result.try_get("idle_connections")?;
        Ok(count as u32)
    }

    /// Get detailed database statistics for monitoring
    /// I'm providing comprehensive database performance metrics
    pub async fn get_database_stats(&self) -> Result<DatabaseStats> {
        let stats_query = r#"
        SELECT
        pg_database_size(current_database()) as database_size_bytes,
        (SELECT count(*) FROM pg_stat_activity) as total_connections,
        (SELECT count(*) FROM pg_stat_activity WHERE state = 'active') as active_connections,
        (SELECT count(*) FROM pg_stat_activity WHERE state = 'idle') as idle_connections,
        (SELECT sum(numbackends) FROM pg_stat_database) as backend_count,
        current_setting('max_connections')::int as max_connections
        "#;

        let result = sqlx::query(stats_query)
        .fetch_one(&self.pool)
        .await?;

        Ok(DatabaseStats {
            database_size_bytes: result.try_get::<i64, _>("database_size_bytes")? as u64,
           total_connections: result.try_get::<i64, _>("total_connections")? as u32,
           active_connections: result.try_get::<i64, _>("active_connections")? as u32,
           idle_connections: result.try_get::<i64, _>("idle_connections")? as u32,
           backend_count: result.try_get::<i64, _>("backend_count")? as u32,
           max_connections: result.try_get::<i32, _>("max_connections")? as u32,
           pool_size: self.pool.size(),
           pool_idle: self.pool.num_idle() as u32,
        })
    }

    /// Run database migrations if needed
    /// I'm providing migration support for deployment automation
    pub async fn run_migrations(&self) -> Result<()> {
        info!("Running database migrations");

        match sqlx::migrate!("src/database/migrations")
        .run(&self.pool)
        .await
        {
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

    /// Close the database connection pool gracefully
    /// I'm implementing proper resource cleanup
    pub async fn close(&self) {
        info!("Closing database connection pool");
        self.pool.close().await;
        info!("Database connection pool closed");
    }
}

/// Database health status information
/// I'm providing comprehensive health monitoring data
#[derive(Debug, Clone, serde::Serialize)]
pub struct DatabaseHealthStatus {
    pub healthy: bool,
    pub response_time_ms: u64,
    pub active_connections: u32,
    pub pool_size: u32,
    pub idle_connections: u32,
    pub error_message: Option<String>,
}

/// Comprehensive database statistics for monitoring
/// I'm providing detailed performance and usage metrics
#[derive(Debug, Clone, serde::Serialize)]
pub struct DatabaseStats {
    pub database_size_bytes: u64,
    pub total_connections: u32,
    pub active_connections: u32,
    pub idle_connections: u32,
    pub backend_count: u32,
    pub max_connections: u32,
    pub pool_size: u32,
    pub pool_idle: u32,
}

/// Create an optimized database connection pool
/// I'm implementing production-ready connection pooling with intelligent configuration
pub async fn create_pool(database_url: &str) -> Result<DatabasePool> {
    info!("Creating database connection pool");

    // Parse the database URL and configure connection options
    let mut connect_options = PgConnectOptions::from_str(database_url)
    .map_err(|e| AppError::ConfigurationError(format!("Invalid database URL: {}", e)))?;

    // I'm configuring connection options for optimal performance and security
    connect_options = connect_options
    .application_name("dark-performance-showcase")
    .ssl_mode(PgSslMode::Prefer) // Prefer SSL but allow non-SSL connections
    .statement_cache_capacity(100) // Cache prepared statements
    .log_statements(tracing::log::LevelFilter::Debug); // Log SQL in debug mode

    // Create the pool with optimized settings
    let pool = PgPoolOptions::new()
    .max_connections(20) // Default max connections
    .min_connections(5)  // Maintain minimum connections
    .acquire_timeout(Duration::from_secs(30))
    .idle_timeout(Duration::from_secs(600)) // 10 minutes idle timeout
    .max_lifetime(Duration::from_secs(1800)) // 30 minutes max lifetime
    .test_before_acquire(true) // Verify connections before use
    .connect_with(connect_options)
    .await
    .map_err(|e| AppError::DatabaseError(format!("Failed to create connection pool: {}", e)))?;

    // Test the initial connection
    test_database_connection(&pool).await?;

    info!("Database connection pool created successfully with {} connections", pool.size());
    Ok(pool)
}

/// Create a database pool with custom configuration
/// I'm providing flexibility for different deployment scenarios
pub async fn create_pool_with_config(database_url: &str, config: &DatabasePoolConfig) -> Result<DatabasePool> {
    info!("Creating database connection pool with custom configuration");

    let mut connect_options = PgConnectOptions::from_str(database_url)
    .map_err(|e| AppError::ConfigurationError(format!("Invalid database URL: {}", e)))?;

    connect_options = connect_options
    .application_name("dark-performance-showcase")
    .ssl_mode(PgSslMode::Prefer)
    .statement_cache_capacity(100)
    .log_statements(if cfg!(debug_assertions) {
        tracing::log::LevelFilter::Debug
    } else {
        tracing::log::LevelFilter::Warn
    });

    let pool = PgPoolOptions::new()
    .max_connections(config.max_connections)
    .min_connections(config.min_connections)
    .acquire_timeout(config.connection_timeout)
    .idle_timeout(config.idle_timeout)
    .max_lifetime(Duration::from_secs(3600)) // 1 hour max lifetime
    .test_before_acquire(config.test_before_acquire)
    .connect_with(connect_options)
    .await
    .map_err(|e| AppError::DatabaseError(format!("Failed to create connection pool: {}", e)))?;

    test_database_connection(&pool).await?;

    info!("Database connection pool created with custom config: max={}, min={}",
          config.max_connections, config.min_connections);
    Ok(pool)
}

/// Test database connection and basic functionality
/// I'm implementing comprehensive connection validation
async fn test_database_connection(pool: &DatabasePool) -> Result<()> {
    debug!("Testing database connection");

    // Test basic connectivity
    let result = sqlx::query("SELECT 1 as test_value, NOW() as current_time")
    .fetch_one(pool)
    .await
    .map_err(|e| AppError::DatabaseError(format!("Database connection test failed: {}", e)))?;

    let test_value: i32 = result.try_get("test_value")?;
    let current_time: chrono::DateTime<chrono::Utc> = result.try_get("current_time")?;

    if test_value != 1 {
        return Err(AppError::DatabaseError("Database test query returned unexpected value".to_string()));
    }

    debug!("Database connection test successful - server time: {}", current_time);

    // Test database version and capabilities
    let version_result = sqlx::query("SELECT version() as db_version")
    .fetch_one(pool)
    .await?;

    let db_version: String = version_result.try_get("db_version")?;
    info!("Connected to database: {}", db_version);

    // Check for required extensions or permissions
    test_database_permissions(pool).await?;

    Ok(())
}

/// Test database permissions and required functionality
/// I'm verifying that the database user has necessary permissions
async fn test_database_permissions(pool: &DatabasePool) -> Result<()> {
    debug!("Testing database permissions");

    // Test table creation permission (for migrations)
    let create_test = sqlx::query(
        "CREATE TEMP TABLE temp_permission_test (id SERIAL PRIMARY KEY, test_data TEXT)"
    )
    .execute(pool)
    .await;

    match create_test {
        Ok(_) => {
            debug!("Database CREATE permission verified");

            // Clean up the temp table
            let _ = sqlx::query("DROP TABLE IF EXISTS temp_permission_test")
            .execute(pool)
            .await;
        }
        Err(e) => {
            warn!("Database CREATE permission test failed: {}", e);
            // Don't fail here as some deployments might not allow temp table creation
        }
    }

    // Test basic SELECT permission
    let select_test = sqlx::query("SELECT current_user, current_database()")
    .fetch_one(pool)
    .await?;

    let current_user: String = select_test.try_get("current_user")?;
    let current_database: String = select_test.try_get("current_database")?;

    info!("Database permissions verified - user: {}, database: {}", current_user, current_database);

    Ok(())
}

/// Database connection helper for transactions
/// I'm providing convenient transaction handling
pub async fn with_transaction<F, R>(pool: &DatabasePool, f: F) -> Result<R>
where
F: for<'c> FnOnce(&mut sqlx::Transaction<'c, sqlx::Postgres>) -> std::pin::Pin<Box<dyn std::future::Future<Output = Result<R>> + Send + 'c>>,
{
    let mut tx = pool.begin().await?;

    match f(&mut tx).await {
        Ok(result) => {
            tx.commit().await?;
            Ok(result)
        }
        Err(e) => {
            if let Err(rollback_err) = tx.rollback().await {
                error!("Failed to rollback transaction: {}", rollback_err);
            }
            Err(e)
        }
    }
}

/// Batch operation helper for improved performance
/// I'm providing optimized batch processing for bulk operations
pub async fn batch_execute<T>(
    pool: &DatabasePool,
    items: Vec<T>,
    batch_size: usize,
    mut operation: impl FnMut(&T) -> sqlx::query::Query<'_, sqlx::Postgres, sqlx::postgres::PgArguments>,
) -> Result<u64>
where
T: Send,
{
    let mut total_affected = 0u64;

    for chunk in items.chunks(batch_size) {
        let mut tx = pool.begin().await?;

        for item in chunk {
            let query = operation(item);
            let result = query.execute(&mut *tx).await?;
            total_affected += result.rows_affected();
        }

        tx.commit().await?;
    }

    Ok(total_affected)
}

/// Connection pool monitoring and metrics collection
/// I'm implementing performance monitoring for database operations
pub struct ConnectionPoolMonitor {
    pool: DatabasePool,
    metrics_interval: Duration,
}

impl ConnectionPoolMonitor {
    pub fn new(pool: DatabasePool, metrics_interval: Duration) -> Self {
        Self {
            pool,
            metrics_interval,
        }
    }

    /// Start monitoring the connection pool
    /// I'm providing continuous monitoring of database performance
    pub async fn start_monitoring(&self) {
        let mut interval = tokio::time::interval(self.metrics_interval);

        loop {
            interval.tick().await;

            if let Err(e) = self.collect_metrics().await {
                warn!("Failed to collect database metrics: {}", e);
            }
        }
    }

    /// Collect and log database metrics
    /// I'm gathering comprehensive performance data
    async fn collect_metrics(&self) -> Result<()> {
        let pool_size = self.pool.size();
        let idle_connections = self.pool.num_idle();
        let active_connections = pool_size - (idle_connections as u32);

        // Log pool statistics
        debug!("Database pool stats - Total: {}, Active: {}, Idle: {}",
               pool_size, active_connections, idle_connections);

        // Check for potential issues
        if active_connections > (pool_size * 3 / 4) {
            warn!("High database connection usage: {}/{} connections active",
                  active_connections, pool_size);
        }

        if idle_connections == 0 {
            warn!("No idle database connections available - consider increasing pool size");
        }

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_database_health_status_serialization() {
        let status = DatabaseHealthStatus {
            healthy: true,
            response_time_ms: 42,
            active_connections: 5,
            pool_size: 10,
            idle_connections: 5,
            error_message: None,
        };

        let json = serde_json::to_string(&status).unwrap();
        assert!(json.contains("\"healthy\":true"));
        assert!(json.contains("\"response_time_ms\":42"));
    }

    #[test]
    fn test_connection_options_parsing() {
        let url = "postgresql://user:pass@localhost:5432/testdb";
        let options = PgConnectOptions::from_str(url);
        assert!(options.is_ok());
    }
}
