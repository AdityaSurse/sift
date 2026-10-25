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
      className="group flex flex-col justify-between p-5 rounded-2xl border border-border/80 bg-surface hover:border-accent/40 hover:shadow-card transition-all duration-200 ease-editorial text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      <div className="flex items-center justify-between w-full mb-4">
        <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-accent-subdued text-accent border border-accent/20 group-hover:scale-105 transition-transform duration-150 ease-editorial">
          <IconComponent size={20} strokeWidth={1.5} />
        </div>
        <span className="font-mono text-12 text-text-muted group-hover:text-accent font-medium transition-colors duration-150 ease-editorial">
          {category.count.toLocaleString()} roles
        </span>
      </div>

      <div>
        <h3 className="font-sans text-15 font-semibold text-text group-hover:text-accent transition-colors duration-150 ease-editorial leading-snug">
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
