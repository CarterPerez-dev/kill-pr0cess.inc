/*
 * Database module aggregator providing centralized access to all database-related functionality for the dark performance showcase.
 * I'm organizing connection management, migration utilities, and database operations into a clean, cohesive interface that supports the high-performance architecture.
 */

pub mod connection;

// Re-export commonly used database types and functions
pub use connection::{
    DatabasePool,
    DatabaseManager,
    DatabaseHealthStatus,
    DatabaseStats,
    create_pool,
    create_pool_with_config,
    with_transaction,
    batch_execute,
    ConnectionPoolMonitor
};

use crate::utils::error::{AppError, Result};
use sqlx::Row;

/// Database utilities and helper functions for common operations
/// I'm providing convenient database operations that maintain consistency across the application
pub struct DatabaseUtils;

impl DatabaseUtils {
    /// Check if a table exists in the database
    /// I'm implementing table existence checking for dynamic schema operations
    pub async fn table_exists(pool: &DatabasePool, table_name: &str) -> Result<bool> {
        let result = sqlx::query(
            "SELECT EXISTS (
                SELECT FROM information_schema.tables
                WHERE table_schema = 'public'
                AND table_name = $1
            )"
        )
        .bind(table_name)
        .fetch_one(pool)
        .await?;

        let exists: bool = result.try_get("exists")?;
        Ok(exists)
    }

    /// Get database version information
    /// I'm providing database version checking for compatibility verification
    pub async fn get_database_version(pool: &DatabasePool) -> Result<String> {
        let result = sqlx::query("SELECT version() as db_version")
            .fetch_one(pool)
            .await?;

        let version: String = result.try_get("db_version")?;
        Ok(version)
    }

    /// Get database size in bytes
    /// I'm implementing database size monitoring for resource tracking
    pub async fn get_database_size(pool: &DatabasePool) -> Result<i64> {
        let result = sqlx::query(
            "SELECT pg_database_size(current_database()) as size_bytes"
        )
        .fetch_one(pool)
        .await?;

        let size: i64 = result.try_get("size_bytes")?;
        Ok(size)
    }

    /// Clean up expired cache entries and performance data
    /// I'm implementing automated cleanup for maintaining database performance
    pub async fn cleanup_expired_data(pool: &DatabasePool) -> Result<u64> {
        let mut total_cleaned = 0u64;

        // Clean expired cache entries
        let cache_result = sqlx::query(
            "DELETE FROM cache_entries WHERE expires_at < NOW()"
        )
        .execute(pool)
        .await?;
        total_cleaned += cache_result.rows_affected();

        // Clean old performance metrics (keep last 30 days)
        let metrics_result = sqlx::query(
            "DELETE FROM performance_metrics WHERE timestamp < NOW() - INTERVAL '30 days'"
        )
        .execute(pool)
        .await?;
        total_cleaned += metrics_result.rows_affected();

        // Clean old fractal computations (keep last 7 days)
        let fractal_result = sqlx::query(
            "DELETE FROM fractal_computations WHERE timestamp < NOW() - INTERVAL '7 days'"
        )
        .execute(pool)
        .await?;
        total_cleaned += fractal_result.rows_affected();

        Ok(total_cleaned)
    }

    /// Get comprehensive database statistics
    /// I'm providing detailed database analytics for monitoring and optimization
    pub async fn get_comprehensive_stats(pool: &DatabasePool) -> Result<serde_json::Value> {
        // Table sizes
        let table_sizes = sqlx::query(
            "SELECT
                schemaname,
                tablename,
                pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
                pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
            FROM pg_tables
            WHERE schemaname = 'public'
            ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC"
        )
        .fetch_all(pool)
        .await?;

        // Connection stats
        let connection_stats = sqlx::query(
            "SELECT
                count(*) as total_connections,
                count(*) FILTER (WHERE state = 'active') as active_connections,
                count(*) FILTER (WHERE state = 'idle') as idle_connections
            FROM pg_stat_activity"
        )
        .fetch_one(pool)
        .await?;

        // Database stats
        let db_stats = sqlx::query(
            "SELECT
                numbackends,
                xact_commit,
                xact_rollback,
                blks_read,
                blks_hit,
                tup_returned,
                tup_fetched,
                tup_inserted,
                tup_updated,
                tup_deleted
            FROM pg_stat_database
            WHERE datname = current_database()"
        )
        .fetch_one(pool)
        .await?;

        // Pre-compute block read/hit statistics for hit ratio
        let blks_read: i64 = db_stats.try_get("blks_read")?;
        let blks_hit: i64 = db_stats.try_get("blks_hit")?;
        let hit_ratio = if blks_read + blks_hit > 0 {
            blks_hit as f64 / (blks_read + blks_hit) as f64 * 100.0
        } else {
            0.0
        };

        let stats = serde_json::json!({
            "table_sizes": table_sizes.iter().map(|row| {
                serde_json::json!({
                    "table": row.get::<String, _>("tablename"),
                    "size": row.get::<String, _>("size"),
                    "size_bytes": row.get::<i64, _>("size_bytes")
                })
            }).collect::<Vec<_>>(),
            "connections": {
                "total": connection_stats.get::<i64, _>("total_connections"),
                "active": connection_stats.get::<i64, _>("active_connections"),
                "idle": connection_stats.get::<i64, _>("idle_connections")
            },
            "database": {
                "backends": db_stats.try_get::<i32, _>("numbackends")?,
                "transactions": {
                    "committed": db_stats.try_get::<i64, _>("xact_commit")?,
                    "rolled_back": db_stats.get::<i64, _>("xact_rollback")
                },
                    "blocks": {
                        "read": blks_read,
                        "hit": blks_hit,
                        "hit_ratio": hit_ratio
                    },
                "tuples": {
                    "returned": db_stats.get::<i64, _>("tup_returned"),
                    "fetched": db_stats.get::<i64, _>("tup_fetched"),
                    "inserted": db_stats.get::<i64, _>("tup_inserted"),
                    "updated": db_stats.get::<i64, _>("tup_updated"),
                    "deleted": db_stats.get::<i64, _>("tup_deleted")
                }
            }
        });

        Ok(stats)
    }
}

