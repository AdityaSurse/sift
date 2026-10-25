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

/**
 * Editorial Category Tile Component
 * Why: Allows candidates to quickly browse live curated pools of roles with exact live counts.
 */
export const CategoryTile: React.FC<CategoryTileProps> = ({ category, onClick }) => {
  const IconComponent = CATEGORY_ICONS[category.id] || Code2;

  return (
    <button
      type="button"
      onClick={() => onClick(category)}
      className="group flex flex-col justify-between p-4 sm:p-5 rounded-surface border border-border/80 bg-surface/50 hover:bg-surface hover:border-border-strong transition-all duration-150 ease-editorial text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
    >
      <div className="flex items-center justify-between w-full mb-3">
        <div className="flex items-center justify-center h-9 w-9 rounded-control border border-border/70 bg-bg text-text-muted group-hover:text-accent group-hover:border-accent/40 transition-colors duration-150 ease-editorial">
          <IconComponent size={18} strokeWidth={1.5} />
        </div>
        <span className="font-mono text-12 text-text-muted group-hover:text-text transition-colors duration-150 ease-editorial">
          {category.count.toLocaleString()} roles
        </span>
      </div>

      <div>
        <h3 className="font-sans text-15 font-medium text-text group-hover:text-accent transition-colors duration-150 ease-editorial leading-snug">
          {category.label}
        </h3>
        <p className="font-mono text-11 text-text-muted/60 mt-0.5">
          Live direct feeds
        </p>
      </div>
    </button>
  );
};

export default CategoryTile;
