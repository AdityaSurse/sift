import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchBar } from '../components/SearchBar';
import { useFilterOptions } from '../hooks/useFilterOptions';

const EXAMPLE_CHIPS = [
  { label: '6 mo embedded internship Bangalore', query: '6 month embedded software internship in Bangalore, fresher' },
  { label: 'Senior React frontend remote', query: 'Senior React frontend engineer in London, remote' },
  { label: 'Machine learning San Francisco', query: 'Full time machine learning engineer in San Francisco' },
  { label: 'Staff DevOps remote USA', query: 'Staff DevOps engineer remote USA' },
];

export const LandingPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const { data: filterOptions } = useFilterOptions();

  const handleSearch = (searchTerm: string): void => {
    const trimmed = searchTerm.trim();
    if (!trimmed) {
      navigate('/search');
    } else {
      navigate(`/search?q=${encodeURIComponent(trimmed)}`);
    }
  };

  const totalOpen = filterOptions?.total_open_jobs;
  const statsLine = totalOpen
    ? `Indexing direct ATS feeds across ${totalOpen.toLocaleString()} verified open roles.`
    : 'Indexing direct ATS feeds across verified company career portals.';

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-9rem)] px-4 sm:px-6 py-12 sm:py-16 max-w-3xl mx-auto text-center transition-colors duration-150 ease-editorial">
      {/* Editorial Headline in Instrument Serif */}
      <h1 className="font-serif text-48 sm:text-64 text-text font-normal tracking-tight max-w-2xl mx-auto leading-none mb-3 sm:mb-4">
        The jobs nobody posts.
      </h1>

      {/* Understated Subtitle */}
      <p className="font-sans text-15 sm:text-16 text-text-muted max-w-lg mx-auto leading-relaxed mb-8">
        Aggregated directly from company career portals and public ATS endpoints. Enriched with AI.
        Zero sponsored clutter or expired listings.
      </p>

      {/* Expansive Hero Search Bar */}
      <div className="w-full max-w-2xl mb-4">
        <SearchBar
          size="large"
          value={query}
          onChange={setQuery}
          onSubmit={handleSearch}
          autoFocus
        />
      </div>

      {/* 4 Example Query Chips */}
      <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 mb-10 max-w-2xl">
        <span className="font-mono text-12 text-text-muted/60 mr-1 select-none">Try:</span>
        {EXAMPLE_CHIPS.map((chip) => (
          <button
            key={chip.label}
            type="button"
            onClick={() => {
              setQuery(chip.query);
              handleSearch(chip.query);
            }}
            className="rounded-full border border-border/80 bg-surface/70 px-3 py-0.5 font-mono text-12 text-text-muted hover:border-accent/40 hover:text-accent transition-colors duration-150 ease-editorial focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Quiet Live Index Stats Note */}
      <div className="pt-6 border-t border-border/40 inline-flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
        <p className="font-mono text-12 text-text-muted tracking-tight">
          {statsLine}
        </p>
      </div>
    </div>
  );
};

export default LandingPage;
