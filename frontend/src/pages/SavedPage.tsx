import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, Search } from 'lucide-react';
import { JobDetailSlideOver } from '../components/JobDetailSlideOver';
import { JobRow } from '../components/JobRow';
import { useSavedJobs } from '../hooks/useSavedJobs';
import type { SearchItem } from '../lib/api';

/**
 * SavedPage displays all bookmarked positions persisted in localStorage.
 * Why: Allows job seekers to curate a private list of target roles without creating an account.
 */
export const SavedPage: React.FC = () => {
  const { savedJobs, isSaved, toggleSave } = useSavedJobs();
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [activeRowIndex, setActiveRowIndex] = useState<number>(-1);

  // Keyboard navigation: j (down), k (up), Enter (open selected)
  useEffect(() => {
    if (savedJobs.length === 0) return;

    const handleKeyDown = (e: KeyboardEvent): void => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || (e.target as HTMLElement)?.isContentEditable) {
        return;
      }

      if (e.key === 'j' || e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveRowIndex((prev) => Math.min(prev + 1, savedJobs.length - 1));
      } else if (e.key === 'k' || e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveRowIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' && activeRowIndex >= 0 && activeRowIndex < savedJobs.length) {
        e.preventDefault();
        setSelectedJobId(savedJobs[activeRowIndex].job_id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [savedJobs, activeRowIndex]);

  const activeJob = savedJobs.find((j) => j.job_id === selectedJobId);

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-8 py-10 transition-colors duration-150 ease-editorial">
      {/* Editorial Page Header */}
      <div className="mb-8 pb-5 border-b border-border/80">
        <div className="flex items-center gap-2.5 mb-1.5">
          <div className="p-2 rounded-xl bg-accent-subdued text-accent">
            <Bookmark size={20} strokeWidth={1.5} />
          </div>
          <h1 className="font-sans text-26 font-bold text-text">
            Saved Positions
          </h1>
          {savedJobs.length > 0 && (
            <span className="ml-2 rounded-full bg-accent-subdued px-3 py-0.5 font-mono text-12 font-semibold text-accent">
              {savedJobs.length} {savedJobs.length === 1 ? 'role' : 'roles'}
            </span>
          )}
        </div>
        <p className="font-sans text-14 text-text-muted">
          Positions you've bookmarked for review. Stored locally on this device with zero tracking.
        </p>
      </div>

      {/* Empty State */}
      {savedJobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-border/80 bg-surface shadow-card">
          <div className="flex items-center justify-center h-12 w-12 rounded-full bg-surface-subdued text-text-muted mb-4">
            <Bookmark size={22} strokeWidth={1.5} />
          </div>
          <h3 className="font-sans text-18 font-bold text-text mb-1">
            No saved positions yet
          </h3>
          <p className="font-sans text-14 text-text-muted max-w-sm mb-6 leading-relaxed">
            Bookmark roles while exploring to keep track of target opportunities you want to apply to.
          </p>
          <Link
            to="/jobs"
            className="flex items-center gap-2 rounded-full bg-btn-primary px-6 py-2.5 font-sans text-13 font-semibold text-btn-primary-text hover:bg-btn-primary-hover active:scale-[0.98] transition-all shadow-sm"
          >
            <Search size={14} strokeWidth={2} />
            <span>Discover Open Positions</span>
          </Link>
        </div>
      ) : (
        /* Dense Saved Rows List */
        <div className="space-y-4">
          <div className="flex items-center justify-between font-mono text-12 text-text-muted pb-1">
            <span>{savedJobs.length} bookmarked {savedJobs.length === 1 ? 'position' : 'positions'}</span>
            <span className="hidden sm:inline">
              <kbd className="rounded border border-border px-1">j</kbd> / <kbd className="rounded border border-border px-1">k</kbd> to navigate, <kbd className="rounded border border-border px-1">Enter</kbd> to view
            </span>
          </div>

          <div className="border border-border/80 rounded-2xl overflow-hidden divide-y divide-border/60 bg-surface shadow-card">
            {savedJobs.map((job, idx) => (
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
        </div>
      )}

      {/* Slide-over Detail Drawer */}
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

export default SavedPage;
