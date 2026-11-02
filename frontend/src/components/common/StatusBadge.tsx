import React from 'react';
import type { LeadStatus } from '../../types';

interface StatusBadgeProps {
  status: LeadStatus | string;
  size?: 'sm' | 'md';
}

const statusConfig: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  new: {
    label: 'New',
    bg: 'bg-blue-50 border-blue-200',
    text: 'text-blue-700',
    dot: 'bg-blue-500',
  },
  contacted: {
    label: 'Contacted',
    bg: 'bg-sky-50 border-sky-200',
    text: 'text-sky-700',
    dot: 'bg-sky-500',
  },
  qualified: {
    label: 'Qualified',
    bg: 'bg-amber-50 border-amber-200',
    text: 'text-amber-700',
    dot: 'bg-amber-500',
  },
  site_visit_scheduled: {
    label: 'Site Visit',
    bg: 'bg-purple-50 border-purple-200',
    text: 'text-purple-700',
    dot: 'bg-purple-500',
  },
  negotiation: {
    label: 'Negotiation',
    bg: 'bg-emerald-50 border-emerald-200',
    text: 'text-emerald-700',
    dot: 'bg-emerald-500',
  },
  won: {
    label: 'Won',
    bg: 'bg-green-50 border-green-200',
    text: 'text-green-700',
    dot: 'bg-green-600',
  },
  lost: {
    label: 'Lost',
    bg: 'bg-slate-100 border-slate-200',
    text: 'text-slate-600',
    dot: 'bg-slate-400',
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm' }) => {
  const config = statusConfig[status] || {
    label: status.replace(/_/g, ' '),
    bg: 'bg-slate-50 border-slate-200',
    text: 'text-slate-700',
    dot: 'bg-slate-400',
  };

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium border ${config.bg} ${config.text} ${sizeClasses}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      <span className="capitalize">{config.label}</span>
    </span>
  );
};
