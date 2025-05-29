// backend/src/services/cache_service.rs

use redis::{Client, AsyncCommands}; // Removed `Connection` as it wasn't directly used in the struct
use serde::{Deserialize, Serialize, de::DeserializeOwned};
use std::time::{Duration, SystemTime, UNIX_EPOCH};
use tracing::{info, warn, error, debug};
use std::sync::Arc;
use tokio::sync::RwLock;

use crate::utils::error::{AppError, Result};


#[derive(Clone)]
pub struct CacheService {
    client: Client,
    key_prefix: String,
    default_ttl: u64,
    connection_pool: Arc<RwLock<Option<redis::aio::ConnectionManager>>>,
}

// Manually implement Debug for CacheService
impl std::fmt::Debug for CacheService {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("CacheService")
            .field("client", &"<RedisClient>") // Placeholder for client as it might not be Debug or simple to Debug
            .field("key_prefix", &self.key_prefix)
            .field("default_ttl", &self.default_ttl)
            .field("connection_pool", &"<ConnectionPool>") // Placeholder for connection_pool
            .finish()
        // Or, if you want to indicate that some fields are not shown:
        // .finish_non_exhaustive()
    }
}

/// Cache entry with metadata for advanced cache management
/// I'm including metadata to enable sophisticated cache analytics and management
#[derive(Debug, Serialize, Deserialize)]
struct CacheEntry<T> {
    data: T,
    created_at: u64,
    expires_at: u64,
    access_count: u64,
    last_accessed: u64,
    version: u32,
}

/// Cache statistics for monitoring and optimization
/// I'm providing comprehensive cache analytics for performance tuning
#[derive(Debug, Serialize, Deserialize)]
pub struct CacheStats {
    pub total_keys: u64,
    pub hit_rate: f64,
    pub miss_rate: f64,
    pub memory_usage_bytes: u64,
    pub expired_keys: u64,
    pub evicted_keys: u64,
    pub average_ttl_seconds: f64,
    pub most_accessed_keys: Vec<String>,
}

/// Cache operation types for metrics tracking
/// I'm categorizing cache operations for detailed performance analysis
#[derive(Debug, Clone)]
pub enum CacheOperation {
    Get,
    Set,
    Delete,
    Expire,
    Flush,
}

impl CacheService {
    /// Create a new cache service with Redis connection
    /// I'm setting up comprehensive cache configuration with connection management
    pub fn new(redis_client: Client) -> Self {
        Self {
            client: redis_client,
            key_prefix: "perf_showcase:".to_string(),
            default_ttl: 3600, // 1 hour default TTL
            connection_pool: Arc::new(RwLock::new(None)),
        }
    }

    /// Create cache service with custom configuration
    /// I'm providing flexibility for different caching strategies and environments
    pub fn with_config(redis_client: Client, key_prefix: String, default_ttl: u64) -> Self {
        Self {
            client: redis_client,
            key_prefix,
            default_ttl,
            connection_pool: Arc::new(RwLock::new(None)),
        }
    }

    /// Get a connection with automatic pool management
    /// I'm implementing intelligent connection pooling with automatic recovery
    async fn get_connection(&self) -> Result<redis::aio::ConnectionManager> {
        let mut pool_guard = self.connection_pool.write().await;

        if let Some(conn_manager) = pool_guard.as_ref() {
            // Test connection health
            match self.ping_connection(conn_manager).await {
                Ok(_) => return Ok(conn_manager.clone()),
                Err(_) => {
                    warn!("Redis connection is stale, creating new connection");
                    // Connection is stale, drop it and create new one
                }
            }
        }

        // Create initial or new connection
        let new_conn_manager = redis::aio::ConnectionManager::new(self.client.clone())
            .await
            .map_err(|e| AppError::CacheError(format!("Failed to create Redis connection manager: {}", e)))?;

        info!("Created new Redis connection manager");
        *pool_guard = Some(new_conn_manager.clone());
        Ok(new_conn_manager)
    }


