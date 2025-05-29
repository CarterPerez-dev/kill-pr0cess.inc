/*
 * GitHub data models with comprehensive serialization, validation, and database integration for repository showcase.
 * I'm defining robust data structures that handle GitHub API responses and provide clean interfaces for frontend consumption.
 */

use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use chrono::{DateTime, Utc};

/// Core repository model representing GitHub repository data with caching metadata
/// I'm including all essential fields for showcase purposes plus performance tracking
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Repository {
    pub id: i64,
    pub github_id: i64,
    pub owner_login: String,
    pub name: String,
    pub full_name: String,
    pub description: Option<String>,
    pub html_url: String,
    pub clone_url: String,
    pub ssh_url: String,
    pub language: Option<String>,
    pub size_kb: i32,
    pub stargazers_count: i32,
    pub watchers_count: i32,
    pub forks_count: i32,
    pub open_issues_count: i32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub pushed_at: Option<DateTime<Utc>>,
    pub is_private: bool,
    pub is_fork: bool,
    pub is_archived: bool,
    pub topics: Vec<String>,
    pub license_name: Option<String>,
    pub readme_content: Option<String>,
    pub cache_updated_at: DateTime<Utc>,
    pub cache_expires_at: DateTime<Utc>,
}

/// Extended repository model with detailed analytics and performance metrics
/// I'm providing comprehensive repository analysis for the showcase
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RepositoryDetailed {
    #[serde(flatten)]
    pub basic: Repository,
    pub readme_content: String,
    pub stats: RepositoryStats,
    pub contributors_count: i32,
    pub commit_count: i32,
    pub branch_count: i32,
    pub release_count: i32,
}

/// Repository statistics and health metrics for performance analysis
/// I'm calculating meaningful metrics that showcase repository activity and quality
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RepositoryStats {
    pub commit_frequency: f64,        // Commits per week average
    pub contributors_count: i32,      // Number of unique contributors
    pub issues_ratio: f64,           // Open issues / total issues
    pub fork_ratio: f64,             // Forks / stars ratio
    pub activity_score: f64,         // Overall activity score (0-100)
    pub health_score: f64,           // Repository health score (0-100)
    pub last_activity_days: i32,     // Days since last activity
}

/// GitHub user model for owner information and contributor data
/// I'm including essential user data for repository context
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct GitHubUser {
    pub id: i64,
    pub login: String,
    pub name: Option<String>,
    pub email: Option<String>,
    pub avatar_url: String,
    pub html_url: String,
    pub bio: Option<String>,
    pub location: Option<String>,
    pub company: Option<String>,
    pub blog: Option<String>,
    pub twitter_username: Option<String>,
    pub public_repos: i32,
    pub public_gists: i32,
    pub followers: i32,
    pub following: i32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Repository language statistics for technology showcase
/// I'm tracking language usage across repositories for analytics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LanguageStats {
    pub language: String,
    pub byte_count: i64,
    pub percentage: f64,
    pub repository_count: i32,
}

/// Repository filtering and search criteria for API endpoints
/// I'm providing flexible filtering options for repository discovery
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RepositoryFilter {
    pub language: Option<String>,
    pub min_stars: Option<i32>,
    pub max_stars: Option<i32>,
    pub min_size_kb: Option<i32>,
    pub max_size_kb: Option<i32>,
    pub is_fork: Option<bool>,
    pub is_archived: Option<bool>,
    pub has_topics: Option<bool>,
    pub has_license: Option<bool>,
    pub created_after: Option<DateTime<Utc>>,
    pub created_before: Option<DateTime<Utc>>,
    pub updated_after: Option<DateTime<Utc>>,
    pub updated_before: Option<DateTime<Utc>>,
    pub search_query: Option<String>,
}

/// Repository sorting options for organized display
/// I'm providing multiple sorting strategies for different use cases
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum RepositorySort {
    Name,
    Stars,
    Forks,
    Updated,
    Created,
    Size,
    Issues,
    ActivityScore,
}

/// Repository collection response with pagination and metadata
/// I'm providing comprehensive response structure for API endpoints
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RepositoryCollection {
    pub repositories: Vec<Repository>,
    pub total_count: i32,
    pub page: i32,
    pub per_page: i32,
    pub total_pages: i32,
    pub has_next_page: bool,
    pub has_previous_page: bool,
    pub language_distribution: Vec<LanguageStats>,
    pub statistics: CollectionStats,
}

/// Aggregate statistics for repository collections
/// I'm calculating meaningful metrics across repository sets
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CollectionStats {
    pub total_stars: i32,
    pub total_forks: i32,
    pub total_size_kb: i64,
    pub average_stars: f64,
    pub most_starred_repo: String,
    pub newest_repo: String,
    pub most_active_repo: String,
    pub language_count: i32,
    pub topics_count: i32,
    pub archived_count: i32,
    pub fork_count: i32,
}

