/*
 * Individual repository card component displaying GitHub project information with interactive elements and dark aesthetic styling.
 * I'm implementing comprehensive repository visualization including language indicators, statistics, health metrics, and hover effects that maintain the eerie, contemplative theme.
 */

import { Component, Show, For, createMemo } from 'solid-js';
import { Card } from '../UI/Card';

interface Repository {
  id: number;
  name: string;
  full_name: string;
  description?: string;
  html_url: string;
  language?: string;
  stargazers_count: number;
  watchers_count: number;
  forks_count: number;
  open_issues_count: number;
  size_kb: number;
  created_at: string;
  updated_at: string;
  pushed_at?: string;
  is_private: boolean;
  is_fork: boolean;
  is_archived: boolean;
  topics: string[];
  license_name?: string;
}

interface ProjectCardProps {
  repository: Repository;
  onClick?: (repository: Repository) => void;
  viewMode?: 'grid' | 'list';
}

export const ProjectCard: Component<ProjectCardProps> = (props) => {
  // I'm creating language color mapping for visual coding language identification
  const getLanguageColor = (language: string): string => {
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
      'HTML': '#e34c26',
      'CSS': '#1572B6',
      'Shell': '#89e051',
      'Dockerfile': '#384d54',
      'Vue': '#4FC08D',
      'Svelte': '#ff3e00',
      'Dart': '#00B4AB',
    };
    return colors[language] || '#586069';
  };

  // I'm calculating repository health and activity metrics
  const getHealthMetrics = createMemo(() => {
    const repo = props.repository;
    const daysSinceUpdate = (new Date().getTime() - new Date(repo.updated_at).getTime()) / (1000 * 60 * 60 * 24);

    let healthScore = 0;
    if (repo.description) healthScore += 1;
    if (repo.topics.length > 0) healthScore += 1;
    if (repo.license_name) healthScore += 1;
    if (daysSinceUpdate <= 90) healthScore += 1;

    const healthRating = healthScore === 4 ? 'excellent' :
                        healthScore === 3 ? 'good' :
                        healthScore === 2 ? 'fair' : 'poor';

    const activityScore = Math.log(repo.stargazers_count + 1) * 5 +
                         Math.log(repo.forks_count + 1) * 3 +
                         (daysSinceUpdate < 30 ? 20 : daysSinceUpdate < 90 ? 10 : 0);

    return {
      healthRating,
      healthScore,
      activityScore: Math.min(activityScore, 100),
      daysSinceUpdate: Math.floor(daysSinceUpdate),
      isActive: daysSinceUpdate <= 90
    };
  });

  // I'm formatting file sizes for human readability
  const formatSize = (sizeKb: number): string => {
    if (sizeKb < 1024) return `${sizeKb} KB`;
    const sizeMb = sizeKb / 1024;
    if (sizeMb < 1024) return `${sizeMb.toFixed(1)} MB`;
    const sizeGb = sizeMb / 1024;
    return `${sizeGb.toFixed(1)} GB`;
  };

  // I'm creating relative time formatting for timestamps
  const formatRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    if (diffInSeconds < 2629746) return `${Math.floor(diffInSeconds / 604800)}w ago`;
    return `${Math.floor(diffInSeconds / 2629746)}mo ago`;
  };

  const healthMetrics = getHealthMetrics();
  const repo = props.repository;

  // I'm implementing different layouts based on view mode
  if (props.viewMode === 'list') {
    return (
      <Card
        interactive
        hover
        onClick={() => props.onClick?.(repo)}
        class="cursor-pointer"
      >
        <div class="flex items-start justify-between gap-4">
          <div class="flex-1 min-w-0">
            {/* Header with name and status indicators */}
            <div class="flex items-center gap-2 mb-2">
              <h3 class="font-mono text-lg text-neutral-100 truncate group-hover:text-cyan-400 transition-colors duration-200">
                {repo.name}
              </h3>

              <div class="flex items-center gap-1">
                <Show when={repo.is_private}>
                  <span class="px-1.5 py-0.5 bg-yellow-900/30 text-yellow-400 border border-yellow-800 rounded text-xs font-mono">
                    PRIVATE
                  </span>
                </Show>
                <Show when={repo.is_fork}>
                  <span class="px-1.5 py-0.5 bg-blue-900/30 text-blue-400 border border-blue-800 rounded text-xs font-mono">
                    FORK
                  </span>
                </Show>
                <Show when={repo.is_archived}>
                  <span class="px-1.5 py-0.5 bg-neutral-800 text-neutral-500 border border-neutral-700 rounded text-xs font-mono">
                    ARCHIVED
                  </span>
                </Show>
              </div>
            </div>

            {/* Description */}
            <Show when={repo.description}>
              <p class="text-neutral-400 text-sm mb-3 line-clamp-2 leading-relaxed">
                {repo.description}
              </p>
            </Show>

            {/* Stats and metadata */}
            <div class="flex items-center gap-4 text-xs text-neutral-500">
              <Show when={repo.language}>
                <div class="flex items-center gap-1.5">
                  <div
                    class="w-3 h-3 rounded-full"
                    style={{ 'background-color': getLanguageColor(repo.language!) }}
                  ></div>
                  <span>{repo.language}</span>
                </div>
              </Show>

              <Show when={repo.stargazers_count > 0}>
                <div class="flex items-center gap-1">
                  <span>⭐</span>
                  <span>{repo.stargazers_count}</span>
                </div>
              </Show>

              <Show when={repo.forks_count > 0}>
                <div class="flex items-center gap-1">
                  <span>🍴</span>
                  <span>{repo.forks_count}</span>
                </div>
              </Show>

              <span>Updated {formatRelativeTime(repo.updated_at)}</span>
              <span>{formatSize(repo.size_kb)}</span>
            </div>
          </div>

          {/* Right side metadata */}
          <div class="flex flex-col items-end gap-2 text-xs">
            <div class={`px-2 py-1 rounded font-mono ${
              healthMetrics.healthRating === 'excellent' ? 'bg-green-900/30 text-green-400' :
              healthMetrics.healthRating === 'good' ? 'bg-blue-900/30 text-blue-400' :
              healthMetrics.healthRating === 'fair' ? 'bg-yellow-900/30 text-yellow-400' :
              'bg-red-900/30 text-red-400'
            }`}>
              {healthMetrics.healthRating.toUpperCase()}
            </div>

            <div class="text-neutral-600 font-mono">
              Activity: {healthMetrics.activityScore.toFixed(0)}
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // I'm implementing the grid card layout as default
  return (
    <Card
      interactive
      hover
      glow
      onClick={() => props.onClick?.(repo)}
      class="cursor-pointer h-full"
    >
      <div class="flex flex-col h-full">
        {/* Header */}
        <div class="flex items-start justify-between mb-3">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <h3 class="font-mono text-xl text-neutral-100 truncate group-hover:text-cyan-400 transition-colors duration-200">
                {repo.name}
              </h3>
            </div>

            <div class="flex items-center gap-1 mb-2">
              <Show when={repo.is_private}>
                <div class="w-2 h-2 bg-yellow-500 rounded-full" title="Private repository"></div>
              </Show>
              <Show when={repo.is_fork}>
                <div class="w-2 h-2 bg-blue-500 rounded-full" title="Forked repository"></div>
              </Show>
              <Show when={repo.is_archived}>
                <div class="w-2 h-2 bg-neutral-600 rounded-full" title="Archived repository"></div>
              </Show>
            </div>
          </div>

          {/* Health indicator */}
          <div class={`px-2 py-1 rounded text-xs font-mono ${
            healthMetrics.healthRating === 'excellent' ? 'bg-green-900/30 text-green-400 border border-green-800' :
            healthMetrics.healthRating === 'good' ? 'bg-blue-900/30 text-blue-400 border border-blue-800' :
            healthMetrics.healthRating === 'fair' ? 'bg-yellow-900/30 text-yellow-400 border border-yellow-800' :
            'bg-red-900/30 text-red-400 border border-red-800'
          }`}>
            {healthMetrics.healthRating.toUpperCase()}
          </div>
        </div>

        {/* Description */}
        <Show when={repo.description} fallback={
          <div class="text-neutral-600 text-sm italic mb-4 flex-1">
            No description provided
          </div>
        }>
          <p class="text-neutral-400 text-sm mb-4 line-clamp-3 leading-relaxed flex-1">
            {repo.description}
          </p>
        </Show>

        {/* Topics */}
        <Show when={repo.topics.length > 0}>
          <div class="flex flex-wrap gap-1 mb-4">
            <For each={repo.topics.slice(0, 3)}>
              {(topic) => (
                <span class="text-xs px-2 py-1 bg-neutral-800/50 text-neutral-400 rounded font-mono border border-neutral-700">
                  {topic}
                </span>
              )}
            </For>
            <Show when={repo.topics.length > 3}>
              <span class="text-xs px-2 py-1 text-neutral-600 font-mono">
                +{repo.topics.length - 3}
              </span>
            </Show>
          </div>
        </Show>

        {/* Statistics */}
        <div class="flex items-center justify-between mt-auto pt-4 border-t border-neutral-800">
          <div class="flex items-center gap-3 text-xs text-neutral-500">
            <Show when={repo.language}>
              <div class="flex items-center gap-1.5">
                <div
                  class="w-2 h-2 rounded-full"
                  style={{ 'background-color': getLanguageColor(repo.language!) }}
                ></div>
                <span>{repo.language}</span>
              </div>
            </Show>

            <Show when={repo.stargazers_count > 0}>
              <div class="flex items-center gap-1">
                <span>⭐</span>
                <span>{repo.stargazers_count}</span>
              </div>
            </Show>

            <Show when={repo.forks_count > 0}>
              <div class="flex items-center gap-1">
                <span>🍴</span>
                <span>{repo.forks_count}</span>
              </div>
            </Show>
          </div>

          <div class="flex flex-col items-end text-xs">
            <div class="text-neutral-600 font-mono">
              {formatSize(repo.size_kb)}
            </div>
            <div class="text-neutral-600 font-mono">
              {formatRelativeTime(repo.updated_at)}
            </div>
          </div>
        </div>

        {/* Activity indicator */}
        <div class="mt-2">
          <div class="flex items-center justify-between text-xs">
            <span class="text-neutral-600">Activity</span>
            <span class="text-neutral-500 font-mono">
              {healthMetrics.activityScore.toFixed(0)}/100
            </span>
          </div>
          <div class="w-full h-1 bg-neutral-800 rounded-full mt-1 overflow-hidden">
            <div
              class={`h-full rounded-full transition-all duration-500 ${
                healthMetrics.activityScore > 70 ? 'bg-green-500' :
                healthMetrics.activityScore > 40 ? 'bg-yellow-500' :
                'bg-red-500'
              }`}
              style={{ width: `${Math.min(healthMetrics.activityScore, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Hover overlay for additional info */}
        <div class="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-lg"></div>
      </div>
    </Card>
  );
};
