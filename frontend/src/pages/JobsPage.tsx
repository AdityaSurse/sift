import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { FilterRail } from '../components/FilterRail';
import { JobDetailPane } from '../components/JobDetailPane';
import { JobDetailSlideOver } from '../components/JobDetailSlideOver';
import { JobRow } from '../components/JobRow';
import { SkeletonRow } from '../components/SkeletonRow';
import { EmptyState } from '../components/EmptyState';
import { useFilterOptions } from '../hooks/useFilterOptions';
import { useSavedJobs } from '../hooks/useSavedJobs';
import { useSearch } from '../hooks/useSearch';
import type { SearchItem, SearchParams } from '../lib/api';

/**
 * Sift Two-Pane Jobs Browser (/jobs)
 * Why: Implements a high-density, keyboard-driven two-pane master-detail layout
 * modeled on Simplify's job browser with Aegean Marine Teal and Caspian Slate design language.
 */
export const JobsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [activeRowIndex, setActiveRowIndex] = useState<number>(0);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [isMobileDetailOpen, setIsMobileDetailOpen] = useState(false);

  const { isSaved, toggleSave } = useSavedJobs();
  const { data: filterOptions } = useFilterOptions();

  // Extract query parameters from URL for 100% shareable links
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

  const [prevParamQ, setPrevParamQ] = useState(params.q);
  const [inputQuery, setInputQuery] = useState(params.q || '');

  // Synchronize input query on external URL change without extra effect renders
  if (params.q !== prevParamQ) {
    setPrevParamQ(params.q);
    setInputQuery(params.q || '');
  }

  const { data, isLoading, isError, error, refetch } = useSearch(params);

  // Derive currently focused job: either user selection or default to first result
  const items = data?.items || [];
  const effectiveJobId = selectedJobId && items.some((j) => j.job_id === selectedJobId)
    ? selectedJobId
    : items[0]?.job_id ?? null;

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

  const handleSearchSubmit = (e?: React.FormEvent): void => {
    if (e) e.preventDefault();
    const clean = inputQuery.trim();
    updateParams({ q: clean || undefined, page: 1 });
  };

  const handleClearQuery = (): void => {
    setInputQuery('');
    updateParams({ q: undefined, page: 1 });
  };

  const handleResetFilters = (): void => {
    const nextParams = new URLSearchParams();
    if (params.q) nextParams.set('q', params.q);
    setSearchParams(nextParams);
  };

  // Keyboard navigation: j (down), k (up), Enter (open direct apply link in new tab)
  useEffect(() => {
    const jobList = data?.items || [];
    if (jobList.length === 0) return;

    const handleKeyDown = (e: KeyboardEvent): void => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || (e.target as HTMLElement)?.isContentEditable) {
        return;
      }

      if (e.key === 'j' || e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveRowIndex((prev) => {
          const next = Math.min(prev + 1, jobList.length - 1);
          setSelectedJobId(jobList[next].job_id);
          return next;
        });
      } else if (e.key === 'k' || e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveRowIndex((prev) => {
          const next = Math.max(prev - 1, 0);
          setSelectedJobId(jobList[next].job_id);
          return next;
        });
      } else if (e.key === 'Enter' && activeRowIndex >= 0 && activeRowIndex < jobList.length) {
        e.preventDefault();
        window.open(jobList[activeRowIndex].apply_url, '_blank', 'noopener,noreferrer');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [data?.items, activeRowIndex]);

  const activeJob = data?.items.find((j) => j.job_id === effectiveJobId);
  const activeFiltersCount = [params.type, params.max_months, params.level, params.location, params.remote].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-bg text-text transition-colors duration-150 ease-editorial flex flex-col">
      {/* Sticky Top Search & Filter Bar */}
      <div className="sticky top-0 z-30 bg-bg/95 border-b border-border/80 px-4 sm:px-8 py-3">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Natural Language Search Capsule */}
          <form onSubmit={handleSearchSubmit} className="flex-1 max-w-2xl relative">
            <div className="relative flex items-center rounded-full border border-border/80 bg-surface shadow-card px-2 py-1 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20 transition-all">
              <div className="pl-3 pr-2 text-text-muted">
                <Search size={16} strokeWidth={1.5} />
              </div>
              <input
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder="Search natural language, title, stack, or location..."
                className="w-full bg-transparent py-1.5 px-1 font-sans text-13 sm:text-14 text-text placeholder:text-text-muted/50 focus:outline-none"
              />
              {inputQuery && (
                <button
                  type="button"
                  onClick={handleClearQuery}
                  className="p-1 mr-1 text-text-muted hover:text-text rounded-full"
                  title="Clear query"
                >
                  <X size={14} strokeWidth={2} />
                </button>
              )}
              <button
                type="submit"
                className="rounded-full bg-btn-primary px-4 py-1.5 font-sans text-12 font-semibold text-btn-primary-text hover:bg-btn-primary-hover active:scale-[0.98] transition-all shadow-sm"
              >
                Search
              </button>
            </div>
          </form>

          {/* Quick Filter Chips & Mobile Action Controls */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {/* Remote Quick Filter */}
            <button
              type="button"
              onClick={() => updateParams({ remote: params.remote === 'remote' ? undefined : 'remote', page: 1 })}
              className={`rounded-full border px-3.5 py-1.5 font-sans text-12 font-medium transition-all whitespace-nowrap ${
                params.remote === 'remote'
                  ? 'border-accent/40 bg-accent-subdued text-accent shadow-xs'
                  : 'border-border/80 bg-surface text-text-muted hover:text-text hover:border-border-strong'
              }`}
            >
              Remote
            </button>

            {/* Internships Quick Filter */}
            <button
              type="button"
              onClick={() => updateParams({ type: params.type === 'internship' ? undefined : 'internship', page: 1 })}
              className={`rounded-full border px-3.5 py-1.5 font-sans text-12 font-medium transition-all whitespace-nowrap ${
                params.type === 'internship'
                  ? 'border-accent/40 bg-accent-subdued text-accent shadow-xs'
                  : 'border-border/80 bg-surface text-text-muted hover:text-text hover:border-border-strong'
              }`}
            >
              Internships
            </button>

            {/* Full-Time Quick Filter */}
            <button
              type="button"
              onClick={() => updateParams({ type: params.type === 'full_time' ? undefined : 'full_time', page: 1 })}
              className={`rounded-full border px-3.5 py-1.5 font-sans text-12 font-medium transition-all whitespace-nowrap ${
                params.type === 'full_time'
                  ? 'border-accent/40 bg-accent-subdued text-accent shadow-xs'
                  : 'border-border/80 bg-surface text-text-muted hover:text-text hover:border-border-strong'
              }`}
            >
              Full-Time
            </button>

            {/* Mobile Filters Trigger */}
            <button
              type="button"
              onClick={() => setIsMobileFiltersOpen(true)}
              className="lg:hidden flex items-center gap-1.5 rounded-full border border-border/80 bg-surface px-3.5 py-1.5 font-sans text-12 font-medium text-text hover:border-border-strong transition-colors"
            >
              <SlidersHorizontal size={13} strokeWidth={1.5} />
              <span>Filters</span>
              {activeFiltersCount > 0 && (
                <span className="rounded-full bg-accent-subdued px-1.5 font-mono text-11 text-accent font-medium">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Two-Pane Workplace Layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-6 flex items-start gap-6 sm:gap-8">
        {/* Left Filter Rail on Desktop */}
        <FilterRail
          params={params}
          onChange={updateParams}
          onReset={handleResetFilters}
          options={filterOptions}
          isOpenMobile={isMobileFiltersOpen}
          onCloseMobile={() => setIsMobileFiltersOpen(false)}
        />

        {/* Center / Left Pane: Dense Job List */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Metadata & Total Count Header */}
          <div className="flex items-center justify-between pb-3 border-b border-border/80 mb-3">
            <div className="flex items-center gap-2.5 flex-wrap min-w-0">
              <span className="font-sans text-14 font-semibold text-text">
                {isLoading ? 'Scanning index...' : `${data?.total.toLocaleString() ?? 0} positions found`}
              </span>

              {params.q && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent-subdued px-3 py-0.5 font-sans text-12 text-accent font-medium">
                  <span className="truncate max-w-[160px]">{params.q}</span>
                  <button type="button" onClick={handleClearQuery} className="hover:text-text">
                    <X size={12} strokeWidth={2} />
                  </button>
                </span>
              )}
            </div>

            <span className="hidden xl:inline font-mono text-11 text-text-muted select-none">
              <kbd className="rounded border border-border px-1">j</kbd> / <kbd className="rounded border border-border px-1">k</kbd> navigate · <kbd className="rounded border border-border px-1">Enter</kbd> apply
            </span>
          </div>

          {/* Error State */}
          {isError && (
            <div className="p-8 text-center border border-border rounded-2xl bg-surface my-4 space-y-2 shadow-card">
              <p className="font-sans text-15 font-semibold text-text">Could not load positions</p>
              <p className="font-mono text-12 text-text-muted">{error?.message || 'Server error'}</p>
              <button
                type="button"
                onClick={() => refetch()}
                className="inline-flex items-center gap-1.5 rounded-full bg-btn-primary px-4 py-2 font-sans text-12 font-semibold text-btn-primary-text hover:bg-btn-primary-hover transition-colors mt-2"
              >
                <RotateCcw size={13} strokeWidth={1.5} />
                <span>Retry Search</span>
              </button>
            </div>
          )}

          {/* Loading Skeletons */}
          {isLoading && (
            <div className="border border-border/80 rounded-2xl overflow-hidden divide-y divide-border/60 bg-surface shadow-card">
              <SkeletonRow />
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
              onSelectSuggestion={(sug) => {
                setInputQuery(sug);
                updateParams({ q: sug, page: 1 });
              }}
            />
          )}

          {/* Dense Job Rows */}
          {!isLoading && !isError && data && data.items.length > 0 && (
            <div className="border border-border/80 rounded-2xl overflow-hidden divide-y divide-border/60 bg-surface shadow-card">
              {data.items.map((job, idx) => (
                <JobRow
                  key={job.job_id}
                  job={job}
                  isSaved={isSaved(job.job_id)}
                  onToggleSave={(j: SearchItem) => toggleSave(j)}
                  onSelect={(j: SearchItem) => {
                    setSelectedJobId(j.job_id);
                    setActiveRowIndex(idx);
                    // On mobile screens, also open the detail slide-over
                    if (window.innerWidth < 1024) {
                      setIsMobileDetailOpen(true);
                    }
                  }}
                  isSelected={job.job_id === effectiveJobId}
                />
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {!isLoading && data && data.total_pages > 1 && (
            <div className="flex items-center justify-between pt-5 border-t border-border/80 mt-5">
              <button
                type="button"
                disabled={params.page! <= 1}
                onClick={() => updateParams({ page: Math.max(1, (params.page || 1) - 1) })}
                className="flex items-center gap-1.5 rounded-full border border-border bg-surface px-4 py-1.5 font-sans text-12 font-medium text-text disabled:opacity-30 disabled:pointer-events-none hover:bg-surface-subdued transition-colors shadow-xs"
              >
                <ChevronLeft size={13} strokeWidth={1.5} />
                <span>Previous</span>
              </button>

              <span className="font-mono text-12 text-text-muted">
                Page {params.page || 1} of {data.total_pages}
              </span>

              <button
                type="button"
                disabled={params.page! >= data.total_pages}
                onClick={() => updateParams({ page: (params.page || 1) + 1 })}
                className="flex items-center gap-1.5 rounded-full border border-border bg-surface px-4 py-1.5 font-sans text-12 font-medium text-text disabled:opacity-30 disabled:pointer-events-none hover:bg-surface-subdued transition-colors shadow-xs"
              >
                <span>Next</span>
                <ChevronRight size={13} strokeWidth={1.5} />
              </button>
            </div>
          )}
        </div>

        {/* Right Pane on Desktop: Sticky Job Detail Pane (Two-Pane Layout) */}
        <aside className="hidden lg:block w-[440px] xl:w-[500px] flex-shrink-0 sticky top-20 h-[calc(100vh-6.5rem)]">
          <JobDetailPane
            jobId={effectiveJobId}
            isSaved={effectiveJobId ? isSaved(effectiveJobId) : false}
            onToggleSave={() => {
              if (activeJob) toggleSave(activeJob);
            }}
          />
        </aside>
      </div>

      {/* Mobile Slide-Over Detail Drawer when clicking a row on <1024px */}
      <JobDetailSlideOver
        jobId={isMobileDetailOpen ? effectiveJobId : null}
        onClose={() => setIsMobileDetailOpen(false)}
        isSaved={effectiveJobId ? isSaved(effectiveJobId) : false}
        onToggleSave={() => {
          if (activeJob) toggleSave(activeJob);
        }}
      />
    </div>
  );
};

export default JobsPage;
