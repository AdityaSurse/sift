import React from 'react';
import {
  Bot,
  CircuitBoard,
  Code2,
  Cpu,
  Database,
  Globe,
  GraduationCap,
  Sparkles,
} from 'lucide-react';
import type { LandingCategoryCount } from '../lib/api';

interface CategoryTileProps {
  category: LandingCategoryCount;
  onClick: (cat: LandingCategoryCount) => void;
}

/** Maps backend category ID to a matching Lucide stroke icon (stroke width 1.5 strict) */
const CATEGORY_ICONS: Record<string, React.FC<{ size?: number; strokeWidth?: number; className?: string }>> = {
  embedded: Cpu,
  software: Code2,
  ai_ml: Sparkles,
  hardware: CircuitBoard,
  data: Database,
  robotics: Bot,
  internships: GraduationCap,
  remote: Globe,
};

/** Curated semantic color styling per category for clean, vibrant editorial scanning */
const CATEGORY_THEMES: Record<
  string,
  { iconBg: string; text: string; border: string; countBadge: string }
> = {
  embedded: {
    iconBg: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/25',
    text: 'group-hover:text-teal-600 dark:group-hover:text-teal-400',
    border: 'hover:border-teal-500/40',
    countBadge: 'text-teal-700 dark:text-teal-300',
  },
  software: {
    iconBg: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/25',
    text: 'group-hover:text-sky-600 dark:group-hover:text-sky-400',
    border: 'hover:border-sky-500/40',
    countBadge: 'text-sky-700 dark:text-sky-300',
  },
  ai_ml: {
    iconBg: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/25',
    text: 'group-hover:text-cyan-600 dark:group-hover:text-cyan-400',
    border: 'hover:border-cyan-500/40',
    countBadge: 'text-cyan-700 dark:text-cyan-300',
  },
  hardware: {
    iconBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25',
    text: 'group-hover:text-amber-600 dark:group-hover:text-amber-400',
    border: 'hover:border-amber-500/40',
    countBadge: 'text-amber-700 dark:text-amber-300',
  },
  data: {
    iconBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/25',
    text: 'group-hover:text-blue-600 dark:group-hover:text-blue-400',
    border: 'hover:border-blue-500/40',
    countBadge: 'text-blue-700 dark:text-blue-300',
  },
  robotics: {
    iconBg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25',
    text: 'group-hover:text-rose-600 dark:group-hover:text-rose-400',
    border: 'hover:border-rose-500/40',
    countBadge: 'text-rose-700 dark:text-rose-300',
  },
  internships: {
    iconBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25',
    text: 'group-hover:text-emerald-600 dark:group-hover:text-emerald-400',
    border: 'hover:border-emerald-500/40',
    countBadge: 'text-emerald-700 dark:text-emerald-300',
  },
  remote: {
    iconBg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/25',
    text: 'group-hover:text-indigo-600 dark:group-hover:text-indigo-400',
    border: 'hover:border-indigo-500/40',
    countBadge: 'text-indigo-700 dark:text-indigo-300',
  },
};

/**
 * Editorial Category Tile Component
 * Why: Allows candidates to quickly browse live curated pools of roles with exact live counts,
 * enhanced with domain-specific color accents for immediate visual recognition.
 */
export const CategoryTile: React.FC<CategoryTileProps> = ({ category, onClick }) => {
  const IconComponent = CATEGORY_ICONS[category.id] || Code2;
  const theme = CATEGORY_THEMES[category.id] || {
    iconBg: 'bg-accent-subdued text-accent border-accent/20',
    text: 'group-hover:text-accent',
    border: 'hover:border-accent/40',
    countBadge: 'text-accent',
  };

  return (
    <button
      type="button"
      onClick={() => onClick(category)}
      className={`group flex flex-col justify-between p-5 rounded-2xl border border-border/80 bg-surface ${theme.border} hover:shadow-card hover:-translate-y-0.5 transition-all duration-200 ease-editorial text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent`}
    >
      <div className="flex items-center justify-between w-full mb-4">
        {/* Curated Icon Capsule */}
        <div className={`flex items-center justify-center h-10 w-10 rounded-xl border ${theme.iconBg} group-hover:scale-105 transition-transform duration-150 ease-editorial shadow-2xs`}>
          <IconComponent size={20} strokeWidth={1.5} />
        </div>
        <span className="font-mono text-12 text-text-muted group-hover:text-text font-medium transition-colors duration-150 ease-editorial">
          {category.count.toLocaleString()} roles
        </span>
      </div>

      <div>
        <h3 className={`font-sans text-15 font-semibold text-text ${theme.text} transition-colors duration-150 ease-editorial leading-snug`}>
          {category.label}
        </h3>
        <p className="font-sans text-12 text-text-muted mt-0.5">
          Verified direct openings
        </p>
      </div>
    </button>
  );
};

export default CategoryTile;