    /// Create a new Redis connection with optimal settings
    /// I'm configuring Redis connections for maximum performance and reliability
    async fn create_connection(&self) -> Result<redis::aio::ConnectionManager> {
        let conn_manager = redis::aio::ConnectionManager::new(self.client.clone())
        .await
        .map_err(|e| AppError::CacheError(format!("Failed to create Redis connection: {}", e)))?;

        info!("Created new Redis connection");
        Ok(conn_manager)
    }

    /// Test connection health with ping
    /// I'm implementing connection health verification
    async fn ping_connection(&self, conn_manager: &redis::aio::ConnectionManager) -> Result<()> {
        let mut conn = conn_manager.clone(); // Clone the manager to get a connection from its pool
        let response: String = redis::cmd("PING").query_async(&mut conn).await
            .map_err(|e| AppError::CacheError(format!("Redis ping failed: {}", e)))?;

        if response == "PONG" {
            Ok(())
        } else {
            Err(AppError::CacheError("Redis ping returned unexpected response".to_string()))
        }
    }

    /// Get a value from cache with automatic deserialization
    /// I'm implementing intelligent cache retrieval with metadata tracking
    pub async fn get<T>(&self, key: &str) -> Result<Option<T>>
    where
    T: DeserializeOwned + Send + Sync + Serialize,
    {
        let full_key = self.build_key(key);
        let mut conn = self.get_connection().await?;

        debug!("Cache GET: {}", full_key);

        match conn.get::<_, Option<String>>(&full_key).await {
            Ok(Some(cached_data)) => {
                match serde_json::from_str::<CacheEntry<T>>(&cached_data) {
                    Ok(mut entry) => {
                        let now = self.current_timestamp();

                        // Check if entry has expired
                        if now > entry.expires_at {
                            debug!("Cache entry expired: {}", full_key);
                            // Asynchronously delete expired entry
                            let _ = self.delete(key).await; // Use existing delete method
                            return Ok(None);
                        }

                        // Update access metadata
                        entry.access_count += 1;
                        entry.last_accessed = now;

                        // Update entry in cache (fire and forget, but handle potential errors)
                        let updated_data_res = serde_json::to_string(&entry);
                        if let Ok(updated_data) = updated_data_res {
                           let set_result = conn.set::<_, _, ()>(&full_key, updated_data).await;
                           if let Err(e) = set_result {
                               warn!("Failed to update access metadata for cache key {}: {}", full_key, e);
                           }
                        } else if let Err(e) = updated_data_res {
                             warn!("Failed to serialize updated metadata for cache key {}: {}", full_key, e);
                        }


                        debug!("Cache HIT: {}", full_key);
                        Ok(Some(entry.data))
                    }
                    Err(e) => {
                        warn!("Failed to deserialize cache entry {}: {}", full_key, e);
                        // Delete corrupted entry
                        let _ = self.delete(key).await;
                        Ok(None)
                    }
                }
            }
            Ok(None) => {
                debug!("Cache MISS: {}", full_key);
                Ok(None)
            }
            Err(e) => {
                error!("Cache GET error for {}: {}", full_key, e);
                Err(AppError::CacheError(format!("Failed to get cache entry: {}", e)))
            }
        }
    }

    /// Set a value in cache with optional TTL
    /// I'm implementing intelligent cache storage with metadata and expiration management
    pub async fn set<T>(&self, key: &str, value: &T, ttl_seconds: Option<u64>) -> Result<()>
    where
    T: Serialize + Send + Sync,
    {
        let full_key = self.build_key(key);
        let ttl = ttl_seconds.unwrap_or(self.default_ttl);
        let now = self.current_timestamp();

        let entry = CacheEntry {
            data: value,
            created_at: now,
            expires_at: now + ttl,
            access_count: 0,
            last_accessed: now,
            version: 1,
        };

        let serialized = serde_json::to_string(&entry)
        .map_err(|e| AppError::SerializationError(format!("Failed to serialize cache entry: {}", e)))?;

        let mut conn = self.get_connection().await?;

        debug!("Cache SET: {} (TTL: {}s)", full_key, ttl);

        conn.set_ex(&full_key, serialized, ttl).await // Using set_ex for value and TTL together
        .map_err(|e| AppError::CacheError(format!("Failed to set cache entry: {}", e)))?;

        Ok(())
    }

