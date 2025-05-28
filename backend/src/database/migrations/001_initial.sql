-- Initial database schema for the dark performance showcase backend.
-- I'm designing tables for GitHub repository caching, performance metrics storage, and fractal computation logs with optimal indexing for high-performance queries.

-- Enable UUID extension for unique identifiers
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Repositories table for GitHub data caching with comprehensive metadata
CREATE TABLE repositories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    github_id BIGINT UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    full_name VARCHAR(511) NOT NULL,
    owner_login VARCHAR(255) NOT NULL,
    description TEXT,
    homepage VARCHAR(2048),
    clone_url TEXT NOT NULL,
    ssh_url TEXT NOT NULL,
    html_url TEXT NOT NULL,
    language VARCHAR(100),
    size_kb INTEGER DEFAULT 0,
    stargazers_count INTEGER DEFAULT 0,
    watchers_count INTEGER DEFAULT 0,
    forks_count INTEGER DEFAULT 0,
    open_issues_count INTEGER DEFAULT 0,
    default_branch VARCHAR(100) DEFAULT 'main',
    topics TEXT[],
    is_private BOOLEAN DEFAULT false,
    is_fork BOOLEAN DEFAULT false,
    is_archived BOOLEAN DEFAULT false,
    license_name VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    pushed_at TIMESTAMPTZ,
    -- Caching metadata
    cache_updated_at TIMESTAMPTZ DEFAULT NOW(),
    cache_expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '1 hour',
    -- Performance tracking
    fetch_duration_ms INTEGER,
    last_fetch_status VARCHAR(50) DEFAULT 'success'
);

-- Performance metrics table for system and application monitoring
CREATE TABLE performance_metrics (
    id UUID DEFAULT uuid_generate_v4(),
    metric_type VARCHAR(100) NOT NULL, -- 'cpu', 'memory', 'disk', 'network', 'response_time', 'throughput'
    metric_name VARCHAR(255) NOT NULL,
    metric_value DOUBLE PRECISION NOT NULL,
    metric_unit VARCHAR(50) NOT NULL, -- 'percent', 'bytes', 'ms', 'requests_per_second'
    tags JSONB DEFAULT '{}', -- Additional metadata as key-value pairs
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    -- Context information
    endpoint VARCHAR(255), -- For request-specific metrics
    user_agent TEXT,
    ip_address INET,
    session_id UUID,
    -- Performance context
    server_instance VARCHAR(100),
    environment VARCHAR(50) DEFAULT 'production',
    PRIMARY KEY (timestamp, id)
);

-- Fractal computations table for tracking generation performance and parameters
CREATE TABLE fractal_computations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fractal_type VARCHAR(50) NOT NULL, -- 'mandelbrot', 'julia'
    width INTEGER NOT NULL,
    height INTEGER NOT NULL,
    center_x DOUBLE PRECISION NOT NULL,
    center_y DOUBLE PRECISION NOT NULL,
    zoom_level DOUBLE PRECISION NOT NULL,
    max_iterations INTEGER NOT NULL,
    -- Julia set specific parameters
    julia_c_real DOUBLE PRECISION,
    julia_c_imag DOUBLE PRECISION,
    -- Performance metrics
    computation_time_ms INTEGER NOT NULL,
    memory_used_bytes BIGINT,
    cpu_cores_used INTEGER,
    cpu_usage_percent DOUBLE PRECISION,
    memory_usage_mb DOUBLE PRECISION,
    parallel_threads INTEGER,
    pixels_computed BIGINT GENERATED ALWAYS AS (width * height) STORED,
    pixels_per_ms DOUBLE PRECISION GENERATED ALWAYS AS (
        CASE WHEN computation_time_ms > 0
        THEN (width * height)::DOUBLE PRECISION / computation_time_ms
        ELSE 0 END
    ) STORED,
    -- Request context
    session_id UUID,
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    -- Quality and optimization tracking
    iteration_efficiency DOUBLE PRECISION, -- average iterations per pixel
    cache_hit BOOLEAN DEFAULT false,
    optimization_flags TEXT[]
);

