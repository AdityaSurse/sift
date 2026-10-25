import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, SlidersHorizontal } from 'lucide-react';
import { FilterRail } from '../components/FilterRail';
import { JobDetailSlideOver } from '../components/JobDetailSlideOver';
import { JobRow } from '../components/JobRow';
import { SearchBar } from '../components/SearchBar';
import { SkeletonRow } from '../components/SkeletonRow';
import { EmptyState } from '../components/EmptyState';
import { useFilterOptions } from '../hooks/useFilterOptions';
import { useSavedJobs } from '../hooks/useSavedJobs';
import { useSearch } from '../hooks/useSearch';
import type { SearchItem, SearchParams } from '../lib/api';

export const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [activeRowIndex, setActiveRowIndex] = useState<number>(-1);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  const { isSaved, toggleSave } = useSavedJobs();
  const { data: filterOptions } = useFilterOptions();

  // Extract query parameters from URL for 100% shareable URLs
  const params: SearchParams = useMemo(() => {
    const q = searchParams.get('q') || undefined;
    const type = searchParams.get('type') || undefined;
    const max_months = searchParams.get('max_months') ? parseInt(searchParams.get('max_months')!, 10) : undefined;
    const level = searchParams.get('level') || undefined;
    const location = searchParams.get('location') || undefined;
    const remote = searchParams.get('remote') || undefined;
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!, 10) : 1;

    return { q, type, max_months, level, location, remote, page, page_size: 20 };
  }, [searchParams]);

  const [prevQ, setPrevQ] = useState(params.q);
  const [inputQuery, setInputQuery] = useState(params.q || '');

  // Keep local search input synchronized if URL query changes
  if (params.q !== prevQ) {
    setPrevQ(params.q);
    setInputQuery(params.q || '');
  }

  const { data, isLoading, isError, error } = useSearch(params);

  // Sync state changes to URL query parameters
  const updateParams = (updates: Partial<SearchParams>): void => {
    const nextParams = new URLSearchParams(searchParams);

    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') {
        nextParams.delete(key);
      } else {
        nextParams.set(key, value.toString());
      }
    });

    setSearchParams(nextParams);
  };

  const handleSearchSubmit = (text: string): void => {
    updateParams({ q: text.trim() || undefined, page: 1 });
  };

  const handleResetFilters = (): void => {
    const nextParams = new URLSearchParams();
    if (params.q) nextParams.set('q', params.q);
    setSearchParams(nextParams);
  };

  // Keyboard navigation: j (down), k (up), Enter (open selected)
  useEffect(() => {
    const items = data?.items || [];
    if (items.length === 0) return;

    const handleKeyDown = (e: KeyboardEvent): void => {
      // Ignore keyboard shortcuts when typing in inputs or textareas
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || (e.target as HTMLElement)?.isContentEditable) {
        return;
      }

      if (e.key === 'j' || e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveRowIndex((prev) => Math.min(prev + 1, items.length - 1));
      } else if (e.key === 'k' || e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveRowIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' && activeRowIndex >= 0 && activeRowIndex < items.length) {
        e.preventDefault();
        setSelectedJobId(items[activeRowIndex].job_id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [data?.items, activeRowIndex]);

  const activeJob = data?.items.find((j) => j.job_id === selectedJobId);
  const activeFiltersCount = [params.type, params.max_months, params.level, params.location, params.remote].filter(Boolean).length;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 transition-colors duration-150 ease-editorial">
      {/* Search Header Row */}
      <div className="mb-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex-1 max-w-2xl">
          <SearchBar
            value={inputQuery}
            onChange={setInputQuery}
            onSubmit={handleSearchSubmit}
          />
        </div>

        {/* Mobile Filter Toggle Button */}
        <button
          type="button"
          onClick={() => setIsMobileFiltersOpen(true)}
          className="md:hidden flex items-center justify-center gap-2 rounded-control border border-border bg-surface px-4 py-2 font-sans text-13 text-text"
        >
          <SlidersHorizontal size={14} strokeWidth={1.5} />
          <span>Filters</span>
          {activeFiltersCount > 0 && (
            <span className="rounded-full bg-accent-subdued px-1.5 py-0.2 font-mono text-12 text-accent">
              {activeFiltersCount}
            </span>
          )}
        </button>
      </div>

      {/* Main Layout: Left Filter Rail + Right Dense Results Column */}
      <div className="flex items-start gap-8">
        {/* Left Filter Rail */}
        <FilterRail
          params={params}
          onChange={updateParams}
          onReset={handleResetFilters}
          options={filterOptions}
          isOpenMobile={isMobileFiltersOpen}
          onCloseMobile={() => setIsMobileFiltersOpen(false)}
        />

        {/* Right Main Column: Results */}
        <main className="flex-1 min-w-0">
          {/* Results Metadata Summary */}
          <div className="flex items-center justify-between pb-3 border-b border-border mb-0.5">
            <div className="flex items-center gap-2">
              <span className="font-mono text-13 font-medium text-text">
                {isLoading ? 'Searching...' : `${data?.total.toLocaleString() ?? 0} positions found`}
              </span>
              {params.q && (
                <span className="font-sans text-13 text-text-muted truncate max-w-xs">
                  for "{params.q}"
                </span>
              )}
            </div>

            {/* Keyboard shortcut tip */}
            <span className="hidden lg:inline font-mono text-12 text-text-muted/60">
              Navigate with <kbd className="rounded border border-border px-1">j</kbd> / <kbd className="rounded border border-border px-1">k</kbd>, press <kbd className="rounded border border-border px-1">Enter</kbd> to inspect
            </span>
          </div>

          {/* Error State */}
          {isError && (
            <div className="p-8 text-center border-b border-border bg-surface rounded-control mt-4">
              <p className="font-sans text-14 text-text mb-1">Could not fetch positions</p>
              <p className="font-mono text-12 text-text-muted">{error?.message || 'Server error'}</p>
            </div>
          )}

          {/* Loading Skeletons */}
          {isLoading && (
            <div className="border border-border rounded-surface overflow-hidden divide-y divide-border">
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !isError && data?.items.length === 0 && (
            <EmptyState
              query={params.q}
              onReset={handleResetFilters}
              onSelectSuggestion={(sug) => handleSearchSubmit(sug)}
            />
          )}

          {/* Dense Job Rows List */}
          {!isLoading && !isError && data && data.items.length > 0 && (
            <div className="border border-border rounded-surface overflow-hidden">
              {data.items.map((job, idx) => (
                <JobRow
                  key={job.job_id}
                  job={job}
                  isSaved={isSaved(job.job_id)}
                  onToggleSave={(j: SearchItem) => toggleSave(j)}
                  onSelect={(j: SearchItem) => {
                    setSelectedJobId(j.job_id);
                    setActiveRowIndex(idx);
                  }}
                  isSelected={idx === activeRowIndex || job.job_id === selectedJobId}
                />
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {!isLoading && data && data.total_pages > 1 && (
            <div className="flex items-center justify-between pt-6 border-t border-border mt-6">
              <button
                type="button"
                disabled={params.page! <= 1}
                onClick={() => updateParams({ page: Math.max(1, (params.page || 1) - 1) })}
                className="flex items-center gap-1.5 rounded-control border border-border bg-surface px-3 py-1.5 font-sans text-13 text-text disabled:opacity-30 disabled:pointer-events-none hover:border-border-strong transition-colors"
              >
                <ChevronLeft size={14} strokeWidth={1.5} />
                <span>Previous</span>
              </button>

              <span className="font-mono text-12 text-text-muted">
                Page {params.page || 1} of {data.total_pages}
              </span>

              <button
                type="button"
                disabled={params.page! >= data.total_pages}
                onClick={() => updateParams({ page: (params.page || 1) + 1 })}
                className="flex items-center gap-1.5 rounded-control border border-border bg-surface px-3 py-1.5 font-sans text-13 text-text disabled:opacity-30 disabled:pointer-events-none hover:border-border-strong transition-colors"
              >
                <span>Next</span>
                <ChevronRight size={14} strokeWidth={1.5} />
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Right-Side Slide-Over Detail Drawer */}
      <JobDetailSlideOver
        jobId={selectedJobId}
        onClose={() => setSelectedJobId(null)}
        isSaved={selectedJobId ? isSaved(selectedJobId) : false}
        onToggleSave={() => {
          if (activeJob) toggleSave(activeJob);
        }}
      />
    </div>
  );
};
