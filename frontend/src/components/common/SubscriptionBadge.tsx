import React from 'react';
import type { SubscriptionPlan, SubscriptionStatus } from '../../types';

interface SubscriptionBadgeProps {
  plan?: SubscriptionPlan | string;
  status?: SubscriptionStatus | string;
}

export const SubscriptionBadge: React.FC<SubscriptionBadgeProps> = ({ plan, status }) => {
  const planColor: Record<string, string> = {
    pro: 'bg-purple-50 text-purple-700 border-purple-200',
    basic: 'bg-blue-50 text-blue-700 border-blue-200',
    free: 'bg-slate-100 text-slate-700 border-slate-200',
    custom: 'bg-amber-50 text-amber-700 border-amber-200',
  };

  const statusColor: Record<string, string> = {
    active: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    expired: 'text-rose-700 bg-rose-50 border-rose-200',
    trial: 'text-sky-700 bg-sky-50 border-sky-200',
    cancelled: 'text-slate-600 bg-slate-100 border-slate-200',
  };

  return (
    <div className="inline-flex items-center gap-1.5">
      {plan && (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider border ${
            planColor[plan.toLowerCase()] || 'bg-slate-100 text-slate-700 border-slate-200'
          }`}
        >
          {plan}
        </span>
      )}
      {status && (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
            statusColor[status.toLowerCase()] || 'text-slate-700 bg-slate-50 border-slate-200'
          }`}
        >
          {status}
        </span>
      )}
    </div>
  );
};
