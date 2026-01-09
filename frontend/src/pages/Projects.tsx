/*
 * Projects showcase page displaying GitHub repositories with sophisticated filtering and dark aesthetic presentation.
 * I'm implementing a comprehensive repository browser that embodies the contemplative, eerie theme while providing powerful functionality.
 */

import {
  type Component,
  createSignal,
  createMemo,
  Show,
  For,
  onMount,
} from 'solid-js';
import { useGitHub, type Repository } from '../hooks/useGitHub';

export default function Projects(): Component {
  const github = useGitHub();
  const [searchTerm, setSearchTerm] = createSignal('');
  const [selectedLanguage, setSelectedLanguage] = createSignal<string>('');
  const [sortBy, setSortBy] = createSignal<string>('updated');
  const [viewMode, setViewMode] = createSignal<'grid' | 'list'>('grid');
  const [showArchived, setShowArchived] = createSignal(false);
  const [isVisible, setIsVisible] = createSignal(false);

  const filteredRepositories = createMemo(() => {
    let repos = github.repositories();

    const search = searchTerm().toLowerCase();
    if (search) {
      repos = repos.filter(
        (repo) =>
          repo.name.toLowerCase().includes(search) ||
          (repo.description &&
            repo.description.toLowerCase().includes(search)) ||
          repo.topics.some((topic) => topic.toLowerCase().includes(search)),
      );
    }

    const language = selectedLanguage();
    if (language && language !== 'all') {
      repos = repos.filter((repo) => repo.language === language);
    }

    if (!showArchived()) {
      repos = repos.filter((repo) => !repo.is_archived);
    }

    const sort = sortBy();
    repos.sort((a, b) => {
      switch (sort) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'stars':
          return b.stargazers_count - a.stargazers_count;
        case 'forks':
          return b.forks_count - a.forks_count;
        case 'updated':
          return (
            new Date(b.updated_at).getTime() -
            new Date(a.updated_at).getTime()
          );
        case 'created':
          return (
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime()
          );
        case 'size':
          return b.size_kb - a.size_kb;
        default:
          return 0;
      }
    });

    return repos;
  });

  const availableLanguages = createMemo(() => {
    const languages = new Set<string>();
    github.allRepositories().forEach((repo) => {
      if (repo.language) {
        languages.add(repo.language);
      }
    });
    return Array.from(languages).sort();
  });

  onMount(() => {
    github.refreshRepositories();

    setTimeout(() => setIsVisible(true), 10);
  });

  const getLanguageColor = (language: string): string => {
    return github.utils.getLanguageColor(language);
  };

  const formatRelativeTime = (dateString: string): string => {
    return github.utils.formatRelativeTime(dateString);
  };

  const formatSize = (sizeKb: number): string => {
    return github.utils.formatSize(sizeKb);
  };

  const getHealthStatus = (repo: Repository): string => {
    return github.utils.getHealthStatus(repo);
  };

  const getActivityScore = (repo: Repository): number => {
    return github.utils.calculateActivityScore(repo);
  };

  return (
    <div class="min-h-screen pt-14">
      <div
        class={`transition-all duration-50 ${isVisible() ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
      >
        <section
          class="py-16"
          style={{
            'background-color': 'hsl(0, 0%, 7.1%)',
            'background-image':
              'radial-gradient(circle, hsl(0, 0%, 11%) 1px, transparent 1px)',
            'background-size': '22px 22px',
          }}
        >
          <div class="container-custom text-center mb-10">
            <div class="inline-block mb-6">
              <span class="px-2.5 py-1 bg-[hsl(0,0%,12.2%)] border border-[hsl(0,0%,18%)] rounded text-xs font-mono text-[hsl(0,0%,53.7%)]">
                Live GitHub API
              </span>
            </div>
            <h1 class="text-2xl md:text-3xl font-semibold text-[hsl(0,0%,98%)] mb-4">
              Projects
            </h1>
            <p class="text-sm text-[hsl(0,0%,70.6%)] max-w-xl mx-auto leading-relaxed">
              Real-time repository data powered by GitHub API with WebSocket
              updates.
            </p>
          </div>

          {/* Statistics Bar */}
          <Show when={github.statistics()}>
            <div class="container-custom">
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div class="bg-[hsl(0,0%,12.2%)] border border-[hsl(0,0%,18%)] rounded-md p-4 text-center">
                  <div class="text-lg font-mono font-semibold text-[hsl(0,0%,98%)] mb-1">
                    {github.statistics().totalRepositories}
                  </div>
                  <div class="text-xs text-[hsl(0,0%,53.7%)]">
                    Repositories
                  </div>
                </div>

                <div class="bg-[hsl(0,0%,12.2%)] border border-[hsl(0,0%,18%)] rounded-md p-4 text-center">
                  <div class="text-lg font-mono font-semibold text-[hsl(0,0%,98%)] mb-1">
                    {github.statistics().totalStars}
                  </div>
                  <div class="text-xs text-[hsl(0,0%,53.7%)]">
                    Total Stars
                  </div>
                </div>

                <div class="bg-[hsl(0,0%,12.2%)] border border-[hsl(0,0%,18%)] rounded-md p-4 text-center">
                  <div class="text-lg font-mono font-semibold text-[hsl(0,0%,98%)] mb-1">
                    {github.statistics().languages.length}
                  </div>
                  <div class="text-xs text-[hsl(0,0%,53.7%)]">Languages</div>
                </div>

                <div class="bg-[hsl(0,0%,12.2%)] border border-[hsl(0,0%,18%)] rounded-md p-4 text-center">
                  <div class="text-lg font-mono font-semibold text-[hsl(0,0%,98%)] mb-1">
                    {github.statistics().activeProjects}
                  </div>
                  <div class="text-xs text-[hsl(0,0%,53.7%)]">Active</div>
                </div>
              </div>
            </div>
          </Show>
        </section>

        {/* Filters and Controls */}
        <section
          class="border-t border-[hsl(0,0%,18%)] py-6"
          style={{
            'background-color': 'hsl(0, 0%, 9%)',
            'background-image':
              'radial-gradient(circle, hsl(0, 0%, 12.2%) 1px, transparent 1px)',
            'background-size': '20px 20px',
          }}
        >
          <div class="container-custom">
            <div class="bg-[hsl(0,0%,12.2%)] border border-[hsl(0,0%,18%)] rounded-md p-4">
              <div class="grid md:grid-cols-4 gap-3 mb-3">
                <div class="md:col-span-2">
                  <input
                    type="text"
                    placeholder="Search repositories..."
                    value={searchTerm()}
                    onInput={(e) => setSearchTerm(e.currentTarget.value)}
                    class="w-full bg-[hsl(0,0%,7.1%)] border border-[hsl(0,0%,21.2%)] rounded px-3 py-2 text-[hsl(0,0%,98%)] placeholder-[hsl(0,0%,30.2%)] focus:border-[#C15F3C] focus:outline-none font-mono text-sm transition-colors duration-100"
                  />
                </div>

                <div>
                  <select
                    value={selectedLanguage()}
                    onChange={(e) =>
                      setSelectedLanguage(e.currentTarget.value)
                    }
                    class="w-full bg-[hsl(0,0%,7.1%)] border border-[hsl(0,0%,21.2%)] rounded px-3 py-2 text-[hsl(0,0%,98%)] focus:border-[#C15F3C] focus:outline-none font-mono text-sm transition-colors duration-100"
                  >
                    <option value="">All Languages</option>
                    <For each={availableLanguages()}>
                      {(language) => (
                        <option value={language}>{language}</option>
                      )}
                    </For>
                  </select>
                </div>

                <div>
                  <select
                    value={sortBy()}
                    onChange={(e) => setSortBy(e.currentTarget.value)}
                    class="w-full bg-[hsl(0,0%,7.1%)] border border-[hsl(0,0%,21.2%)] rounded px-3 py-2 text-[hsl(0,0%,98%)] focus:border-[#C15F3C] focus:outline-none font-mono text-sm transition-colors duration-100"
                  >
                    <option value="updated">Recently Updated</option>
                    <option value="created">Recently Created</option>
                    <option value="stars">Most Stars</option>
                    <option value="forks">Most Forks</option>
                    <option value="name">Name</option>
                    <option value="size">Size</option>
                  </select>
                </div>
              </div>

              <div class="flex justify-between items-center">
                <div class="flex items-center gap-4">
                  <label class="flex items-center gap-2 text-xs text-[hsl(0,0%,53.7%)] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showArchived()}
                      onChange={(e) =>
                        setShowArchived(e.currentTarget.checked)
                      }
                      class="w-4 h-4 bg-[hsl(0,0%,7.1%)] border border-[hsl(0,0%,21.2%)] rounded"
                    />
                    Include archived
                  </label>

                  <div class="text-xs text-[hsl(0,0%,30.2%)] font-mono">
                    {filteredRepositories().length} repositories
                  </div>
                </div>

                <div class="flex items-center gap-2">
                  <button
                    onClick={() => setViewMode('grid')}
                    class={`p-2 rounded border transition-colors duration-100 ${
                      viewMode() === 'grid'
                        ? 'border-[hsl(0,0%,27.1%)] bg-[hsl(0,0%,19.2%)] text-[hsl(0,0%,98%)]'
                        : 'border-[hsl(0,0%,18%)] text-[hsl(0,0%,53.7%)] hover:text-[hsl(0,0%,98%)]'
                    }`}
                  >
                    <div class="w-4 h-4 grid grid-cols-2 gap-0.5">
                      <div class="bg-current rounded-sm"></div>
                      <div class="bg-current rounded-sm"></div>
                      <div class="bg-current rounded-sm"></div>
                      <div class="bg-current rounded-sm"></div>
                    </div>
                  </button>

                  <button
                    onClick={() => setViewMode('list')}
                    class={`p-2 rounded border transition-colors duration-100 ${
                      viewMode() === 'list'
                        ? 'border-[hsl(0,0%,27.1%)] bg-[hsl(0,0%,19.2%)] text-[hsl(0,0%,98%)]'
                        : 'border-[hsl(0,0%,18%)] text-[hsl(0,0%,53.7%)] hover:text-[hsl(0,0%,98%)]'
                    }`}
                  >
                    <div class="w-4 h-4 flex flex-col gap-1">
                      <div class="h-0.5 bg-current rounded-sm"></div>
                      <div class="h-0.5 bg-current rounded-sm"></div>
                      <div class="h-0.5 bg-current rounded-sm"></div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Loading State */}
        <Show when={github.isLoading()}>
          <div class="container-custom py-16 text-center">
            <div class="w-12 h-12 border-2 border-[hsl(0,0%,18%)] border-t-[#C15F3C] rounded-full animate-spin mx-auto mb-4"></div>
            <div class="text-[hsl(0,0%,53.7%)] font-mono text-sm">
              Loading repositories...
            </div>
          </div>
        </Show>

        {/* Error State */}
        <Show when={github.error()}>
          <div class="container-custom py-16 text-center">
            <div class="bg-[hsl(0,0%,12.2%)] border border-[hsl(0,0%,18%)] rounded-md p-6 max-w-md mx-auto">
              <div class="text-[hsl(0,0%,70.6%)] font-mono text-sm mb-2">
                Error
              </div>
              <div class="text-[hsl(0,0%,53.7%)] text-sm mb-4">
                {github.error()}
              </div>
              <button
                onClick={() => github.refreshRepositories()}
                class="btn btn-primary text-sm"
              >
                Retry
              </button>
            </div>
          </div>
        </Show>

        {/* Repositories Display */}
        <section
          class="border-t border-[hsl(0,0%,18%)] py-10"
          style={{
            'background-color': 'hsl(0, 0%, 5.9%)',
            'background-image':
              'radial-gradient(circle, hsl(0, 0%, 9%) 1px, transparent 1px)',
            'background-size': '22px 22px',
          }}
        >
          <div class="container-custom">
            <Show when={!github.isLoading() && !github.error()}>
              <Show
                when={filteredRepositories().length > 0}
                fallback={
                  <div class="text-center py-16">
                    <div class="text-[hsl(0,0%,53.7%)] font-mono text-sm mb-2">
                      No repositories found
                    </div>
                    <div class="text-[hsl(0,0%,30.2%)] text-xs">
                      Try adjusting your filters or search terms.
                    </div>
                  </div>
                }
              >
                <div
                  class={
                    viewMode() === 'grid'
                      ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-4'
                      : 'space-y-3'
                  }
                >
                  <For each={filteredRepositories()}>
                    {(repo) => (
                      <RepositoryCard
                        repository={repo}
                        viewMode={viewMode()}
                        onSelect={() =>
                          github.getRepositoryDetails(repo.owner, repo.name)
                        }
                      />
                    )}
                  </For>
                </div>
              </Show>
            </Show>
          </div>
        </section>

        {/* Rate Limit Warning */}
        <Show
          when={
            github.rateLimit()?.status === 'warning' ||
            github.rateLimit()?.status === 'critical'
          }
        >
          <div class="fixed bottom-4 right-4 bg-[hsl(0,0%,12.2%)] border border-[hsl(0,0%,18%)] rounded-md p-3 max-w-xs">
            <div class="text-[#C15F3C] font-mono text-xs mb-1">
              Rate Limit {github.rateLimit()?.status}
            </div>
            <div class="text-[hsl(0,0%,53.7%)] text-xs">
              {github.rateLimit()?.remaining} / {github.rateLimit()?.limit}{' '}
              remaining
            </div>
          </div>
        </Show>
      </div>
    </div>
  );
}

// Repository Card Component
interface RepositoryCardProps {
  repository: Repository;
  viewMode: 'grid' | 'list';
  onSelect: () => void;
}

const RepositoryCard: Component<RepositoryCardProps> = (props) => {
  const repo = () => props.repository;
  const github = useGitHub();

  const healthStatus = () => github.utils.getHealthStatus(repo());
  const languageColor = () =>
    repo().language
      ? github.utils.getLanguageColor(repo().language)
      : '#586069';

  const healthColors = {
    excellent: 'text-green-400',
    good: 'text-blue-400',
    fair: 'text-[#C15F3C]',
    poor: 'text-[hsl(0,0%,53.7%)]',
  };

  if (props.viewMode === 'list') {
    return (
      <div
        class="bg-[hsl(0,0%,12.2%)] border border-[hsl(0,0%,18%)] rounded-md p-4 cursor-pointer transition-[filter] duration-100 hover:brightness-110"
        onClick={props.onSelect}
      >
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="flex items-center gap-3 mb-2">
              <h3 class="font-mono text-sm font-medium text-[hsl(0,0%,98%)]">
                {repo().name}
              </h3>
              <Show when={repo().is_private}>
                <span class="text-xs px-1.5 py-0.5 bg-[hsl(0,0%,14.1%)] text-[#C15F3C] border border-[hsl(0,0%,18%)] rounded font-mono">
                  private
                </span>
              </Show>
              <Show when={repo().is_archived}>
                <span class="text-xs px-1.5 py-0.5 bg-[hsl(0,0%,14.1%)] text-[hsl(0,0%,53.7%)] border border-[hsl(0,0%,18%)] rounded font-mono">
                  archived
                </span>
              </Show>
            </div>

            <Show when={repo().description}>
              <p class="text-[hsl(0,0%,53.7%)] text-xs mb-3 line-clamp-2">
                {repo().description}
              </p>
            </Show>

            <div class="flex items-center gap-4 text-xs text-[hsl(0,0%,53.7%)]">
              <Show when={repo().language}>
                <div class="flex items-center gap-1.5">
                  <div
                    class="w-2 h-2 rounded-full"
                    style={`background-color: ${languageColor()}`}
                  ></div>
                  <span>{repo().language}</span>
                </div>
              </Show>

              <Show when={repo().stargazers_count > 0}>
                <div class="flex items-center gap-1">
                  <svg
                    class="w-3 h-3"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  <span>{repo().stargazers_count}</span>
                </div>
              </Show>

              <span class="text-[hsl(0,0%,30.2%)]">
                {github.utils.formatRelativeTime(repo().updated_at)}
              </span>
            </div>
          </div>

          <div class="flex flex-col items-end gap-1">
            <div class={`text-xs font-mono ${healthColors[healthStatus()]}`}>
              {healthStatus()}
            </div>
            <div class="text-xs text-[hsl(0,0%,30.2%)] font-mono">
              {github.utils.formatSize(repo().size_kb)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      class="bg-[hsl(0,0%,12.2%)] border border-[hsl(0,0%,18%)] rounded-md p-4 cursor-pointer transition-[filter] duration-100 hover:brightness-110"
      onClick={props.onSelect}
    >
      <div class="flex items-start justify-between mb-3">
        <h3 class="font-mono text-sm font-medium text-[hsl(0,0%,98%)] truncate">
          {repo().name}
        </h3>
        <div class="flex gap-1.5">
          <Show when={repo().is_private}>
            <div class="w-2 h-2 bg-[#C15F3C] rounded-full"></div>
          </Show>
          <Show when={repo().is_archived}>
            <div class="w-2 h-2 bg-[hsl(0,0%,30.2%)] rounded-full"></div>
          </Show>
        </div>
      </div>

      <Show when={repo().description}>
        <p class="text-[hsl(0,0%,53.7%)] text-xs mb-3 line-clamp-2 leading-relaxed">
          {repo().description}
        </p>
      </Show>

      <div class="flex items-center gap-3 mb-3 text-xs">
        <Show when={repo().language}>
          <div class="flex items-center gap-1.5">
            <div
              class="w-2 h-2 rounded-full"
              style={`background-color: ${languageColor()}`}
            ></div>
            <span class="text-[hsl(0,0%,53.7%)]">{repo().language}</span>
          </div>
        </Show>

        <Show when={repo().stargazers_count > 0}>
          <div class="flex items-center gap-1 text-[hsl(0,0%,53.7%)]">
            <svg
              class="w-3 h-3"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            <span>{repo().stargazers_count}</span>
          </div>
        </Show>
      </div>

      <div class="flex items-center justify-between text-xs">
        <div class="text-[hsl(0,0%,30.2%)]">
          {github.utils.formatRelativeTime(repo().updated_at)}
        </div>

        <div class="flex items-center gap-2">
          <div class={`font-mono ${healthColors[healthStatus()]}`}>
            {healthStatus()}
          </div>
          <div class="text-[hsl(0,0%,30.2%)] font-mono">
            {github.utils.formatSize(repo().size_kb)}
          </div>
        </div>
      </div>

      <Show when={repo().topics.length > 0}>
        <div class="flex flex-wrap gap-1 mt-3">
          <For each={repo().topics.slice(0, 3)}>
            {(topic) => (
              <span class="text-xs px-1.5 py-0.5 bg-[hsl(0,0%,7.1%)] text-[hsl(0,0%,53.7%)] border border-[hsl(0,0%,18%)] rounded font-mono">
                {topic}
              </span>
            )}
          </For>
          <Show when={repo().topics.length > 3}>
            <span class="text-xs px-1.5 py-0.5 text-[hsl(0,0%,30.2%)] font-mono">
              +{repo().topics.length - 3}
            </span>
          </Show>
        </div>
      </Show>
    </div>
  );
};
