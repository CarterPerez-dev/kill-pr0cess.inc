/*
 * Projects showcase page displaying GitHub repositories with sophisticated filtering and dark aesthetic presentation.
 * I'm implementing a comprehensive repository browser that embodies the contemplative, eerie theme while providing powerful functionality.
 */

import { Component, createSignal, createMemo, Show, For, onMount } from 'solid-js';
import { useGitHub, Repository } from '../hooks/useGitHub';

export default function Projects(): Component {
  const github = useGitHub();
  const [searchTerm, setSearchTerm] = createSignal('');
  const [selectedLanguage, setSelectedLanguage] = createSignal<string>('');
  const [sortBy, setSortBy] = createSignal<string>('updated');
  const [viewMode, setViewMode] = createSignal<'grid' | 'list'>('grid');
  const [showArchived, setShowArchived] = createSignal(false);
  const [isVisible, setIsVisible] = createSignal(false);

  // I'm implementing sophisticated filtering logic for repository discovery
  const filteredRepositories = createMemo(() => {
    let repos = github.repositories();
    
    // Apply search filter
    const search = searchTerm().toLowerCase();
    if (search) {
      repos = repos.filter(repo => 
        repo.name.toLowerCase().includes(search) ||
        (repo.description && repo.description.toLowerCase().includes(search)) ||
        repo.topics.some(topic => topic.toLowerCase().includes(search))
      );
    }
    
    // Apply language filter
    const language = selectedLanguage();
    if (language && language !== 'all') {
      repos = repos.filter(repo => repo.language === language);
    }
    
    // Apply archived filter
    if (!showArchived()) {
      repos = repos.filter(repo => !repo.is_archived);
    }
    
    // Apply sorting
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
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        case 'created':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'size':
          return b.size_kb - a.size_kb;
        default:
          return 0;
      }
    });
    
    return repos;
  });

  // Get unique languages for filter dropdown
  const availableLanguages = createMemo(() => {
    const languages = new Set<string>();
    github.allRepositories().forEach(repo => {
      if (repo.language) {
        languages.add(repo.language);
      }
    });
    return Array.from(languages).sort();
  });

  onMount(() => {
    // I'm triggering the initial data fetch
    github.refreshRepositories();
    
    // Entrance animation
    setTimeout(() => setIsVisible(true), 100);
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
    <div class="min-h-screen bg-black text-neutral-100">
      {/* Atmospheric background */}
      <div class="absolute inset-0 opacity-10">
        <div class="absolute top-1/3 left-1/6 w-64 h-64 bg-blue-900/20 rounded-full blur-3xl animate-pulse" style="animation-duration: 8s"></div>
        <div class="absolute bottom-1/3 right-1/6 w-48 h-48 bg-purple-900/20 rounded-full blur-3xl animate-pulse" style="animation-duration: 12s; animation-delay: 4s"></div>
      </div>

      <div class={`relative z-10 transition-all duration-1000 ${isVisible() ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        {/* Header Section */}
        <section class="container mx-auto px-6 pt-24 pb-12">
          <div class="max-w-4xl mx-auto text-center mb-12">
            <h1 class="text-5xl md:text-7xl font-thin tracking-wider mb-6 text-neutral-100">
              REPOSITORIES
            </h1>
            <p class="text-lg text-neutral-400 max-w-2xl mx-auto leading-relaxed">
              Digital artifacts of computational exploration. Each repository a question posed to the void, 
              each commit a step deeper into the labyrinth of logic.
            </p>
          </div>

          {/* Statistics Bar */}
          <Show when={github.statistics()}>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
              <div class="bg-neutral-900/30 border border-neutral-800 rounded-sm p-4 text-center">
                <div class="text-2xl font-mono text-neutral-100 mb-1">
                  {github.statistics().totalRepositories}
                </div>
                <div class="text-xs text-neutral-500 tracking-wide">REPOSITORIES</div>
              </div>
              
              <div class="bg-neutral-900/30 border border-neutral-800 rounded-sm p-4 text-center">
                <div class="text-2xl font-mono text-neutral-100 mb-1">
                  {github.statistics().totalStars}
                </div>
                <div class="text-xs text-neutral-500 tracking-wide">TOTAL STARS</div>
              </div>
              
              <div class="bg-neutral-900/30 border border-neutral-800 rounded-sm p-4 text-center">
                <div class="text-2xl font-mono text-neutral-100 mb-1">
                  {github.statistics().languages.length}
                </div>
                <div class="text-xs text-neutral-500 tracking-wide">LANGUAGES</div>
              </div>
              
              <div class="bg-neutral-900/30 border border-neutral-800 rounded-sm p-4 text-center">
                <div class="text-2xl font-mono text-neutral-100 mb-1">
                  {github.statistics().activeProjects}
                </div>
                <div class="text-xs text-neutral-500 tracking-wide">ACTIVE</div>
              </div>
            </div>
          </Show>
        </section>

        {/* Filters and Controls */}
        <section class="container mx-auto px-6 mb-8">
          <div class="bg-neutral-900/20 border border-neutral-800 rounded-lg p-6 backdrop-blur-sm">
            <div class="grid md:grid-cols-4 gap-4 mb-4">
              {/* Search */}
              <div class="md:col-span-2">
                <input
                  type="text"
                  placeholder="Search repositories, descriptions, topics..."
                  value={searchTerm()}
                  onInput={(e) => setSearchTerm(e.currentTarget.value)}
                  class="w-full bg-black/50 border border-neutral-700 rounded-sm px-4 py-2 text-neutral-100 placeholder-neutral-600 focus:border-neutral-500 focus:outline-none font-mono text-sm"
                />
              </div>

              {/* Language Filter */}
              <div>
                <select
                  value={selectedLanguage()}
                  onChange={(e) => setSelectedLanguage(e.currentTarget.value)}
                  class="w-full bg-black/50 border border-neutral-700 rounded-sm px-4 py-2 text-neutral-100 focus:border-neutral-500 focus:outline-none font-mono text-sm"
                >
                  <option value="">All Languages</option>
                  <For each={availableLanguages()}>
                    {(language) => (
                      <option value={language}>{language}</option>
                    )}
                  </For>
                </select>
              </div>

              {/* Sort */}
              <div>
                <select
                  value={sortBy()}
                  onChange={(e) => setSortBy(e.currentTarget.value)}
                  class="w-full bg-black/50 border border-neutral-700 rounded-sm px-4 py-2 text-neutral-100 focus:border-neutral-500 focus:outline-none font-mono text-sm"
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
                <label class="flex items-center gap-2 text-sm text-neutral-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showArchived()}
                    onChange={(e) => setShowArchived(e.currentTarget.checked)}
                    class="w-4 h-4 bg-black border border-neutral-600 rounded text-neutral-100 focus:ring-0"
                  />
                  Include archived
                </label>

                <div class="text-xs text-neutral-600 font-mono">
                  {filteredRepositories().length} repositories
                </div>
              </div>

              <div class="flex items-center gap-2">
                <button
                  onClick={() => setViewMode('grid')}
                  class={`p-2 rounded-sm border transition-colors duration-200 ${
                    viewMode() === 'grid' 
                      ? 'border-neutral-500 bg-neutral-800 text-neutral-100' 
                      : 'border-neutral-700 text-neutral-500 hover:text-neutral-300'
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
                  class={`p-2 rounded-sm border transition-colors duration-200 ${
                    viewMode() === 'list' 
                      ? 'border-neutral-500 bg-neutral-800 text-neutral-100' 
                      : 'border-neutral-700 text-neutral-500 hover:text-neutral-300'
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
        </section>

        {/* Loading State */}
        <Show when={github.isLoading()}>
          <div class="container mx-auto px-6 py-20 text-center">
            <div class="w-16 h-16 border-2 border-neutral-600 border-t-neutral-300 rounded-full animate-spin mx-auto mb-4"></div>
            <div class="text-neutral-500 font-mono text-sm">
              Retrieving digital artifacts...
            </div>
          </div>
        </Show>

        {/* Error State */}
        <Show when={github.error()}>
          <div class="container mx-auto px-6 py-20 text-center">
            <div class="bg-red-900/20 border border-red-800 rounded-lg p-8 max-w-md mx-auto">
              <div class="text-red-400 font-mono text-lg mb-2">ERROR</div>
              <div class="text-neutral-300 text-sm mb-4">{github.error()}</div>
              <button
                onClick={() => github.refreshRepositories()}
                class="bg-red-800 hover:bg-red-700 text-white px-4 py-2 rounded-sm font-mono text-sm transition-colors duration-200"
              >
                RETRY
              </button>
            </div>
          </div>
        </Show>

        {/* Repositories Display */}
        <section class="container mx-auto px-6 pb-20">
          <Show when={!github.isLoading() && !github.error()}>
            <Show when={filteredRepositories().length > 0} fallback={
              <div class="text-center py-20">
                <div class="text-neutral-500 font-mono text-lg mb-4">
                  No repositories found matching your criteria.
                </div>
                <div class="text-neutral-600 text-sm">
                  Try adjusting your filters or search terms.
                </div>
              </div>
            }>
              <div class={viewMode() === 'grid' 
                ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-6'
                : 'space-y-4'
              }>
                <For each={filteredRepositories()}>
                  {(repo) => (
                    <RepositoryCard 
                      repository={repo} 
                      viewMode={viewMode()}
                      onSelect={() => github.getRepositoryDetails(repo.owner, repo.name)}
                    />
                  )}
                </For>
              </div>
            </Show>
          </Show>
        </section>

        {/* Rate Limit Warning */}
        <Show when={github.rateLimit()?.status === 'warning' || github.rateLimit()?.status === 'critical'}>
          <div class="fixed bottom-4 right-4 bg-yellow-900/90 border border-yellow-700 rounded-lg p-4 max-w-sm backdrop-blur-sm">
            <div class="text-yellow-400 font-mono text-sm mb-2">
              API RATE LIMIT {github.rateLimit()?.status.toUpperCase()}
            </div>
            <div class="text-neutral-300 text-xs">
              {github.rateLimit()?.remaining} / {github.rateLimit()?.limit} requests remaining
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
  const activityScore = () => github.utils.calculateActivityScore(repo());
  const languageColor = () => repo().language ? github.utils.getLanguageColor(repo().language) : '#586069';

  const healthColors = {
    excellent: 'text-green-400',
    good: 'text-blue-400',
    fair: 'text-yellow-400',
    poor: 'text-red-400',
  };

  if (props.viewMode === 'list') {
    return (
      <div class="bg-neutral-900/30 border border-neutral-800 rounded-sm p-4 hover:border-neutral-700 transition-all duration-300 cursor-pointer"
           onClick={props.onSelect}>
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="flex items-center gap-3 mb-2">
              <h3 class="font-mono text-lg text-neutral-100 hover:text-white transition-colors">
                {repo().name}
              </h3>
              <Show when={repo().is_private}>
                <span class="text-xs px-2 py-1 bg-yellow-900/30 text-yellow-400 border border-yellow-800 rounded-sm font-mono">
                  PRIVATE
                </span>
              </Show>
              <Show when={repo().is_archived}>
                <span class="text-xs px-2 py-1 bg-neutral-800 text-neutral-500 border border-neutral-700 rounded-sm font-mono">
                  ARCHIVED
                </span>
              </Show>
            </div>
            
            <Show when={repo().description}>
              <p class="text-neutral-400 text-sm mb-3 line-clamp-2">
                {repo().description}
              </p>
            </Show>
            
            <div class="flex items-center gap-4 text-xs text-neutral-500">
              <Show when={repo().language}>
                <div class="flex items-center gap-1">
                  <div class="w-3 h-3 rounded-full" style={`background-color: ${languageColor()}`}></div>
                  <span>{repo().language}</span>
                </div>
              </Show>
              
              <Show when={repo().stargazers_count > 0}>
                <div class="flex items-center gap-1">
                  <span>⭐</span>
                  <span>{repo().stargazers_count}</span>
                </div>
              </Show>
              
              <Show when={repo().forks_count > 0}>
                <div class="flex items-center gap-1">
                  <span>🍴</span>
                  <span>{repo().forks_count}</span>
                </div>
              </Show>
              
              <span>Updated {github.utils.formatRelativeTime(repo().updated_at)}</span>
            </div>
          </div>
          
          <div class="flex flex-col items-end gap-2">
            <div class={`text-xs font-mono ${healthColors[healthStatus()]}`}>
              {healthStatus().toUpperCase()}
            </div>
            <div class="text-xs text-neutral-600 font-mono">
              {github.utils.formatSize(repo().size_kb)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div class="bg-neutral-900/30 border border-neutral-800 rounded-lg p-6 hover:border-neutral-700 transition-all duration-300 cursor-pointer group"
         onClick={props.onSelect}>
      <div class="flex items-start justify-between mb-4">
        <h3 class="font-mono text-xl text-neutral-100 group-hover:text-white transition-colors truncate">
          {repo().name}
        </h3>
        <div class="flex gap-2">
          <Show when={repo().is_private}>
            <div class="w-2 h-2 bg-yellow-500 rounded-full"></div>
          </Show>
          <Show when={repo().is_archived}>
            <div class="w-2 h-2 bg-neutral-600 rounded-full"></div>
          </Show>
        </div>
      </div>
      
      <Show when={repo().description}>
        <p class="text-neutral-400 text-sm mb-4 line-clamp-3 leading-relaxed">
          {repo().description}
        </p>
      </Show>
      
      <div class="flex items-center gap-3 mb-4 text-xs">
        <Show when={repo().language}>
          <div class="flex items-center gap-1">
            <div class="w-2 h-2 rounded-full" style={`background-color: ${languageColor()}`}></div>
            <span class="text-neutral-500">{repo().language}</span>
          </div>
        </Show>
        
        <Show when={repo().stargazers_count > 0}>
          <div class="flex items-center gap-1 text-neutral-500">
            <span>⭐</span>
            <span>{repo().stargazers_count}</span>
          </div>
        </Show>
        
        <Show when={repo().forks_count > 0}>
          <div class="flex items-center gap-1 text-neutral-500">
            <span>🍴</span>
            <span>{repo().forks_count}</span>
          </div>
        </Show>
      </div>
      
      <div class="flex items-center justify-between">
        <div class="text-xs text-neutral-600">
          Updated {github.utils.formatRelativeTime(repo().updated_at)}
        </div>
        
        <div class="flex items-center gap-3">
          <div class={`text-xs font-mono ${healthColors[healthStatus()]}`}>
            {healthStatus().toUpperCase()}
          </div>
          <div class="text-xs text-neutral-600 font-mono">
            {github.utils.formatSize(repo().size_kb)}
          </div>
        </div>
      </div>
      
      <Show when={repo().topics.length > 0}>
        <div class="flex flex-wrap gap-1 mt-3">
          <For each={repo().topics.slice(0, 3)}>
            {(topic) => (
              <span class="text-xs px-2 py-1 bg-neutral-800/50 text-neutral-400 rounded-sm font-mono">
                {topic}
              </span>
            )}
          </For>
          <Show when={repo().topics.length > 3}>
            <span class="text-xs px-2 py-1 text-neutral-600 font-mono">
              +{repo().topics.length - 3}
            </span>
          </Show>
        </div>
      </Show>
    </div>
  );
};