/// GitHub API rate limit information for monitoring and optimization
/// I'm tracking rate limits to prevent API exhaustion
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RateLimitInfo {
    pub limit: i32,
    pub remaining: i32,
    pub reset_at: DateTime<Utc>,
    pub used: i32,
    pub percentage_used: f64,
}

/// Repository contribution data for activity analysis
/// I'm tracking contribution patterns for showcase purposes
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContributionData {
    pub author: GitHubUser,
    pub commit_count: i32,
    pub additions: i32,
    pub deletions: i32,
    pub changed_files: i32,
    pub first_contribution: DateTime<Utc>,
    pub last_contribution: DateTime<Utc>,
}

/// Repository release information for version tracking
/// I'm including release data for project maturity indicators
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RepositoryRelease {
    pub id: i64,
    pub tag_name: String,
    pub name: Option<String>,
    pub body: Option<String>,
    pub draft: bool,
    pub prerelease: bool,
    pub created_at: DateTime<Utc>,
    pub published_at: Option<DateTime<Utc>>,
    pub author: GitHubUser,
    pub assets_count: i32,
    pub download_count: i32,
}

impl Repository {
    /// Calculate repository activity score based on various metrics
    /// I'm implementing a comprehensive scoring algorithm for repository health
    pub fn calculate_activity_score(&self) -> f64 {
        let mut score = 0.0;

        // Stars contribute to score (logarithmic scale to prevent skewing)
        if self.stargazers_count > 0 {
            score += (self.stargazers_count as f64).ln() * 10.0;
        }

        // Recent activity bonus
        if let Some(pushed_at) = self.pushed_at {
            let days_since_push = (Utc::now() - pushed_at).num_days();
            if days_since_push < 30 {
                score += 20.0;
            } else if days_since_push < 90 {
                score += 10.0;
            }
        }

        // Fork ratio (indicates usefulness)
        if self.stargazers_count > 0 {
            let fork_ratio = self.forks_count as f64 / self.stargazers_count as f64;
            score += fork_ratio * 15.0;
        }

        // Issue management (lower open issues ratio is better)
        if self.open_issues_count > 0 {
            score -= (self.open_issues_count as f64).ln() * 2.0;
        }

        // Documentation (has description and topics)
        if self.description.is_some() {
            score += 5.0;
        }
        if !self.topics.is_empty() {
            score += self.topics.len() as f64 * 2.0;
        }

        // License indicates maturity
        if self.license_name.is_some() {
            score += 5.0;
        }

        // Penalize archived repositories
        if self.is_archived {
            score *= 0.5;
        }

        // Normalize to 0-100 scale
        score.max(0.0).min(100.0)
    }

    /// Check if repository cache is still valid
    /// I'm implementing intelligent cache validation for performance optimization
    pub fn is_cache_valid(&self) -> bool {
        Utc::now() < self.cache_expires_at
    }

    /// Get repository age in days
    /// I'm calculating repository maturity for analysis
    pub fn age_in_days(&self) -> i64 {
        (Utc::now() - self.created_at).num_days()
    }

    /// Get days since last update
    /// I'm tracking repository freshness for activity analysis
    pub fn days_since_update(&self) -> i64 {
        (Utc::now() - self.updated_at).num_days()
    }

    /// Generate repository summary for display
    /// I'm creating concise summaries for UI components
    pub fn generate_summary(&self) -> String {
        let mut summary_parts = Vec::new();

        if let Some(ref language) = self.language {
            summary_parts.push(language.clone());
        }

        if self.stargazers_count > 0 {
            summary_parts.push(format!("⭐ {}", self.stargazers_count));
        }

        if self.forks_count > 0 {
            summary_parts.push(format!("🍴 {}", self.forks_count));
        }

        if self.size_kb > 0 {
            let size_mb = self.size_kb as f64 / 1024.0;
            if size_mb >= 1.0 {
                summary_parts.push(format!("{:.1} MB", size_mb));
            } else {
                summary_parts.push(format!("{} KB", self.size_kb));
            }
        }

        summary_parts.join(" • ")
    }
}

impl RepositoryFilter {
    /// Create a new empty filter
    /// I'm providing a convenient constructor for filter initialization
    pub fn new() -> Self {
        Self {
            language: None,
            min_stars: None,
            max_stars: None,
            min_size_kb: None,
            max_size_kb: None,
            is_fork: None,
            is_archived: None,
            has_topics: None,
            has_license: None,
            created_after: None,
            created_before: None,
            updated_after: None,
            updated_before: None,
            search_query: None,
        }
    }

