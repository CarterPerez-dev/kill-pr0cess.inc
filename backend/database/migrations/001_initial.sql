-- Initial database schema for the performance showcase application.
-- I'm creating all necessary tables with proper constraints and indexes for optimal query performance.

-- Create repositories table for caching GitHub data
CREATE TABLE IF NOT EXISTS repositories (
    id SERIAL PRIMARY KEY,
    github_id BIGINT NOT NULL UNIQUE,
    owner VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    description TEXT,
    html_url VARCHAR(512) NOT NULL,
    clone_url VARCHAR(512),
    ssh_url VARCHAR(512),
    language VARCHAR(64),
    size_kb INTEGER DEFAULT 0,
    stargazers_count INTEGER DEFAULT 0,
    watchers_count INTEGER DEFAULT 0,
    forks_count INTEGER DEFAULT 0,
    open_issues_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    pushed_at TIMESTAMPTZ,
    is_private BOOLEAN DEFAULT false,
    is_fork BOOLEAN DEFAULT false,
    is_archived BOOLEAN DEFAULT false,
    topics TEXT[] DEFAULT '{}',
    license_name VARCHAR(255),
    readme_content TEXT,
    cached_at TIMESTAMPTZ DEFAULT NOW(),
    cache_expires_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT unique_owner_name UNIQUE (owner, name)
);

-- Create performance metrics table
CREATE TABLE IF NOT EXISTS performance_metrics (
    id SERIAL PRIMARY KEY,
    metric_type VARCHAR(64) NOT NULL,
    metric_value DOUBLE PRECISION NOT NULL,
    metric_unit VARCHAR(32) NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    endpoint VARCHAR(255),
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create fractal computations table
CREATE TABLE IF NOT EXISTS fractal_computations (
    id SERIAL PRIMARY KEY,
    fractal_type VARCHAR(32) NOT NULL,
    width INTEGER NOT NULL,
    height INTEGER NOT NULL,
    center_x DOUBLE PRECISION NOT NULL,
    center_y DOUBLE PRECISION NOT NULL,
    zoom_level DOUBLE PRECISION NOT NULL,
    max_iterations INTEGER NOT NULL,
    computation_time_ms INTEGER NOT NULL,
    pixels_computed INTEGER NOT NULL,
    cpu_usage_percent DOUBLE PRECISION,
    memory_usage_mb DOUBLE PRECISION,
    parameters JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_repositories_owner ON repositories(owner);
CREATE INDEX idx_repositories_language ON repositories(language);
CREATE INDEX idx_repositories_cached_at ON repositories(cached_at);
CREATE INDEX idx_performance_metrics_type ON performance_metrics(metric_type);
CREATE INDEX idx_performance_metrics_timestamp ON performance_metrics(timestamp);
CREATE INDEX idx_fractal_computations_type ON fractal_computations(fractal_type);
CREATE INDEX idx_fractal_computations_created_at ON fractal_computations(created_at);
