import React from 'react';
import type { AccountStatus } from '../../types';

interface AccountStatusBadgeProps {
  status: AccountStatus | string;
}

export const AccountStatusBadge: React.FC<AccountStatusBadgeProps> = ({ status }) => {
  const s = status?.toLowerCase();

  if (s === 'active') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 border border-emerald-200">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Active
      </span>
    );
  }

  if (s === 'suspended') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700 border border-rose-200">
        <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
        Suspended
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 border border-slate-200">
      <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
      Inactive
    </span>
  );
};