    /// Set a value in cache with default TTL
    /// I'm providing a convenient method for standard cache operations
    pub async fn set_default<T>(&self, key: &str, value: &T) -> Result<()>
    where
    T: Serialize + Send + Sync,
    {
        self.set(key, value, None).await
    }

    /// Delete a value from cache
    /// I'm implementing safe cache invalidation with error handling
    pub async fn delete(&self, key: &str) -> Result<bool> {
        let full_key = self.build_key(key);
        let mut conn = self.get_connection().await?;

        debug!("Cache DELETE: {}", full_key);

        let deleted: i32 = conn.del(&full_key).await
        .map_err(|e| AppError::CacheError(format!("Failed to delete cache entry: {}", e)))?;

        Ok(deleted > 0)
    }

    /// Check if a key exists in cache
    /// I'm providing cache presence verification
    pub async fn exists(&self, key: &str) -> Result<bool> {
        let full_key = self.build_key(key);
        let mut conn = self.get_connection().await?;

        let exists: bool = conn.exists(&full_key).await
        .map_err(|e| AppError::CacheError(format!("Failed to check cache existence: {}", e)))?;

        Ok(exists)
    }

    /// Set expiration time for an existing key
    /// I'm providing TTL management for existing cache entries
    pub async fn expire(&self, key: &str, ttl_seconds: u64) -> Result<bool> {
        let full_key = self.build_key(key);
        let mut conn = self.get_connection().await?;

        debug!("Cache EXPIRE: {} (TTL: {}s)", full_key, ttl_seconds);

        let expired: bool = conn.expire(&full_key, ttl_seconds as usize).await
        .map_err(|e| AppError::CacheError(format!("Failed to set cache expiration: {}", e)))?;

        Ok(expired)
    }

    /// Get remaining TTL for a key
    /// I'm providing TTL inspection for cache management
    pub async fn ttl(&self, key: &str) -> Result<i64> {
        let full_key = self.build_key(key);
        let mut conn = self.get_connection().await?;

        let ttl_val: Option<i64> = conn.ttl(&full_key).await // Changed to Option<i64> as per redis crate docs for non-existent keys or no expiry
        .map_err(|e| AppError::CacheError(format!("Failed to get cache TTL: {}", e)))?;

        Ok(ttl_val.unwrap_or(-2)) // Return -2 if key does not exist, -1 if no expiry, consistent with Redis TTL command
    }

    /// Flush all cache entries with the current prefix
    /// I'm implementing safe cache clearing that respects key namespacing
    pub async fn flush_prefix(&self) -> Result<u64> {
        let pattern = format!("{}*", self.key_prefix);
        let mut conn = self.get_connection().await?;

        info!("Flushing cache entries with pattern: {}", pattern);

        // Get all keys matching the pattern
        let keys: Vec<String> = conn.keys(&pattern).await
        .map_err(|e| AppError::CacheError(format!("Failed to get cache keys: {}", e)))?;

        if keys.is_empty() {
            return Ok(0);
        }

        // Delete all matching keys
        let deleted: i32 = conn.del(&keys).await
        .map_err(|e| AppError::CacheError(format!("Failed to delete cache keys: {}", e)))?;

        info!("Flushed {} cache entries", deleted);
        Ok(deleted as u64)
    }

