import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

interface AnnouncementBarProps {
  rolesAdded24h?: number;
}

/**
 * Slim top announcement bar showing live 24h crawled roles count.
 * Why: Establishes freshness with a live database-backed count and Aegean accent.
 */
export const AnnouncementBar: React.FC<AnnouncementBarProps> = ({ rolesAdded24h }) => {
  return (
    <div className="w-full border-b border-border/60 bg-surface-subdued text-text px-4 py-2 transition-colors duration-150 ease-editorial">
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-2.5 font-sans text-12 text-center">
        <span className="flex h-2 w-2 relative flex-shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>

        <span className="text-text-muted">
          <strong className="font-semibold text-text">
            {rolesAdded24h ? rolesAdded24h.toLocaleString() : 'Fresh'}
          </strong>{' '}
          verified roles indexed directly from company ATS feeds in the last 24 hours.
        </span>

        <Link
          to="/jobs"
          className="inline-flex items-center gap-1 font-medium text-accent hover:underline flex-shrink-0"
        >
          <span>View fresh additions</span>
          <ArrowRight size={11} strokeWidth={2} />
        </Link>
      </div>
    </div>
  );
};

export default AnnouncementBar;
