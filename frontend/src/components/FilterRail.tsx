import React from 'react';
import { Filter, RotateCcw, X } from 'lucide-react';
import type { FilterOptionsResponse, SearchParams } from '../lib/api';

interface FilterRailProps {
  params: SearchParams;
  onChange: (updated: Partial<SearchParams>) => void;
  onReset: () => void;
  options?: FilterOptionsResponse;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

const EMPLOYMENT_TYPES = [
  { value: 'internship', label: 'Internship' },
  { value: 'full_time', label: 'Full-Time' },
  { value: 'part_time', label: 'Part-Time' },
  { value: 'contract', label: 'Contract' },
];

const EXPERIENCE_LEVELS = [
  { value: 'intern', label: 'Intern' },
  { value: 'entry', label: 'Entry / Fresher' },
  { value: 'mid', label: 'Mid-Level' },
  { value: 'senior', label: 'Senior / Lead' },
];

const REMOTE_TYPES = [
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'onsite', label: 'Onsite' },
];

export const FilterRail: React.FC<FilterRailProps> = ({
  params,
  onChange,
  onReset,
  options,
  isOpenMobile = false,
  onCloseMobile,
}) => {
  const hasActiveFilters = Boolean(
    params.type ||
    params.max_months ||
    params.level ||
    params.location ||
    params.remote
  );

  const filterContent = (
    <div className="space-y-6 text-13 font-sans">
      {/* Header & Reset Button */}
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Filter size={15} strokeWidth={1.5} className="text-text-muted" />
          <span className="font-mono text-12 font-medium text-text uppercase tracking-wider">
            Filters
          </span>
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-1 font-mono text-12 text-accent hover:underline focus-visible:outline-none"
          >
            <RotateCcw size={12} strokeWidth={1.5} />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* 1. Employment Type */}
      <div>
        <label className="block font-mono text-12 text-text-muted uppercase tracking-wider mb-2">
          Contract Type
        </label>
        <div className="flex flex-wrap gap-1.5">
          {EMPLOYMENT_TYPES.map((t) => {
            const isSelected = params.type === t.value;
            const facetCount = options?.employment_types.find((f) => f.value === t.value)?.count;

            return (
              <button
                key={t.value}
                type="button"
                onClick={() => onChange({ type: isSelected ? undefined : t.value, page: 1 })}
                className={`flex items-center gap-1.5 rounded-control px-2.5 py-1 transition-colors duration-150 ease-editorial border ${
                  isSelected
                    ? 'border-accent bg-accent-subdued text-accent font-medium'
                    : 'border-border bg-surface text-text hover:border-border-strong'
                }`}
              >
                <span>{t.label}</span>
                {facetCount !== undefined && (
                  <span className="font-mono text-12 opacity-60">({facetCount})</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Duration Slider (Months) */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="font-mono text-12 text-text-muted uppercase tracking-wider">
            Max Duration
          </label>
          <span className="font-mono text-12 text-accent">
            {params.max_months ? `${params.max_months} Months` : 'Any duration'}
          </span>
        </div>
        <input
          type="range"
          min="1"
          max="12"
          step="1"
          value={params.max_months || 12}
          onChange={(e) => {
            const val = parseInt(e.target.value, 10);
            onChange({ max_months: val === 12 ? undefined : val, page: 1 });
          }}
          className="w-full h-1 bg-border rounded-lg appearance-none cursor-pointer accent-accent"
        />
        <div className="flex justify-between font-mono text-12 text-text-muted mt-1">
          <span>1 mo</span>
          <span>6 mo</span>
          <span>12+ mo</span>
        </div>
      </div>

      {/* 3. Experience Level */}
      <div>
        <label className="block font-mono text-12 text-text-muted uppercase tracking-wider mb-2">
          Experience Level
        </label>
        <div className="flex flex-wrap gap-1.5">
          {EXPERIENCE_LEVELS.map((lvl) => {
            const isSelected = params.level === lvl.value;
            const facetCount = options?.experience_levels.find((f) => f.value === lvl.value)?.count;

            return (
              <button
                key={lvl.value}
                type="button"
                onClick={() => onChange({ level: isSelected ? undefined : lvl.value, page: 1 })}
                className={`flex items-center gap-1.5 rounded-control px-2.5 py-1 transition-colors duration-150 ease-editorial border ${
                  isSelected
                    ? 'border-accent bg-accent-subdued text-accent font-medium'
                    : 'border-border bg-surface text-text hover:border-border-strong'
                }`}
              >
                <span>{lvl.label}</span>
                {facetCount !== undefined && (
                  <span className="font-mono text-12 opacity-60">({facetCount})</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Remote Arrangement */}
      <div>
        <label className="block font-mono text-12 text-text-muted uppercase tracking-wider mb-2">
          Workplace Policy
        </label>
        <div className="flex flex-wrap gap-1.5">
          {REMOTE_TYPES.map((rem) => {
            const isSelected = params.remote === rem.value;
            const facetCount = options?.remote_types.find((f) => f.value === rem.value)?.count;

            return (
              <button
                key={rem.value}
                type="button"
                onClick={() => onChange({ remote: isSelected ? undefined : rem.value, page: 1 })}
                className={`flex items-center gap-1.5 rounded-control px-2.5 py-1 transition-colors duration-150 ease-editorial border ${
                  isSelected
                    ? 'border-accent bg-accent-subdued text-accent font-medium'
                    : 'border-border bg-surface text-text hover:border-border-strong'
                }`}
              >
                <span>{rem.label}</span>
                {facetCount !== undefined && (
                  <span className="font-mono text-12 opacity-60">({facetCount})</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Location Search */}
      <div>
        <label className="block font-mono text-12 text-text-muted uppercase tracking-wider mb-2">
          Location
        </label>
        <input
          type="text"
          value={params.location || ''}
          placeholder="Filter city or country..."
          onChange={(e) => onChange({ location: e.target.value || undefined, page: 1 })}
          className="w-full rounded-control border border-border bg-surface px-3 py-1.5 font-sans text-13 text-text placeholder:text-text-muted/60 focus:border-border-strong focus:outline-none focus-visible:ring-1 focus-visible:ring-accent"
        />

        {/* Popular Location Chips */}
        {options?.locations && options.locations.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {options.locations.slice(0, 4).map((loc) => {
              const isSelected = params.location === loc.city;
              return (
                <button
                  key={loc.city}
                  type="button"
                  onClick={() => onChange({ location: isSelected ? undefined : loc.city, page: 1 })}
                  className={`rounded-control px-2 py-0.5 font-mono text-12 border transition-colors ${
                    isSelected
                      ? 'border-accent bg-accent-subdued text-accent'
                      : 'border-border bg-surface text-text-muted hover:text-text'
                  }`}
                >
                  {loc.city}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 6. Role Category */}
      {options?.role_categories && options.role_categories.length > 0 && (
        <div>
          <label className="block font-mono text-12 text-text-muted uppercase tracking-wider mb-2">
            Role Category
          </label>
          <div className="flex flex-wrap gap-1.5">
            {options.role_categories.map((cat) => {
              const isSelected = params.q?.toLowerCase() === cat.value.toLowerCase();
              return (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => onChange({ q: isSelected ? undefined : cat.value, page: 1 })}
                  className={`flex items-center gap-1.5 rounded-control px-2.5 py-1 transition-colors duration-150 ease-editorial border ${
                    isSelected
                      ? 'border-accent bg-accent-subdued text-accent font-medium'
                      : 'border-border bg-surface text-text hover:border-border-strong'
                  }`}
                >
                  <span>{cat.value}</span>
                  <span className="font-mono text-12 opacity-60">({cat.count})</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Rail */}
      <aside className="hidden md:block w-64 flex-shrink-0 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto pr-6 border-r border-border py-4">
        {filterContent}
      </aside>

      {/* Mobile Collapsible Bottom Sheet */}
      {isOpenMobile && (
        <div className="md:hidden fixed inset-0 z-50 overflow-hidden" aria-modal="true" role="dialog">
          <div
            onClick={onCloseMobile}
            className="fixed inset-0 bg-black/60 transition-opacity duration-150 ease-editorial"
          />
          <div className="fixed inset-x-0 bottom-0 max-h-[85vh] rounded-t-surface border-t border-border bg-bg p-6 overflow-y-auto shadow-popover">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-border">
              <span className="font-sans text-16 font-medium text-text">Search Filters</span>
              <button
                type="button"
                onClick={onCloseMobile}
                className="p-1 rounded-control text-text-muted hover:text-text"
                aria-label="Close filters"
              >
                <X size={18} strokeWidth={1.5} />
              </button>
            </div>
            {filterContent}
            <div className="pt-6 mt-6 border-t border-border">
              <button
                type="button"
                onClick={onCloseMobile}
                className="w-full rounded-control bg-accent py-2.5 font-sans text-14 font-medium text-white hover:bg-accent-hover transition-colors"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
