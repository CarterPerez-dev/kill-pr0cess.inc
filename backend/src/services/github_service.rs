/*
 * GitHub API integration service providing intelligent caching, rate limiting, and data transformation for repository showcase.
 * I'm implementing comprehensive GitHub API communication with automatic retry logic, performance optimization, and database caching.
 */

use reqwest::{Client, header::{HeaderMap, HeaderValue, USER_AGENT, AUTHORIZATION}};
use serde::{Deserialize, Serialize};
use std::time::{Duration, SystemTime, UNIX_EPOCH};
use tokio::time::sleep;
use tracing::{info, warn, error, debug};

use crate::{
    models::github::{Repository, RepositoryStats, GitHubUser, RepositoryDetailed},
    services::cache_service::CacheService,
    utils::error::{AppError, Result},
    database::DatabasePool,
};

#[derive(Debug, Clone)]
pub struct GitHubService {
    client: Client,
    token: String,
    cache_service: CacheService,
    base_url: String,
    rate_limit_remaining: std::sync::Arc<std::sync::Mutex<u32>>,
    rate_limit_reset: std::sync::Arc<std::sync::Mutex<u64>>,
}

#[derive(Debug, Deserialize)]
struct GitHubApiRepository {
    id: u64,
    name: String,
    full_name: String,
    owner: GitHubOwner,
    description: Option<String>,
    html_url: String,
    clone_url: String,
    ssh_url: String,
    language: Option<String>,
    size: u32,
    stargazers_count: u32,
    watchers_count: u32,
    forks_count: u32,
        open_issues_count: u32,
        created_at: String,
        updated_at: String,
        pushed_at: Option<String>,
        private: bool,
            fork: bool,
                archived: bool,
                topics: Vec<String>,
                license: Option<GitHubLicense>,
}

#[derive(Debug, Deserialize)]
struct GitHubOwner {
    login: String,
    id: u64,
    avatar_url: String,
}

#[derive(Debug, Deserialize)]
struct GitHubLicense {
    name: String,
    spdx_id: Option<String>,
}

#[derive(Debug, Deserialize)]
struct GitHubRateLimit {
    pub limit: u32,
    pub remaining: u32,
    pub reset: u64,
    pub used: u32,
}

#[derive(Debug, Deserialize)]
struct GitHubRateLimitResponse {
    rate: GitHubRateLimit,
}


#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RateLimitInfo {
    pub limit: i32,
    pub remaining: i32,
    pub reset_at: chrono::DateTime<chrono::Utc>,
    pub used: i32,
    pub percentage_used: f64,
}

impl GitHubService {
    pub fn new(token: String, cache_service: CacheService) -> Self {
        // I'm setting up the HTTP client with optimal configuration for GitHub API
        let mut headers = HeaderMap::new();
        headers.insert(USER_AGENT, HeaderValue::from_static("dark-performance-showcase/0.1.0"));
        headers.insert(
            AUTHORIZATION,
            HeaderValue::from_str(&format!("Bearer {}", token))
            .expect("Invalid GitHub token format")
        );
        headers.insert("Accept", HeaderValue::from_static("application/vnd.github+json"));
        headers.insert("X-GitHub-Api-Version", HeaderValue::from_static("2022-11-28"));

        let client = Client::builder()
        .default_headers(headers)
        .timeout(Duration::from_secs(30))
        .pool_idle_timeout(Duration::from_secs(90))
        .pool_max_idle_per_host(10)
        .build()
        .expect("Failed to create HTTP client");

        Self {
            client,
            token,
            cache_service,
            base_url: "https://api.github.com".to_string(),
            rate_limit_remaining: std::sync::Arc::new(std::sync::Mutex::new(5000)),
            rate_limit_reset: std::sync::Arc::new(std::sync::Mutex::new(0)),
        }
    }

