import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { type SearchParams, type SearchResponse, searchJobs } from '../lib/api';

/**
 * React Query hook for Sift hybrid search.
 * Why: Automatically deduplicates requests, manages caching, and provides loading/error states.
 */
export function useSearch(params: SearchParams) {
  return useQuery<SearchResponse, Error>({
    queryKey: ['search', params],
    queryFn: () => searchJobs(params),
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000, // 1 minute
  });
}
