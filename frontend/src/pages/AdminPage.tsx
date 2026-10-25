import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Database,
  ExternalLink,
  Lock,
  RefreshCw,
  Server,
} from 'lucide-react';
import { type AdminStatsResponse, getAdminStats } from '../lib/api';

const STORAGE_KEY = 'sift_admin_token_v1';

export const AdminPage: React.FC = () => {
  const [tokenInput, setTokenInput] = useState('');
  const [activeToken, setActiveToken] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    return sessionStorage.getItem(STORAGE_KEY) || '';
  });

  const {
    data: stats,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery<AdminStatsResponse, Error>({
    queryKey: ['admin-stats', activeToken],
    queryFn: () => getAdminStats(activeToken),
    enabled: Boolean(activeToken),
    retry: false,
  });

  const handleLogin = (e: React.FormEvent): void => {
    e.preventDefault();
    const trimmed = tokenInput.trim();
    if (trimmed) {
      sessionStorage.setItem(STORAGE_KEY, trimmed);
      setActiveToken(trimmed);
    }
  };

  const handleLogout = (): void => {
    sessionStorage.removeItem(STORAGE_KEY);
    setActiveToken('');
    setTokenInput('');
  };

  // If no token or unauthorized, show minimal editorial token gateway
  if (!activeToken || (isError && error.message.includes('401'))) {
    return (
      <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center px-4">
        <div className="w-full max-w-sm rounded-surface border border-border bg-surface p-6">
          <div className="flex items-center gap-2 mb-2">
            <Lock size={16} strokeWidth={1.5} className="text-accent" />
            <h1 className="font-sans text-16 font-medium text-text">
              Admin Diagnostics
            </h1>
          </div>
          <p className="font-sans text-13 text-text-muted mb-5 leading-relaxed">
            Provide the administrative token to inspect crawler status, failure logs, and ATS indexing metrics.
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="password"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="Enter admin token..."
                autoFocus
                className="w-full rounded-control border border-border bg-bg px-3 py-2 font-mono text-13 text-text placeholder:text-text-muted/60 focus:border-border-strong focus:outline-none focus-visible:ring-1 focus-visible:ring-accent"
              />
            </div>

            {isError && (
              <p className="font-mono text-12 text-accent">
                {error.message.includes('401')
                  ? 'Invalid admin credentials.'
                  : error.message}
              </p>
            )}

            <button
              type="submit"
              className="w-full rounded-control bg-accent py-2 font-sans text-13 font-medium text-white hover:bg-accent-hover transition-colors"
            >
              Verify Token
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 transition-colors duration-150 ease-editorial">
      {/* Top Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Server size={18} strokeWidth={1.5} className="text-accent" />
            <h1 className="font-sans text-20 font-medium text-text">
              Platform Health & Crawler Diagnostics
            </h1>
          </div>
          <p className="font-sans text-13 text-text-muted">
            Internal telemetry covering ATS pipelines, failure clusters, and board freshness.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-1.5 rounded-control border border-border bg-surface px-3 py-1.5 font-sans text-12 text-text hover:border-border-strong transition-colors"
          >
            <RefreshCw size={13} strokeWidth={1.5} className={isFetching ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="rounded-control border border-border bg-surface px-3 py-1.5 font-sans text-12 text-text-muted hover:text-text hover:border-border-strong transition-colors"
          >
            Lock
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="py-16 text-center">
          <p className="font-mono text-13 text-text-muted animate-pulse">Loading telemetry...</p>
        </div>
      )}

      {stats && (
        <div className="space-y-8">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="rounded-control border border-border bg-surface p-4">
              <span className="font-mono text-12 text-text-muted uppercase">Open Jobs</span>
              <p className="font-mono text-24 font-medium text-text mt-1">
                {stats.summary.total_open_jobs.toLocaleString()}
              </p>
              <span className="font-sans text-12 text-text-muted/70">
                of {stats.summary.total_jobs.toLocaleString()} total
              </span>
            </div>

            <div className="rounded-control border border-border bg-surface p-4">
              <span className="font-mono text-12 text-text-muted uppercase">Companies</span>
              <p className="font-mono text-24 font-medium text-text mt-1">
                {stats.summary.total_companies.toLocaleString()}
              </p>
              <span className="font-sans text-12 text-text-muted/70">Active registries</span>
            </div>

            <div className="rounded-control border border-border bg-surface p-4">
              <span className="font-mono text-12 text-text-muted uppercase">AI Enriched</span>
              <p className="font-mono text-24 font-medium text-text mt-1">
                {stats.summary.total_enriched_jobs.toLocaleString()}
              </p>
              <span className="font-sans text-12 text-text-muted/70">Validated schema</span>
            </div>

            <div className="rounded-control border border-border bg-surface p-4">
              <span className="font-mono text-12 text-text-muted uppercase">Embeddings</span>
              <p className="font-mono text-24 font-medium text-text mt-1">
                {stats.summary.total_embeddings.toLocaleString()}
              </p>
              <span className="font-sans text-12 text-text-muted/70">768-dim vectors</span>
            </div>

            <div className="rounded-control border border-border bg-surface p-4">
              <span className="font-mono text-12 text-text-muted uppercase">7d Failures</span>
              <p className={`font-mono text-24 font-medium mt-1 ${stats.summary.failed_crawls_7d_count > 0 ? 'text-accent' : 'text-text'}`}>
                {stats.summary.failed_crawls_7d_count}
              </p>
              <span className="font-sans text-12 text-text-muted/70">Crawl runs</span>
            </div>
          </div>

          {/* Main Telemetry Columns: ATS Breakdown & Failed Runs */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 1. Jobs Per ATS Distribution */}
            <div className="rounded-surface border border-border bg-surface overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3.5 border-b border-border bg-bg/50">
                <Database size={15} strokeWidth={1.5} className="text-text-muted" />
                <h3 className="font-sans text-14 font-medium text-text">
                  Open Openings by ATS Architecture
                </h3>
              </div>

              <div className="divide-y divide-border font-sans text-13">
                {stats.jobs_per_ats.map((ats) => {
                  const pct = stats.summary.total_open_jobs > 0
                    ? ((ats.count / stats.summary.total_open_jobs) * 100).toFixed(1)
                    : '0';

                  return (
                    <div key={ats.ats} className="flex items-center justify-between px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-12 capitalize text-text">
                          {ats.ats}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-12 text-text font-medium">
                          {ats.count.toLocaleString()}
                        </span>
                        <span className="font-mono text-12 text-text-muted/60 w-12 text-right">
                          {pct}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. Stale Companies */}
            <div className="rounded-surface border border-border bg-surface overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3.5 border-b border-border bg-bg/50">
                <Clock size={15} strokeWidth={1.5} className="text-text-muted" />
                <h3 className="font-sans text-14 font-medium text-text">
                  Stale Companies (Uncrawled &gt; 7 days)
                </h3>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-border font-sans text-13">
                {stats.stale_companies.length === 0 ? (
                  <div className="p-5 text-center text-text-muted font-sans text-13">
                    <CheckCircle2 size={16} strokeWidth={1.5} className="mx-auto mb-1 text-text" />
                    All active company boards have been crawled within the last 7 days.
                  </div>
                ) : (
                  stats.stale_companies.map((c) => (
                    <div key={c.id} className="flex items-center justify-between px-5 py-2.5">
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-text truncate">{c.name}</span>
                          <span className="rounded-control border border-border px-1.5 py-0.2 font-mono text-12 text-text-muted">
                            {c.ats_type}
                          </span>
                        </div>
                        <a
                          href={c.careers_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-12 text-text-muted hover:text-accent flex items-center gap-0.5 truncate mt-0.5"
                        >
                          <span>{c.careers_url}</span>
                          <ExternalLink size={10} strokeWidth={1.5} />
                        </a>
                      </div>

                      <span className="font-mono text-12 text-text-muted flex-shrink-0">
                        {c.last_crawled_at
                          ? new Date(c.last_crawled_at).toLocaleDateString()
                          : 'Never'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* 3. Failed Crawls Log (Last 7 Days) */}
          <div className="rounded-surface border border-border bg-surface overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-bg/50">
              <div className="flex items-center gap-2">
                <AlertTriangle size={15} strokeWidth={1.5} className="text-accent" />
                <h3 className="font-sans text-14 font-medium text-text">
                  Failed Crawl Runs (Past 7 Days)
                </h3>
              </div>
              <span className="font-mono text-12 text-text-muted">
                {stats.failed_crawls_7d.length} events logged
              </span>
            </div>

            <div className="max-h-96 overflow-y-auto divide-y divide-border">
              {stats.failed_crawls_7d.length === 0 ? (
                <div className="p-8 text-center text-text-muted font-sans text-13">
                  <CheckCircle2 size={18} strokeWidth={1.5} className="mx-auto mb-1 text-text" />
                  Zero crawler failures recorded in the past 7 days.
                </div>
              ) : (
                stats.failed_crawls_7d.map((run) => (
                  <div key={run.id} className="p-4 hover:bg-bg/40 transition-colors">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-sans text-13 font-medium text-text">
                          {run.company_name}
                        </span>
                        <span className="font-mono text-12 text-text-muted">
                          ({run.company_slug})
                        </span>
                      </div>
                      <span className="font-mono text-12 text-text-muted">
                        {new Date(run.started_at).toLocaleString()}
                      </span>
                    </div>

                    <div className="rounded-control border border-border/80 bg-bg p-2 font-mono text-12 text-accent break-all whitespace-pre-wrap">
                      {run.error_message || 'Unknown network failure'}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
