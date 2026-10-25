import React from 'react';

export const SkeletonRow: React.FC = () => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-4.5 border-b border-border/70 bg-surface animate-pulse">
      <div className="flex items-start gap-3.5 min-w-0">
        {/* Monogram placeholder */}
        <div className="flex-shrink-0 h-9 w-9 rounded-xl border border-border bg-surface-subdued" />

        {/* Content lines */}
        <div className="space-y-2.5 min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <div className="h-4.5 w-48 sm:w-64 rounded-md bg-surface-subdued" />
            <div className="h-3.5 w-20 rounded-md bg-surface-subdued" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-24 rounded-full bg-surface-subdued" />
            <div className="h-3 w-16 rounded-full bg-surface-subdued" />
            <div className="h-3 w-20 rounded-full bg-surface-subdued" />
          </div>
        </div>
      </div>

      {/* Right column chips and action */}
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        <div className="h-6 w-16 rounded-full bg-surface-subdued" />
        <div className="h-6 w-16 rounded-full bg-surface-subdued" />
        <div className="h-7 w-20 rounded-full bg-surface-subdued" />
      </div>
    </div>
  );
};

export default SkeletonRow;
