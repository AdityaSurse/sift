import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bookmark, ExternalLink, MapPin, X } from 'lucide-react';
import { getJobById } from '../lib/api';

interface JobDetailSlideOverProps {
  jobId: string | null;
  onClose: () => void;
  isSaved: boolean;
  onToggleSave: () => void;
}

export const JobDetailSlideOver: React.FC<JobDetailSlideOverProps> = ({
  jobId,
  onClose,
  isSaved,
  onToggleSave,
}) => {
  const { data: job, isLoading, error } = useQuery({
    queryKey: ['job-detail', jobId],
    queryFn: () => getJobById(jobId!),
    enabled: Boolean(jobId),
  });

  // Handle escape key listener to close drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!jobId) return null;

  const monogram = (job?.company_name || 'C').charAt(0).toUpperCase();

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" aria-modal="true" role="dialog">
      {/* Dimmed backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/60 transition-opacity duration-150 ease-editorial"
      />

      {/* Slide-over panel container */}
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <aside className="w-screen max-w-xl border-l border-border bg-bg text-text shadow-popover flex flex-col justify-between transition-transform duration-150 ease-editorial">
          {/* Top Bar Header */}
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <span className="font-mono text-12 text-text-muted uppercase tracking-wider">
              Position Details
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onToggleSave}
                disabled={isLoading || !job}
                className={`p-2 rounded-full border border-border transition-colors duration-150 ease-editorial focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  isSaved
                    ? 'bg-accent-subdued text-accent border-accent/40'
                    : 'bg-surface text-text-muted hover:text-text hover:border-border-strong'
                }`}
                title={isSaved ? 'Remove from saved' : 'Save position'}
              >
                <Bookmark size={15} strokeWidth={1.5} fill={isSaved ? 'currentColor' : 'none'} />
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-full border border-border bg-surface text-text-muted hover:text-text hover:border-border-strong transition-colors duration-150 ease-editorial focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                title="Close panel (Esc)"
              >
                <X size={16} strokeWidth={1.5} />
              </button>
            </div>
          </div>

          {/* Main Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            {isLoading && (
              <div className="space-y-4 animate-pulse">
                <div className="h-8 w-3/4 rounded-control bg-surface border border-border" />
                <div className="h-4 w-1/2 rounded-control bg-surface border border-border" />
                <div className="pt-6 space-y-2">
                  <div className="h-4 w-full rounded bg-surface" />
                  <div className="h-4 w-5/6 rounded bg-surface" />
                  <div className="h-4 w-4/6 rounded bg-surface" />
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-control border border-border bg-surface p-6 text-center text-text-muted">
                <p className="font-sans text-14 text-text">Failed to load position details.</p>
                <p className="font-mono text-12 text-text-muted mt-1">{error.message}</p>
              </div>
            )}

            {job && (
              <>
                {/* Position Title & Employer */}
                <div>
                  <div className="flex items-center gap-3.5 mb-4">
                    <div className="flex-shrink-0 flex items-center justify-center h-11 w-11 rounded-xl bg-btn-primary text-btn-primary-text font-sans text-16 font-bold select-none shadow-sm">
                      {monogram}
                    </div>
                    <div>
                      <h2 className="font-sans text-20 font-bold text-text leading-tight">
                        {job.title}
                      </h2>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-sans text-14 text-text-muted font-medium">{job.company_name}</span>
                        {job.company_careers_url && (
                          <a
                            href={job.company_careers_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-sans text-12 text-accent hover:underline flex items-center gap-0.5"
                          >
                            <span>Careers page</span>
                            <ExternalLink size={11} strokeWidth={1.5} />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Metadata Tag Row with Rounded-Full Pills */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1 font-sans text-12 text-text-muted">
                    {job.location_raw && (
                      <span className="flex items-center gap-1 rounded-full border border-border bg-surface-subdued px-3 py-1 font-medium">
                        <MapPin size={12} strokeWidth={1.5} className="text-text-muted/70" />
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
                        {job.duration_months} mo contract
                      </span>
                    )}

                    {job.remote_type && (
                      <span className="rounded-full border border-border bg-surface-subdued px-3 py-1 font-medium capitalize">
                        {job.remote_type}
                      </span>
                    )}

                    {job.experience_level && (
                      <span className="rounded-full border border-border bg-surface-subdued px-3 py-1 font-medium capitalize">
                        {job.experience_level}
                      </span>
                    )}

                    {job.role_category && (
                      <span className="rounded-full border border-border bg-surface-subdued px-3 py-1 font-medium">
                        {job.role_category}
                      </span>
                    )}
                  </div>
                </div>

                {/* Skills Section */}
                {job.skills && job.skills.length > 0 && (
                  <div className="border-t border-border pt-5">
                    <h4 className="font-sans text-12 font-bold text-text uppercase tracking-wider mb-2.5">
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

                {/* Cleaned Job Description */}
                <div className="border-t border-border pt-5">
                  <h4 className="font-sans text-12 font-bold text-text uppercase tracking-wider mb-3">
                    Description
                  </h4>
                  <div className="font-sans text-14 text-text/90 leading-relaxed whitespace-pre-wrap space-y-4">
                    {job.description_text}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Sticky Bottom Footer Apply Action with Caspian Slate Pill Button */}
          {job && (
            <div className="border-t border-border bg-surface px-6 py-4 flex items-center justify-between gap-4">
              <span className="font-sans text-12 text-text-muted">
                Direct ATS apply link
              </span>

              <a
                href={job.apply_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-full bg-btn-primary px-6 py-2.5 font-sans text-13 font-semibold text-btn-primary-text hover:bg-btn-primary-hover active:scale-[0.98] transition-all shadow-sm"
              >
                <span>Apply on Company Site</span>
                <ExternalLink size={14} strokeWidth={2} />
              </a>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};