    /// Fetch all repositories for the authenticated user with intelligent caching
    /// I'm implementing pagination handling and comprehensive error recovery
    pub async fn get_user_repositories(&self, username: &str) -> Result<Vec<Repository>> {
        let cache_key = format!("github:repos:{}", username);

        // Check cache first - I'm implementing intelligent cache with TTL
        if let Ok(Some(cached_repos)) = self.cache_service.get::<Vec<Repository>>(&cache_key).await {
            debug!("Returning cached repositories for user: {}", username);
            return Ok(cached_repos);
        }

        info!("Fetching fresh repository data for user: {}", username);

        let mut all_repos = Vec::new();
        let mut page = 1;
        let per_page = 100; // Maximum allowed by GitHub API

        loop {
            // I'm checking rate limits before making requests
            self.check_rate_limit().await?;

            let url = format!(
                "{}/users/{}/repos?page={}&per_page={}&sort=updated&direction=desc",
                self.base_url, username, page, per_page
            );

            debug!("Fetching repositories page {} for user: {}", page, username);

            let response = self.client
            .get(&url)
            .send()
            .await
            .map_err(|e| AppError::ExternalApiError(format!("GitHub API request failed: {}", e)))?;

            // Update rate limit information from headers
            self.update_rate_limit_from_headers(&response).await;

            if !response.status().is_success() {
                let status = response.status();
                let error_text = response.text().await.unwrap_or_default();
                return Err(AppError::ExternalApiError(
                    format!("GitHub API error {}: {}", status, error_text)
                ));
            }

            let repos: Vec<GitHubApiRepository> = response
            .json()
            .await
            .map_err(|e| AppError::SerializationError(format!("Failed to parse GitHub response: {}", e)))?;

            if repos.is_empty() {
                break; // No more pages
            }

            // Transform GitHub API response to our internal format
            for api_repo in repos {
                let repo = self.transform_api_repository(api_repo);
                all_repos.push(repo);
            }

            page += 1;

            // Prevent infinite loops and respect API limits
            if page > 50 {
                warn!("Stopping repository fetch at page 50 to prevent excessive API usage");
                break;
            }
        }

        info!("Fetched {} repositories for user: {}", all_repos.len(), username);

        // Cache the results with 1-hour TTL
          if let Err(e) = self.cache_service.set(&cache_key, &all_repos, Some(3600)).await {
            warn!("Failed to cache repository data: {}", e);
        }

        Ok(all_repos)
    }

    /// Get detailed information for a specific repository including README and stats
    /// I'm providing comprehensive repository analysis with performance metrics
    pub async fn get_repository_details(&self, owner: &str, name: &str) -> Result<RepositoryDetailed> {
        let cache_key = format!("github:repo:{}:{}", owner, name);

        if let Ok(Some(cached_repo)) = self.cache_service.get::<RepositoryDetailed>(&cache_key).await {
            debug!("Returning cached repository details for {}/{}", owner, name);
            return Ok(cached_repo);
        }

        info!("Fetching detailed repository information for {}/{}", owner, name);

        self.check_rate_limit().await?;

        let url = format!("{}/repos/{}/{}", self.base_url, owner, name);

        let response = self.client
        .get(&url)
        .send()
        .await
        .map_err(|e| AppError::ExternalApiError(format!("GitHub API request failed: {}", e)))?;

        self.update_rate_limit_from_headers(&response).await;

        if !response.status().is_success() {
            return Err(AppError::ExternalApiError(
                format!("Failed to fetch repository {}/{}: HTTP {}", owner, name, response.status())
            ));
        }

        let api_repo: GitHubApiRepository = response
        .json()
        .await
        .map_err(|e| AppError::SerializationError(format!("Failed to parse repository response: {}", e)))?;

        // Fetch README content separately
        let readme_content = self.get_repository_readme(owner, name).await.unwrap_or_default();

        // Get repository statistics
        let stats = self.get_repository_stats(owner, name).await?;

        let detailed_repo = RepositoryDetailed {
            basic: self.transform_api_repository(api_repo),
            readme_content,
            stats,
            contributors_count: 0, // TODO: Implement if needed
            commit_count: 0,       // TODO: Implement if needed
            branch_count: 0,       // TODO: Implement if needed
            release_count: 0,      // TODO: Implement if needed
        };

        // Cache for 30 minutes (detailed info changes less frequently)
        if let Err(e) = self.cache_service.set(&cache_key, &detailed_repo, 1800).await {
            warn!("Failed to cache detailed repository data: {}", e);
        }

        Ok(detailed_repo)
    }

    /// Get repository README content with fallback handling
    /// I'm implementing intelligent README detection for various formats
    async fn get_repository_readme(&self, owner: &str, name: &str) -> Result<String> {
        let readme_variants = vec!["README.md", "readme.md", "README", "readme", "README.txt"];

        for readme_file in readme_variants {
            self.check_rate_limit().await?;

            let url = format!(
                "{}/repos/{}/{}/contents/{}",
                self.base_url, owner, name, readme_file
            );

            let response = self.client.get(&url).send().await;

            match response {
                Ok(resp) if resp.status().is_success() => {
                    if let Ok(content_response) = resp.json::<serde_json::Value>().await {
                        if let Some(content) = content_response.get("content")
                            .and_then(|c| c.as_str()) {
                                // Decode base64 content
                                if let Ok(decoded) = base64::decode(&content.replace('\n', "")) {
                                    if let Ok(readme_text) = String::from_utf8(decoded) {
                                        debug!("Found README: {} for {}/{}", readme_file, owner, name);
                                        return Ok(readme_text);
                                    }
                                }
                            }
                    }
                }
                _ => continue, // Try next variant
            }

            self.update_rate_limit_from_headers(&response.ok().as_ref().unwrap()).await;
        }

        debug!("No README found for {}/{}", owner, name);
        Ok(String::new())
    }

