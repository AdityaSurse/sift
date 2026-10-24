import React, { useState } from 'react';
import {
  Sun,
  Moon,
  Search,
  ExternalLink,
  MapPin,
  Clock,
  DollarSign,
  Building2,
  Check,
  Command,
  ArrowUpRight,
} from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

export const DesignSystemShowcase: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const [selectedChip, setSelectedChip] = useState<string>('Remote');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const chips = ['Remote', 'Hybrid', 'New York', 'San Francisco', 'Series A', 'Staff+'];

  return (
    <div className="min-h-screen bg-bg text-text transition-colors duration-150 ease-editorial">
      {/* Top Navigation Bar: Hairline border, no floating drop shadow */}
      <header className="sticky top-0 z-40 w-full border-b border-border bg-bg/95 backdrop-blur-none px-6 py-3.5">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-mono text-14 font-medium tracking-tight text-text">SIFT</span>
            <span className="h-3.5 w-px bg-border" />
            <span className="font-mono text-12 text-text-muted uppercase tracking-wider">
              Design System Specimen
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="font-mono text-12 text-text-muted">
              Mode: <span className="text-text capitalize">{theme}</span>
            </span>
            <button
              id="theme-toggle-btn"
              onClick={toggleTheme}
              className="flex items-center gap-2 rounded-control border border-border bg-surface px-3 py-1.5 font-sans text-13 text-text hover:border-border-strong transition-all duration-150 ease-editorial"
              title="Toggle Light / Dark Mode"
            >
              {theme === 'dark' ? (
                <>
                  <Sun size={16} strokeWidth={1.5} className="text-accent" />
                  <span>Light Mode</span>
                </>
              ) : (
                <>
                  <Moon size={16} strokeWidth={1.5} className="text-accent" />
                  <span>Dark Mode</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-6xl px-6 py-12 space-y-16">
        {/* Section 1: Editorial Display Headline (Instrument Serif) */}
        <section className="space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-control border border-border bg-surface px-2.5 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            <span className="font-mono text-12 text-text-muted">Direct Career Index</span>
          </div>
          <h1 className="font-serif text-56 leading-[1.05] tracking-[-0.025em] text-text">
            Find the jobs and internships that never make it to LinkedIn.
          </h1>
          <p className="font-sans text-16 text-text-muted leading-relaxed max-w-2xl">
            Sift aggregates unlisted openings directly from verified company career portals and ATS platforms.
            Typeset with quiet dignity. No gradients, no frosted glass, no algorithmic feeds.
          </p>
        </section>

        {/* Section 2: SearchBar & Command Trigger Preview */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-sans text-20 font-medium text-text">1. Search & Filter Bar</h2>
            <span className="font-mono text-12 text-text-muted">Component: SearchBar</span>
          </div>

          <div className="relative rounded-surface border border-border bg-surface p-2 transition-all duration-150 focus-within:border-accent">
            <div className="flex items-center gap-3 px-3 py-2">
              <Search size={16} strokeWidth={1.5} className="text-text-muted" />
              <input
                id="search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ask in natural language: 'Founding backend engineer in NYC paying >$180k with Go or Rust'..."
                className="w-full bg-transparent font-sans text-14 text-text placeholder:text-text-muted outline-none"
              />
              <div className="flex items-center gap-1 rounded-control border border-border bg-bg px-2 py-0.5 font-mono text-12 text-text-muted">
                <Command size={12} strokeWidth={1.5} />
                <span>K</span>
              </div>
              <button className="flex items-center gap-1.5 rounded-control bg-accent px-4 py-2 font-sans text-13 font-medium text-white hover:bg-accent-hover transition-colors duration-150">
                <span>Search</span>
                <ArrowUpRight size={14} strokeWidth={1.5} />
              </button>
            </div>
          </div>

          {/* Filter Chips Bar */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <span className="font-mono text-12 text-text-muted mr-2">Filter:</span>
            {chips.map((chip) => {
              const active = selectedChip === chip;
              return (
                <button
                  key={chip}
                  onClick={() => setSelectedChip(chip)}
                  className={`flex items-center gap-1.5 rounded-control px-3 py-1 font-sans text-13 transition-all duration-150 ease-editorial ${
                    active
                      ? 'border border-accent bg-accent-subdued text-text'
                      : 'border border-border bg-surface text-text-muted hover:border-border-strong hover:text-text'
                  }`}
                >
                  {active && <Check size={12} strokeWidth={1.5} className="text-accent" />}
                  <span>{chip}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Section 3: JobRow Specimen (Dense, Information-Dense Editorial Layout) */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-sans text-20 font-medium text-text">2. Job Listing Row</h2>
            <span className="font-mono text-12 text-text-muted">Component: JobRow</span>
          </div>

          <div className="rounded-surface border border-border bg-surface divide-y divide-border overflow-hidden">
            {/* Row 1 */}
            <article className="group p-5 hover:bg-bg/40 transition-colors duration-150 ease-editorial">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-3">
                    <span className="font-sans text-16 font-medium text-text group-hover:text-accent transition-colors duration-150">
                      Senior Distributed Systems Engineer
                    </span>
                    <span className="rounded-control border border-border bg-bg px-2 py-0.5 font-mono text-12 text-text-muted">
                      Greenhouse
                    </span>
                    <span className="rounded-control bg-accent-subdued border border-accent/30 px-2 py-0.5 font-mono text-12 text-text">
                      98% match
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-13 text-text-muted">
                    <div className="flex items-center gap-1.5">
                      <Building2 size={14} strokeWidth={1.5} />
                      <span className="text-text">Linear</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin size={14} strokeWidth={1.5} />
                      <span>San Francisco / Remote</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <DollarSign size={14} strokeWidth={1.5} />
                      <span className="text-text">$190k – $240k</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock size={14} strokeWidth={1.5} />
                      <span>Indexed 2h ago</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <a
                    href="https://boards.greenhouse.io"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 rounded-control border border-border bg-surface px-3 py-1.5 font-sans text-13 font-medium text-text hover:border-accent hover:text-accent transition-colors duration-150"
                  >
                    <span>Direct Apply</span>
                    <ExternalLink size={14} strokeWidth={1.5} />
                  </a>
                </div>
              </div>
            </article>

            {/* Row 2 */}
            <article className="group p-5 hover:bg-bg/40 transition-colors duration-150 ease-editorial">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-3">
                    <span className="font-sans text-16 font-medium text-text group-hover:text-accent transition-colors duration-150">
                      Founding AI Inference Engineer
                    </span>
                    <span className="rounded-control border border-border bg-bg px-2 py-0.5 font-mono text-12 text-text-muted">
                      Ashby
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-13 text-text-muted">
                    <div className="flex items-center gap-1.5">
                      <Building2 size={14} strokeWidth={1.5} />
                      <span className="text-text">Together AI</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin size={14} strokeWidth={1.5} />
                      <span>New York, NY</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <DollarSign size={14} strokeWidth={1.5} />
                      <span className="text-text">$210k – $260k + 0.5%</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock size={14} strokeWidth={1.5} />
                      <span>Indexed 5h ago</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <a
                    href="https://ashbyhq.com"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 rounded-control border border-border bg-surface px-3 py-1.5 font-sans text-13 font-medium text-text hover:border-accent hover:text-accent transition-colors duration-150"
                  >
                    <span>Direct Apply</span>
                    <ExternalLink size={14} strokeWidth={1.5} />
                  </a>
                </div>
              </div>
            </article>
          </div>
        </section>

        {/* Section 4: Token Grid Verification Matrix */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-sans text-20 font-medium text-text">3. Design Tokens Verification Matrix</h2>
            <span className="font-mono text-12 text-text-muted">Tokens Contract</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Color Swatches */}
            <div className="rounded-surface border border-border bg-surface p-5 space-y-3">
              <span className="font-mono text-12 text-text-muted uppercase">Color Tokens</span>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 rounded-control border border-border bg-bg">
                  <span className="font-mono text-12">bg</span>
                  <span className="font-mono text-12 text-text-muted">var(--bg)</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-control border border-border bg-surface">
                  <span className="font-mono text-12">surface</span>
                  <span className="font-mono text-12 text-text-muted">var(--surface)</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-control bg-accent text-white">
                  <span className="font-mono text-12">accent (vermilion)</span>
                  <span className="font-mono text-12">#E5533D</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-control bg-accent-subdued border border-accent/30 text-text">
                  <span className="font-mono text-12">accent-subdued</span>
                  <span className="font-mono text-12 text-accent">tint wash</span>
                </div>
              </div>
            </div>

            {/* Typography Scale */}
            <div className="rounded-surface border border-border bg-surface p-5 space-y-3">
              <span className="font-mono text-12 text-text-muted uppercase">Type Hierarchy</span>
              <div className="space-y-1.5">
                <div className="font-serif text-32 text-text leading-tight">Headline 32px Serif</div>
                <div className="font-sans text-20 font-medium text-text">Title 20px Sans</div>
                <div className="font-sans text-16 text-text">Body 16px Sans</div>
                <div className="font-sans text-14 text-text-muted">Label 14px Sans</div>
                <div className="font-mono text-13 text-text">Metadata 13px Mono</div>
                <div className="font-mono text-12 text-text-muted">Caption 12px Mono</div>
              </div>
            </div>

            {/* Elevation & Borders */}
            <div className="rounded-surface border border-border bg-surface p-5 space-y-3">
              <span className="font-mono text-12 text-text-muted uppercase">Hairline vs Popover</span>
              <div className="space-y-3">
                <div className="rounded-surface border border-border p-3 text-center font-mono text-12 text-text-muted">
                  Standard Surface: 1px hairline border, 0px shadow
                </div>
                <div className="rounded-surface border border-border bg-surface p-3 text-center font-mono text-12 text-text shadow-popover">
                  Floating Popover: shadow-popover enabled
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8 text-center font-mono text-12 text-text-muted">
        Sift Engine — Built strictly to /docs/design-system.md
      </footer>
    </div>
  );
};
