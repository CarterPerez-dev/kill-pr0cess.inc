/*
 * Repository filtering and search interface providing comprehensive filtering options for GitHub project discovery.
 * I'm implementing advanced filtering capabilities including language, stars, size, and activity filters while maintaining the dark aesthetic and providing real-time filter feedback.
 */

import { type Component, createSignal, Show, For, createEffect } from 'solid-js';
import { Card } from '../UI/Card';

interface FilterOptions {
  search: string;
  language: string;
  minStars: number;
  maxStars: number;
  minSize: number;
  maxSize: number;
  isArchived: boolean | null;
  isFork: boolean | null;
  hasTopics: boolean | null;
  hasLicense: boolean | null;
  sort: string;
  direction: 'asc' | 'desc';
  updatedAfter: string;
}

interface ProjectFiltersProps {
  filters: FilterOptions;
  onFiltersChange: (filters: Partial<FilterOptions>) => void;
  languages: string[];
  totalCount: number;
  filteredCount: number;
  isLoading?: boolean;
}

export const ProjectFilters: Component<ProjectFiltersProps> = (props) => {
  const [isExpanded, setIsExpanded] = createSignal(false);
  const [activeFilterCount, setActiveFilterCount] = createSignal(0);

  createEffect(() => {
    let count = 0;
    const filters = props.filters;

    if (filters.search) count++;
    if (filters.language) count++;
    if (filters.minStars > 0) count++;
    if (filters.maxStars < 10000) count++;
    if (filters.minSize > 0) count++;
    if (filters.maxSize < 1000000) count++;
    if (filters.isArchived !== null) count++;
    if (filters.isFork !== null) count++;
    if (filters.hasTopics !== null) count++;
    if (filters.hasLicense !== null) count++;
    if (filters.updatedAfter) count++;

    setActiveFilterCount(count);
  });

  const clearAllFilters = () => {
    props.onFiltersChange({
      search: '',
      language: '',
      minStars: 0,
      maxStars: 10000,
      minSize: 0,
      maxSize: 1000000,
      isArchived: null,
      isFork: null,
      hasTopics: null,
      hasLicense: null,
      updatedAfter: '',
    });
  };

  const sortOptions = [
    { value: 'updated', label: 'Recently Updated' },
    { value: 'created', label: 'Recently Created' },
    { value: 'stars', label: 'Most Stars' },
    { value: 'forks', label: 'Most Forks' },
    { value: 'name', label: 'Name' },
    { value: 'size', label: 'Size' },
  ];

  const timeRangeOptions = [
    { value: '', label: 'All Time' },
    {
      value: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0],
      label: 'Last 30 Days',
    },
    {
      value: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0],
      label: 'Last 3 Months',
    },
    {
      value: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0],
      label: 'Last Year',
    },
  ];

  return (
    <Card
      variant="glass"
      class="backdrop-blur-md"
    >
      {/* Header */}
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-3">
          <h3 class="font-sans text-sm text-neutral-300 tracking-wide">
            FILTERS
          </h3>
          <Show when={activeFilterCount() > 0}>
            <span class="px-2 py-1 bg-cyan-900/30 text-cyan-400 border border-cyan-800 rounded text-xs font-sans">
              {activeFilterCount()} ACTIVE
            </span>
          </Show>
        </div>

        <div class="flex items-center gap-2">
          <Show when={activeFilterCount() > 0}>
            <button
              onClick={clearAllFilters}
              class="px-3 py-1 bg-red-900/30 hover:bg-red-800/30 text-red-400 border border-red-800 rounded text-xs font-sans transition-colors duration-200"
            >
              CLEAR ALL
            </button>
          </Show>

          <button
            onClick={() => setIsExpanded(!isExpanded())}
            class="px-3 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 rounded text-xs font-sans transition-colors duration-200"
          >
            {isExpanded() ? 'COLLAPSE' : 'EXPAND'}
          </button>
        </div>
      </div>

      {/* Results Summary */}
      <div class="mb-4 p-3 bg-neutral-900/50 rounded">
        <div class="flex items-center justify-between text-xs font-sans">
          <span class="text-neutral-500">
            Showing {props.filteredCount} of {props.totalCount} repositories
          </span>
          <Show when={props.isLoading}>
            <div class="flex items-center gap-2 text-neutral-500">
              <div class="w-3 h-3 border border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
              <span>Filtering...</span>
            </div>
          </Show>
        </div>
      </div>

      {/* Quick Search */}
      <div class="mb-4">
        <label class="block text-xs text-neutral-500 font-sans uppercase mb-2">
          Search
        </label>
        <input
          type="text"
          value={props.filters.search}
          onInput={(e) =>
            props.onFiltersChange({ search: e.currentTarget.value })
          }
          placeholder="Search repositories, descriptions, topics..."
          class="w-full bg-neutral-900 border border-neutral-700 focus:border-cyan-400 rounded px-3 py-2 text-sm text-neutral-300 placeholder-neutral-600 focus:outline-none"
        />
      </div>

      {/* Sort Options */}
      <div class="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label class="block text-xs text-neutral-500 font-sans uppercase mb-2">
            Sort By
          </label>
          <select
            value={props.filters.sort}
            onChange={(e) =>
              props.onFiltersChange({ sort: e.currentTarget.value })
            }
            class="w-full bg-neutral-900 border border-neutral-700 focus:border-cyan-400 rounded px-3 py-2 text-sm text-neutral-300 focus:outline-none"
          >
            <For each={sortOptions}>
              {(option) => (
                <option value={option.value}>{option.label}</option>
              )}
            </For>
          </select>
        </div>

        <div>
          <label class="block text-xs text-neutral-500 font-sans uppercase mb-2">
            Direction
          </label>
          <select
            value={props.filters.direction}
            onChange={(e) =>
              props.onFiltersChange({
                direction: e.currentTarget.value as 'asc' | 'desc',
              })
            }
            class="w-full bg-neutral-900 border border-neutral-700 focus:border-cyan-400 rounded px-3 py-2 text-sm text-neutral-300 focus:outline-none"
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>
      </div>

      {/* Expanded Filters */}
      <Show when={isExpanded()}>
        <div class="space-y-4 pt-4 border-t border-neutral-800">
          {/* Language Filter */}
          <div>
            <label class="block text-xs text-neutral-500 font-sans uppercase mb-2">
              Language
            </label>
            <select
              value={props.filters.language}
              onChange={(e) =>
                props.onFiltersChange({ language: e.currentTarget.value })
              }
              class="w-full bg-neutral-900 border border-neutral-700 focus:border-cyan-400 rounded px-4 py-2 text-sm text-neutral-300 focus:outline-none"
            >
              <option value="">All Languages</option>
              <For each={props.languages}>
                {(language) => <option value={language}>{language}</option>}
              </For>
            </select>
          </div>

          {/* Stars Range */}
          <div>
            <label class="block text-xs text-neutral-500 font-sans uppercase mb-2">
              Stars Range
            </label>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs text-neutral-600 mb-1">
                  Min
                </label>
                <input
                  type="number"
                  value={props.filters.minStars}
                  onInput={(e) =>
                    props.onFiltersChange({
                      minStars: parseInt(e.currentTarget.value) || 0,
                    })
                  }
                  min="0"
                  class="w-full bg-neutral-900 border border-neutral-700 focus:border-cyan-400 rounded px-3 py-2 text-sm text-neutral-300 focus:outline-none"
                />
              </div>
              <div>
                <label class="block text-xs text-neutral-600 mb-1">
                  Max
                </label>
                <input
                  type="number"
                  value={props.filters.maxStars}
                  onInput={(e) =>
                    props.onFiltersChange({
                      maxStars: parseInt(e.currentTarget.value) || 10000,
                    })
                  }
                  min="0"
                  class="w-full bg-neutral-900 border border-neutral-700 focus:border-cyan-400 rounded px-3 py-2 text-sm text-neutral-300 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Size Range */}
          <div>
            <label class="block text-xs text-neutral-500 font-sans uppercase mb-2">
              Size Range (KB)
            </label>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs text-neutral-600 mb-1">
                  Min
                </label>
                <input
                  type="number"
                  value={props.filters.minSize}
                  onInput={(e) =>
                    props.onFiltersChange({
                      minSize: parseInt(e.currentTarget.value) || 0,
                    })
                  }
                  min="0"
                  class="w-full bg-neutral-900 border border-neutral-700 focus:border-cyan-400 rounded px-3 py-2 text-sm text-neutral-300 focus:outline-none"
                />
              </div>
              <div>
                <label class="block text-xs text-neutral-600 mb-1">
                  Max
                </label>
                <input
                  type="number"
                  value={props.filters.maxSize}
                  onInput={(e) =>
                    props.onFiltersChange({
                      maxSize: parseInt(e.currentTarget.value) || 1000000,
                    })
                  }
                  min="0"
                  class="w-full bg-neutral-900 border border-neutral-700 focus:border-cyan-400 rounded px-3 py-2 text-sm text-neutral-300 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Time Range */}
          <div>
            <label class="block text-xs text-neutral-500 font-sans uppercase mb-2">
              Updated After
            </label>
            <select
              value={props.filters.updatedAfter}
              onChange={(e) =>
                props.onFiltersChange({
                  updatedAfter: e.currentTarget.value,
                })
              }
              class="w-full bg-neutral-900 border border-neutral-700 focus:border-cyan-400 rounded px-3 py-2 text-sm text-neutral-300 focus:outline-none"
            >
              <For each={timeRangeOptions}>
                {(option) => (
                  <option value={option.value}>{option.label}</option>
                )}
              </For>
            </select>
          </div>

          {/* Boolean Filters */}
          <div class="space-y-3">
            <label class="block text-xs text-neutral-500 font-sans uppercase">
              Repository Type
            </label>

            <div class="grid grid-cols-2 gap-3">
              {/* Archived Filter */}
              <div>
                <label class="block text-xs text-neutral-600 mb-1">
                  Archived
                </label>
                <select
                  value={
                    props.filters.isArchived === null
                      ? ''
                      : props.filters.isArchived.toString()
                  }
                  onChange={(e) => {
                    const value = e.currentTarget.value;
                    props.onFiltersChange({
                      isArchived: value === '' ? null : value === 'true',
                    });
                  }}
                  class="w-full bg-neutral-900 border border-neutral-700 focus:border-cyan-400 rounded px-3 py-2 text-sm text-neutral-300 focus:outline-none"
                >
                  <option value="">All</option>
                  <option value="false">Active Only</option>
                  <option value="true">Archived Only</option>
                </select>
              </div>

              {/* Fork Filter */}
              <div>
                <label class="block text-xs text-neutral-600 mb-1">
                  Forks
                </label>
                <select
                  value={
                    props.filters.isFork === null
                      ? ''
                      : props.filters.isFork.toString()
                  }
                  onChange={(e) => {
                    const value = e.currentTarget.value;
                    props.onFiltersChange({
                      isFork: value === '' ? null : value === 'true',
                    });
                  }}
                  class="w-full bg-neutral-900 border border-neutral-700 focus:border-cyan-400 rounded px-3 py-2 text-sm text-neutral-300 focus:outline-none"
                >
                  <option value="">All</option>
                  <option value="false">Original Only</option>
                  <option value="true">Forks Only</option>
                </select>
              </div>

              {/* Topics Filter */}
              <div>
                <label class="block text-xs text-neutral-600 mb-1">
                  Topics
                </label>
                <select
                  value={
                    props.filters.hasTopics === null
                      ? ''
                      : props.filters.hasTopics.toString()
                  }
                  onChange={(e) => {
                    const value = e.currentTarget.value;
                    props.onFiltersChange({
                      hasTopics: value === '' ? null : value === 'true',
                    });
                  }}
                  class="w-full bg-neutral-900 border border-neutral-700 focus:border-cyan-400 rounded px-3 py-2 text-sm text-neutral-300 focus:outline-none"
                >
                  <option value="">All</option>
                  <option value="true">With Topics</option>
                  <option value="false">Without Topics</option>
                </select>
              </div>

              {/* License Filter */}
              <div>
                <label class="block text-xs text-neutral-600 mb-1">
                  License
                </label>
                <select
                  value={
                    props.filters.hasLicense === null
                      ? ''
                      : props.filters.hasLicense.toString()
                  }
                  onChange={(e) => {
                    const value = e.currentTarget.value;
                    props.onFiltersChange({
                      hasLicense: value === '' ? null : value === 'true',
                    });
                  }}
                  class="w-full bg-neutral-900 border border-neutral-700 focus:border-cyan-400 rounded px-3 py-2 text-sm text-neutral-300 focus:outline-none"
                >
                  <option value="">All</option>
                  <option value="true">With License</option>
                  <option value="false">Without License</option>
                </select>
              </div>
            </div>
          </div>

          {/* Advanced Search Tips */}
          <div class="mt-6 p-3 bg-neutral-900/30 rounded border border-neutral-800">
            <div class="text-xs text-neutral-500 font-sans uppercase mb-2">
              Search Tips
            </div>
            <div class="text-xs text-neutral-600 space-y-1">
              <div>• Search terms match name, description, and topics</div>
              <div>• Use quotes for exact phrases: "react component"</div>
              <div>• Combine filters for precise results</div>
              <div>• Sort by stars to find popular projects</div>
            </div>
          </div>
        </div>
      </Show>

      {/* Active Filters Summary */}
      <Show when={activeFilterCount() > 0}>
        <div class="mt-4 pt-4 border-t border-neutral-800">
          <div class="text-xs text-neutral-500 font-sans uppercase mb-2">
            Active Filters
          </div>
          <div class="flex flex-wrap gap-2">
            <Show when={props.filters.search}>
              <span class="px-2 py-1 bg-cyan-900/30 text-cyan-400 border border-cyan-800 rounded text-xs font-sans">
                Search: "{props.filters.search}"
              </span>
            </Show>

            <Show when={props.filters.language}>
              <span class="px-2 py-1 bg-green-900/30 text-green-400 border border-green-800 rounded text-xs font-sans">
                Language: {props.filters.language}
              </span>
            </Show>

            <Show
              when={
                props.filters.minStars > 0 || props.filters.maxStars < 10000
              }
            >
              <span class="px-2 py-1 bg-yellow-900/30 text-yellow-400 border border-yellow-800 rounded text-xs font-sans">
                Stars: {props.filters.minStars}-{props.filters.maxStars}
              </span>
            </Show>

            <Show when={props.filters.isArchived !== null}>
              <span class="px-2 py-1 bg-purple-900/30 text-purple-400 border border-purple-800 rounded text-xs font-sans">
                {props.filters.isArchived ? 'Archived' : 'Active'}
              </span>
            </Show>
          </div>
        </div>
      </Show>
    </Card>
  );
};
