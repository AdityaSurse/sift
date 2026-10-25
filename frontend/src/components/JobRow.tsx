import React from 'react';
import { Bookmark, ExternalLink, MapPin } from 'lucide-react';
import type { SearchItem } from '../lib/api';

interface JobRowProps {
  job: SearchItem;
  isSaved: boolean;
  onToggleSave: (job: SearchItem) => void;
  onSelect: (job: SearchItem) => void;
  isSelected?: boolean;
}

export const JobRow: React.FC<JobRowProps> = ({
  job,
  isSaved,
  onToggleSave,
  onSelect,
  isSelected = false,
}) => {
  const monogram = (job.company_name || 'C').charAt(0).toUpperCase();

  const handleRowClick = (e: React.MouseEvent): void => {
    // Prevent drawer trigger when clicking directly on the external apply link or bookmark button
    const target = e.target as HTMLElement;
    if (target.closest('a') || target.closest('button')) {
      return;
    }
    onSelect(job);
  };

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter') {
      onSelect(job);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleRowClick}
      onKeyDown={handleKeyDown}
      className={`group relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 border-b border-border/70 bg-bg hover:bg-surface/50 transition-colors duration-150 ease-editorial cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent ${
        isSelected ? 'bg-surface/80 border-l-2 border-l-accent' : ''
      }`}
    >
      {/* Left Column: Monogram + Information Hierarchy */}
      <div className="flex items-start gap-3 min-w-0">
        {/* Company Monogram: Tinted letter square without logo clutter */}
        <div
          className="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded border border-border/80 bg-surface font-mono text-13 font-semibold text-text select-none group-hover:border-border-strong transition-colors duration-150 ease-editorial"
          aria-hidden="true"
        >
          {monogram}
        </div>

        {/* Content Hierarchy */}
        <div className="min-w-0 flex-1">
          {/* Title & Employer */}
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <h3 className="font-sans text-15 font-medium text-text group-hover:text-accent transition-colors duration-150 ease-editorial leading-snug">
              {job.title}
            </h3>
            <span className="font-sans text-13 text-text-muted">at {job.company_name}</span>
          </div>

          {/* Geist Mono Metadata Line */}
          <div className="mt-1 flex flex-wrap items-center gap-1.5 font-mono text-12 text-text-muted">
            {job.location && (
              <span className="flex items-center gap-1">
                <MapPin size={11} strokeWidth={1.5} className="text-text-muted/60 flex-shrink-0" />
                <span>{job.location}</span>
              </span>
            )}

            {job.employment_type && (
              <>
                <span className="text-border">·</span>
                <span className="capitalize">{job.employment_type.replace('_', ' ')}</span>
              </>
            )}

            {job.duration_months && (
              <>
                <span className="text-border">·</span>
                <span>{job.duration_months} mo tenure</span>
              </>
            )}

            {job.remote_type && (
              <>
                <span className="text-border">·</span>
                <span className="capitalize">{job.remote_type}</span>
              </>
            )}

            {job.experience_level && (
              <>
                <span className="text-border">·</span>
                <span className="capitalize">{job.experience_level} tier</span>
              </>
            )}
          </div>

          {/* Subtle Match Rationale Line */}
          {job.match_reasons && job.match_reasons.length > 0 && (
            <div className="mt-1.5 flex items-center gap-1.5 font-mono text-11 text-text-muted/80">
              <span className="h-1.5 w-1.5 rounded-full bg-accent flex-shrink-0" />
              <span className="truncate">{job.match_reasons.slice(0, 3).join(' · ')}</span>
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Skills & Direct Actions */}
      <div className="flex items-center justify-between sm:justify-end gap-2.5 sm:gap-3 flex-shrink-0 pt-2 sm:pt-0 border-t border-border/30 sm:border-t-0">
        {/* Up to 3 Skill Chips */}
        {job.skills && job.skills.length > 0 && (
          <div className="hidden sm:flex items-center gap-1">
            {job.skills.slice(0, 3).map((skill) => (
              <span
                key={skill}
                className="rounded border border-border/60 bg-surface/60 px-1.5 py-0.5 font-mono text-11 text-text-muted"
              >
                {skill}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-1.5">
          {/* Save / Bookmark Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleSave(job);
            }}
            className={`p-1.5 rounded border border-border transition-colors duration-150 ease-editorial focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent ${
              isSaved
                ? 'bg-accent-subdued text-accent border-accent/40'
                : 'bg-surface text-text-muted hover:text-text hover:border-border-strong'
            }`}
            title={isSaved ? 'Remove from saved' : 'Save job'}
            aria-label={isSaved ? 'Remove from saved' : 'Save job'}
          >
            <Bookmark size={13} strokeWidth={1.5} fill={isSaved ? 'currentColor' : 'none'} />
          </button>

          {/* External Apply Link */}
          <a
            href={job.apply_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 rounded border border-border bg-surface px-2.5 py-1 font-sans text-12 text-text hover:border-accent hover:text-accent transition-colors duration-150 ease-editorial focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
            title="Open direct apply page in new tab"
          >
            <span>Apply</span>
            <ExternalLink size={12} strokeWidth={1.5} />
          </a>
        </div>
      </div>
    </div>
  );
};

export default JobRow;
