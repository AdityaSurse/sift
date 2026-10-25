import { useCallback, useEffect, useMemo, useState } from 'react';
import type { SearchItem } from '../lib/api';

const STORAGE_KEY = 'sift_saved_jobs_v1';

/**
 * Hook to manage bookmarked jobs persisted in localStorage.
 * Why: Provides instantaneous, offline-ready saving with zero server-side auth requirement.
 */
export function useSavedJobs(): {
  savedJobs: SearchItem[];
  savedIds: Set<string>;
  isSaved: (id: string) => boolean;
  toggleSave: (job: SearchItem) => void;
  removeSaved: (id: string) => void;
} {
  const [savedJobs, setSavedJobs] = useState<SearchItem[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const savedIds = useMemo(() => new Set(savedJobs.map((j) => j.job_id)), [savedJobs]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedJobs));
    } catch (err) {
      console.error('Failed to sync saved jobs to localStorage', err);
    }
  }, [savedJobs]);

  const isSaved = useCallback(
    (id: string): boolean => {
      return savedIds.has(id);
    },
    [savedIds]
  );

  const toggleSave = useCallback((job: SearchItem): void => {
    setSavedJobs((prev) => {
      const exists = prev.some((j) => j.job_id === job.job_id);
      if (exists) {
        return prev.filter((j) => j.job_id !== job.job_id);
      }
      return [job, ...prev];
    });
  }, []);

  const removeSaved = useCallback((id: string): void => {
    setSavedJobs((prev) => prev.filter((j) => j.job_id !== id));
  }, []);

  return { savedJobs, savedIds, isSaved, toggleSave, removeSaved };
}
