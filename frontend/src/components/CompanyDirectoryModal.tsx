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
        className="w-full max-w-2xl bg-surface border border-border rounded-2xl shadow-popover overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-accent-subdued text-accent">
              <Building2 size={18} strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="font-sans text-16 font-semibold text-text">
                Indexed Companies ({companiesList.length})
              </h2>
              <p className="font-sans text-12 text-text-muted">
                Direct public ATS feeds crawled every 24 hours
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-text-muted hover:text-text hover:bg-surface-subdued transition-colors"
          >
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>

        {/* Search Input Bar */}
        <div className="p-4 border-b border-border/60 bg-surface-subdued/30">
          <div className="relative flex items-center rounded-full border border-border bg-surface px-3.5 py-1.5 focus-within:border-accent focus-within:ring-1 focus-within:ring-accent">
            <Search size={15} strokeWidth={1.5} className="text-text-muted mr-2" />
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Search by employer name or ATS (Greenhouse, Lever, Ashby)..."
              className="w-full bg-transparent font-sans text-13 text-text placeholder:text-text-muted/60 focus:outline-none"
              autoFocus
            />
          </div>
        </div>

        {/* Scrollable Company List */}
        <div className="flex-1 overflow-y-auto divide-y divide-border/60 p-2">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-text-muted font-sans text-13">
              No matching indexed employers found.
            </div>
          ) : (
            filtered.map((comp) => {
              const monogram = comp.name.charAt(0).toUpperCase();
              return (
                <div
                  key={comp.slug}
                  onClick={() => handleSelectCompany(comp.name)}
                  className="flex items-center justify-between p-3.5 rounded-xl hover:bg-surface-subdued cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 flex items-center justify-center h-9 w-9 rounded-xl bg-surface-subdued border border-border font-sans text-14 font-semibold text-text">
                      {monogram}
                    </div>
                    <div>
                      <h3 className="font-sans text-14 font-semibold text-text">
                        {comp.name}
                      </h3>
                      <span className="font-mono text-11 text-text-muted uppercase">
                        via {comp.ats_type}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-accent-subdued px-2.5 py-0.5 font-mono text-12 font-medium text-accent">
                      {comp.jobs_count} open roles
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border/80 bg-surface-subdued/40 text-center font-sans text-12 text-text-muted">
          Click any company to view all verified active openings
        </div>
      </div>
    </div>
  );
};

export default CompanyDirectoryModal;