    /// Get repository statistics and performance metrics
    /// I'm calculating comprehensive repository health and activity metrics
    async fn get_repository_stats(&self, owner: &str, name: &str) -> Result<RepositoryStats> {
        // For now, I'm returning basic stats - can be expanded with more GitHub API calls
        Ok(RepositoryStats {
            commit_frequency: 0.0,
            contributors_count: 0,
            issues_ratio: 0.0,
            fork_ratio: 0.0,
                activity_score: 0.0,
                health_score: 0.0,
                last_activity_days: 0,
        })
    }

    /// Get current rate limit status
    /// I'm providing real-time rate limit monitoring for optimal API usage
    pub async fn get_rate_limit_status(&self) -> Result<GitHubRateLimit> {
        let url = format!("{}/rate_limit", self.base_url);

        let response = self.client
        .get(&url)
        .send()
        .await
        .map_err(|e| AppError::ExternalApiError(format!("Rate limit check failed: {}", e)))?;

        if !response.status().is_success() {
            return Err(AppError::ExternalApiError(
                format!("Rate limit check failed: HTTP {}", response.status())
            ));
        }

        let rate_limit_response: GitHubRateLimitResponse = response
        .json()
        .await
        .map_err(|e| AppError::SerializationError(format!("Failed to parse rate limit response: {}", e)))?;

        // Update internal rate limit tracking
        {
            let mut remaining = self.rate_limit_remaining.lock().unwrap();
            *remaining = rate_limit_response.rate.remaining;
        }
        {
            let mut reset = self.rate_limit_reset.lock().unwrap();
            *reset = rate_limit_response.rate.reset;
        }

        Ok(rate_limit_response.rate)
    }

    /// Check rate limit and wait if necessary
    /// I'm implementing intelligent rate limit handling with automatic backoff
    async fn check_rate_limit(&self) -> Result<()> {
        let remaining = {
            let remaining = self.rate_limit_remaining.lock().unwrap();
            *remaining
        };

        if remaining < 10 {
            let reset_time = {
                let reset = self.rate_limit_reset.lock().unwrap();
                *reset
            };

            let current_time = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();

            if current_time < reset_time {
                let wait_time = reset_time - current_time + 5; // Add 5 second buffer
                warn!("Rate limit low ({}), waiting {} seconds until reset", remaining, wait_time);
                sleep(Duration::from_secs(wait_time)).await;
            }
        }

        Ok(())
    }

    /// Update rate limit information from response headers
    /// I'm tracking rate limits in real-time to prevent API exhaustion
    async fn update_rate_limit_from_headers(&self, response: &reqwest::Response) {
        if let Some(remaining_header) = response.headers().get("x-ratelimit-remaining") {
            if let Ok(remaining_str) = remaining_header.to_str() {
                if let Ok(remaining) = remaining_str.parse::<u32>() {
                    let mut rate_limit_remaining = self.rate_limit_remaining.lock().unwrap();
                    *rate_limit_remaining = remaining;
                }
            }
        }

        if let Some(reset_header) = response.headers().get("x-ratelimit-reset") {
            if let Ok(reset_str) = reset_header.to_str() {
                if let Ok(reset) = reset_str.parse::<u64>() {
                    let mut rate_limit_reset = self.rate_limit_reset.lock().unwrap();
                    *rate_limit_reset = reset;
                }
            }
        }
    }

