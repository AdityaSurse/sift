import React from 'react';
import { SearchX } from 'lucide-react';

interface EmptyStateProps {
  query?: string;
  onReset?: () => void;
  onSelectSuggestion?: (query: string) => void;
}

const SUGGESTIONS = [
  'Embedded software internship in Bangalore',
  'Senior React frontend engineer remote',
  'Machine learning engineer San Francisco',
  'Staff DevOps engineer remote',
];

export const EmptyState: React.FC<EmptyStateProps> = ({
  query,
  onReset,
  onSelectSuggestion,
}) => {
  return (
    <div className="py-16 px-4 text-center max-w-md mx-auto">
      <div className="flex items-center justify-center h-12 w-12 rounded-surface border border-border bg-surface mx-auto mb-4 text-text-muted">
        <SearchX size={20} strokeWidth={1.5} />
      </div>

      <h3 className="font-sans text-16 font-medium text-text mb-1.5">
        No openings matched your search
      </h3>

      <p className="font-sans text-13 text-text-muted leading-relaxed mb-6">
        {query ? (
          <>
            No verified company postings matched <span className="text-text font-mono">"{query}"</span>.
            Try broadening your location, removing duration constraints, or searching by functional role.
          </>
        ) : (
          'No openings matched the selected filters. Try clearing some constraints.'
        )}
      </p>

      {/* Suggested Queries */}
      {onSelectSuggestion && (
        <div className="mb-6">
          <p className="font-mono text-12 text-text-muted uppercase tracking-wider mb-2">
            Try searching for:
          </p>
          <div className="flex flex-col gap-1.5 items-center">
            {SUGGESTIONS.map((sug) => (
              <button
                key={sug}
                type="button"
                onClick={() => onSelectSuggestion(sug)}
                className="font-mono text-12 text-accent hover:underline focus-visible:outline-none"
              >
                "{sug}"
              </button>
            ))}
          </div>
        </div>
      )}

      {onReset && (
        <button
          type="button"
          onClick={onReset}
          className="rounded-control border border-border bg-surface px-4 py-2 font-sans text-13 text-text hover:border-border-strong hover:text-accent transition-colors duration-150 ease-editorial"
        >
          Reset all filters
        </button>
      )}
    </div>
  );
};
