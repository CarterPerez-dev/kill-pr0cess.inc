/*
 * ©AngelaMos | 2025
 */

import { apiClient } from './api';
import type {
  Repository,
  RepositoryDetailed,
  RepositoryFilter,
} from '../hooks/useGitHub';

interface RepositoryResponse {
  repositories: Repository[];
  pagination: {
    current_page: number;
    per_page: number;
    total_pages: number;
    total_count: number;
    has_next_page: boolean;
    has_previous_page: boolean;
  };
  statistics: {
    total_stars: number;
    total_forks: number;
    average_stars: number;
    most_starred_repo: string;
    language_count: number;
    topics_count: number;
  };
  rate_limit: {
    limit: number;
    remaining: number;
    reset_at: string;
    percentage_used: number;
  };
}

interface LanguageDistribution {
  languages: Array<{
    name: string;
    repository_count: number;
    total_size_kb: number;
    percentage: number;
    average_stars: number;
  }>;
  summary: {
    total_languages: number;
    total_repositories_analyzed: number;
    most_used_language?: string;
    language_diversity_score: number;
  };
}

class GitHubService {
  private cache: Map<string, { data: any; timestamp: number; ttl: number }>;
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.cache = new Map();

    // I'm setting up cache cleanup to prevent memory leaks
    setInterval(() => this.cleanupCache(), 60000); // Cleanup every minute
  }

  private cleanupCache() {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  private getCacheKey(
    endpoint: string,
    params?: Record<string, any>,
  ): string {
    const paramString = params ? JSON.stringify(params) : '';
    return `${endpoint}:${paramString}`;
  }

  private getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  private setCache<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  async getRepositories(
    params: {
      page?: number;
      per_page?: number;
      sort?: string;
      direction?: string;
      language?: string;
      min_stars?: number;
      max_stars?: number;
      is_fork?: boolean;
      is_archived?: boolean;
      search?: string;
    } = {},
  ): Promise<RepositoryResponse> {
    const cacheKey = this.getCacheKey('/api/github/repos', params);

    // I'm checking cache first for performance optimization
    const cached = this.getFromCache<RepositoryResponse>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const queryParams = new URLSearchParams();

      // I'm building query parameters with proper type conversion
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });

      const endpoint = `/api/github/repos${queryParams.toString() ? `?${queryParams}` : ''}`;
      const response = await apiClient.get<RepositoryResponse>(endpoint);

      // I'm caching successful responses with TTL based on rate limit status
      const cacheTtl =
        response.rate_limit.remaining > 100
          ? this.DEFAULT_TTL
          : this.DEFAULT_TTL * 2; // Cache longer when rate limit is low

      this.setCache(cacheKey, response, cacheTtl);
      return response;
    } catch (error) {
      console.error('Failed to fetch repositories:', error);
      throw error;
    }
  }

  async getRepositoryDetails(
    owner: string,
    name: string,
  ): Promise<RepositoryDetailed> {
    const cacheKey = this.getCacheKey(`/api/github/repo/${owner}/${name}`);

    const cached = this.getFromCache<RepositoryDetailed>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const response = await apiClient.get<RepositoryDetailed>(
        `/api/github/repo/${owner}/${name}`,
      );

      // I'm caching detailed repository data for longer since it changes less frequently
      this.setCache(cacheKey, response, this.DEFAULT_TTL * 2);
      return response;
    } catch (error) {
      console.error(
        `Failed to fetch repository details for ${owner}/${name}:`,
        error,
      );
      throw error;
    }
  }

  async getRepositoryStats(owner: string, name: string): Promise<any> {
    const cacheKey = this.getCacheKey(
      `/api/github/repo/${owner}/${name}/stats`,
    );

    const cached = this.getFromCache<any>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const response = await apiClient.get<any>(
        `/api/github/repo/${owner}/${name}/stats`,
      );

      // I'm caching stats for a shorter time since they're more dynamic
      this.setCache(cacheKey, response, this.DEFAULT_TTL);
      return response;
    } catch (error) {
      console.error(
        `Failed to fetch repository stats for ${owner}/${name}:`,
        error,
      );
      throw error;
    }
  }

  async getLanguageDistribution(): Promise<LanguageDistribution> {
    const cacheKey = this.getCacheKey('/api/github/language-distribution');

    const cached = this.getFromCache<LanguageDistribution>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const response = await apiClient.get<LanguageDistribution>(
        '/api/github/language-distribution',
      );

      // I'm caching language distribution for longer since it changes slowly
      this.setCache(cacheKey, response, this.DEFAULT_TTL * 4);
      return response;
    } catch (error) {
      console.error('Failed to fetch language distribution:', error);
      throw error;
    }
  }

  // I'm implementing utility methods for data transformation and analysis
  calculateRepositoryHealth(
    repo: Repository,
  ): 'excellent' | 'good' | 'fair' | 'poor' {
    if (repo.is_archived) return 'poor';

    let score = 0;

    // I'm scoring based on various repository health indicators
    if (repo.description) score += 1;
    if (repo.topics && repo.topics.length > 0) score += 1;
    if (repo.license_name) score += 1;

    // Check if recently updated (within 90 days)
    const daysSinceUpdate =
      (new Date().getTime() - new Date(repo.updated_at).getTime()) /
      (1000 * 60 * 60 * 24);
    if (daysSinceUpdate <= 90) score += 1;

    switch (score) {
      case 4:
        return 'excellent';
      case 3:
        return 'good';
      case 2:
        return 'fair';
      default:
        return 'poor';
    }
  }

  calculateActivityScore(repo: Repository): number {
    const daysSinceUpdate =
      (new Date().getTime() - new Date(repo.updated_at).getTime()) /
      (1000 * 60 * 60 * 24);
    const recentActivityBonus =
      daysSinceUpdate < 30 ? 20 : daysSinceUpdate < 90 ? 10 : 0;
    const starScore = Math.log(repo.stargazers_count + 1) * 5;
    const forkScore = Math.log(repo.forks_count + 1) * 3;
    const sizeScore = Math.min(Math.log(repo.size_kb + 1), 10);

    return Math.min(
      recentActivityBonus + starScore + forkScore + sizeScore,
      100,
    );
  }

  formatSize(sizeKb: number): string {
    if (sizeKb < 1024) return `${sizeKb} KB`;
    const sizeMb = sizeKb / 1024;
    if (sizeMb < 1024) return `${sizeMb.toFixed(1)} MB`;
    const sizeGb = sizeMb / 1024;
    return `${sizeGb.toFixed(1)} GB`;
  }

  formatRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor(
      (now.getTime() - date.getTime()) / 1000,
    );

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600)
      return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800)
      return `${Math.floor(diffInSeconds / 86400)} days ago`;
    if (diffInSeconds < 2629746)
      return `${Math.floor(diffInSeconds / 604800)} weeks ago`;
    if (diffInSeconds < 31556952)
      return `${Math.floor(diffInSeconds / 2629746)} months ago`;
    return `${Math.floor(diffInSeconds / 31556952)} years ago`;
  }

  getLanguageColor(language: string): string {
    // I'm providing a comprehensive color mapping for popular languages
    const colors: Record<string, string> = {
      'JavaScript': '#f1e05a',
      'TypeScript': '#2b7489',
      'Python': '#3572A5',
      'Java': '#b07219',
      'C++': '#f34b7d',
      'C': '#555555',
      'C#': '#239120',
      'PHP': '#4F5D95',
      'Ruby': '#701516',
      'Go': '#00ADD8',
      'Rust': '#dea584',
      'Swift': '#ffac45',
      'Kotlin': '#F18E33',
      'Scala': '#c22d40',
      'HTML': '#e34c26',
      'CSS': '#1572B6',
      'Shell': '#89e051',
      'Dockerfile': '#384d54',
      'Makefile': '#427819',
      'Vue': '#4FC08D',
      'Svelte': '#ff3e00',
      'Dart': '#00B4AB',
      'Elixir': '#6e4a7e',
      'Haskell': '#5e5086',
      'Lua': '#000080',
      'R': '#198CE7',
      'MATLAB': '#e16737',
    };

    return colors[language] || '#586069';
  }

  // I'm adding search and filtering utilities
  filterRepositories(
    repositories: Repository[],
    filters: RepositoryFilter,
  ): Repository[] {
    return repositories.filter((repo) => {
      if (filters.language && repo.language !== filters.language)
        return false;
      if (filters.min_stars && repo.stargazers_count < filters.min_stars)
        return false;
      if (filters.max_stars && repo.stargazers_count > filters.max_stars)
        return false;
      if (filters.is_fork !== undefined && repo.is_fork !== filters.is_fork)
        return false;
      if (
        filters.is_archived !== undefined &&
        repo.is_archived !== filters.is_archived
      )
        return false;

      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const searchableText =
          `${repo.name} ${repo.description || ''} ${repo.topics.join(' ')}`.toLowerCase();
        if (!searchableText.includes(searchTerm)) return false;
      }

      return true;
    });
  }

  sortRepositories(
    repositories: Repository[],
    sortBy: string,
    direction: 'asc' | 'desc' = 'desc',
  ): Repository[] {
    const sorted = [...repositories].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'stars':
          comparison = a.stargazers_count - b.stargazers_count;
          break;
        case 'forks':
          comparison = a.forks_count - b.forks_count;
          break;
        case 'updated':
          comparison =
            new Date(a.updated_at).getTime() -
            new Date(b.updated_at).getTime();
          break;
        case 'created':
          comparison =
            new Date(a.created_at).getTime() -
            new Date(b.created_at).getTime();
          break;
        case 'size':
          comparison = a.size_kb - b.size_kb;
          break;
        case 'activity':
          comparison =
            this.calculateActivityScore(a) - this.calculateActivityScore(b);
          break;
        default:
          comparison =
            new Date(a.updated_at).getTime() -
            new Date(b.updated_at).getTime();
      }

      return direction === 'desc' ? -comparison : comparison;
    });

    return sorted;
  }

  // I'm providing cache management utilities
  clearCache() {
    this.cache.clear();
  }

  getCacheStats() {
    const entries = Array.from(this.cache.entries());
    const now = Date.now();

    return {
      totalEntries: entries.length,
      validEntries: entries.filter(
        ([_, entry]) => now - entry.timestamp <= entry.ttl,
      ).length,
      memoryUsage: JSON.stringify(Object.fromEntries(entries)).length,
    };
  }

  // I'm adding prefetch capabilities for performance optimization
  async prefetchRepository(owner: string, name: string) {
    try {
      // I'm prefetching both details and stats in parallel
      await Promise.all([
        this.getRepositoryDetails(owner, name),
        this.getRepositoryStats(owner, name),
      ]);
    } catch (error) {
      console.warn(`Failed to prefetch repository ${owner}/${name}:`, error);
    }
  }

  async prefetchRepositories(repositories: Repository[]) {
    // I'm prefetching the most likely to be viewed repositories
    const priorityRepos = repositories
      .filter((repo) => !repo.is_archived && repo.stargazers_count > 0)
      .slice(0, 5); // Prefetch top 5 repositories

    await Promise.allSettled(
      priorityRepos.map((repo) =>
        this.prefetchRepository(repo.owner, repo.name),
      ),
    );
  }
}

// I'm creating and exporting a singleton instance
export const githubService = new GitHubService();

// I'm exporting types for use in other modules
export type { RepositoryResponse, LanguageDistribution };