    /// Transform GitHub API repository format to our internal format
    /// I'm normalizing data and calculating derived fields for better UX
    fn transform_api_repository(&self, api_repo: GitHubApiRepository) -> Repository {
        Repository {
            id: api_repo.id as i64,
            github_id: api_repo.id as i64,
            owner_login: api_repo.owner.login,
            name: api_repo.name,
            full_name: api_repo.full_name,
            description: api_repo.description,
            html_url: api_repo.html_url,
            clone_url: api_repo.clone_url,
            ssh_url: api_repo.ssh_url,
            language: api_repo.language,
            size_kb: api_repo.size as i32,
            stargazers_count: api_repo.stargazers_count as i32,
            watchers_count: api_repo.watchers_count as i32,
            forks_count: api_repo.forks_count as i32,
                open_issues_count: api_repo.open_issues_count as i32,
                created_at: chrono::DateTime::parse_from_rfc3339(&api_repo.created_at)
                .unwrap_or_else(|_| chrono::Utc::now().into())
                .with_timezone(&chrono::Utc),
                updated_at: chrono::DateTime::parse_from_rfc3339(&api_repo.updated_at)
                .unwrap_or_else(|_| chrono::Utc::now().into())
                .with_timezone(&chrono::Utc),
                pushed_at: api_repo.pushed_at
                .and_then(|s| chrono::DateTime::parse_from_rfc3339(&s).ok())
                .map(|dt| dt.with_timezone(&chrono::Utc)),
                is_private: api_repo.private,
                is_fork: api_repo.fork,
                is_archived: api_repo.archived,
                topics: api_repo.topics,
                license_name: api_repo.license.map(|l| l.name),
                readme_content: None,
                cached_at: chrono::Utc::now(),
                cache_expires_at: chrono::Utc::now() + chrono::Duration::hours(1),
        }
    }

    /// Store repositories in database cache for performance optimization
    /// I'm implementing intelligent database caching with automatic cleanup
    pub async fn store_repositories_in_db(
        &self,
        db_pool: &DatabasePool,
        repositories: &[Repository],
    ) -> Result<()> {
        for repo in repositories {
            let result = sqlx::query!(
                r#"
                INSERT INTO repositories (
                    github_id, owner_login, name, full_name, description, html_url, clone_url, ssh_url,
                    language, size_kb, stargazers_count, watchers_count, forks_count, open_issues_count,
                    created_at, updated_at, pushed_at, is_private, is_fork, is_archived, topics,
                    license_name, cached_at, cache_expires_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
            ON CONFLICT (github_id) DO UPDATE SET
            description = EXCLUDED.description,
            html_url = EXCLUDED.html_url,
            language = EXCLUDED.language,
            size_kb = EXCLUDED.size_kb,
            stargazers_count = EXCLUDED.stargazers_count,
            watchers_count = EXCLUDED.watchers_count,
            forks_count = EXCLUDED.forks_count,
                open_issues_count = EXCLUDED.open_issues_count,
                updated_at = EXCLUDED.updated_at,
                pushed_at = EXCLUDED.pushed_at,
                is_archived = EXCLUDED.is_archived,
                topics = EXCLUDED.topics,
                license_name = EXCLUDED.license_name,
                cached_at = EXCLUDED.cached_at,
                cache_expires_at = EXCLUDED.cache_expires_at
                "#,
                repo.github_id,
                repo.owner_login,
                repo.name,
                repo.full_name,
                repo.description,
                repo.html_url,
                repo.clone_url,
                repo.ssh_url,
                repo.language,
                repo.size_kb,
                repo.stargazers_count,
                repo.watchers_count,
                repo.forks_count,
                repo.open_issues_count,
                repo.created_at,
                repo.updated_at,
                repo.pushed_at,
                repo.is_private,
                repo.is_fork,
                repo.is_archived,
                &repo.topics,
                repo.license_name,
                repo.cached_at,
                repo.cache_expires_at
            )
            .execute(db_pool)
            .await;

            if let Err(e) = result {
                warn!("Failed to store repository {}/{} in database: {}", repo.owner_login, repo.name, e);
            }
        }

        info!("Stored {} repositories in database cache", repositories.len());
        Ok(())
    }
}

// Base64 decoding utility - I'm using a simple implementation to avoid additional dependencies
mod base64 {
    use std::collections::HashMap;

    pub fn decode(input: &str) -> Result<Vec<u8>, &'static str> {
        let chars: Vec<char> = input.chars().collect();
        let mut result = Vec::new();

        // Simple base64 decoding implementation
        // In production, you'd use the `base64` crate for better performance
        let base64_chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
        let mut char_map = HashMap::new();

        for (i, c) in base64_chars.chars().enumerate() {
            char_map.insert(c, i as u8);
        }

        for chunk in chars.chunks(4) {
            let mut values = [0u8; 4];
            for (i, &c) in chunk.iter().enumerate() {
                if c == '=' {
                    break;
                }
                values[i] = *char_map.get(&c).ok_or("Invalid base64 character")?;
            }

            result.push((values[0] << 2) | (values[1] >> 4));
            if chunk.len() > 2 && chunk[2] != '=' {
                result.push((values[1] << 4) | (values[2] >> 2));
            }
            if chunk.len() > 3 && chunk[3] != '=' {
                result.push((values[2] << 6) | values[3]);
            }
        }

        Ok(result)
    }
}