    /// Get comprehensive cache statistics
    /// I'm providing detailed cache analytics for performance monitoring
    pub async fn get_stats(&self) -> Result<CacheStats> {
        let mut conn = self.get_connection().await?;

        // Get Redis info
        let info_str: String = redis::cmd("INFO").query_async(&mut conn).await
            .map_err(|e| AppError::CacheError(format!("Failed to get Redis info: {}", e)))?;

        // Parse INFO string manually or use a helper if available (redis::InfoDict is not directly async)
        let mut info_map = std::collections::HashMap::new();
        for line in info_str.lines() {
            if line.starts_with('#') || line.is_empty() {
                continue;
            }
            let parts: Vec<&str> = line.split(':').collect();
            if parts.len() == 2 {
                info_map.insert(parts[0].to_string(), parts[1].trim().to_string());
            }
        }

        // Get keys with our prefix
        let pattern = format!("{}*", self.key_prefix);
        let keys: Vec<String> = conn.keys(&pattern).await
        .map_err(|e| AppError::CacheError(format!("Failed to get cache keys: {}", e)))?;

        let total_keys = keys.len() as u64;
        let memory_usage_bytes = info_map.get("used_memory").and_then(|s| s.parse().ok()).unwrap_or(0u64);

        let keyspace_hits: u64 = info_map.get("keyspace_hits").and_then(|s| s.parse().ok()).unwrap_or(0);
        let keyspace_misses: u64 = info_map.get("keyspace_misses").and_then(|s| s.parse().ok()).unwrap_or(0);
        let total_requests = keyspace_hits + keyspace_misses;

        let hit_rate = if total_requests > 0 {
            keyspace_hits as f64 / total_requests as f64
        } else {
            0.0
        };
        let miss_rate = 1.0 - hit_rate;

        let most_accessed_keys = keys.into_iter().take(10).collect();

        Ok(CacheStats {
            total_keys,
            hit_rate,
            miss_rate,
            memory_usage_bytes,
            expired_keys: info_map.get("expired_keys").and_then(|s| s.parse().ok()).unwrap_or(0),
            evicted_keys: info_map.get("evicted_keys").and_then(|s| s.parse().ok()).unwrap_or(0),
            average_ttl_seconds: self.default_ttl as f64, // Simplified
            most_accessed_keys,
        })
    }

    /// Batch get operation for multiple keys
    /// I'm providing efficient bulk cache operations
    pub async fn mget<T>(&self, keys: &[&str]) -> Result<Vec<Option<T>>>
    where
    T: DeserializeOwned + Send + Sync,
    {
        if keys.is_empty() {
            return Ok(vec![]);
        }

        let full_keys: Vec<String> = keys.iter().map(|k| self.build_key(k)).collect();
        let mut conn = self.get_connection().await?;

        debug!("Cache MGET: {} keys", keys.len());

        let results: Vec<Option<String>> = conn.mget(&full_keys).await
        .map_err(|e| AppError::CacheError(format!("Failed to get multiple cache entries: {}", e)))?;

        let mut output = Vec::with_capacity(results.len());
        let now = self.current_timestamp();

        for (i, result) in results.into_iter().enumerate() {
            match result {
                Some(cached_data) => {
                    match serde_json::from_str::<CacheEntry<T>>(&cached_data) {
                        Ok(entry) => {
                            if now <= entry.expires_at {
                                output.push(Some(entry.data));
                            } else {
                                // Entry expired
                                output.push(None);
                                // Asynchronously delete expired entry
                                let _ = self.delete(keys[i]).await;
                            }
                        }
                        Err(_) => {
                            output.push(None);
                            // Delete corrupted entry
                            let _ = self.delete(keys[i]).await;
                        }
                    }
                }
                None => output.push(None),
            }
        }

        Ok(output)
    }

