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
    ? `Indexing direct ATS boards across ${totalOpen.toLocaleString()} verified open roles.`
    : 'Indexing direct ATS boards across verified company career portals.';

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] px-4 sm:px-6 py-12 max-w-4xl mx-auto text-center transition-colors duration-150 ease-editorial">
      {/* Editorial Headline in Instrument Serif */}
      <h1 className="font-serif text-56 text-text tracking-tight max-w-2xl mx-auto leading-none mb-4">
        The jobs nobody posts.
      </h1>

      {/* Understated Subtitle */}
      <p className="font-sans text-16 text-text-muted max-w-xl mx-auto leading-relaxed mb-10">
        Aggregated directly from company career portals and public ATS endpoints. Enriched with AI.
        Zero sponsored clutter or expired listings.
      </p>

      {/* Expansive Hero Search Bar */}
      <div className="w-full max-w-2xl mb-5">
        <SearchBar
          size="large"
          value={query}
          onChange={setQuery}
          onSubmit={handleSearch}
          autoFocus
        />
      </div>

      {/* 4 Example Query Chips */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-12">
        <span className="font-mono text-12 text-text-muted/60 mr-1">Examples:</span>
        {EXAMPLE_CHIPS.map((chip) => (
          <button
            key={chip.label}
            type="button"
            onClick={() => handleSearch(chip.query)}
            className="rounded-control border border-border bg-surface px-2.5 py-1 font-mono text-12 text-text-muted hover:border-border-strong hover:text-text transition-colors duration-150 ease-editorial focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Quiet Live Index Stats Note */}
      <div className="pt-8 border-t border-border/50 w-full max-w-md">
        <p className="font-mono text-12 text-text-muted tracking-tight">
          {statsLine}
        </p>
      </div>
    </div>
  );
};
