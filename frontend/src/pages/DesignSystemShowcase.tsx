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
          <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent-subdued px-3 py-1 shadow-2xs">
            <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
            <span className="font-mono text-12 text-accent font-medium">Direct Career Index Specimen</span>
          </div>
          <h1 className="font-serif text-56 leading-[1.05] tracking-[-0.025em] text-text">
            Find the jobs and internships that never make it to <span className="italic text-accent">LinkedIn</span>.
          </h1>
          <p className="font-sans text-16 text-text-muted leading-relaxed max-w-2xl">
            Sift aggregates unlisted openings directly from verified company career portals and ATS platforms.
            Typeset with quiet dignity. No gradients, no frosted glass, no algorithmic feeds.
          </p>
        </section>

        {/* Section 2: SearchBar & Command Trigger Preview */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-sans text-20 font-semibold text-text">1. Search & Filter Bar</h2>
            <span className="font-mono text-12 text-accent font-medium">Component: SearchBar Capsule</span>
          </div>

          <div className="relative rounded-full border border-border bg-surface p-1.5 shadow-card transition-all duration-200 focus-within:border-accent focus-within:ring-4 focus-within:ring-accent/15">
            <div className="flex items-center gap-3 px-3 py-1">
              <Search size={17} strokeWidth={1.5} className="text-text-muted" />
              <input
                id="search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ask in natural language: 'Founding backend engineer in NYC paying >$180k with Go or Rust'..."
                className="w-full bg-transparent font-sans text-14 text-text placeholder:text-text-muted/60 outline-none"
              />
              <div className="flex items-center gap-1 rounded-full border border-border bg-surface-subdued px-2.5 py-0.5 font-mono text-11 text-text-muted select-none">
                <Command size={11} strokeWidth={1.5} />
                <span>K</span>
              </div>
              <button className="flex items-center gap-1.5 rounded-full bg-btn-primary px-5 py-2 font-sans text-13 font-semibold text-btn-primary-text hover:bg-btn-primary-hover active:scale-[0.98] transition-all shadow-sm">
                <span>Search</span>
                <ArrowUpRight size={13} strokeWidth={2} />
              </button>
            </div>
          </div>

          {/* Filter Chips Bar */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <span className="font-sans text-12 text-text-muted font-medium mr-1 select-none">Filters:</span>
            {chips.map((chip) => {
              const active = selectedChip === chip;
              return (
                <button
                  key={chip}
                  onClick={() => setSelectedChip(chip)}
                  className={`flex items-center gap-1.5 rounded-full px-3.5 py-1 font-sans text-12 transition-all duration-150 ease-editorial ${
                    active
                      ? 'border border-accent/40 bg-accent-subdued text-accent font-semibold shadow-2xs'
                      : 'border border-border/80 bg-surface text-text-muted hover:border-accent/40 hover:text-accent'
                  }`}
                >
                  {active && <Check size={12} strokeWidth={2} className="text-accent" />}
                  <span>{chip}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Section 3: JobRow Specimen (Dense, Information-Dense Editorial Layout) */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-sans text-20 font-semibold text-text">2. Job Listing Row</h2>
            <span className="font-mono text-12 text-accent font-medium">Component: JobRow</span>
          </div>

          <div className="rounded-2xl border border-border/80 bg-surface divide-y divide-border/70 overflow-hidden shadow-card">
            {/* Row 1 */}
            <article className="group p-5 hover:bg-surface-subdued/70 transition-colors duration-150 ease-editorial">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-xl border border-teal-500/25 bg-teal-500/10 text-teal-600 dark:text-teal-400 font-bold text-15 select-none shadow-2xs">
                    L
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-sans text-16 font-semibold text-text group-hover:text-accent transition-colors duration-150">
                        Senior Distributed Systems Engineer
                      </span>
                      <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 font-mono text-11 text-emerald-700 dark:text-emerald-300 font-medium">
                        Greenhouse Direct
                      </span>
                      <span className="rounded-full bg-accent-subdued border border-accent/30 px-2.5 py-0.5 font-mono text-11 text-accent font-semibold">
                        98% match
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-sans text-13 text-text-muted">
                      <div className="flex items-center gap-1.5">
                        <Building2 size={13} strokeWidth={1.5} />
                        <span className="text-text font-medium">Linear</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin size={13} strokeWidth={1.5} />
                        <span>San Francisco / Remote</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <DollarSign size={13} strokeWidth={1.5} />
                        <span className="text-text font-medium">$190k – $240k</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock size={13} strokeWidth={1.5} />
                        <span>Indexed 2h ago</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <a
                    href="https://boards.greenhouse.io"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 rounded-full border border-border bg-surface px-4 py-1.5 font-sans text-13 font-medium text-text hover:border-accent hover:text-accent transition-colors duration-150 shadow-xs"
                  >
                    <span>Direct Apply</span>
                    <ExternalLink size={13} strokeWidth={1.5} />
                  </a>
                </div>
              </div>
            </article>

            {/* Row 2 */}
            <article className="group p-5 hover:bg-surface-subdued/70 transition-colors duration-150 ease-editorial">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-xl border border-sky-500/25 bg-sky-500/10 text-sky-600 dark:text-sky-400 font-bold text-15 select-none shadow-2xs">
                    T
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-sans text-16 font-semibold text-text group-hover:text-accent transition-colors duration-150">
                        Founding AI Inference Engineer
                      </span>
                      <span className="rounded-full border border-cyan-500/25 bg-cyan-500/10 px-2.5 py-0.5 font-mono text-11 text-cyan-700 dark:text-cyan-300 font-medium">
                        Ashby Direct
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-sans text-13 text-text-muted">
                      <div className="flex items-center gap-1.5">
                        <Building2 size={13} strokeWidth={1.5} />
                        <span className="text-text font-medium">Together AI</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin size={13} strokeWidth={1.5} />
                        <span>New York, NY</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <DollarSign size={13} strokeWidth={1.5} />
                        <span className="text-text font-medium">$210k – $260k + 0.5%</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock size={13} strokeWidth={1.5} />
                        <span>Indexed 5h ago</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <a
                    href="https://ashbyhq.com"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 rounded-full border border-border bg-surface px-4 py-1.5 font-sans text-13 font-medium text-text hover:border-accent hover:text-accent transition-colors duration-150 shadow-xs"
                  >
                    <span>Direct Apply</span>
                    <ExternalLink size={13} strokeWidth={1.5} />
                  </a>
                </div>
              </div>
            </article>
          </div>
        </section>

        {/* Section 4: Token Grid Verification Matrix */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-sans text-20 font-semibold text-text">3. Design Tokens Verification Matrix</h2>
            <span className="font-mono text-12 text-accent font-medium">Tokens Contract</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Color Swatches */}
            <div className="rounded-2xl border border-border/80 bg-surface p-5 space-y-3 shadow-card">
              <span className="font-mono text-12 text-text-muted uppercase font-semibold">Color Tokens</span>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 rounded-xl border border-border bg-bg">
                  <span className="font-mono text-12 font-medium">bg</span>
                  <span className="font-mono text-12 text-text-muted">var(--bg)</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl border border-border bg-surface">
                  <span className="font-mono text-12 font-medium">surface</span>
                  <span className="font-mono text-12 text-text-muted">var(--surface)</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-accent text-white font-medium shadow-xs">
                  <span className="font-mono text-12">accent (Aegean Teal)</span>
                  <span className="font-mono text-12">var(--accent)</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-btn-primary text-btn-primary-text font-medium shadow-xs">
                  <span className="font-mono text-12">btn-primary (Caspian Slate)</span>
                  <span className="font-mono text-12">var(--btn-primary)</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-accent-subdued border border-accent/30 text-accent font-medium">
                  <span className="font-mono text-12">accent-subdued</span>
                  <span className="font-mono text-12">tint wash</span>
                </div>
              </div>
            </div>

            {/* Typography Scale */}
            <div className="rounded-2xl border border-border/80 bg-surface p-5 space-y-3 shadow-card">
              <span className="font-mono text-12 text-text-muted uppercase font-semibold">Type Hierarchy</span>
              <div className="space-y-1.5">
                <div className="font-serif text-32 text-text leading-tight">Headline 32px Serif</div>
                <div className="font-sans text-20 font-semibold text-text">Title 20px Sans</div>
                <div className="font-sans text-16 text-text">Body 16px Sans</div>
                <div className="font-sans text-14 text-text-muted font-medium">Label 14px Sans</div>
                <div className="font-mono text-13 text-text">Metadata 13px Mono</div>
                <div className="font-mono text-12 text-text-muted">Caption 12px Mono</div>
              </div>
            </div>

            {/* Elevation & Borders */}
            <div className="rounded-2xl border border-border/80 bg-surface p-5 space-y-3 shadow-card">
              <span className="font-mono text-12 text-text-muted uppercase font-semibold">Hairline vs Popover</span>
              <div className="space-y-3">
                <div className="rounded-xl border border-border p-3 text-center font-mono text-12 text-text-muted">
                  Standard Surface: 1px hairline border, subtle ambient elevation
                </div>
                <div className="rounded-xl border border-border bg-surface p-3 text-center font-mono text-12 text-text shadow-popover">
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
