import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Building2, Search, X } from 'lucide-react';
import { getLandingStats, type CompanyDirectoryItem } from '../lib/api';

interface CompanyDirectoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  companies?: CompanyDirectoryItem[];
}

/**
 * Company roster modal allowing users to explore all indexed company career portals.
 * Why: Gives transparency into which employers are crawled directly from official ATS feeds.
 */
export const CompanyDirectoryModal: React.FC<CompanyDirectoryModalProps> = ({
  isOpen,
  onClose,
  companies: initialCompanies,
}) => {
  const [filterQuery, setFilterQuery] = useState('');
  const navigate = useNavigate();

  const { data: stats } = useQuery({
    queryKey: ['landing-stats'],
    queryFn: getLandingStats,
    enabled: isOpen && !initialCompanies,
  });

  if (!isOpen) return null;

  const companiesList = initialCompanies || stats?.top_companies || [];

  const filtered = companiesList.filter((c) =>
    c.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
    c.ats_type.toLowerCase().includes(filterQuery.toLowerCase())
  );

  const handleSelectCompany = (companyName: string) => {
    onClose();
    navigate(`/jobs?q=${encodeURIComponent(companyName)}`);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-surface border border-border rounded-surface shadow-popover overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/80">
          <div className="flex items-center gap-2">
            <Building2 size={16} strokeWidth={1.5} className="text-accent" />
            <h2 className="font-sans text-15 font-medium text-text">
              Indexed Companies ({companiesList.length})
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-text-muted hover:text-text hover:bg-surface-hover transition-colors"
          >
            <X size={16} strokeWidth={1.5} />
          </button>
        </div>

        {/* Filter Input */}
        <div className="p-3 border-b border-border/80 bg-surface/50">
          <div className="flex items-center gap-2 rounded border border-border bg-bg px-3 py-1.5 focus-within:border-accent">
            <Search size={14} strokeWidth={1.5} className="text-text-muted shrink-0" />
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Filter companies or ATS type (e.g. OpenAI, Greenhouse)..."
              className="w-full bg-transparent font-sans text-13 text-text placeholder:text-text-muted/60 focus:outline-none"
              autoFocus
            />
            {filterQuery && (
              <button
                type="button"
                onClick={() => setFilterQuery('')}
                className="text-text-muted hover:text-text p-0.5"
              >
                <X size={12} strokeWidth={1.5} />
              </button>
            )}
          </div>
        </div>

        {/* Company List */}
        <div className="overflow-y-auto divide-y divide-border/60 p-2">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-text-muted text-13 font-mono">
              No companies match "{filterQuery}"
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {filtered.map((comp) => (
                <button
                  key={comp.slug}
                  type="button"
                  onClick={() => handleSelectCompany(comp.name)}
                  className="flex items-center justify-between p-2.5 rounded border border-transparent hover:border-border hover:bg-surface-hover text-left transition-colors group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-7 h-7 rounded border border-border/80 bg-bg flex items-center justify-center font-mono text-12 font-medium text-text shrink-0">
                      {comp.name.charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <p className="font-sans text-13 font-medium text-text truncate group-hover:text-accent transition-colors">
                        {comp.name}
                      </p>
                      <p className="font-mono text-11 text-text-muted uppercase">
                        {comp.ats_type}
                      </p>
                    </div>
                  </div>

                  <span className="font-mono text-11 text-text-muted px-2 py-0.5 rounded bg-bg border border-border/60 shrink-0">
                    {comp.jobs_count} roles
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer note */}
        <div className="p-3 border-t border-border/80 bg-surface/30 flex items-center justify-between text-11 font-mono text-text-muted">
          <span>Direct ATS ingestion · Zero third-party scrapers</span>
          <span>Press ESC to close</span>
        </div>
      </div>
    </div>
  );
};

export default CompanyDirectoryModal;
