import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, AlertTriangle, RefreshCw, LogOut, CheckCircle2, Calendar } from 'lucide-react';

export const BlockedAccountPage: React.FC<{ onNavigateToSettings?: () => void }> = () => {
  const { user, logout, refreshUser } = useAuth();

  const isSuspended = user?.account_status === 'suspended';
  const isExpired = user?.subscription_expiry_date
    ? new Date(user.subscription_expiry_date) < new Date()
    : false;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 sm:p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-6 sm:p-8 text-center space-y-6">
        <div
          className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center ${
            isSuspended
              ? 'bg-rose-50 text-rose-600 border border-rose-200'
              : 'bg-amber-50 text-amber-600 border border-amber-200'
          }`}
        >
          {isSuspended ? (
            <ShieldAlert className="w-8 h-8" />
          ) : (
            <AlertTriangle className="w-8 h-8" />
          )}
        </div>

        <div>
          <h2 className="text-xl font-bold text-slate-900">
            {isSuspended
              ? 'Account Suspended'
              : isExpired
              ? 'Access Expired'
              : 'Account Inactive'}
          </h2>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
            {isSuspended
              ? 'Your real estate agent account has been temporarily suspended by the platform administrator.'
              : isExpired
              ? `Your account access expired on ${
                  user?.subscription_expiry_date
                    ? new Date(user.subscription_expiry_date).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : 'N/A'
                }. Please contact your platform administrator to extend your expiry date.`
              : 'Your agent account is currently marked as inactive. Please contact the administrator to activate your access.'}
          </p>
        </div>

        {/* Status Card */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-left text-xs space-y-2">
          <div className="flex justify-between items-center py-1 border-b border-slate-200">
            <span className="text-slate-500 font-medium">Agent Name:</span>
            <span className="font-semibold text-slate-900">{user?.name}</span>
          </div>
          <div className="flex justify-between items-center py-1 border-b border-slate-200">
            <span className="text-slate-500 font-medium">Email:</span>
            <span className="text-slate-700">{user?.email}</span>
          </div>
          <div className="flex justify-between items-center py-1 border-b border-slate-200">
            <span className="text-slate-500 font-medium">Account Status:</span>
            <span
              className={`font-semibold capitalize ${
                user?.account_status === 'active' ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {user?.account_status}
            </span>
          </div>
          <div className="flex justify-between items-center py-1">
            <span className="text-slate-500 font-medium">Expiry Date:</span>
            <span
              className={`font-semibold ${
                isExpired ? 'text-rose-600' : 'text-slate-900'
              }`}
            >
              {user?.subscription_expiry_date
                ? new Date(user.subscription_expiry_date).toLocaleDateString([], {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : 'No Expiry'}
            </span>
          </div>
        </div>

        <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl text-left text-xs text-blue-900 flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Your data is 100% safe:</strong> All your prospective clients,
            notes, and activities are safely retained. Contact your Platform Admin to
            extend your expiry date or reactivate your account.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <button
            onClick={() => refreshUser()}
            className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Check Status</span>
          </button>
          <button
            onClick={logout}
            className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};
