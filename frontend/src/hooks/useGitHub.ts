/*
 * ©AngelaMos | 2025
 */

import {
  createSignal,
  createResource,
  createMemo,
  createEffect,
  onCleanup,
} from 'solid-js';
import { createStore, produce } from 'solid-js/store';
import { apiClient } from '../services/api';

interface Repository {
  id: string;
  github_id: number;
  owner_login: string;
  name: string;
  full_name: string;
  description?: string;
  html_url: string;
  clone_url: string;
  ssh_url: string;
  language?: string;
  size_kb: number;
  stargazers_count: number;
  watchers_count: number;
  forks_count: number;
  open_issues_count: number;
  created_at: string;
  updated_at: string;
  pushed_at?: string;
  is_private: boolean;
  is_fork: boolean;
  is_archived: boolean;
  topics: string[];
  license_name?: string;
  readme_content?: string;
  cached_at: string;
  cache_expires_at: string;
}

interface RepositoryDetailed extends Repository {
  readme_content: string;
  stats: RepositoryStats;
  contributors_count: number;
  commit_count: number;
  branch_count: number;
  release_count: number;
}

interface RepositoryStats {
  commit_frequency: number;
  contributors_count: number;
  issues_ratio: number;
  fork_ratio: number;
  activity_score: number;
  health_score: number;
  last_activity_days: number;
}

interface RepositoryFilter {
  language?: string;
  min_stars?: number;
  max_stars?: number;
  is_fork?: boolean;
  is_archived?: boolean;
  search?: string;
  sort?: string;
  direction?: string;
}

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

interface GitHubState {
  repositories: Repository[];
  selectedRepository: RepositoryDetailed | null;
  languageDistribution: LanguageDistribution | null;
  currentPage: number;
  totalPages: number;
  totalCount: number;
  isLoading: boolean;
  error: string | null;
  filters: RepositoryFilter;
  statistics: any;
  rateLimit: any;
}

