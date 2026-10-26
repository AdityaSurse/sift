import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Search, Sparkles } from 'lucide-react';
import { CategoryTile } from '../components/CategoryTile';
import { HowItWorksMockup } from '../components/HowItWorksMockup';
import { FaqAccordion } from '../components/FaqAccordion';
import { getLandingStats, type LandingCategoryCount } from '../lib/api';

const EXAMPLE_CHIPS = [
  { label: '6 mo embedded internship Bangalore', query: '6 month embedded software internship in Bangalore, fresher' },
  { label: 'Senior React frontend remote', query: 'Senior React frontend engineer in London, remote' },
  { label: 'Machine learning San Francisco', query: 'Full time machine learning engineer in San Francisco' },
  { label: 'Staff DevOps remote USA', query: 'Staff DevOps engineer remote USA' },
];

const ROTATING_PLACEHOLDERS = [
  '6 month embedded firmware internship in Bangalore...',
  'Senior React frontend engineer remote...',
  'Full time machine learning engineer in San Francisco...',
  'Staff DevOps engineer remote USA...',
];

/**
 * Sift Editorial Landing Page
 * Why: Assembles the 8 required landing sections in exact sequence,
 * powered 100% by live database statistics and styled with Aegean Marine Teal and Caspian Slate tokens.
 */
