import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bookmark, Moon, Search, Sun, Terminal } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CommandItem {
  id: string;
  title: string;
  category: 'Query Suggestion' | 'Navigation' | 'Appearance';
  icon: React.ReactNode;
  action: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  // Define commands catalog
  const commands: CommandItem[] = [
    {
      id: 'query-embedded',
      title: '6 month embedded software internship in Bangalore, fresher',
      category: 'Query Suggestion',
      icon: <Search size={14} strokeWidth={1.5} />,
      action: () => {
        navigate('/jobs?q=6+month+embedded+software+internship+in+Bangalore,+fresher');
        onClose();
      },
    },
    {
      id: 'query-frontend',
      title: 'Senior React frontend engineer in London, remote',
      category: 'Query Suggestion',
      icon: <Search size={14} strokeWidth={1.5} />,
      action: () => {
        navigate('/jobs?q=Senior+React+frontend+engineer+in+London,+remote');
        onClose();
      },
    },
    {
      id: 'query-ml',
      title: 'Full time machine learning engineer in San Francisco',
      category: 'Query Suggestion',
      icon: <Search size={14} strokeWidth={1.5} />,
      action: () => {
        navigate('/jobs?q=Full+time+machine+learning+engineer+in+San+Francisco');
        onClose();
      },
    },
    {
      id: 'query-devops',
      title: 'Staff DevOps engineer remote USA',
      category: 'Query Suggestion',
      icon: <Search size={14} strokeWidth={1.5} />,
      action: () => {
        navigate('/jobs?q=Staff+DevOps+engineer+remote+USA');
        onClose();
      },
    },
    {
      id: 'nav-jobs',
      title: 'Explore All Openings (/jobs)',
      category: 'Navigation',
      icon: <Terminal size={14} strokeWidth={1.5} />,
      action: () => {
        navigate('/jobs');
        onClose();
      },
    },
    {
      id: 'nav-saved',
      title: 'View Saved Jobs',
      category: 'Navigation',
      icon: <Bookmark size={14} strokeWidth={1.5} />,
      action: () => {
        navigate('/saved');
        onClose();
      },
    },
    {
      id: 'theme-toggle',
      title: `Toggle Theme (${theme === 'dark' ? 'Light Mode' : 'Dark Mode'})`,
      category: 'Appearance',
      icon: theme === 'dark' ? <Sun size={14} strokeWidth={1.5} /> : <Moon size={14} strokeWidth={1.5} />,
      action: () => {
        toggleTheme();
        onClose();
      },
    },
  ];

  // Filter commands by search string
  const filtered = search.trim()
    ? commands.filter(
        (c) =>
          c.title.toLowerCase().includes(search.toLowerCase()) ||
          c.category.toLowerCase().includes(search.toLowerCase())
      )
    : commands;

  // Keyboard navigation within palette
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % (filtered.length || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + (filtered.length || 1)) % (filtered.length || 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          filtered[selectedIndex].action();
        } else if (search.trim()) {
          navigate(`/jobs?q=${encodeURIComponent(search.trim())}`);
          onClose();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filtered, selectedIndex, search, navigate, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" aria-modal="true" role="dialog">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 transition-opacity duration-150 ease-editorial"
      />

      {/* Floating Dialog Container: rounded-2xl + shadow-popover */}
      <div className="fixed inset-0 flex items-start justify-center pt-20 sm:pt-28 px-4">
        <div className="w-full max-w-xl rounded-2xl border border-border bg-surface text-text shadow-popover overflow-hidden transition-all duration-150 ease-editorial">
          {/* Search Input Bar */}
          <div className="flex items-center px-4 py-3.5 border-b border-border gap-3">
            <Search size={16} strokeWidth={1.5} className="text-accent flex-shrink-0" />
            <input
              type="text"
              autoFocus
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setSelectedIndex(0);
              }}
              placeholder="Search positions, suggestions, or commands..."
              className="w-full bg-transparent font-sans text-14 text-text placeholder:text-text-muted/60 focus:outline-none"
            />
            <kbd className="hidden sm:inline rounded-full border border-border px-2 py-0.5 font-mono text-11 text-text-muted">
              ESC
            </kbd>
          </div>

          {/* Command List */}
          <div className="max-h-80 overflow-y-auto p-2 space-y-1">
            {filtered.length === 0 ? (
              <div className="p-4 text-center">
                <p className="font-sans text-13 text-text-muted">
                  No matching command. Press <span className="text-text font-mono font-medium">Enter</span> to search for "{search}".
                </p>
              </div>
            ) : (
              filtered.map((item, idx) => {
                const isSelected = idx === selectedIndex;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={item.action}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-left transition-colors duration-150 ease-editorial font-sans text-13 ${
                      isSelected ? 'bg-surface-subdued text-accent font-medium' : 'text-text hover:bg-surface-subdued/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={`${isSelected ? 'text-accent' : 'text-text-muted'}`}>
                        {item.icon}
                      </span>
                      <span className="truncate">{item.title}</span>
                    </div>
                    <span className="font-sans text-11 text-text-muted flex-shrink-0 ml-2">
                      {item.category}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
