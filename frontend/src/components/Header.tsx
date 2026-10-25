import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bookmark, Command, Moon, Search, Sun } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { useSavedJobs } from '../hooks/useSavedJobs';

interface HeaderProps {
  onOpenCommandPalette?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenCommandPalette }) => {
  const { theme, toggleTheme } = useTheme();
  const { savedJobs } = useSavedJobs();
  const location = useLocation();

  const isSearchActive = location.pathname.startsWith('/search');
  const isSavedActive = location.pathname === '/saved';

  return (
    <header className="sticky top-0 z-30 w-full border-b border-border bg-bg/95 backdrop-blur-none px-4 sm:px-6 py-3 transition-colors duration-150 ease-editorial">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        {/* Brand Wordmark */}
        <div className="flex items-center gap-6">
          <Link
            to="/"
            className="flex items-center gap-2.5 text-text hover:text-accent transition-colors duration-150 ease-editorial focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-control"
          >
            <span className="font-mono text-14 font-semibold tracking-tight text-accent">SIFT</span>
            <span className="hidden sm:inline font-mono text-12 text-text-muted">/</span>
            <span className="hidden sm:inline font-mono text-12 text-text-muted">job discovery</span>
          </Link>

          {/* Navigation Links */}
          <nav className="flex items-center gap-4 text-13 font-sans">
            <Link
              to="/search"
              className={`flex items-center gap-1.5 px-2 py-1 rounded-control transition-colors duration-150 ease-editorial ${
                isSearchActive ? 'text-text font-medium bg-surface hairline-border' : 'text-text-muted hover:text-text'
              }`}
            >
              <Search size={14} strokeWidth={1.5} />
              <span>Search</span>
            </Link>

            <Link
              to="/saved"
              className={`flex items-center gap-1.5 px-2 py-1 rounded-control transition-colors duration-150 ease-editorial ${
                isSavedActive ? 'text-text font-medium bg-surface hairline-border' : 'text-text-muted hover:text-text'
              }`}
            >
              <Bookmark size={14} strokeWidth={1.5} />
              <span>Saved</span>
              {savedJobs.length > 0 && (
                <span className="ml-1 rounded-full bg-accent-subdued px-1.5 py-0.2 font-mono text-12 text-accent">
                  {savedJobs.length}
                </span>
              )}
            </Link>
          </nav>
        </div>

        {/* Global Actions */}
        <div className="flex items-center gap-2.5">
          {/* Command Palette Trigger */}
          <button
            id="cmd-palette-btn"
            onClick={onOpenCommandPalette}
            className="hidden sm:flex items-center gap-2 rounded-control border border-border bg-surface px-2.5 py-1.5 font-mono text-12 text-text-muted hover:border-border-strong hover:text-text transition-colors duration-150 ease-editorial focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            title="Open Command Palette (Cmd+K)"
          >
            <Command size={13} strokeWidth={1.5} />
            <span>Search or command</span>
            <kbd className="ml-1 rounded border border-border px-1 py-0.2 font-mono text-12 text-text-muted">
              ⌘K
            </kbd>
          </button>

          {/* Theme Toggle */}
          <button
            id="header-theme-toggle"
            onClick={toggleTheme}
            className="flex items-center justify-center h-8 w-8 rounded-control border border-border bg-surface text-text-muted hover:text-text hover:border-border-strong transition-colors duration-150 ease-editorial focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun size={15} strokeWidth={1.5} className="text-text-muted hover:text-accent" />
            ) : (
              <Moon size={15} strokeWidth={1.5} className="text-text-muted hover:text-accent" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
