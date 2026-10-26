import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Bookmark,
  Briefcase,
  Building2,
  Command,
  Moon,
  Sparkles,
  Sun,
} from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { useSavedJobs } from '../hooks/useSavedJobs';

interface HeaderProps {
  onOpenCommandPalette?: () => void;
  onOpenCompanies?: () => void;
}

/**
 * Sift Editorial Navbar
 * Why: High-contrast header with Sift geometric mark, navigation pills, and primary action.
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
    <header className="sticky top-0 z-30 w-full border-b border-border/70 bg-bg px-4 sm:px-8 py-3 transition-colors duration-150 ease-editorial">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        {/* Brand Mark & Main Nav */}
        <div className="flex items-center gap-6 sm:gap-10">
          <Link
            to="/"
            className="group flex items-center gap-2.5 text-text hover:text-accent transition-colors duration-150 ease-editorial focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent rounded-full"
          >
            {/* Sift Geometric Spark Mark */}
            <div className="flex items-center justify-center h-7 w-7 rounded-xl bg-accent-subdued text-accent border border-accent/40 font-bold text-14 select-none group-hover:scale-105 transition-transform duration-150 shadow-2xs">
              <Sparkles size={14} strokeWidth={2} />
            </div>
            <span className="font-sans text-16 font-bold tracking-tight text-text">
              Sift
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="flex items-center gap-1 sm:gap-1.5 text-13 font-sans">
            <Link
              to="/jobs"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-150 ease-editorial ${
                isJobsActive
                  ? 'text-text font-semibold bg-surface border border-border shadow-xs'
                  : 'text-text-muted hover:text-text hover:bg-surface-subdued'
              }`}
            >
              <Briefcase size={13} strokeWidth={1.5} className={isJobsActive ? 'text-accent' : ''} />
              <span>Jobs</span>
            </Link>

            <button
              type="button"
              onClick={onOpenCompanies}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-text-muted hover:text-text hover:bg-surface-subdued transition-colors duration-150 ease-editorial"
            >
              <Building2 size={13} strokeWidth={1.5} />
              <span>Companies</span>
            </button>

            <Link
              to="/saved"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-150 ease-editorial ${
                isSavedActive
                  ? 'text-text font-semibold bg-surface border border-border shadow-xs'
                  : 'text-text-muted hover:text-text hover:bg-surface-subdued'
              }`}
            >
              <Bookmark size={13} strokeWidth={1.5} className={isSavedActive ? 'text-accent' : ''} />
              <span>Saved</span>
              {savedJobs.length > 0 && (
                <span className="ml-0.5 rounded-full bg-accent-subdued border border-accent/30 px-1.5 py-0.2 font-mono text-11 text-accent font-semibold">
                  {savedJobs.length}
                </span>
              )}
            </Link>
          </nav>
        </div>

        {/* Right Actions: Cmd+K, Theme Toggle, Primary Pill CTA */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Search Hotkey Trigger */}
          <button
            type="button"
            onClick={onOpenCommandPalette}
            className="hidden md:flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 font-mono text-12 text-text-muted hover:border-border-strong hover:text-text transition-colors duration-150 ease-editorial"
            title="Search commands (⌘K)"
          >
            <Command size={12} strokeWidth={1.5} />
            <span className="font-sans text-12">Search</span>
            <kbd className="rounded border border-border bg-bg/80 px-1 py-0.2 text-10 text-text-muted">
              ⌘K
            </kbd>
          </button>

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-full border border-border bg-surface text-text-muted hover:text-text hover:border-border-strong transition-colors duration-150 ease-editorial"
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? <Sun size={14} strokeWidth={1.5} /> : <Moon size={14} strokeWidth={1.5} />}
          </button>

          {/* Primary Pill Button */}
          <Link
            to="/jobs"
            className="flex items-center justify-center rounded-full bg-btn-primary px-4 sm:px-5 py-1.5 font-sans text-13 font-medium text-btn-primary-text hover:bg-btn-primary-hover active:scale-[0.98] transition-all shadow-sm"
          >
            Browse Jobs
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
