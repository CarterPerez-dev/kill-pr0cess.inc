-- Fix nullable columns that should have NOT NULL with defaults
-- This migration ensures all columns match the Rust model expectations

-- Update repositories table to ensure columns are NOT NULL with defaults
ALTER TABLE repositories 
    ALTER COLUMN size_kb SET DEFAULT 0,
    ALTER COLUMN size_kb SET NOT NULL,
    ALTER COLUMN stargazers_count SET DEFAULT 0,
    ALTER COLUMN stargazers_count SET NOT NULL,
    ALTER COLUMN watchers_count SET DEFAULT 0,
    ALTER COLUMN watchers_count SET NOT NULL,
    ALTER COLUMN forks_count SET DEFAULT 0,
    ALTER COLUMN forks_count SET NOT NULL,
    ALTER COLUMN open_issues_count SET DEFAULT 0,
    ALTER COLUMN open_issues_count SET NOT NULL,
    ALTER COLUMN is_private SET DEFAULT false,
    ALTER COLUMN is_private SET NOT NULL,
    ALTER COLUMN is_fork SET DEFAULT false,
    ALTER COLUMN is_fork SET NOT NULL,
    ALTER COLUMN is_archived SET DEFAULT false,
    ALTER COLUMN is_archived SET NOT NULL,
    ALTER COLUMN cache_updated_at SET DEFAULT NOW(),
    ALTER COLUMN cache_updated_at SET NOT NULL,
    ALTER COLUMN cache_expires_at SET DEFAULT NOW() + INTERVAL '1 hour',
    ALTER COLUMN cache_expires_at SET NOT NULL;

-- Update any existing NULL values to defaults before applying constraints
UPDATE repositories SET 
    size_kb = COALESCE(size_kb, 0),
    stargazers_count = COALESCE(stargazers_count, 0),
    watchers_count = COALESCE(watchers_count, 0),
    forks_count = COALESCE(forks_count, 0),
    open_issues_count = COALESCE(open_issues_count, 0),
    is_private = COALESCE(is_private, false),
    is_fork = COALESCE(is_fork, false),
    is_archived = COALESCE(is_archived, false),
    cache_updated_at = COALESCE(cache_updated_at, NOW()),
    cache_expires_at = COALESCE(cache_expires_at, NOW() + INTERVAL '1 hour')
WHERE 
    size_kb IS NULL OR
    stargazers_count IS NULL OR
    watchers_count IS NULL OR
    forks_count IS NULL OR
    open_issues_count IS NULL OR
    is_private IS NULL OR
    is_fork IS NULL OR
    is_archived IS NULL OR
    cache_updated_at IS NULL OR
    cache_expires_at IS NULL;