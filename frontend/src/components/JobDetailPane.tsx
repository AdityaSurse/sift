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

/** Formats ISO timestamp to quiet date string */
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
      <div className="h-full flex flex-col items-center justify-center p-8 text-center border border-border/80 rounded-2xl bg-surface/50 shadow-sm">
        <div className="h-12 w-12 rounded-full bg-surface-subdued border border-border flex items-center justify-center mb-3 text-text-muted">
          <Building2 size={22} strokeWidth={1.5} />
        </div>
        <p className="font-sans text-16 font-semibold text-text">No position selected</p>
        <p className="font-sans text-13 text-text-muted mt-1 max-w-xs leading-relaxed">
          Select an opening from the list on the left or use <kbd className="rounded border border-border bg-surface px-1 font-mono text-11">j</kbd> / <kbd className="rounded border border-border bg-surface px-1 font-mono text-11">k</kbd> to inspect details.
        </p>
      </div>
    );
  }

  const monogram = (job?.company_name || 'C').charAt(0).toUpperCase();

  return (
    <article className="h-full flex flex-col justify-between border border-border/80 rounded-2xl bg-surface shadow-card overflow-hidden">
      {/* Scrollable Main Area */}
      <div className="flex-1 overflow-y-auto p-6 sm:p-7 space-y-6">
        {/* Loading Skeleton */}
        {isLoading && (
          <div className="space-y-4 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-surface-subdued border border-border" />
              <div className="space-y-2 flex-1">
                <div className="h-5 w-3/5 rounded bg-surface-subdued" />
                <div className="h-3 w-2/5 rounded bg-surface-subdued" />
              </div>
            </div>
            <div className="h-4 w-4/5 rounded bg-surface-subdued mt-6" />
            <div className="space-y-2 pt-4">
              <div className="h-3 w-full rounded bg-surface-subdued" />
              <div className="h-3 w-5/6 rounded bg-surface-subdued" />
              <div className="h-3 w-4/6 rounded bg-surface-subdued" />
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="p-6 text-center border border-border rounded-xl bg-surface-subdued space-y-1">
            <p className="font-sans text-14 font-medium text-text">Could not load position</p>
            <p className="font-mono text-12 text-text-muted">{error.message}</p>
          </div>
        )}

        {job && (
          <>
            {/* Header: Monogram, Title, Company & Save Action */}
            <div className="flex items-start justify-between gap-4 pb-5 border-b border-border/70">
              <div className="flex items-start gap-3.5 min-w-0">
                <div
                  className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-xl bg-btn-primary text-btn-primary-text font-bold text-18 select-none shadow-sm"
                  aria-hidden="true"
                >
                  {monogram}
                </div>

                <div className="min-w-0">
                  <h2 className="font-sans text-18 sm:text-20 font-bold text-text leading-snug">
                    {job.title}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-sans text-14 text-text-muted font-medium">{job.company_name}</span>
                    {job.company_careers_url && (
                      <a
                        href={job.company_careers_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-sans text-12 text-accent hover:underline inline-flex items-center gap-0.5"
                      >
                        <span>Company Careers</span>
                        <ExternalLink size={11} strokeWidth={1.5} />
                      </a>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={onToggleSave}
                className={`p-2.5 rounded-full border transition-colors duration-150 ease-editorial focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  isSaved
                    ? 'bg-accent-subdued text-accent border-accent/40'
                    : 'bg-surface text-text-muted border-border hover:text-text hover:border-border-strong'
                }`}
                title={isSaved ? 'Remove from saved' : 'Save position'}
                aria-label={isSaved ? 'Remove from saved' : 'Save position'}
              >
                <Bookmark size={16} strokeWidth={1.5} fill={isSaved ? 'currentColor' : 'none'} />
              </button>
            </div>

            {/* Metadata Tags Row with Rounded-Full Pills */}
            <div className="flex flex-wrap items-center gap-1.5 font-sans text-12 text-text-muted">
              {job.location_raw && (
                <span className="flex items-center gap-1 rounded-full border border-border bg-surface-subdued px-3 py-1 font-medium">
                  <MapPin size={12} strokeWidth={1.5} className="text-text-muted flex-shrink-0" />
                  <span>{job.location_raw}</span>
                </span>
              )}

              {job.employment_type && (
                <span className="rounded-full border border-border bg-surface-subdued px-3 py-1 font-medium capitalize">
                  {job.employment_type.replace('_', ' ')}
                </span>
              )}

              {job.duration_months && (
                <span className="rounded-full border border-border bg-surface-subdued px-3 py-1 font-medium">
                  {job.duration_months} mo tenure
                </span>
              )}

              {job.remote_type && (
                <span className="rounded-full border border-border bg-surface-subdued px-3 py-1 font-medium capitalize">
                  {job.remote_type}
                </span>
              )}

              {job.experience_level && (
                <span className="rounded-full border border-border bg-surface-subdued px-3 py-1 font-medium capitalize">
                  {job.experience_level} tier
                </span>
              )}

              {job.role_category && (
                <span className="rounded-full border border-border bg-surface-subdued px-3 py-1 font-medium">
                  {job.role_category}
                </span>
              )}

              <span className="flex items-center gap-1 rounded-full border border-border bg-surface-subdued px-3 py-1 text-text-muted">
                <Calendar size={12} strokeWidth={1.5} />
                <span>Posted {formatJobDate(job.posted_at || job.first_seen_at)}</span>
              </span>
            </div>

            {/* Verified ATS Provenance */}
            <div className="rounded-xl border border-border/80 bg-surface-subdued/40 px-3.5 py-2.5 flex items-center justify-between text-12 font-sans text-text-muted">
              <span className="flex items-center gap-1.5 font-medium text-text">
                <ShieldCheck size={15} strokeWidth={2} className="text-emerald-500" />
                <span>Verified Direct ATS Feed</span>
              </span>
              <span className="font-mono text-11">ID: {job.external_id || job.id.slice(0, 8)}</span>
            </div>

            {/* Target Technologies & Skills */}
            {job.skills && job.skills.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-border/60">
                <h4 className="font-sans text-12 font-semibold text-text uppercase tracking-wider">
                  Target Technologies & Skills
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {job.skills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full border border-border bg-surface-subdued px-3 py-0.5 font-mono text-12 text-text font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Full Job Description */}
            <div className="space-y-2 pt-2 border-t border-border/60">
              <h4 className="font-sans text-12 font-semibold text-text uppercase tracking-wider">
                Description
              </h4>
              <div className="font-sans text-14 text-text/90 leading-relaxed whitespace-pre-wrap space-y-4">
                {job.description_text}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Sticky Bottom Apply Action Bar with Caspian Slate Pill Button */}
      {job && (
        <div className="border-t border-border/80 bg-surface p-4 sm:p-5 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <span className="font-sans text-11 font-medium text-text-muted block">Direct employer application</span>
            <span className="font-mono text-11 text-text-muted/70 truncate block max-w-xs sm:max-w-sm">
              {job.apply_url.replace(/^https?:\/\//, '')}
            </span>
          </div>

          <a
            href={job.apply_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 flex items-center gap-2 rounded-full bg-btn-primary px-6 py-2.5 font-sans text-13 font-semibold text-btn-primary-text hover:bg-btn-primary-hover active:scale-[0.98] transition-all shadow-sm"
          >
            <span>Apply on Company Site</span>
            <ExternalLink size={13} strokeWidth={2} />
          </a>
        </div>
      )}
    </article>
  );
};

export default JobDetailPane;
