/*
 * Repository grid component providing organized display of GitHub projects with sophisticated filtering and interactive exploration capabilities.
 * I'm implementing comprehensive project visualization with pagination, search, filtering, and detailed project cards that maintain the dark aesthetic while showcasing technical projects effectively.
 */

import {
  type Component,
  createSignal,
  Show,
  For,
  onMount,
  createEffect,
} from 'solid-js';
import { ProjectCard } from './ProjectCard';
import { ProjectDetail } from './ProjectDetail';
import { ProjectFilters } from './ProjectFilters';
import { LoadingSpinner } from '../UI/LoadingSpinner';
import { useGitHub } from '../../hooks/useGitHub';

interface ProjectGridProps {
  className?: string;
}

export const ProjectGrid: Component<ProjectGridProps> = (props) => {
  const github = useGitHub();
  const [selectedRepository, setSelectedRepository] = createSignal(null);
  const [viewMode, setViewMode] = createSignal<'grid' | 'list'>('grid');
  const [isFiltersExpanded, setIsFiltersExpanded] = createSignal(false);

  // I'm setting up the initial data fetch when the component mounts
  onMount(() => {
    github.refreshRepositories();
  });

  // I'm handling repository selection for detailed view
  const handleRepositorySelect = async (repository: any) => {
    const details = await github.getRepositoryDetails(
      repository.owner,
      repository.name,
    );
    setSelectedRepository(details);
  };

  // I'm creating filter change handler
  const handleFiltersChange = (newFilters: any) => {
    github.setFilters(newFilters);
  };

  // I'm getting unique languages for filter options
  const availableLanguages = () => {
    const languages = new Set<string>();
    github.allRepositories().forEach((repo) => {
      if (repo.language) {
        languages.add(repo.language);
      }
    });
    return Array.from(languages).sort();
  };

  return (
    <div class={`space-y-6 ${props.className || ''}`}>
      {/* Filters */}
      <ProjectFilters
        filters={github.filters()}
        onFiltersChange={handleFiltersChange}
        languages={availableLanguages()}
        totalCount={github.allRepositories().length}
        filteredCount={github.repositories().length}
        isLoading={github.isLoading()}
      />

      {/* View Controls */}
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <h2 class="text-2xl font-sans text-neutral-200">REPOSITORIES</h2>
          <div class="text-sm text-neutral-500 font-sans">
            {github.repositories().length} / {github.totalCount()}
          </div>
        </div>

        <div class="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div class="flex items-center bg-neutral-900 rounded border border-neutral-700">
            <button
              onClick={() => setViewMode('grid')}
              class={`p-2 text-sm transition-colors duration-200 ${
                viewMode() === 'grid'
                  ? 'bg-neutral-700 text-neutral-100'
                  : 'text-neutral-500 hover:text-neutral-300'
              }`}
              title="Grid view"
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
              class={`p-2 text-sm transition-colors duration-200 ${
                viewMode() === 'list'
                  ? 'bg-neutral-700 text-neutral-100'
                  : 'text-neutral-500 hover:text-neutral-300'
              }`}
              title="List view"
            >
              <div class="w-4 h-4 flex flex-col gap-1">
                <div class="h-0.5 bg-current rounded-sm"></div>
                <div class="h-0.5 bg-current rounded-sm"></div>
                <div class="h-0.5 bg-current rounded-sm"></div>
              </div>
            </button>
          </div>

          {/* Refresh Button */}
          <button
            onClick={() => github.refreshRepositories()}
            disabled={github.isLoading()}
            class="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-neutral-300 rounded font-sans text-sm transition-colors duration-200"
          >
            {github.isLoading() ? 'REFRESHING...' : 'REFRESH'}
          </button>
        </div>
      </div>

      {/* Loading State */}
      <Show when={github.isLoading()}>
        <div class="flex justify-center py-12">
          <LoadingSpinner
            variant="fractal"
            size="lg"
            message="Loading repositories..."
          />
        </div>
      </Show>

      {/* Error State */}
      <Show when={github.error() && !github.isLoading()}>
        <div class="bg-red-900/20 border border-red-800 rounded-lg p-8 text-center">
          <div class="text-red-400 text-lg font-sans mb-2">FETCH ERROR</div>
          <div class="text-neutral-300 mb-4">{github.error()}</div>
          <button
            onClick={() => github.refreshRepositories()}
            class="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-sans text-sm transition-colors duration-200"
          >
            RETRY
          </button>
        </div>
      </Show>

      {/* Empty State */}
      <Show
        when={
          !github.isLoading() &&
          !github.error() &&
          github.repositories().length === 0
        }
      >
        <div class="text-center py-20">
          <div class="text-6xl mb-6 opacity-20">📁</div>
          <div class="text-xl font-thin text-neutral-300 mb-4">
            No repositories found
          </div>
          <div class="text-neutral-500 max-w-md mx-auto">
            {github.allRepositories().length > 0
              ? 'Try adjusting your filters to see more results.'
              : 'No repositories are available at this time.'}
          </div>
          <Show when={github.allRepositories().length > 0}>
            <button
              onClick={() => github.clearFilters()}
              class="mt-6 px-6 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded font-sans text-sm transition-colors duration-200"
            >
              CLEAR FILTERS
            </button>
          </Show>
        </div>
      </Show>

      {/* Repository Grid/List */}
      <Show
        when={
          !github.isLoading() &&
          !github.error() &&
          github.repositories().length > 0
        }
      >
        <div
          class={
            viewMode() === 'grid'
              ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'space-y-4'
          }
        >
          <For each={github.repositories()}>
            {(repository) => (
              <ProjectCard
                repository={repository}
                viewMode={viewMode()}
                onClick={handleRepositorySelect}
              />
            )}
          </For>
        </div>

        {/* Pagination */}
        <Show when={github.totalPages() > 1}>
          <div class="flex items-center justify-center gap-4 pt-8">
            <button
              onClick={() => github.goToPage(github.currentPage() - 1)}
              disabled={!github.hasPreviousPage()}
              class="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed text-neutral-300 rounded font-sans text-sm transition-colors duration-200"
            >
              PREV
            </button>

            <div class="flex items-center gap-2">
              {Array.from(
                { length: Math.min(5, github.totalPages()) },
                (_, i) => {
                  const pageNum = github.currentPage() - 2 + i;
                  if (pageNum < 1 || pageNum > github.totalPages())
                    return null;

                  return (
                    <button
                      onClick={() => github.goToPage(pageNum)}
                      class={`w-10 h-10 rounded font-sans text-sm transition-colors duration-200 ${
                        pageNum === github.currentPage()
                          ? 'bg-cyan-600 text-white'
                          : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                },
              )}
            </div>

            <button
              onClick={() => github.goToPage(github.currentPage() + 1)}
              disabled={!github.hasNextPage()}
              class="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed text-neutral-300 rounded font-sans text-sm transition-colors duration-200"
            >
              NEXT
            </button>
          </div>

          <div class="text-center text-xs text-neutral-500 font-sans">
            Page {github.currentPage()} of {github.totalPages()} •{' '}
            {github.totalCount()} total repositories
          </div>
        </Show>
      </Show>

      {/* Rate Limit Warning */}
      <Show
        when={
          github.rateLimit()?.status === 'warning' ||
          github.rateLimit()?.status === 'critical'
        }
      >
        <div class="fixed bottom-4 right-4 bg-yellow-900/90 border border-yellow-700 rounded-lg p-4 max-w-sm backdrop-blur-sm">
          <div class="text-yellow-400 font-sans text-sm mb-2">
            API RATE LIMIT {github.rateLimit()?.status.toUpperCase()}
          </div>
          <div class="text-neutral-300 text-xs">
            {github.rateLimit()?.remaining} / {github.rateLimit()?.limit}{' '}
            requests remaining
          </div>
          <div class="text-neutral-400 text-xs mt-1">
            Resets in{' '}
            {Math.ceil(
              (new Date(github.rateLimit()?.resetTime || 0).getTime() -
                Date.now()) /
                (1000 * 60),
            )}{' '}
            minutes
          </div>
        </div>
      </Show>

      {/* Repository Detail Modal */}
      <Show when={selectedRepository()}>
        <ProjectDetail
          repository={selectedRepository()!}
          onClose={() => setSelectedRepository(null)}
        />
      </Show>
    </div>
  );
};