export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  // Fetch live verified stats from backend database
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['landing-stats'],
    queryFn: getLandingStats,
    staleTime: 60 * 1000,
  });

  // Animated rotating placeholder text
  useEffect(() => {
    const timer = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % ROTATING_PLACEHOLDERS.length);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  const handleSearchSubmit = (e?: React.FormEvent): void => {
    if (e) e.preventDefault();
    const clean = query.trim();
    if (clean) {
      navigate(`/jobs?q=${encodeURIComponent(clean)}`);
    } else {
      navigate('/jobs');
    }
  };

  const handleCategoryClick = (category: LandingCategoryCount): void => {
    if (category.id === 'internships') {
      navigate('/jobs?type=internship');
    } else if (category.id === 'remote') {
      navigate('/jobs?remote=remote');
    } else {
      navigate(`/jobs?q=${encodeURIComponent(category.query_param)}`);
    }
  };

  return (
    <div className="min-h-screen bg-bg text-text transition-colors duration-150 ease-editorial">
      {/* 3. Hero Section */}
      <section className="relative px-4 sm:px-8 pt-16 sm:pt-24 pb-16 sm:pb-24 max-w-5xl mx-auto text-center">
        {/* Subtle pill badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent-subdued px-3.5 py-1 text-accent font-sans text-12 font-medium mb-6 shadow-2xs">
          <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
          <Sparkles size={13} strokeWidth={2} />
          <span>Polite, Direct ATS Ingestion Engine</span>
        </div>

        {/* Editorial Headline with Instrument Serif & Aegean Accent Highlight */}
        <h1 className="font-serif text-48 sm:text-64 md:text-72 text-text font-normal tracking-tight leading-[1.04] max-w-4xl mx-auto mb-5">
          Get hired directly through verified company <span className="italic text-accent font-serif">ATS career portals</span>.
        </h1>

        {/* Subhead */}
        <p className="font-sans text-16 sm:text-18 text-text-muted max-w-2xl mx-auto leading-relaxed mb-10">
          Aggregated directly from company career pages and verified public ATS endpoints.
          Enriched with AI. Zero recruiter bloat, zero sponsored spam, zero middlemen.
        </p>

        {/* Large Natural-Language Search Capsule with Animated Placeholder & Cmd+K Hint */}
        <form
          onSubmit={handleSearchSubmit}
          className="relative max-w-2xl mx-auto mb-5 group"
        >
          <div className="relative flex items-center rounded-full border border-border bg-surface shadow-card p-1.5 focus-within:border-accent focus-within:ring-4 focus-within:ring-accent/15 transition-all duration-200 ease-editorial">
            <div className="pl-4 pr-2 text-text-muted group-focus-within:text-accent transition-colors">
              <Search size={18} strokeWidth={1.5} />
            </div>

            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Try: "${ROTATING_PLACEHOLDERS[placeholderIndex]}"`}
              className="w-full bg-transparent py-2.5 px-2 font-sans text-15 sm:text-16 text-text placeholder:text-text-muted/50 focus:outline-none"
            />

            <div className="flex items-center gap-2 pr-1.5">
              <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded-full border border-border bg-surface-subdued px-2.5 py-1 font-mono text-11 text-text-muted select-none">
                <span className="text-10">⌘</span>K
              </kbd>

              <button
                type="submit"
                className="rounded-full bg-btn-primary px-6 py-2.5 font-sans text-13 font-semibold text-btn-primary-text hover:bg-btn-primary-hover active:scale-[0.98] transition-all shadow-sm"
              >
                Search
              </button>
            </div>
          </div>
        </form>

        {/* 4 Example Query Prompt Chips */}
        <div className="flex flex-wrap items-center justify-center gap-2 max-w-2xl mx-auto mb-10">
          <span className="font-sans text-12 text-text-muted font-medium mr-1 select-none">Try:</span>
          {EXAMPLE_CHIPS.map((chip) => (
            <button
              key={chip.label}
              type="button"
              onClick={() => {
                setQuery(chip.query);
                navigate(`/jobs?q=${encodeURIComponent(chip.query)}`);
              }}
              className="rounded-full border border-border/80 bg-surface px-3.5 py-1 font-sans text-12 text-text-muted hover:border-accent/50 hover:text-accent hover:bg-accent-subdued/30 hover:-translate-y-0.5 transition-all duration-150 ease-editorial focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent shadow-2xs"
            >
              {chip.label}
            </button>
          ))}
        </div>
      </section>

      {/* 4. Live Stats Row */}
      <section className="border-y border-border/70 bg-surface-subdued/50 py-10 px-4 sm:px-8">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="p-3">
            <span className="block font-sans text-32 sm:text-40 font-bold text-text tracking-tight">
              {statsLoading ? '—' : stats?.total_companies.toLocaleString() ?? '0'}
            </span>
            <span className="font-sans text-12 text-text-muted font-medium uppercase tracking-wider mt-1 block">
              Companies Indexed
            </span>
          </div>

          <div className="p-3">
            <span className="block font-sans text-32 sm:text-40 font-bold text-text tracking-tight">
              {statsLoading ? '—' : stats?.total_roles.toLocaleString() ?? '0'}
            </span>
            <span className="font-sans text-12 text-text-muted font-medium uppercase tracking-wider mt-1 block">
              Open Roles
            </span>
          </div>

          <div className="p-3">
            <div className="flex items-center justify-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-sans text-32 sm:text-40 font-bold text-text tracking-tight">
                {statsLoading ? '—' : stats?.roles_added_24h.toLocaleString() ?? '0'}
              </span>
            </div>
            <span className="font-sans text-12 text-text-muted font-medium uppercase tracking-wider mt-1 block">
              Roles Added Today
            </span>
          </div>

          <div className="p-3">
            <span className="block font-sans text-32 sm:text-40 font-bold text-text tracking-tight">
              {statsLoading ? '—' : stats?.ats_platforms_count ?? '3'}
            </span>
            <span className="font-sans text-12 text-text-muted font-medium uppercase tracking-wider mt-1 block">
              ATS Platforms Covered
            </span>
          </div>
        </div>
      </section>

      {/* 5. "Fresh roles, added daily": Category Browse Grid */}
      <section className="py-20 sm:py-28 max-w-6xl mx-auto px-4 sm:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent-subdued px-3 py-0.5 font-sans text-11 font-medium text-accent uppercase tracking-wider">
              Curated Index
            </span>
            <h2 className="font-serif text-36 sm:text-44 text-text font-normal tracking-tight mt-2">
              Fresh roles, added daily.
            </h2>
          </div>
          <Link
            to="/jobs"
            className="font-sans text-13 font-semibold text-accent hover:underline inline-flex items-center gap-1 self-start sm:self-auto"
          >
            <span>Browse all open roles</span>
            <ArrowRight size={14} strokeWidth={2} />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {stats?.categories?.map((cat) => (
            <CategoryTile
              key={cat.id}
              category={cat}
              onClick={handleCategoryClick}
            />
          ))}
        </div>
      </section>

      {/* 6. "How Sift Works" Walkthrough Sections */}
      <HowItWorksMockup />

      {/* 7. FAQ Accordion */}
      <FaqAccordion />

      {/* 8. Closing CTA and Minimal Footer */}
      <section className="py-24 sm:py-32 border-t border-border/70 bg-surface-subdued/30 text-center px-4 sm:px-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <h2 className="font-serif text-36 sm:text-52 text-text font-normal tracking-tight">
            Discover openings directly <span className="italic">from the source</span>.
          </h2>
          <p className="font-sans text-16 text-text-muted leading-relaxed">
            No recruiter walls. No affiliate redirects. Just authentic, verified engineering roles
            updated daily from company career endpoints.
          </p>
          <div className="pt-2">
            <Link
              to="/jobs"
              className="inline-flex items-center gap-2 rounded-full bg-btn-primary px-8 py-3.5 font-sans text-14 font-semibold text-btn-primary-text hover:bg-btn-primary-hover active:scale-[0.98] transition-all shadow-sm"
            >
              <span>Explore All Open Roles</span>
              <ArrowRight size={16} strokeWidth={2} />
            </Link>
          </div>
        </div>
      </section>

      {/* Minimal Footer */}
      <footer className="border-t border-border/80 bg-surface py-12 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 font-sans text-13 text-text-muted">
          <div className="flex items-center gap-3">
            <span className="font-bold text-text">Sift</span>
            <span>·</span>
            <span>Editorial Job Discovery Engine</span>
          </div>

          <div className="flex items-center gap-6 font-medium">
            <Link to="/jobs" className="hover:text-text transition-colors">Jobs</Link>
            <Link to="/saved" className="hover:text-text transition-colors">Saved</Link>
            <Link to="/admin" className="hover:text-text transition-colors">Admin</Link>
            <Link to="/design" className="hover:text-text transition-colors">Design System</Link>
          </div>

          <p className="text-text-muted text-center sm:text-right text-12">
            Polite crawler respecting robots.txt · Greenhouse, Lever, Ashby
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
