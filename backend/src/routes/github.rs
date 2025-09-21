/*
 * ©AngelaMos | 2025
 */

use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    Json,
    response::Json as JsonResponse,
};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tracing::{info, warn, error, debug};
use uuid::Uuid;

use crate::{
    models::github::{
        Repository, RepositoryDetailed, RepositoryCollection, RepositoryFilter,
        RepositorySort, CollectionStats, RateLimitInfo, calculate_collection_stats
    },
    utils::error::{AppError, Result},
    AppState,
};

#[derive(Debug, Deserialize)]
pub struct RepositoryQuery {
    pub page: Option<i32>,
    pub per_page: Option<i32>,
    pub sort: Option<String>,
    pub direction: Option<String>,
    pub language: Option<String>,
    pub min_stars: Option<i32>,
    pub max_stars: Option<i32>,
    pub is_fork: Option<bool>,
    pub is_archived: Option<bool>,
    pub search: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct RepositoryResponse {
    pub repositories: Vec<Repository>,
    pub pagination: PaginationInfo,
    pub statistics: CollectionStats,
    pub rate_limit: RateLimitInfo,
    pub cache_info: CacheInfo,
}

#[derive(Debug, Serialize)]
pub struct PaginationInfo {
    pub current_page: i32,
    pub per_page: i32,
    pub total_pages: i32,
    pub total_count: i32,
    pub has_next_page: bool,
    pub has_previous_page: bool,
}

#[derive(Debug, Serialize)]
pub struct CacheInfo {
    pub cached: bool,
    pub cache_age_seconds: i64,
    pub expires_in_seconds: i64,
}

/// Get paginated list of repositories with comprehensive filtering and sorting
/// I'm providing a full-featured repository listing endpoint with performance optimization
pub async fn get_repositories(
    State(app_state): State<AppState>,
    Query(params): Query<RepositoryQuery>,
) -> Result<JsonResponse<RepositoryResponse>> {
    info!("Fetching repositories with params: {:?}", params);

    // I'm setting sensible defaults for pagination and validation
    let page = params.page.unwrap_or(1).max(1);
    let per_page = params.per_page.unwrap_or(20).clamp(1, 100);
    let offset = (page - 1) * per_page;

    // Get GitHub username from config
    let username = &app_state.config.github_username;

    // Try to get fresh repositories from GitHub API
    let repositories = match app_state.github_service.get_user_repositories(username).await {
        Ok(repos) => {
            // Store in database for caching
            if let Err(e) = app_state.github_service.store_repositories_in_db(&app_state.db_pool, &repos).await {
                warn!("Failed to store repositories in database: {}", e);
            }
            repos
        }
        Err(e) => {
            warn!("GitHub API failed, falling back to database cache: {}", e);
            // Fallback to database cache
            get_repositories_from_db(&app_state, username).await?
        }
    };

    // Apply filtering
    let filter = create_filter_from_params(&params);
    let filtered_repos = filter.apply(repositories);

    // Apply sorting
    let sorted_repos = apply_sorting(filtered_repos, &params);

    // Apply pagination
    let total_count = sorted_repos.len() as i32;
    let total_pages = (total_count + per_page - 1) / per_page;
    let paginated_repos = sorted_repos
        .into_iter()
        .skip(offset as usize)
        .take(per_page as usize)
        .collect::<Vec<_>>();

    // Calculate statistics for the filtered set
    let statistics = calculate_collection_stats(&paginated_repos);

    // Get rate limit information
    let rate_limit = match app_state.github_service.get_rate_limit_status().await {
        Ok(limit) => RateLimitInfo {
            limit: limit.limit as i32,
            remaining: limit.remaining as i32,
            reset_at: chrono::DateTime::from_timestamp(limit.reset as i64, 0)
                .unwrap_or_else(|| chrono::Utc::now())
                .into(),
            used: limit.used as i32,
            percentage_used: (limit.used as f64 / limit.limit as f64) * 100.0,
        },
        Err(_) => RateLimitInfo {
            limit: 5000,
            remaining: 0,
            reset_at: chrono::Utc::now(),
            used: 0,
            percentage_used: 0.0,
        },
    };

    let response = RepositoryResponse {
        repositories: paginated_repos,
        pagination: PaginationInfo {
            current_page: page,
            per_page,
            total_pages,
            total_count,
            has_next_page: page < total_pages,
            has_previous_page: page > 1,
        },
        statistics,
        rate_limit,
        cache_info: CacheInfo {
            cached: false, // This could be enhanced to track actual cache usage
            cache_age_seconds: 0,
            expires_in_seconds: 3600,
        },
    };

    info!(
        "Returning {} repositories (page {} of {})",
        response.repositories.len(),
        page,
        total_pages
    );

    Ok(Json(response))
}

/// Get detailed information for a specific repository including README and analytics
/// I'm providing comprehensive repository analysis with performance metrics and content
pub async fn get_repository_details(
    State(app_state): State<AppState>,
    Path((owner, name)): Path<(String, String)>,
) -> Result<JsonResponse<RepositoryDetailed>> {
    info!("Fetching detailed repository information for {}/{}", owner, name);

    // Get detailed repository information
    let repository_details = app_state.github_service
        .get_repository_details(&owner, &name)
        .await?;

    // Update access metrics in database
    if let Err(e) = record_repository_access(&app_state, &owner, &name).await {
        warn!("Failed to record repository access: {}", e);
    }

    info!("Successfully retrieved details for {}/{}", owner, name);
    Ok(Json(repository_details))
}

/// Get repository statistics and analytics for performance showcase
/// I'm providing detailed analytics that highlight the repository's characteristics
pub async fn get_repository_stats(
    State(app_state): State<AppState>,
    Path((owner, name)): Path<(String, String)>,
) -> Result<JsonResponse<serde_json::Value>> {
    info!("Fetching repository statistics for {}/{}", owner, name);

    // Get repository from database or API
    let repo = match get_single_repository(&app_state, &owner, &name).await {
        Ok(repo) => repo,
        Err(_) => {
            // Try fetching from GitHub API
            let detailed = app_state.github_service
                .get_repository_details(&owner, &name)
                .await?;
            detailed.basic
        }
    };

    // Calculate comprehensive statistics
    let stats = serde_json::json!({
        "basic_stats": {
            "stars": repo.stargazers_count,
            "forks": repo.forks_count,
            "watchers": repo.watchers_count,
            "open_issues": repo.open_issues_count,
            "size_kb": repo.size_kb,
            "language": repo.language,
            "topics": repo.topics,
            "license": repo.license_name
        },
        "activity_metrics": {
            "activity_score": repo.calculate_activity_score(),
            "age_in_days": repo.age_in_days(),
            "days_since_update": repo.days_since_update(),
            "is_active": repo.days_since_update() < 90,
            "last_updated": repo.updated_at,
            "last_pushed": repo.pushed_at
        },
        "health_indicators": {
            "has_description": repo.description.is_some(),
            "has_topics": repo.topics.as_ref().map(|t| !t.is_empty()).unwrap_or(false),
            "has_license": repo.license_name.is_some(),
            "is_archived": repo.is_archived,
            "is_fork": repo.is_fork,
            "issue_activity": if repo.stargazers_count > 0 {
                repo.open_issues_count as f64 / repo.stargazers_count as f64
            } else { 0.0 }
        },
        "popularity_metrics": {
            "stars_to_forks_ratio": if repo.forks_count > 0 {
                repo.stargazers_count as f64 / repo.forks_count as f64
            } else { repo.stargazers_count as f64 },
            "watchers_to_stars_ratio": if repo.stargazers_count > 0 {
                repo.watchers_count as f64 / repo.stargazers_count as f64
            } else { 0.0 },
            "popularity_rank": calculate_popularity_rank(&repo)
        },
        "technical_info": {
            "primary_language": repo.language,
            "size_category": categorize_repository_size(repo.size_kb),
            "complexity_estimate": estimate_complexity(&repo)
        }
    });

    info!("Generated comprehensive statistics for {}/{}", owner, name);
    Ok(Json(stats))
}

/// Get language distribution across all repositories for technology showcase
/// I'm providing insights into technology usage patterns across the portfolio
pub async fn get_language_distribution(
    State(app_state): State<AppState>,
) -> Result<JsonResponse<serde_json::Value>> {
    info!("Calculating language distribution across repositories");

    let username = &app_state.config.github_username;

    // Get all repositories
    let repositories = match app_state.github_service.get_user_repositories(username).await {
        Ok(repos) => repos,
        Err(_) => get_repositories_from_db(&app_state, username).await?,
    };

    // Calculate language statistics
    let mut language_stats: HashMap<String, LanguageStat> = HashMap::new();
    let mut total_size: i64 = 0;

    for repo in &repositories {
        if repo.is_archived || repo.is_fork {
            continue; // Skip archived and forked repositories for cleaner stats
        }

        total_size += repo.size_kb as i64;

        if let Some(ref language) = repo.language {
            let stat = language_stats.entry(language.clone()).or_insert(LanguageStat {
                name: language.clone(),
                repository_count: 0,
                total_size_kb: 0,
                total_stars: 0,
                average_stars: 0.0,
                percentage: 0.0,
            });

            stat.repository_count += 1;
            stat.total_size_kb += repo.size_kb as i64;
            stat.total_stars += repo.stargazers_count;
        }
    }

    // Calculate percentages and averages
    for stat in language_stats.values_mut() {
        stat.percentage = if total_size > 0 {
            (stat.total_size_kb as f64 / total_size as f64) * 100.0
        } else { 0.0 };
        stat.average_stars = if stat.repository_count > 0 {
            stat.total_stars as f64 / stat.repository_count as f64
        } else { 0.0 };
    }

    // Sort by usage (repository count)
    let mut sorted_languages: Vec<_> = language_stats.into_values().collect();
    sorted_languages.sort_by(|a, b| b.repository_count.cmp(&a.repository_count));

    let response = serde_json::json!({
        "languages": sorted_languages,
        "summary": {
            "total_languages": sorted_languages.len(),
            "total_repositories_analyzed": repositories.len(),
            "total_size_kb": total_size,
            "most_used_language": sorted_languages.first().map(|l| &l.name),
            "language_diversity_score": calculate_diversity_score(&sorted_languages)
        },
        "analysis_timestamp": chrono::Utc::now()
    });

    info!("Language distribution calculated for {} languages", sorted_languages.len());
    Ok(Json(response))
}

#[derive(Debug, Serialize)]
struct LanguageStat {
    name: String,
    repository_count: i32,
    total_size_kb: i64,
    total_stars: i32,
    average_stars: f64,
    percentage: f64,
}

// Helper functions for repository processing and analysis

async fn get_repositories_from_db(app_state: &AppState, username: &str) -> Result<Vec<Repository>> {
    let repositories = sqlx::query_as::<_, Repository>(
        r#"
        SELECT
            id, github_id, owner_login, name, full_name, description, html_url, clone_url, ssh_url,
            language, size_kb, stargazers_count, watchers_count, forks_count, open_issues_count,
            created_at, updated_at, pushed_at, is_private, is_fork, is_archived, topics,
            license_name, readme_content, cache_updated_at, cache_expires_at
        FROM repositories
        WHERE owner_login = $1 AND cache_expires_at > CURRENT_TIMESTAMP
        ORDER BY updated_at DESC
        "#
    )
    .bind(username)
    .fetch_all(&app_state.db_pool)
    .await
    .map_err(|e| AppError::DatabaseError(format!("Failed to fetch repositories from database: {}", e)))?;

    Ok(repositories)
}

async fn get_single_repository(app_state: &AppState, owner: &str, name: &str) -> Result<Repository> {
    let repo = sqlx::query_as::<_, Repository>(
        r#"
        SELECT
            id, github_id, owner_login, name, full_name, description, html_url, clone_url, ssh_url,
            language, size_kb, stargazers_count, watchers_count, forks_count, open_issues_count,
            created_at, updated_at, pushed_at, is_private, is_fork, is_archived, topics,
            license_name, readme_content, cache_updated_at, cache_expires_at
        FROM repositories
        WHERE owner_login = $1 AND name = $2
        LIMIT 1
        "#
    )
    .bind(owner)
    .bind(name)
    .fetch_one(&app_state.db_pool)
    .await
    .map_err(|e| AppError::DatabaseError(format!("Repository not found: {}", e)))?;

    Ok(repo)
}

async fn record_repository_access(app_state: &AppState, owner: &str, name: &str) -> Result<()> {
    sqlx::query(
        r#"
        INSERT INTO performance_metrics (metric_type, metric_name, metric_value, metric_unit, endpoint, tags)
        VALUES ('repository_access', 'repo_access_count', 1, 'count', $1, $2)
        "#
    )
    .bind(format!("/api/github/repo/{}/{}", owner, name))
    .bind(serde_json::json!({"owner": owner, "name": name, "access_time": chrono::Utc::now()}))
    .execute(&app_state.db_pool)
    .await
    .map_err(|e| AppError::DatabaseError(format!("Failed to record access: {}", e)))?;

    Ok(())
}

fn create_filter_from_params(params: &RepositoryQuery) -> RepositoryFilter {
    RepositoryFilter {
        language: params.language.clone(),
        min_stars: params.min_stars,
        max_stars: params.max_stars,
        is_fork: params.is_fork,
        is_archived: params.is_archived,
        search_query: params.search.clone(),
        ..Default::default()
    }
}

fn apply_sorting(mut repositories: Vec<Repository>, params: &RepositoryQuery) -> Vec<Repository> {
    let sort_field = params.sort.as_deref().unwrap_or("updated");
    let direction = params.direction.as_deref().unwrap_or("desc");

    repositories.sort_by(|a, b| {
        let comparison = match sort_field {
            "name" => a.name.cmp(&b.name),
            "stars" => a.stargazers_count.cmp(&b.stargazers_count),
            "forks" => a.forks_count.cmp(&b.forks_count),
            "size" => a.size_kb.cmp(&b.size_kb),
            "created" => a.created_at.cmp(&b.created_at),
            "updated" | _ => a.updated_at.cmp(&b.updated_at),
        };

        if direction == "desc" {
            comparison.reverse()
        } else {
            comparison
        }
    });

    repositories
}

fn calculate_popularity_rank(repo: &Repository) -> String {
    match repo.stargazers_count {
        0..=5 => "Getting Started".to_string(),
        6..=25 => "Growing".to_string(),
        26..=100 => "Popular".to_string(),
        101..=500 => "Highly Popular".to_string(),
        501..=2000 => "Very Popular".to_string(),
        _ => "Exceptional".to_string(),
    }
}

fn categorize_repository_size(size_kb: i32) -> String {
    match size_kb {
        0..=100 => "Tiny".to_string(),
        101..=1000 => "Small".to_string(),
        1001..=10000 => "Medium".to_string(),
        10001..=100000 => "Large".to_string(),
        _ => "Huge".to_string(),
    }
}

fn estimate_complexity(repo: &Repository) -> String {
    // I'm using a simple heuristic based on size, issues, and language
    let mut complexity_score = 0;

    // Size factor
    complexity_score += match repo.size_kb {
        0..=1000 => 1,
        1001..=10000 => 2,
        10001..=100000 => 3,
        _ => 4,
    };

    // Issue activity factor
    if repo.open_issues_count > 10 {
        complexity_score += 1;
    }

    // Language complexity (subjective but useful heuristic)
    if let Some(ref lang) = repo.language {
        complexity_score += match lang.as_str() {
            "Assembly" | "C" | "C++" | "Rust" => 3,
            "Java" | "C#" | "Go" | "Kotlin" => 2,
            "Python" | "JavaScript" | "TypeScript" => 1,
            "HTML" | "CSS" | "Markdown" => 0,
            _ => 1,
        };
    }

    match complexity_score {
        0..=2 => "Simple".to_string(),
        3..=4 => "Moderate".to_string(),
        5..=6 => "Complex".to_string(),
        _ => "Very Complex".to_string(),
    }
}

fn calculate_diversity_score(languages: &[LanguageStat]) -> f64 {
    // I'm calculating a Shannon diversity index for language distribution
    let total_repos: i32 = languages.iter().map(|l| l.repository_count).sum();

    if total_repos == 0 {
        return 0.0;
    }

    let mut diversity = 0.0;

    for lang in languages {
        if lang.repository_count > 0 {
            let proportion = lang.repository_count as f64 / total_repos as f64;
            diversity -= proportion * proportion.ln();
        }
    }

    diversity
}