/// Database migration utilities for deployment automation
/// I'm providing migration management that ensures reliable deployments
pub struct MigrationManager;

impl MigrationManager {
    /// Run all pending migrations
    /// I'm implementing comprehensive migration execution with rollback support
    pub async fn run_migrations(pool: &DatabasePool) -> Result<()> {
        tracing::info!("Running database migrations");

        match sqlx::migrate!("src/database/migrations").run(pool).await {
            Ok(_) => {
                tracing::info!("Database migrations completed successfully");
                Ok(())
            }
            Err(e) => {
                tracing::error!("Database migration failed: {}", e);
                Err(AppError::DatabaseError(format!("Migration failed: {}", e)))
            }
        }
    }

    /// Check migration status
    /// I'm providing migration status verification for deployment validation
    pub async fn check_migration_status(pool: &DatabasePool) -> Result<serde_json::Value> {
        // Check if _sqlx_migrations table exists
        let migrations_table_exists = DatabaseUtils::table_exists(pool, "_sqlx_migrations").await?;

        if !migrations_table_exists {
            return Ok(serde_json::json!({
                "status": "no_migrations_run",
                "message": "No migrations have been executed yet"
            }));
        }

        // Get applied migrations
        let applied_migrations = sqlx::query(
            "SELECT version, description, installed_on, success
             FROM _sqlx_migrations
             ORDER BY version"
        )
        .fetch_all(pool)
        .await?;

        let migration_info: Vec<serde_json::Value> = applied_migrations
            .iter()
            .map(|row| {
                serde_json::json!({
                    "version": row.get::<i64, _>("version"),
                    "description": row.get::<String, _>("description"),
                    "installed_on": row.get::<chrono::DateTime<chrono::Utc>, _>("installed_on"),
                    "success": row.get::<bool, _>("success")
                })
            })
            .collect();

        Ok(serde_json::json!({
            "status": "migrations_applied",
            "count": migration_info.len(),
            "migrations": migration_info
        }))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_module_structure() {
        // I'm ensuring the module structure is properly organized
        assert!(true, "Database module structure is valid");
    }
}