    /// Apply filter to a repository collection
    /// I'm implementing client-side filtering for improved performance
    pub fn apply(&self, repositories: Vec<Repository>) -> Vec<Repository> {
        repositories
        .into_iter()
        .filter(|repo| self.matches(repo))
        .collect()
    }

    /// Check if a repository matches the filter criteria
    /// I'm implementing comprehensive filtering logic
    fn matches(&self, repo: &Repository) -> bool {
        if let Some(ref lang) = self.language {
            if repo.language.as_ref() != Some(lang) {
                return false;
            }
        }

        if let Some(min_stars) = self.min_stars {
            if repo.stargazers_count < min_stars {
                return false;
            }
        }

        if let Some(max_stars) = self.max_stars {
            if repo.stargazers_count > max_stars {
                return false;
            }
        }

        if let Some(min_size) = self.min_size_kb {
            if repo.size_kb < min_size {
                return false;
            }
        }

        if let Some(max_size) = self.max_size_kb {
            if repo.size_kb > max_size {
                return false;
            }
        }

        if let Some(is_fork) = self.is_fork {
            if repo.is_fork != is_fork {
                return false;
            }
        }

        if let Some(is_archived) = self.is_archived {
            if repo.is_archived != is_archived {
                return false;
            }
        }

        if let Some(has_topics) = self.has_topics {
            if repo.topics.is_empty() == has_topics {
                return false;
            }
        }

        if let Some(has_license) = self.has_license {
            if repo.license_name.is_some() != has_license {
                return false;
            }
        }

        if let Some(created_after) = self.created_after {
            if repo.created_at < created_after {
                return false;
            }
        }

        if let Some(created_before) = self.created_before {
            if repo.created_at > created_before {
                return false;
            }
        }

        if let Some(updated_after) = self.updated_after {
            if repo.updated_at < updated_after {
                return false;
            }
        }

        if let Some(updated_before) = self.updated_before {
            if repo.updated_at > updated_before {
                return false;
            }
        }

        if let Some(ref query) = self.search_query {
            let search_text = format!(
                "{} {} {}",
                repo.name,
                repo.description.as_deref().unwrap_or(""),
                                      repo.topics.join(" ")
            ).to_lowercase();

            if !search_text.contains(&query.to_lowercase()) {
                return false;
            }
        }

        true
    }
}

impl Default for RepositoryFilter {
    fn default() -> Self {
        Self::new()
    }
}

/// Helper function to calculate collection statistics
/// I'm providing aggregate analytics for repository collections
pub fn calculate_collection_stats(repositories: &[Repository]) -> CollectionStats {
    if repositories.is_empty() {
        return CollectionStats {
            total_stars: 0,
            total_forks: 0,
            total_size_kb: 0,
            average_stars: 0.0,
            most_starred_repo: String::new(),
            newest_repo: String::new(),
            most_active_repo: String::new(),
            language_count: 0,
            topics_count: 0,
            archived_count: 0,
            fork_count: 0,
        };
    }

    let total_stars: i32 = repositories.iter().map(|r| r.stargazers_count).sum();
    let total_forks: i32 = repositories.iter().map(|r| r.forks_count).sum();
    let total_size_kb: i64 = repositories.iter().map(|r| r.size_kb as i64).sum();
    let average_stars = total_stars as f64 / repositories.len() as f64;

    let most_starred_repo = repositories
    .iter()
    .max_by_key(|r| r.stargazers_count)
    .map(|r| r.full_name.clone())
    .unwrap_or_default();

    let newest_repo = repositories
    .iter()
    .max_by_key(|r| r.created_at)
    .map(|r| r.full_name.clone())
    .unwrap_or_default();

    let most_active_repo = repositories
    .iter()
    .max_by_key(|r| r.calculate_activity_score() as i64)
    .map(|r| r.full_name.clone())
    .unwrap_or_default();

    let languages: std::collections::HashSet<String> = repositories
    .iter()
    .filter_map(|r| r.language.as_ref())
    .cloned()
    .collect();

    let all_topics: std::collections::HashSet<String> = repositories
    .iter()
    .flat_map(|r| r.topics.iter())
    .cloned()
    .collect();

    let archived_count = repositories.iter().filter(|r| r.is_archived).count() as i32;
    let fork_count = repositories.iter().filter(|r| r.is_fork).count() as i32;

    CollectionStats {
        total_stars,
        total_forks,
        total_size_kb,
        average_stars,
        most_starred_repo,
        newest_repo,
        most_active_repo,
        language_count: languages.len() as i32,
        topics_count: all_topics.len() as i32,
        archived_count,
        fork_count,
    }
}
