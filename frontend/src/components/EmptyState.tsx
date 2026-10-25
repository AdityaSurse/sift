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
    <div className="py-12 px-6 text-center max-w-lg mx-auto rounded-2xl border border-border/80 bg-surface shadow-card my-6">
      <div className="flex items-center justify-center h-12 w-12 rounded-full bg-surface-subdued text-text-muted mx-auto mb-4">
        <SearchX size={22} strokeWidth={1.5} />
      </div>

      <h3 className="font-sans text-18 font-bold text-text mb-2">
        No openings matched your search
      </h3>

      <p className="font-sans text-14 text-text-muted leading-relaxed mb-6">
        {query ? (
          <>
            No verified company postings matched <span className="text-text font-semibold">"{query}"</span>.
            Try broadening your location, removing duration constraints, or searching by functional role.
          </>
        ) : (
          'No openings matched the selected filters. Try clearing some constraints.'
        )}
      </p>

      {/* Suggested Queries */}
      {onSelectSuggestion && (
        <div className="mb-6">
          <p className="font-sans text-12 font-semibold text-text uppercase tracking-wider mb-2.5">
            Suggested searches:
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {SUGGESTIONS.map((sug) => (
              <button
                key={sug}
                type="button"
                onClick={() => onSelectSuggestion(sug)}
                className="rounded-full border border-border bg-surface-subdued px-3.5 py-1 font-sans text-12 font-medium text-accent hover:border-accent/40 transition-colors"
              >
                {sug}
              </button>
            ))}
          </div>
        </div>
      )}

      {onReset && (
        <button
          type="button"
          onClick={onReset}
          className="rounded-full bg-btn-primary px-6 py-2.5 font-sans text-13 font-semibold text-btn-primary-text hover:bg-btn-primary-hover active:scale-[0.98] transition-all shadow-sm"
        >
          Reset all filters
        </button>
      )}
    </div>
  );
};

export default EmptyState;