-- System statistics table for hardware and runtime information
CREATE TABLE system_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    -- Hardware information
    cpu_model VARCHAR(255),
    cpu_cores INTEGER,
    cpu_threads INTEGER,
    memory_total_bytes BIGINT,
    memory_available_bytes BIGINT,
    disk_total_bytes BIGINT,
    disk_available_bytes BIGINT,
    -- Runtime information
    rust_version VARCHAR(50),
    server_uptime_seconds BIGINT,
    active_connections INTEGER,
    request_count_total BIGINT,
    error_count_total BIGINT,
    -- Load information
    load_average_1m DOUBLE PRECISION,
    load_average_5m DOUBLE PRECISION,
    load_average_15m DOUBLE PRECISION,
    -- Network statistics
    network_bytes_sent BIGINT DEFAULT 0,
    network_bytes_received BIGINT DEFAULT 0,
    -- Timestamp and metadata
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    server_instance VARCHAR(100),
    environment VARCHAR(50) DEFAULT 'production'
);

-- Benchmark results table for comparative performance analysis
CREATE TABLE benchmark_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    benchmark_type VARCHAR(100) NOT NULL, -- 'fractal_generation', 'api_response', 'database_query'
    benchmark_name VARCHAR(255) NOT NULL,
    parameters JSONB NOT NULL, -- Benchmark-specific parameters
    results JSONB NOT NULL, -- Detailed results and metrics
    duration_ms INTEGER NOT NULL,
    iterations INTEGER DEFAULT 1,
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    -- Comparison context
    baseline_duration_ms INTEGER, -- For regression detection
    performance_ratio DOUBLE PRECISION, -- current/baseline
    -- Environment context
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    server_instance VARCHAR(100),
    environment VARCHAR(50) DEFAULT 'production',
    rust_version VARCHAR(50),
    -- Hardware context at time of benchmark
    cpu_model VARCHAR(255),
    cpu_cores INTEGER,
    memory_total_bytes BIGINT
);

-- Cache entries table for intelligent caching with TTL and statistics
CREATE TABLE cache_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cache_key VARCHAR(512) NOT NULL UNIQUE,
    cache_value JSONB NOT NULL,
    content_type VARCHAR(100) DEFAULT 'json',
    size_bytes INTEGER GENERATED ALWAYS AS (octet_length(cache_value::text)) STORED,
    -- TTL and expiration
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
    access_count INTEGER DEFAULT 1,
    -- Cache performance
    hit_count INTEGER DEFAULT 0,
    miss_count INTEGER DEFAULT 0,
    generation_time_ms INTEGER,
    -- Metadata
    tags TEXT[],
    invalidation_keys TEXT[], -- Keys that can trigger cache invalidation
    compression_used VARCHAR(50) -- 'none', 'gzip', 'brotli'
);

-- Indexes for optimal query performance