export function useGitHub() {
  // I'm setting up reactive state management with SolidJS stores
  const [state, setState] = createStore<GitHubState>({
    repositories: [],
    selectedRepository: null,
    languageDistribution: null,
    currentPage: 1,
    totalPages: 0,
    totalCount: 0,
    isLoading: false,
    error: null,
    filters: {},
    statistics: null,
    rateLimit: null,
  });

  // I'm implementing caching signals for performance optimization
  const [cacheTimestamp, setCacheTimestamp] = createSignal<number>(0);
  const [refreshInterval, setRefreshInterval] = createSignal<number | null>(
    null,
  );

  // Main repositories resource with intelligent caching
  const [repositories] = createResource(
    () => ({
      page: state.currentPage,
      filters: state.filters,
      cacheKey: cacheTimestamp(),
    }),
    async ({ page, filters }) => {
      setState('isLoading', true);
      setState('error', null);

      try {
        const params = new URLSearchParams({
          page: page.toString(),
          per_page: '20',
          ...Object.fromEntries(
            Object.entries(filters).filter(
              ([_, value]) => value !== undefined && value !== '',
            ),
          ),
        });

        const response = await apiClient.get(`/api/github/repos?${params}`);

        const data: RepositoryResponse = response;

        setState('repositories', data.repositories);
        setState('totalPages', data.pagination.total_pages);
        setState('totalCount', data.pagination.total_count);
        setState('statistics', data.statistics);
        setState('rateLimit', data.rate_limit);

        return data;
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Failed to fetch repositories';
        setState('error', errorMessage);
        throw error;
      } finally {
        setState('isLoading', false);
      }
    },
  );

  // Language distribution resource
  const [languageData] = createResource(
    () => cacheTimestamp(),
    async () => {
      try {
        const data: LanguageDistribution = await apiClient.get(
          '/api/github/language-distribution',
        );
        setState('languageDistribution', data);
        return data;
      } catch (error) {
        console.warn('Failed to fetch language distribution:', error);
        return null;
      }
    },
  );

  // I'm implementing computed values for enhanced data presentation
  const filteredRepositories = createMemo(() => {
    return state.repositories.filter((repo) => {
      if (state.filters.search) {
        const searchTerm = state.filters.search.toLowerCase();
        const searchableText =
          `${repo.name} ${repo.description || ''} ${repo.topics.join(' ')}`.toLowerCase();
        if (!searchableText.includes(searchTerm)) return false;
      }

      if (
        state.filters.language &&
        repo.language !== state.filters.language
      ) {
        return false;
      }

      if (
        state.filters.min_stars &&
        repo.stargazers_count < state.filters.min_stars
      ) {
        return false;
      }

      if (
        state.filters.max_stars &&
        repo.stargazers_count > state.filters.max_stars
      ) {
        return false;
      }

      if (
        state.filters.is_fork !== undefined &&
        repo.is_fork !== state.filters.is_fork
      ) {
        return false;
      }

      if (
        state.filters.is_archived !== undefined &&
        repo.is_archived !== state.filters.is_archived
      ) {
        return false;
      }

      return true;
    });
  });

  const repositoryStats = createMemo(() => {
    const repos = filteredRepositories();
    return {
      totalRepositories: repos.length,
      totalStars: repos.reduce(
        (sum, repo) => sum + repo.stargazers_count,
        0,
      ),
      totalForks: repos.reduce((sum, repo) => sum + repo.forks_count, 0),
      languages: [
        ...new Set(repos.map((repo) => repo.language).filter(Boolean)),
      ],
      mostStarredRepo: repos.reduce(
        (max, repo) =>
          repo.stargazers_count > (max?.stargazers_count || 0) ? repo : max,
        null as Repository | null,
      ),
      recentlyUpdated: repos.filter((repo) => {
        const daysSinceUpdate =
          (new Date().getTime() - new Date(repo.updated_at).getTime()) /
          (1000 * 60 * 60 * 24);
        return daysSinceUpdate <= 30;
      }).length,
      activeProjects: repos.filter(
        (repo) => !repo.is_archived && !repo.is_fork,
      ).length,
    };
  });

  // Rate limit status with warnings
  const rateLimitStatus = createMemo(() => {
    if (!state.rateLimit) return null;

    const { remaining, limit, percentage_used } = state.rateLimit;
    return {
      remaining,
      limit,
      percentage_used,
      status:
        percentage_used > 90
          ? 'critical'
          : percentage_used > 70
            ? 'warning'
            : 'ok',
      resetTime: new Date(state.rateLimit.reset_at),
    };
  });

  // Actions for state management
  const actions = {
    // Fetch repositories with optional filters
    async refreshRepositories(filters?: Partial<RepositoryFilter>) {
      if (filters) {
        setState(
          'filters',
          produce((current) => Object.assign(current, filters)),
        );
      }
      setCacheTimestamp(Date.now());
    },

    // Navigate to specific page
    async goToPage(page: number) {
      if (page >= 1 && page <= state.totalPages) {
        setState('currentPage', page);
      }
    },

    // Fetch detailed repository information
    async getRepositoryDetails(
      owner: string,
      name: string,
    ): Promise<RepositoryDetailed | null> {
      try {
        setState('isLoading', true);

        const data: RepositoryDetailed = await apiClient.get(
          `/api/github/repo/${owner}/${name}`,
        );
        setState('selectedRepository', data);
        return data;
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Failed to fetch repository details';
        setState('error', errorMessage);
        return null;
      } finally {
        setState('isLoading', false);
      }
    },

    // Get repository statistics
    async getRepositoryStats(owner: string, name: string) {
      try {
        return await apiClient.get(
          `/api/github/repo/${owner}/${name}/stats`,
        );
      } catch (error) {
        console.warn('Failed to fetch repository stats:', error);
        return null;
      }
    },

    // Update filters
    setFilters(newFilters: Partial<RepositoryFilter>) {
      setState(
        'filters',
        produce((current) => Object.assign(current, newFilters)),
      );
      setState('currentPage', 1); // Reset to first page when filtering
      setCacheTimestamp(Date.now());
    },

    // Clear filters
    clearFilters() {
      setState('filters', {});
      setState('currentPage', 1);
      setCacheTimestamp(Date.now());
    },

    // Clear error state
    clearError() {
      setState('error', null);
    },

    // Set up auto-refresh
    startAutoRefresh(intervalMs: number = 300000) {
      // 5 minutes default
      const interval = setInterval(() => {
        setCacheTimestamp(Date.now());
      }, intervalMs);

      setRefreshInterval(interval);

      return () => {
        clearInterval(interval);
        setRefreshInterval(null);
      };
    },

    // Stop auto-refresh
    stopAutoRefresh() {
      const interval = refreshInterval();
      if (interval) {
        clearInterval(interval);
        setRefreshInterval(null);
      }
    },
  };

  // I'm setting up automatic cleanup for intervals
  onCleanup(() => {
    actions.stopAutoRefresh();
  });

  // I'm implementing reactive effects for enhanced UX
  createEffect(() => {
    // Log rate limit warnings
    const rateLimit = rateLimitStatus();
    if (rateLimit?.status === 'critical') {
      console.warn(
        `GitHub API rate limit critical: ${rateLimit.remaining}/${rateLimit.limit} remaining`,
      );
    } else if (rateLimit?.status === 'warning') {
      console.warn(
        `GitHub API rate limit warning: ${rateLimit.remaining}/${rateLimit.limit} remaining`,
      );
    }
  });

  // Helper functions for data transformation
  const utils = {
    // Format repository size for display
    formatSize(sizeKb: number): string {
      if (sizeKb < 1024) return `${sizeKb} KB`;
      const sizeMb = sizeKb / 1024;
      if (sizeMb < 1024) return `${sizeMb.toFixed(1)} MB`;
      const sizeGb = sizeMb / 1024;
      return `${sizeGb.toFixed(1)} GB`;
    },

    // Calculate repository activity score
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
    },

    // Get repository health status
    getHealthStatus(
      repo: Repository,
    ): 'excellent' | 'good' | 'fair' | 'poor' {
      if (repo.is_archived) return 'poor';

      const hasDescription = !!repo.description;
      const hasTopics = repo.topics.length > 0;
      const hasLicense = !!repo.license_name;
      const isActive =
        (new Date().getTime() - new Date(repo.updated_at).getTime()) /
          (1000 * 60 * 60 * 24) <
        90;

      const healthScore = [
        hasDescription,
        hasTopics,
        hasLicense,
        isActive,
      ].filter(Boolean).length;

      switch (healthScore) {
        case 4:
          return 'excellent';
        case 3:
          return 'good';
        case 2:
          return 'fair';
        default:
          return 'poor';
      }
    },

    // Format relative time
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
    },

    // Get language color for visualization
    getLanguageColor(language: string): string {
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
      };
      return colors[language] || '#586069';
    },
  };

  return {
    // State
    repositories: () => filteredRepositories(),
    allRepositories: () => state.repositories,
    selectedRepository: () => state.selectedRepository,
    languageDistribution: () => state.languageDistribution,
    isLoading: () => state.isLoading,
    error: () => state.error,

    // Pagination
    currentPage: () => state.currentPage,
    totalPages: () => state.totalPages,
    totalCount: () => state.totalCount,
    hasNextPage: () => state.currentPage < state.totalPages,
    hasPreviousPage: () => state.currentPage > 1,

    // Filters and search
    filters: () => state.filters,

    // Computed values
    statistics: repositoryStats,
    rateLimit: rateLimitStatus,

    // Actions
    ...actions,

    // Utilities
    utils,

    // Resource states
    repositoriesResource: repositories,
    languageResource: languageData,
  };
}

export type {
  Repository,
  RepositoryDetailed,
  RepositoryFilter,
  RepositoryStats,
  LanguageDistribution,
};
