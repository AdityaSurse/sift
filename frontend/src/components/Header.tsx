import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bookmark, Briefcase, Building2, Command, Moon, Sun } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { useSavedJobs } from '../hooks/useSavedJobs';

interface HeaderProps {
  onOpenCommandPalette?: () => void;
  onOpenCompanies?: () => void;
}

/**
 * Editorial top navigation bar adhering to /docs/design-system.md.
 * Why: Surfaces core discovery routes (Jobs, Companies, Saved) and quick actions quietly.
 */
export const Header: React.FC<HeaderProps> = ({
  onOpenCommandPalette,
  onOpenCompanies,
}) => {
  const { theme, toggleTheme } = useTheme();
  const { savedJobs } = useSavedJobs();
  const location = useLocation();

  const isJobsActive = location.pathname.startsWith('/jobs') || location.pathname.startsWith('/search');
  const isSavedActive = location.pathname === '/saved';

  return (
    <header className="sticky top-0 z-30 w-full border-b border-border/80 bg-bg px-4 sm:px-6 py-2.5 transition-colors duration-150 ease-editorial">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        {/* Brand Wordmark & Nav */}
        <div className="flex items-center gap-6 sm:gap-8">
          <Link
            to="/"
            className="flex items-center gap-2 text-text hover:text-accent transition-colors duration-150 ease-editorial focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent rounded"
          >
            <span className="font-mono text-15 font-bold tracking-wider text-accent">SIFT</span>
            <span className="hidden sm:inline font-mono text-11 text-text-muted/60">/</span>
            <span className="hidden sm:inline font-mono text-11 text-text-muted">career index</span>
          </Link>

          {/* Navigation Links: Jobs, Companies, Saved */}
          <nav className="flex items-center gap-1 sm:gap-2 text-13 font-sans">
            <Link
              to="/jobs"
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors duration-150 ease-editorial ${
                isJobsActive
                  ? 'text-text font-medium bg-surface border border-border/80'
                  : 'text-text-muted hover:text-text'
              }`}
            >
              <Briefcase size={13} strokeWidth={1.5} />
              <span>Jobs</span>
            </Link>

            <button
              type="button"
              onClick={onOpenCompanies}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded text-text-muted hover:text-text transition-colors duration-150 ease-editorial"
            >
              <Building2 size={13} strokeWidth={1.5} />
              <span>Companies</span>
            </button>

            <Link
              to="/saved"
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors duration-150 ease-editorial ${
                isSavedActive
                  ? 'text-text font-medium bg-surface border border-border/80'
                  : 'text-text-muted hover:text-text'
              }`}
            >
              <Bookmark size={13} strokeWidth={1.5} />
              <span>Saved</span>
              {savedJobs.length > 0 && (
                <span className="ml-0.5 rounded-full bg-accent-subdued px-1.5 py-0.2 font-mono text-11 text-accent font-medium">
                  {savedJobs.length}
                </span>
              )}
            </Link>
          </nav>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Command Palette Trigger */}
          <button
            id="cmd-palette-btn"
            onClick={onOpenCommandPalette}
            className="hidden sm:flex items-center gap-2 rounded border border-border/80 bg-surface/60 px-2.5 py-1 font-mono text-12 text-text-muted hover:border-border-strong hover:text-text transition-colors duration-150 ease-editorial focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
            title="Open Command Palette (Cmd+K)"
          >
            <Command size={12} strokeWidth={1.5} />
            <span className="text-12">Search</span>
            <kbd className="rounded border border-border px-1 py-0.2 font-mono text-11 text-text-muted">
              ⌘K
            </kbd>
          </button>

          {/* Theme Toggle */}
          <button
            id="theme-toggle-btn"
            onClick={toggleTheme}
            className="flex items-center justify-center w-8 h-8 rounded border border-border/80 bg-surface/60 text-text-muted hover:text-text hover:border-border-strong transition-colors duration-150 ease-editorial focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            aria-label="Toggle visual theme"
          >
            {theme === 'dark' ? (
              <Sun size={14} strokeWidth={1.5} />
            ) : (
              <Moon size={14} strokeWidth={1.5} />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