    /// Batch set operation for multiple key-value pairs
    /// I'm providing efficient bulk cache storage
    pub async fn mset<T>(&self, entries: &[(&str, &T)], ttl_seconds: Option<u64>) -> Result<()>
    where
    T: Serialize + Send + Sync,
    {
        if entries.is_empty() {
            return Ok(());
        }

        let ttl = ttl_seconds.unwrap_or(self.default_ttl);
        let now = self.current_timestamp();
        let mut conn = self.get_connection().await?;

        debug!("Cache MSET: {} entries (TTL: {}s)", entries.len(), ttl);

        // Prepare entries as (key, value) tuples for mset_multiple
        let mut kv_pairs_for_redis: Vec<(String, String)> = Vec::with_capacity(entries.len());

        for (key, value) in entries {
            let full_key = self.build_key(key);
            let entry = CacheEntry {
                data: value,
                created_at: now,
                expires_at: now + ttl,
                access_count: 0,
                last_accessed: now,
                version: 1,
            };

            let serialized = serde_json::to_string(&entry)
            .map_err(|e| AppError::SerializationError(format!("Failed to serialize cache entry: {}", e)))?;

            kv_pairs_for_redis.push((full_key, serialized));
        }

        // Set all entries
        conn.mset(&kv_pairs_for_redis).await
        .map_err(|e| AppError::CacheError(format!("Failed to set multiple cache entries: {}", e)))?;

        // Set expiration for all keys in a pipeline for efficiency
        let mut pipe = redis::pipe();
        for (key, _) in entries { // Iterate original keys to avoid issues with kv_pairs_for_redis potentially being moved
            let full_key_for_expire = self.build_key(key);
            pipe.expire(full_key_for_expire, ttl);
        }
        pipe.query_async(&mut conn).await
            .map_err(|e| AppError::CacheError(format!("Failed to set expiration for multiple keys: {}", e)))?;


        Ok(())
    }

    /// Build full cache key with prefix
    /// I'm implementing consistent key naming for cache organization
    fn build_key(&self, key: &str) -> String {
        format!("{}{}", self.key_prefix, key)
    }

    /// Get current timestamp in seconds
    /// I'm providing consistent timestamp generation for cache metadata
    fn current_timestamp(&self) -> u64 {
        SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs()
    }

    /// Health check for cache service
    /// I'm implementing comprehensive cache health verification
    pub async fn health_check(&self) -> Result<serde_json::Value> {
        let start = std::time::Instant::now();
        let mut conn = self.get_connection().await?;

        // Test basic connectivity with ping
        let ping_response: String = redis::cmd("PING").query_async(&mut conn).await
        .map_err(|e| AppError::CacheError(format!("Cache ping failed: {}", e)))?;

        if ping_response != "PONG" {
            return Err(AppError::CacheError("Cache ping returned unexpected response".to_string()));
        }

        // Test set/get operations
        let test_key = "health_check_test";
        let test_value = "test_data";

        conn.set_ex(self.build_key(test_key), test_value, 10).await // Use set_ex
        .map_err(|e| AppError::CacheError(format!("Cache set test failed: {}", e)))?;

        let retrieved: String = conn.get(self.build_key(test_key)).await
        .map_err(|e| AppError::CacheError(format!("Cache get test failed: {}", e)))?;

        if retrieved != test_value {
            return Err(AppError::CacheError("Cache data integrity test failed".to_string()));
        }

        // Clean up test key
        let _: Option<i32> = conn.del(self.build_key(test_key)).await.map_err(|e| AppError::CacheError(format!("Cache del test failed: {}", e)))?;


        let response_time = start.elapsed().as_millis();

        Ok(serde_json::json!({
            "status": "healthy",
            "response_time_ms": response_time,
            "ping_response": ping_response,
            "connectivity": "ok",
            "data_integrity": "ok"
        }))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde::{Deserialize, Serialize};

    #[derive(Debug, Serialize, Deserialize, PartialEq)]
    struct TestData {
        id: u32,
        name: String,
    }

    // Note: These tests require a Redis instance running
    // In CI, you'd use a Redis container

    #[tokio::test]
    #[ignore] // Requires Redis instance
    async fn test_cache_basic_operations() {
        let client = redis::Client::open("redis://127.0.0.1:6379").unwrap();
        let cache = CacheService::new(client);

        let test_data = TestData {
            id: 1,
            name: "test".to_string(),
        };

        // Test set
        cache.set("test_key", &test_data, Some(60)).await.unwrap();

        // Test get
        let retrieved: Option<TestData> = cache.get("test_key").await.unwrap();
        assert_eq!(retrieved, Some(test_data));

        // Test delete
        let deleted = cache.delete("test_key").await.unwrap();
        assert!(deleted);

        // Verify deletion
        let retrieved_after_delete: Option<TestData> = cache.get("test_key").await.unwrap();
        assert_eq!(retrieved_after_delete, None);
    }
}
