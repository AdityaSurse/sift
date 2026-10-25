import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Bookmark,
  Building2,
  Calendar,
  ExternalLink,
  MapPin,
  ShieldCheck,
} from 'lucide-react';
import { getJobById } from '../lib/api';

interface JobDetailPaneProps {
  jobId: string | null;
  isSaved: boolean;
  onToggleSave: () => void;
}

/** Formats ISO timestamp to quiet relative time string */
function formatJobDate(dateStr?: string | null): string {
  if (!dateStr) return 'Recently active';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return 'Recently active';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * JobDetailPane Component
 * Why: Renders full position details inline in the desktop two-pane layout,
 * allowing instant scanning without page transitions or modal popups.
 */
export const JobDetailPane: React.FC<JobDetailPaneProps> = ({
  jobId,
  isSaved,
  onToggleSave,
}) => {
  const { data: job, isLoading, error } = useQuery({
    queryKey: ['job-detail', jobId],
    queryFn: () => getJobById(jobId!),
    enabled: Boolean(jobId),
  });

  if (!jobId) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center border border-border/80 rounded-surface bg-surface/30">
        <Building2 size={32} strokeWidth={1.5} className="text-text-muted/40 mb-3" />
        <p className="font-sans text-15 font-medium text-text">No position selected</p>
        <p className="font-mono text-12 text-text-muted mt-1 max-w-xs">
          Select an opening from the list or use <kbd className="rounded border border-border px-1">j</kbd> / <kbd className="rounded border border-border px-1">k</kbd> to inspect details.
        </p>
      </div>
    );
  }

  const monogram = (job?.company_name || 'C').charAt(0).toUpperCase();

  return (
    <article className="h-full flex flex-col justify-between border border-border/80 rounded-surface bg-surface overflow-hidden">
      {/* Scrollable Main Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Loading Skeleton */}
        {isLoading && (
          <div className="space-y-4 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-control bg-bg border border-border" />
              <div className="space-y-1.5 flex-1">
                <div className="h-5 w-3/5 rounded bg-bg" />
                <div className="h-3 w-2/5 rounded bg-bg" />
              </div>
            </div>
            <div className="h-4 w-4/5 rounded bg-bg mt-6" />
            <div className="space-y-2 pt-4">
              <div className="h-3 w-full rounded bg-bg" />
              <div className="h-3 w-5/6 rounded bg-bg" />
              <div className="h-3 w-4/6 rounded bg-bg" />
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="p-6 text-center border border-border rounded-control bg-bg space-y-1">
            <p className="font-sans text-14 font-medium text-text">Could not load position</p>
            <p className="font-mono text-12 text-text-muted">{error.message}</p>
          </div>
        )}

        {job && (
          <>
            {/* Header: Monogram, Title, Company & Save Action */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-border/60">
              <div className="flex items-start gap-3 min-w-0">
                <div
                  className="flex-shrink-0 flex items-center justify-center h-11 w-11 rounded-control border border-border/80 bg-bg font-mono text-18 font-medium text-text select-none"
                  aria-hidden="true"
                >
                  {monogram}
                </div>

                <div className="min-w-0">
                  <h2 className="font-sans text-18 sm:text-20 font-medium text-text leading-snug">
                    {job.title}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-sans text-14 text-text-muted">{job.company_name}</span>
                    {job.company_careers_url && (
                      <a
                        href={job.company_careers_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-11 text-accent hover:underline inline-flex items-center gap-0.5"
                      >
                        <span>Careers page</span>
                        <ExternalLink size={10} strokeWidth={1.5} />
                      </a>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={onToggleSave}
                className={`p-2 rounded-control border transition-colors duration-150 ease-editorial focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent ${
                  isSaved
                    ? 'bg-accent-subdued text-accent border-accent/40'
                    : 'bg-bg text-text-muted border-border hover:text-text hover:border-border-strong'
                }`}
                title={isSaved ? 'Remove from saved' : 'Save position'}
                aria-label={isSaved ? 'Remove from saved' : 'Save position'}
              >
                <Bookmark size={15} strokeWidth={1.5} fill={isSaved ? 'currentColor' : 'none'} />
              </button>
            </div>

            {/* Metadata Tags Row */}
            <div className="flex flex-wrap items-center gap-1.5 font-mono text-12 text-text-muted">
              {job.location_raw && (
                <span className="flex items-center gap-1 rounded border border-border bg-bg px-2.5 py-1">
                  <MapPin size={11} strokeWidth={1.5} className="text-text-muted/70 flex-shrink-0" />
                  <span>{job.location_raw}</span>
                </span>
              )}

              {job.employment_type && (
                <span className="rounded border border-border bg-bg px-2.5 py-1 capitalize">
                  {job.employment_type.replace('_', ' ')}
                </span>
              )}

              {job.duration_months && (
                <span className="rounded border border-border bg-bg px-2.5 py-1">
                  {job.duration_months} mo tenure
                </span>
              )}

              {job.remote_type && (
                <span className="rounded border border-border bg-bg px-2.5 py-1 capitalize">
                  {job.remote_type}
                </span>
              )}

              {job.experience_level && (
                <span className="rounded border border-border bg-bg px-2.5 py-1 capitalize">
                  {job.experience_level} tier
                </span>
              )}

              {job.role_category && (
                <span className="rounded border border-border bg-bg px-2.5 py-1">
                  {job.role_category}
                </span>
              )}

              <span className="flex items-center gap-1 rounded border border-border bg-bg px-2.5 py-1 text-text-muted/70">
                <Calendar size={11} strokeWidth={1.5} />
                <span>Posted {formatJobDate(job.posted_at || job.first_seen_at)}</span>
              </span>
            </div>

            {/* Verified ATS Provenance */}
            <div className="rounded border border-border/60 bg-bg/50 px-3 py-2 flex items-center justify-between text-11 font-mono text-text-muted">
              <span className="flex items-center gap-1.5">
                <ShieldCheck size={13} strokeWidth={1.5} className="text-emerald-500" />
                <span>Verified Direct ATS Feed</span>
              </span>
              <span>ID: {job.external_id || job.id.slice(0, 8)}</span>
            </div>

            {/* Target Technologies & Skills */}
            {job.skills && job.skills.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-border/40">
                <h4 className="font-mono text-11 text-text-muted uppercase tracking-wider">
                  Target Technologies & Skills
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {job.skills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded border border-border bg-bg px-2 py-0.5 font-mono text-12 text-text"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Full Job Description */}
            <div className="space-y-2 pt-2 border-t border-border/40">
              <h4 className="font-mono text-11 text-text-muted uppercase tracking-wider">
                Full Description
              </h4>
              <div className="font-sans text-14 text-text/90 leading-relaxed whitespace-pre-wrap space-y-4">
                {job.description_text}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Sticky Bottom Apply Action Bar */}
      {job && (
        <div className="border-t border-border/80 bg-surface p-4 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <span className="font-mono text-11 text-text-muted block">Direct employer link</span>
            <span className="font-mono text-11 text-text-muted/60 truncate block max-w-xs sm:max-w-sm">
              {job.apply_url.replace(/^https?:\/\//, '')}
            </span>
          </div>

          <a
            href={job.apply_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 flex items-center gap-2 rounded-control bg-accent px-5 py-2 font-sans text-13 font-medium text-white hover:bg-accent-hover transition-colors duration-150 ease-editorial focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
          >
            <span>Apply on Company Site</span>
            <ExternalLink size={13} strokeWidth={1.5} />
          </a>
        </div>
      )}
    </article>
  );
};

export default JobDetailPane;
