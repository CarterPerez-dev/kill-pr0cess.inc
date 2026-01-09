/*
 * Detailed repository view component providing comprehensive project information including README, statistics, and metadata analysis.
 * I'm implementing an immersive project exploration interface with performance metrics, contribution analysis, and technical insights that maintains the dark, contemplative aesthetic.
 */

import {
  type Component,
  createSignal,
  Show,
  For,
  onMount,
  createEffect,
} from 'solid-js';
import { Card, MetricCard, StatusCard } from '../UI/Card';
import { LoadingSpinner } from '../UI/LoadingSpinner';

interface Repository {
  id: number;
  name: string;
  full_name: string;
  description?: string;
  html_url: string;
  clone_url: string;
  ssh_url: string;
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
  readme_content?: string;
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

interface ProjectDetailProps {
  repository: Repository;
  onClose: () => void;
  isLoading?: boolean;
}

export const ProjectDetail: Component<ProjectDetailProps> = (props) => {
  const [activeTab, setActiveTab] = createSignal<
    'overview' | 'readme' | 'analytics' | 'insights'
  >('overview');
  const [repositoryStats, setRepositoryStats] =
    createSignal<RepositoryStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = createSignal(false);

  // I'm fetching detailed statistics when the component mounts
  onMount(async () => {
    if (props.repository) {
      await fetchRepositoryStats();
    }
  });

  // I'm updating stats when repository changes
  createEffect(async () => {
    if (props.repository) {
      await fetchRepositoryStats();
    }
  });

  const fetchRepositoryStats = async () => {
    setIsLoadingStats(true);
    try {
      const response = await fetch(
        `/api/github/repo/${props.repository.full_name}/stats`,
      );
      if (response.ok) {
        const stats = await response.json();
        setRepositoryStats(stats);
      }
    } catch (error) {
      console.error('Failed to fetch repository stats:', error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  // I'm calculating derived metrics and insights
  const getHealthInsights = () => {
    const repo = props.repository;
    const stats = repositoryStats();

    const insights = [];

    if (!repo.description) {
      insights.push({
        type: 'warning',
        message:
          'Missing description - consider adding one for better discoverability',
      });
    }

    if (repo.topics.length === 0) {
      insights.push({
        type: 'info',
        message:
          'No topics defined - adding topics helps with categorization',
      });
    }

    if (!repo.license_name) {
      insights.push({
        type: 'warning',
        message:
          'No license specified - consider adding one for legal clarity',
      });
    }

    if (stats && stats.last_activity_days > 180) {
      insights.push({
        type: 'error',
        message:
          'Repository appears inactive - last activity over 6 months ago',
      });
    }

    if (repo.stargazers_count > 0 && repo.forks_count === 0) {
      insights.push({
        type: 'info',
        message: 'High star-to-fork ratio suggests excellent code quality',
      });
    }

    return insights;
  };

  // I'm formatting various data types for display
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatSize = (sizeKb: number): string => {
    if (sizeKb < 1024) return `${sizeKb} KB`;
    const sizeMb = sizeKb / 1024;
    if (sizeMb < 1024) return `${sizeMb.toFixed(1)} MB`;
    const sizeGb = sizeMb / 1024;
    return `${sizeGb.toFixed(1)} GB`;
  };

  const getLanguageColor = (language: string): string => {
    const colors: Record<string, string> = {
      'JavaScript': '#f1e05a',
      'TypeScript': '#2b7489',
      'Python': '#3572A5',
      'Rust': '#dea584',
      'Go': '#00ADD8',
      'Java': '#b07219',
      'C++': '#f34b7d',
      'C': '#555555',
    };
    return colors[language] || '#586069';
  };

  const healthInsights = getHealthInsights();
  const repo = props.repository;
  const stats = repositoryStats();

  return (
    <div class="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div class="max-w-6xl w-full max-h-[90vh] overflow-hidden rounded-lg bg-black border border-neutral-700">
        {/* Header */}
        <div class="flex items-center justify-between p-6 border-b border-neutral-800">
          <div class="flex-1 min-w-0">
            <h1 class="text-2xl font-mono text-neutral-100 mb-2">
              {repo.name}
            </h1>
            <div class="flex items-center gap-2 text-sm text-neutral-500">
              <span>{repo.full_name}</span>
              <Show when={repo.is_private}>
                <span class="px-2 py-1 bg-yellow-900/30 text-yellow-400 border border-yellow-800 rounded text-xs font-mono">
                  PRIVATE
                </span>
              </Show>
              <Show when={repo.is_fork}>
                <span class="px-2 py-1 bg-blue-900/30 text-blue-400 border border-blue-800 rounded text-xs font-mono">
                  FORK
                </span>
              </Show>
              <Show when={repo.is_archived}>
                <span class="px-2 py-1 bg-neutral-800 text-neutral-500 border border-neutral-700 rounded text-xs font-mono">
                  ARCHIVED
                </span>
              </Show>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <a
              href={repo.html_url}
              target="_blank"
              rel="noopener noreferrer"
              class="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded font-mono text-sm transition-colors duration-200"
            >
              VIEW ON GITHUB ↗
            </a>
            <button
              onClick={props.onClose}
              class="px-4 py-2 bg-transparent border border-neutral-600 hover:border-neutral-500 text-neutral-400 hover:text-neutral-300 rounded font-mono text-sm transition-colors duration-200"
            >
              CLOSE
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div class="flex border-b border-neutral-800">
          {(['overview', 'readme', 'analytics', 'insights'] as const).map(
            (tab) => (
              <button
                onClick={() => setActiveTab(tab)}
                class={`px-6 py-3 font-mono text-sm uppercase tracking-wide transition-colors duration-200 ${
                  activeTab() === tab
                    ? 'bg-neutral-800 text-neutral-200 border-b-2 border-cyan-400'
                    : 'text-neutral-500 hover:text-neutral-300'
                }`}
              >
                {tab}
              </button>
            ),
          )}
        </div>

        {/* Content */}
        <div class="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Overview Tab */}
          <Show when={activeTab() === 'overview'}>
            <div class="grid lg:grid-cols-3 gap-6">
              {/* Main Info */}
              <div class="lg:col-span-2 space-y-6">
                <Show when={repo.description}>
                  <Card>
                    <h3 class="text-lg font-mono text-neutral-300 mb-3">
                      Description
                    </h3>
                    <p class="text-neutral-400 leading-relaxed">
                      {repo.description}
                    </p>
                  </Card>
                </Show>

                {/* Topics */}
                <Show when={repo.topics.length > 0}>
                  <Card>
                    <h3 class="text-lg font-mono text-neutral-300 mb-3">
                      Topics
                    </h3>
                    <div class="flex flex-wrap gap-2">
                      <For each={repo.topics}>
                        {(topic) => (
                          <span class="px-3 py-1 bg-neutral-800 text-neutral-400 rounded font-mono text-sm border border-neutral-700">
                            {topic}
                          </span>
                        )}
                      </For>
                    </div>
                  </Card>
                </Show>

                {/* Clone URLs */}
                <Card>
                  <h3 class="text-lg font-mono text-neutral-300 mb-3">
                    Clone Repository
                  </h3>
                  <div class="space-y-3">
                    <div>
                      <label class="text-xs text-neutral-500 font-mono uppercase block mb-1">
                        HTTPS
                      </label>
                      <div class="flex items-center gap-2">
                        <input
                          type="text"
                          value={repo.clone_url}
                          readonly
                          class="flex-1 bg-neutral-900 border border-neutral-700 rounded px-3 py-2 text-sm font-mono text-neutral-300"
                        />
                        <button
                          onClick={() =>
                            navigator.clipboard.writeText(repo.clone_url)
                          }
                          class="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 rounded text-sm transition-colors duration-200"
                        >
                          COPY
                        </button>
                      </div>
                    </div>
                    <div>
                      <label class="text-xs text-neutral-500 font-mono uppercase block mb-1">
                        SSH
                      </label>
                      <div class="flex items-center gap-2">
                        <input
                          type="text"
                          value={repo.ssh_url}
                          readonly
                          class="flex-1 bg-neutral-900 border border-neutral-700 rounded px-3 py-2 text-sm font-mono text-neutral-300"
                        />
                        <button
                          onClick={() =>
                            navigator.clipboard.writeText(repo.ssh_url)
                          }
                          class="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 rounded text-sm transition-colors duration-200"
                        >
                          COPY
                        </button>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Statistics Sidebar */}
              <div class="space-y-4">
                <MetricCard
                  title="Stars"
                  value={repo.stargazers_count}
                  icon={<span>⭐</span>}
                  description="Developer appreciation"
                />

                <MetricCard
                  title="Forks"
                  value={repo.forks_count}
                  icon={<span>🍴</span>}
                  description="Community contributions"
                />

                <MetricCard
                  title="Watchers"
                  value={repo.watchers_count}
                  icon={<span>👁</span>}
                  description="Active observers"
                />

                <MetricCard
                  title="Open Issues"
                  value={repo.open_issues_count}
                  icon={<span>🐛</span>}
                  description="Pending discussions"
                />

                <MetricCard
                  title="Repository Size"
                  value={formatSize(repo.size_kb)}
                  icon={<span>📦</span>}
                  description="Total codebase size"
                />

                <Show when={repo.language}>
                  <Card>
                    <div class="flex items-center gap-2 mb-2">
                      <div
                        class="w-3 h-3 rounded-full"
                        style={{
                          'background-color': getLanguageColor(
                            repo.language!,
                          ),
                        }}
                      ></div>
                      <span class="text-sm font-mono text-neutral-300">
                        {repo.language}
                      </span>
                    </div>
                    <div class="text-xs text-neutral-500">
                      Primary language
                    </div>
                  </Card>
                </Show>

                <Show when={repo.license_name}>
                  <StatusCard
                    status="healthy"
                    title="License"
                    message={repo.license_name}
                  />
                </Show>

                <Card>
                  <div class="space-y-2 text-sm">
                    <div class="flex justify-between">
                      <span class="text-neutral-500">Created:</span>
                      <span class="text-neutral-400">
                        {formatDate(repo.created_at)}
                      </span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-neutral-500">Updated:</span>
                      <span class="text-neutral-400">
                        {formatDate(repo.updated_at)}
                      </span>
                    </div>
                    <Show when={repo.pushed_at}>
                      <div class="flex justify-between">
                        <span class="text-neutral-500">Last Push:</span>
                        <span class="text-neutral-400">
                          {formatDate(repo.pushed_at!)}
                        </span>
                      </div>
                    </Show>
                  </div>
                </Card>
              </div>
            </div>
          </Show>

          {/* README Tab */}
          <Show when={activeTab() === 'readme'}>
            <Card>
              <Show
                when={repo.readme_content}
                fallback={
                  <div class="text-center py-12">
                    <div class="text-neutral-500 font-mono mb-2">
                      No README available
                    </div>
                    <div class="text-neutral-600 text-sm">
                      This repository doesn't have a README file.
                    </div>
                  </div>
                }
              >
                <div class="prose prose-invert max-w-none">
                  <pre class="bg-neutral-900 p-4 rounded text-sm text-neutral-300 whitespace-pre-wrap">
                    {repo.readme_content}
                  </pre>
                </div>
              </Show>
            </Card>
          </Show>

          {/* Analytics Tab */}
          <Show when={activeTab() === 'analytics'}>
            <Show when={isLoadingStats()}>
              <div class="flex justify-center py-12">
                <LoadingSpinner message="Loading repository analytics..." />
              </div>
            </Show>

            <Show when={!isLoadingStats() && stats}>
              <div class="grid lg:grid-cols-2 gap-6">
                <MetricCard
                  title="Activity Score"
                  value={stats!.activity_score.toFixed(1)}
                  unit="/100"
                  description="Overall repository activity"
                />

                <MetricCard
                  title="Health Score"
                  value={stats!.health_score.toFixed(1)}
                  unit="/100"
                  description="Repository maintenance quality"
                />

                <MetricCard
                  title="Contributors"
                  value={stats!.contributors_count}
                  description="Unique contributors"
                />

                <MetricCard
                  title="Issue Ratio"
                  value={`${(stats!.issues_ratio * 100).toFixed(1)}%`}
                  description="Open vs total issues"
                />

                <MetricCard
                  title="Fork Ratio"
                  value={stats!.fork_ratio.toFixed(2)}
                  description="Forks per star"
                />

                <MetricCard
                  title="Last Activity"
                  value={stats!.last_activity_days}
                  unit="days ago"
                  description="Days since last commit"
                />
              </div>
            </Show>
          </Show>

          {/* Insights Tab */}
          <Show when={activeTab() === 'insights'}>
            <div class="space-y-6">
              <Card>
                <h3 class="text-lg font-mono text-neutral-300 mb-4">
                  Repository Health Analysis
                </h3>
                <Show
                  when={healthInsights.length > 0}
                  fallback={
                    <div class="text-center py-8">
                      <div class="text-green-400 text-2xl mb-2">✓</div>
                      <div class="text-neutral-300 font-mono">
                        All health checks passed
                      </div>
                      <div class="text-neutral-500 text-sm mt-1">
                        This repository follows best practices
                      </div>
                    </div>
                  }
                >
                  <div class="space-y-3">
                    <For each={healthInsights}>
                      {(insight) => (
                        <div
                          class={`p-3 rounded border-l-4 ${
                            insight.type === 'error'
                              ? 'bg-red-900/20 border-red-500 text-red-300'
                              : insight.type === 'warning'
                                ? 'bg-yellow-900/20 border-yellow-500 text-yellow-300'
                                : 'bg-blue-900/20 border-blue-500 text-blue-300'
                          }`}
                        >
                          <div class="text-sm">{insight.message}</div>
                        </div>
                      )}
                    </For>
                  </div>
                </Show>
              </Card>

              <Card>
                <h3 class="text-lg font-mono text-neutral-300 mb-4">
                  Performance Insights
                </h3>
                <div class="space-y-4">
                  <div class="bg-neutral-900/50 rounded p-4">
                    <div class="text-sm text-neutral-400 mb-2">
                      Engagement Analysis
                    </div>
                    <div class="text-xs text-neutral-500">
                      This repository has {repo.stargazers_count} stars and{' '}
                      {repo.forks_count} forks, indicating{' '}
                      {repo.forks_count > repo.stargazers_count * 0.1
                        ? 'high'
                        : 'moderate'}{' '}
                      community engagement. The star-to-fork ratio suggests
                      the code is{' '}
                      {repo.forks_count === 0 && repo.stargazers_count > 0
                        ? 'viewed more than modified'
                        : 'actively used and modified'}
                      .
                    </div>
                  </div>

                  <div class="bg-neutral-900/50 rounded p-4">
                    <div class="text-sm text-neutral-400 mb-2">
                      Maintenance Status
                    </div>
                    <div class="text-xs text-neutral-500">
                      Last updated {formatDate(repo.updated_at)}.
                      {repo.is_archived
                        ? ' This repository is archived and no longer actively maintained.'
                        : ' The repository appears to be actively maintained.'}
                    </div>
                  </div>

                  <div class="bg-neutral-900/50 rounded p-4">
                    <div class="text-sm text-neutral-400 mb-2">
                      Technical Assessment
                    </div>
                    <div class="text-xs text-neutral-500">
                      Repository size: {formatSize(repo.size_kb)}.
                      {repo.size_kb > 100000
                        ? ' Large codebase indicating comprehensive project.'
                        : repo.size_kb > 10000
                          ? ' Medium-sized project with substantial code.'
                          : ' Compact codebase, likely focused or minimal project.'}
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </Show>
        </div>
      </div>
    </div>
  );
};
