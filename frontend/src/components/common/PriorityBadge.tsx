import React from 'react';
import type { LeadPriority } from '../../types';

interface PriorityBadgeProps {
  priority: LeadPriority | string;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority }) => {
  const p = priority?.toLowerCase();

  if (p === 'high') {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700 border border-rose-200">
        <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
        High
      </span>
    );
  }

  if (p === 'medium') {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 border border-amber-200">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
        Medium
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 border border-slate-200">
      <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
      Low
    </span>
  );
};
