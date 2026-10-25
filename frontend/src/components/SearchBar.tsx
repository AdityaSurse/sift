import React, { useEffect, useState } from 'react';
import { ArrowRight, Search, X } from 'lucide-react';

const REALISTIC_PLACEHOLDERS = [
  '6 month embedded software internship in Bangalore, fresher',
  'Senior React frontend engineer in London, remote',
  'Full time machine learning engineer in San Francisco',
  'Staff DevOps engineer remote USA',
  'Entry level iOS mobile developer in Tokyo',
  'Product designer hybrid in Toronto, Figma',
];

interface SearchBarProps {
  value: string;
  onChange: (val: string) => void;
  onSubmit: (val: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  size?: 'large' | 'default';
  className?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  onSubmit,
  placeholder,
  autoFocus = false,
  size = 'default',
  className = '',
}) => {
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  // Cycle placeholder example queries smoothly every 4 seconds when user hasn't typed
  useEffect(() => {
    if (placeholder) return;
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % REALISTIC_PLACEHOLDERS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [placeholder]);

  const activePlaceholder = placeholder || REALISTIC_PLACEHOLDERS[placeholderIndex];

  // Submit either the user's typed input or the active rotating example if input is empty
  const handleTriggerSearch = (): void => {
    const queryToSearch = value.trim() || activePlaceholder;
    if (!value.trim()) {
      onChange(activePlaceholder);
    }
    onSubmit(queryToSearch);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleTriggerSearch();
    }
  };

  const isLarge = size === 'large';

  return (
    <div
      className={`relative flex items-center w-full rounded-surface bg-surface border border-border/80 transition-all duration-150 ease-editorial focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/15 ${
        isLarge ? 'p-1.5 sm:p-2' : 'p-1'
      } ${className}`}
    >
      <div className="flex items-center justify-center pl-3 pr-2 text-text-muted">
        <Search size={isLarge ? 18 : 15} strokeWidth={1.5} className="text-text-muted/80" />
      </div>

      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={activePlaceholder}
        autoFocus={autoFocus}
        spellCheck={false}
        className={`w-full bg-transparent text-text placeholder:text-text-muted/50 focus:outline-none font-sans ${
          isLarge ? 'text-15 sm:text-16 py-2 px-1' : 'text-13 py-1 px-1'
        }`}
      />

      {/* Clear Button */}
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="p-1.5 text-text-muted hover:text-text rounded-control transition-colors duration-150 ease-editorial mr-1 focus-visible:outline-none"
          title="Clear search"
          aria-label="Clear search"
        >
          <X size={15} strokeWidth={1.5} />
        </button>
      )}

      {/* Submit Action Button */}
      <button
        type="button"
        onClick={handleTriggerSearch}
        className={`flex items-center justify-center rounded-control bg-accent text-white hover:bg-accent-hover transition-colors duration-150 ease-editorial focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent flex-shrink-0 ${
          isLarge ? 'h-9 sm:h-10 px-4 gap-1.5 font-sans text-13 sm:text-14 font-medium' : 'h-7 w-7 sm:h-8 sm:w-8'
        }`}
        title="Search jobs"
        aria-label="Search jobs"
      >
        {isLarge ? (
          <>
            <span>Search</span>
            <ArrowRight size={15} strokeWidth={1.5} />
          </>
        ) : (
          <ArrowRight size={13} strokeWidth={1.5} />
        )}
      </button>
    </div>
  );
};
