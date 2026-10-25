import { useQuery } from '@tanstack/react-query';
import { type FilterOptionsResponse, getFilterOptions } from '../lib/api';

/**
 * React Query hook fetching live filter facet options and open job counts.
 */
export function useFilterOptions() {
  return useQuery<FilterOptionsResponse, Error>({
    queryKey: ['filter-options'],
    queryFn: getFilterOptions,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
