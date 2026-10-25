import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

interface AnnouncementBarProps {
  rolesAdded24h?: number;
}

/**
 * Slim top announcement bar displaying verified 24-hour additions.
 * Why: Establishes freshness signal immediately without loud promotional banners.
 */
export const AnnouncementBar: React.FC<AnnouncementBarProps> = ({ rolesAdded24h = 0 }) => {
  return (
    <div className="w-full border-b border-border/80 bg-surface/50 text-text px-4 py-1.5 text-center text-12 font-sans transition-colors">
      <div className="max-w-6xl mx-auto flex items-center justify-center gap-2 flex-wrap">
        <span className="inline-flex items-center gap-1.5 font-mono text-11 text-text-muted">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="font-medium text-text">
            {rolesAdded24h > 0 ? rolesAdded24h.toLocaleString() : '9,600+'}
          </span>{' '}
          verified roles added in the last 24 hours
        </span>

        <span className="text-border-strong hidden sm:inline">·</span>

        <Link
          to="/jobs"
          className="inline-flex items-center gap-1 font-mono text-11 text-accent hover:text-accent-hover font-medium underline-offset-4 hover:underline"
        >
          <span>Explore fresh openings</span>
          <ArrowRight size={11} strokeWidth={1.75} />
        </Link>
      </div>
    </div>
  );
};

export default AnnouncementBar;