-- Repository indexes for GitHub API caching
CREATE INDEX idx_repositories_github_id ON repositories(github_id);
CREATE INDEX idx_repositories_owner_login ON repositories(owner_login);
CREATE INDEX idx_repositories_language ON repositories(language) WHERE language IS NOT NULL;
CREATE INDEX idx_repositories_cache_expires ON repositories(cache_expires_at);
CREATE INDEX idx_repositories_updated_at ON repositories(updated_at DESC);
CREATE INDEX idx_repositories_stars ON repositories(stargazers_count DESC);
CREATE INDEX idx_repositories_topics ON repositories USING GIN(topics);
CREATE INDEX idx_repositories_search ON repositories USING GIN(to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- Performance metrics indexes for time-series analysis
CREATE INDEX idx_performance_metrics_timestamp ON performance_metrics(timestamp DESC);
CREATE INDEX idx_performance_metrics_type_name ON performance_metrics(metric_type, metric_name);
CREATE INDEX idx_performance_metrics_endpoint ON performance_metrics(endpoint) WHERE endpoint IS NOT NULL;
CREATE INDEX idx_performance_metrics_tags ON performance_metrics USING GIN(tags);
CREATE INDEX idx_performance_metrics_composite ON performance_metrics(metric_type, timestamp DESC, metric_value);

-- Fractal computation indexes for performance analysis
CREATE INDEX idx_fractal_computations_timestamp ON fractal_computations(timestamp DESC);
CREATE INDEX idx_fractal_computations_type ON fractal_computations(fractal_type);
CREATE INDEX idx_fractal_computations_performance ON fractal_computations(pixels_per_ms DESC);
CREATE INDEX idx_fractal_computations_zoom ON fractal_computations(zoom_level);
CREATE INDEX idx_fractal_computations_size ON fractal_computations(width, height);
CREATE INDEX idx_fractal_computations_session ON fractal_computations(session_id) WHERE session_id IS NOT NULL;

-- System stats indexes for monitoring
CREATE INDEX idx_system_stats_timestamp ON system_stats(timestamp DESC);
CREATE INDEX idx_system_stats_instance ON system_stats(server_instance, timestamp DESC);
CREATE INDEX idx_system_stats_environment ON system_stats(environment);

-- Benchmark results indexes for performance tracking
CREATE INDEX idx_benchmark_results_timestamp ON benchmark_results(timestamp DESC);
CREATE INDEX idx_benchmark_results_type_name ON benchmark_results(benchmark_type, benchmark_name);
CREATE INDEX idx_benchmark_results_performance ON benchmark_results(duration_ms);
CREATE INDEX idx_benchmark_results_regression ON benchmark_results(performance_ratio) WHERE performance_ratio IS NOT NULL;

-- Cache entries indexes for efficient cache operations
CREATE INDEX idx_cache_entries_key ON cache_entries(cache_key);
CREATE INDEX idx_cache_entries_expires ON cache_entries(expires_at);
CREATE INDEX idx_cache_entries_accessed ON cache_entries(last_accessed_at DESC);
CREATE INDEX idx_cache_entries_tags ON cache_entries USING GIN(tags);
CREATE INDEX idx_cache_entries_invalidation ON cache_entries USING GIN(invalidation_keys);

-- Partitioning for large tables (performance_metrics and fractal_computations)
-- I'm setting up monthly partitioning for better query performance on time-series data

-- Create partitioned table for performance metrics
CREATE TABLE performance_metrics_partitioned (
    LIKE performance_metrics INCLUDING ALL
) PARTITION BY RANGE (timestamp);

-- Create initial partitions (current month and next month)
CREATE TABLE performance_metrics_2024_01 PARTITION OF performance_metrics_partitioned
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
CREATE TABLE performance_metrics_2024_02 PARTITION OF performance_metrics_partitioned
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

-- Constraints and triggers for data integrity and automatic maintenance

-- Ensure cache entries don't expire in the past
ALTER TABLE cache_entries ADD CONSTRAINT chk_cache_not_expired
    CHECK (expires_at > created_at);

-- Ensure fractal parameters are valid
ALTER TABLE fractal_computations ADD CONSTRAINT chk_fractal_dimensions
    CHECK (width > 0 AND height > 0 AND width <= 8192 AND height <= 8192);
ALTER TABLE fractal_computations ADD CONSTRAINT chk_fractal_zoom
    CHECK (zoom_level > 0 AND zoom_level <= 1e15);
ALTER TABLE fractal_computations ADD CONSTRAINT chk_fractal_iterations
    CHECK (max_iterations > 0 AND max_iterations <= 10000);

-- Ensure performance metrics have valid values
ALTER TABLE performance_metrics ADD CONSTRAINT chk_performance_value
    CHECK (metric_value >= 0 OR metric_type IN ('temperature', 'coordinate'));

-- Functions for automatic maintenance and optimization

-- Function to clean up expired cache entries
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM cache_entries WHERE expires_at < NOW();
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to update repository cache status
CREATE OR REPLACE FUNCTION update_repository_cache_status()
RETURNS TRIGGER AS $$
BEGIN
    NEW.cache_updated_at = NOW();
    IF NEW.cache_expires_at IS NULL OR NEW.cache_expires_at <= NOW() THEN
        NEW.cache_expires_at = NOW() + INTERVAL '1 hour';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update cache timestamps
CREATE TRIGGER trg_repositories_cache_update
    BEFORE UPDATE ON repositories
    FOR EACH ROW
    EXECUTE FUNCTION update_repository_cache_status();

-- Views for common queries and analytics

-- View for repository statistics and rankings
CREATE VIEW repository_stats AS
SELECT
    full_name,
    language,
    stargazers_count,
    forks_count,
    open_issues_count,
    EXTRACT(DAYS FROM NOW() - updated_at) as days_since_update,
    CASE
        WHEN cache_expires_at > NOW() THEN 'fresh'
        ELSE 'stale'
    END as cache_status
FROM repositories
WHERE NOT is_archived
ORDER BY stargazers_count DESC;

-- View for performance metrics summary
CREATE VIEW performance_summary AS
SELECT
    metric_type,
    metric_name,
    COUNT(*) as measurement_count,
    AVG(metric_value) as avg_value,
    MIN(metric_value) as min_value,
    MAX(metric_value) as max_value,
    STDDEV(metric_value) as stddev_value,
    DATE_TRUNC('hour', timestamp) as hour_bucket
FROM performance_metrics
WHERE timestamp >= NOW() - INTERVAL '24 hours'
GROUP BY metric_type, metric_name, DATE_TRUNC('hour', timestamp)
ORDER BY hour_bucket DESC;

-- View for fractal performance analysis
CREATE VIEW fractal_performance_stats AS
SELECT
    fractal_type,
    width,
    height,
    COUNT(*) as computation_count,
    AVG(computation_time_ms) as avg_computation_time,
    AVG(pixels_per_ms) as avg_pixels_per_ms,
    MAX(pixels_per_ms) as max_pixels_per_ms,
    AVG(zoom_level) as avg_zoom_level,
    MAX(zoom_level) as max_zoom_level
FROM fractal_computations
WHERE timestamp >= NOW() - INTERVAL '7 days'
GROUP BY fractal_type, width, height
ORDER BY avg_pixels_per_ms DESC;

-- Initial data for testing and development
INSERT INTO system_stats (
    cpu_model, cpu_cores, cpu_threads, memory_total_bytes,
    rust_version, server_uptime_seconds, active_connections,
    server_instance, environment
) VALUES (
    'Development System', 8, 16, 16106127360,
    '1.75.0', 0, 0,
    'dev-001', 'development'
);

-- Create maintenance user and permissions
-- (This would typically be done separately in production)
-- COMMENT: I'm creating a maintenance role for automated cleanup tasks

COMMENT ON TABLE repositories IS 'GitHub repository cache with comprehensive metadata and performance tracking';
COMMENT ON TABLE performance_metrics IS 'Time-series performance metrics for system and application monitoring';
COMMENT ON TABLE fractal_computations IS 'Fractal generation logs with performance analysis and parameter tracking';
COMMENT ON TABLE system_stats IS 'System hardware and runtime statistics for performance baseline';
COMMENT ON TABLE benchmark_results IS 'Comparative performance benchmarks for regression analysis';
COMMENT ON TABLE cache_entries IS 'Intelligent caching layer with TTL and access statistics';

COMMENT ON FUNCTION cleanup_expired_cache() IS 'Maintenance function to remove expired cache entries and return cleanup count';
COMMENT ON VIEW repository_stats IS 'Repository analytics with cache status and activity metrics';
COMMENT ON VIEW performance_summary IS 'Hourly performance metrics aggregation for monitoring dashboards';
COMMENT ON VIEW fractal_performance_stats IS 'Fractal computation performance analysis for optimization tracking';
