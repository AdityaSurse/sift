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

/** Formats ISO timestamp to quiet relative time string (e.g. "Today", "2d ago") */
function formatRelativeDate(dateStr?: string | null): string {
  if (!dateStr) return 'Active';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return 'Active';
  const now = new Date();
  const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
  if (diffHours < 24) return 'Today';
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return '1d ago';
  if (diffDays < 30) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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
      className={`group relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-4.5 border-b border-border/70 bg-surface hover:bg-surface-subdued/70 transition-all duration-150 ease-editorial cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent ${
        isSelected ? 'bg-accent-subdued/40 border-l-4 border-l-accent' : ''
      }`}
    >
      {/* Left Column: Monogram + Information Hierarchy */}
      <div className="flex items-start gap-3.5 min-w-0">
        {/* Company Monogram: High contrast letter tile */}
        <div
          className={`flex-shrink-0 flex items-center justify-center h-9 w-9 rounded-xl font-sans text-14 font-bold select-none transition-all duration-150 ease-editorial ${
            isSelected
              ? 'bg-accent text-white shadow-sm'
              : 'border border-border/80 bg-surface-subdued text-text group-hover:border-accent/40 group-hover:text-accent'
          }`}
          aria-hidden="true"
        >
          {monogram}
        </div>

        {/* Content Hierarchy */}
        <div className="min-w-0 flex-1">
          {/* Title & Employer */}
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <h3 className="font-sans text-15 font-semibold text-text group-hover:text-accent transition-colors duration-150 ease-editorial leading-snug">
              {job.title}
            </h3>
            <span className="font-sans text-13 text-text-muted font-medium">at {job.company_name}</span>
          </div>

          {/* Metadata Line */}
          <div className="mt-1 flex flex-wrap items-center gap-1.5 font-sans text-12 text-text-muted">
            {job.location && (
              <span className="flex items-center gap-1">
                <MapPin size={11} strokeWidth={1.5} className="text-text-muted/70 flex-shrink-0" />
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
            <div className="mt-1.5 flex items-center gap-1.5 font-sans text-11 text-accent font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-accent flex-shrink-0" />
              <span className="truncate">{job.match_reasons.slice(0, 3).join(' · ')}</span>
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Skills, Posted Date & Direct Actions */}
      <div className="flex items-center justify-between sm:justify-end gap-2.5 sm:gap-3 flex-shrink-0 pt-2 sm:pt-0 border-t border-border/30 sm:border-t-0">
        {/* Up to 3 Skill Chips */}
        {job.skills && job.skills.length > 0 && (
          <div className="hidden sm:flex items-center gap-1">
            {job.skills.slice(0, 3).map((skill) => (
              <span
                key={skill}
                className="rounded-full border border-border/70 bg-surface-subdued px-2.5 py-0.5 font-mono text-11 text-text-muted font-medium"
              >
                {skill}
              </span>
            ))}
          </div>
        )}

        {/* Posted relative date */}
        <span className="font-sans text-12 text-text-muted/80 whitespace-nowrap hidden xs:inline select-none">
          {formatRelativeDate(job.posted_at)}
        </span>

        <div className="flex items-center gap-1.5">
          {/* Save / Bookmark Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleSave(job);
            }}
            className={`p-2 rounded-full border transition-colors duration-150 ease-editorial focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent ${
              isSaved
                ? 'bg-accent-subdued text-accent border-accent/40'
                : 'bg-surface text-text-muted border-border hover:text-text hover:border-border-strong'
            }`}
            title={isSaved ? 'Remove from saved' : 'Save job'}
            aria-label={isSaved ? 'Remove from saved' : 'Save job'}
          >
            <Bookmark size={13} strokeWidth={1.5} fill={isSaved ? 'currentColor' : 'none'} />
          </button>

          {/* External Apply Link Pill */}
          <a
            href={job.apply_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 rounded-full border border-border bg-surface px-3 py-1 font-sans text-12 font-medium text-text hover:border-accent hover:text-accent transition-colors duration-150 ease-editorial shadow-xs"
            title="Open direct apply page in new tab"
          >
            <span>Apply</span>
            <ExternalLink size={11} strokeWidth={1.5} />
          </a>
        </div>
      </div>
    </div>
  );
};

export default JobRow;
