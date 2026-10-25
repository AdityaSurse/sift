import React, { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  value?: string;
  onChange?: (value: string) => void;
  onSubmit: (value: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
  size?: 'normal' | 'large';
}

const DEFAULT_ROTATING_PROMPTS = [
  'Senior React frontend engineer in London, remote',
  '6 month embedded software internship in Bangalore, fresher',
  'Full time machine learning engineer in San Francisco',
  'Staff DevOps engineer remote USA',
];

/**
 * Editorial SearchBar Component
 * Why: Features smooth rounded-full capsule architecture, rotating suggestions,
 * and high-contrast Caspian pill trigger matching Simplify's primary layout.
 */
export const SearchBar: React.FC<SearchBarProps> = ({
  value: controlledValue,
  onChange,
  onSubmit,
  placeholder,
  autoFocus = false,
  className = '',
  size = 'normal',
}) => {
  const [internalValue, setInternalValue] = useState(controlledValue || '');
  const [promptIndex, setPromptIndex] = useState(0);

  const value = controlledValue !== undefined ? controlledValue : internalValue;

  // Animate rotating placeholder if none provided
  useEffect(() => {
    if (placeholder) return;
    const interval = setInterval(() => {
      setPromptIndex((prev) => (prev + 1) % DEFAULT_ROTATING_PROMPTS.length);
    }, 3800);
    return () => clearInterval(interval);
  }, [placeholder]);

  const activePlaceholder = placeholder || `Try: "${DEFAULT_ROTATING_PROMPTS[promptIndex]}"`;

  const handleTriggerSearch = (forcedQuery?: string): void => {
    const queryToSearch = forcedQuery !== undefined ? forcedQuery : value;
    if (onChange) {
      onChange(queryToSearch);
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
      className={`relative flex items-center w-full rounded-full bg-surface border border-border/80 shadow-card transition-all duration-200 ease-editorial focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20 ${
        isLarge ? 'p-1.5 sm:p-2' : 'p-1'
      } ${className}`}
    >
      <div className="flex items-center justify-center pl-3.5 pr-2 text-text-muted">
        <Search size={isLarge ? 18 : 15} strokeWidth={1.5} className="text-text-muted" />
      </div>

      <input
        type="text"
        value={value}
        onChange={(e) => {
          setInternalValue(e.target.value);
          if (onChange) onChange(e.target.value);
        }}
        onKeyDown={handleKeyDown}
        placeholder={activePlaceholder}
        autoFocus={autoFocus}
        spellCheck={false}
        className={`w-full bg-transparent font-sans text-text placeholder:text-text-muted/50 focus:outline-none ${
          isLarge ? 'text-15 sm:text-16 py-2 px-1' : 'text-13 sm:text-14 py-1.5 px-1'
        }`}
      />

      {value && (
        <button
          type="button"
          onClick={() => {
            setInternalValue('');
            if (onChange) onChange('');
            onSubmit('');
          }}
          className="p-1.5 mr-1 text-text-muted hover:text-text rounded-full transition-colors"
          title="Clear query"
        >
          <X size={14} strokeWidth={2} />
        </button>
      )}

      <button
        type="button"
        onClick={() => handleTriggerSearch()}
        className={`flex-shrink-0 flex items-center justify-center rounded-full bg-btn-primary font-sans font-semibold text-btn-primary-text hover:bg-btn-primary-hover active:scale-[0.98] transition-all shadow-sm ${
          isLarge ? 'px-6 py-2.5 text-14' : 'px-4 py-1.5 text-12'
        }`}
      >
        Search
      </button>
    </div>
  );
};

export default SearchBar;
