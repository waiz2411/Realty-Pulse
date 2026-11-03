import React, { useState, useEffect, useCallback } from 'react';
import api from '../lib/api';
import type { PaginatedResponse, User } from '../types';
import { AccountStatusBadge } from '../components/common/AccountStatusBadge';
import { ConfirmationModal } from '../components/common/ConfirmationModal';
import {
  Search,
  Filter,
  Plus,
  Trash2,
  Edit2,
  Eye,
  Key,
  ShieldCheck,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  Loader2,
  X,
  Phone,
  Mail,
  Sparkles,
  Calendar,
} from 'lucide-react';
import { toast } from 'sonner';

interface AdminAgentsPageProps {
  onOpenCreateModal: () => void;
  onEditAgent: (agent: User) => void;
  onViewAgent: (agentId: number) => void;
  onResetPassword: (agent: User) => void;
  refreshTrigger?: number;
}

export const AdminAgentsPage: React.FC<AdminAgentsPageProps> = ({
  onOpenCreateModal,
  onEditAgent,
  onViewAgent,
  onResetPassword,
  refreshTrigger,
}) => {
  const [agentsData, setAgentsData] = useState<PaginatedResponse<User> | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [accountStatus, setAccountStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Deletion
  const [agentToDelete, setAgentToDelete] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [seedingAgentId, setSeedingAgentId] = useState<number | null>(null);

  const fetchAgents = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = {
        page: currentPage,
        per_page: 10,
      };

      if (search.trim()) params.search = search.trim();
      if (accountStatus) params.account_status = accountStatus;

      const res = await api.get('/admin/agents', { params });
      setAgentsData(res.data);
    } catch {
      toast.error('Failed to load agents list');
    } finally {
      setLoading(false);
    }
  }, [currentPage, search, accountStatus]);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents, refreshTrigger]);

  const handleDelete = async () => {
    if (!agentToDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/agents/${agentToDelete.id}`);
      toast.success(`Agent '${agentToDelete.name}' deleted successfully`);
      setAgentToDelete(null);
      fetchAgents();
    } catch {
      toast.error('Failed to delete agent account');
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleStatus = async (agent: User) => {
    const nextStatus = agent.account_status === 'active' ? 'suspended' : 'active';
    try {
      await api.patch(`/admin/agents/${agent.id}/status`, { account_status: nextStatus });
      toast.success(`Agent account marked as ${nextStatus}`);
      fetchAgents();
    } catch {
      toast.error('Failed to update agent status');
    }
  };

  const handleSeedDemoData = async (agent: User) => {
    setSeedingAgentId(agent.id);
    try {
      const res = await api.post(`/admin/agents/${agent.id}/seed-demo-data`);
      toast.success(res.data.message || `Demo leads added to ${agent.name}!`);
      fetchAgents();
    } catch {
      toast.error('Failed to populate demo data');
    } finally {
      setSeedingAgentId(null);
    }
  };

  const clearFilters = () => {
    setSearch('');
    setAccountStatus('');
    setCurrentPage(1);
  };

  const hasActiveFilters = Boolean(search) || Boolean(accountStatus);

  return (
    <div className="space-y-6">
      {/* Top Bar with Title and Create Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Agent Account Management
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Provision, manage, and monitor real estate agent accounts and permissions
          </p>
        </div>

        <button
          onClick={onOpenCreateModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-xs cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Agent</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {/* Search Box */}
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by agent name, email, or phone number..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Account Status Filter */}
          <div>
            <select
              value={accountStatus}
              onChange={(e) => {
                setAccountStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 text-slate-700"
            >
              <option value="">All Account Statuses</option>
              <option value="active">Active (Valid Access)</option>
              <option value="expired">Expired Access</option>
              <option value="suspended">Suspended (Access Blocked)</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-slate-500">
              Showing filtered results ({agentsData?.total || 0} agents found)
            </span>
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          </div>
        )}
      </div>

      {/* Agents Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : !agentsData || agentsData.data.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Filter className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800">No agents found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {hasActiveFilters
                ? 'Try adjusting your search filters.'
                : 'Get started by creating your first agent account.'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/75 border-b border-slate-200 text-slate-500 font-medium">
                  <tr>
                    <th className="py-3 px-4">Agent Name</th>
                    <th className="py-3 px-4">Contact</th>
                    <th className="py-3 px-4">Total Leads</th>
                    <th className="py-3 px-4">Account Status</th>
                    <th className="py-3 px-4">Access Expiry</th>
                    <th className="py-3 px-4">Joined Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {agentsData.data.map((agent) => {
                    const expDate = agent.subscription_expiry_date
                      ? new Date(agent.subscription_expiry_date)
                      : null;
                    const isExpired = expDate ? expDate < new Date() : false;

                    return (
                      <tr
                        key={agent.id}
                        className="hover:bg-slate-50/80 transition-colors group"
                      >
                        <td className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap">
                          <button
                            onClick={() => onViewAgent(agent.id)}
                            className="hover:text-blue-600 hover:underline text-left font-semibold cursor-pointer"
                          >
                            {agent.name}
                          </button>
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="text-slate-800 flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{agent.email}</span>
                          </div>
                          {agent.phone && (
                            <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                              <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>{agent.phone}</span>
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-4 font-semibold text-slate-800 whitespace-nowrap">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold text-xs">
                            {agent.leads_count ?? 0} leads
                          </span>
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          <AccountStatusBadge status={agent.account_status} />
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          {expDate ? (
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                                isExpired
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              }`}
                            >
                              <Calendar className="w-3 h-3 shrink-0" />
                              <span>
                                {isExpired ? 'Expired: ' : 'Expires: '}
                                {expDate.toLocaleDateString([], {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                              </span>
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs">No Expiry</span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                          {new Date(agent.created_at).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          {/* Seed Demo Data Button */}
                          <button
                            onClick={() => handleSeedDemoData(agent)}
                            disabled={seedingAgentId === agent.id}
                            title="Add 6 demo leads to this account"
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          >
                            {seedingAgentId === agent.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                            ) : (
                              <Sparkles className="w-3.5 h-3.5" />
                            )}
                          </button>

                          <button
                            onClick={() => onViewAgent(agent.id)}
                            title="View Profile & Leads"
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => onEditAgent(agent)}
                            title="Edit Agent Information"
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleToggleStatus(agent)}
                            title={
                              agent.account_status === 'active'
                                ? 'Suspend Account'
                                : 'Activate Account'
                            }
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              agent.account_status === 'active'
                                ? 'text-amber-600 hover:bg-amber-50'
                                : 'text-emerald-600 hover:bg-emerald-50'
                            }`}
                          >
                            {agent.account_status === 'active' ? (
                              <ShieldAlert className="w-3.5 h-3.5" />
                            ) : (
                              <ShieldCheck className="w-3.5 h-3.5" />
                            )}
                          </button>

                          <button
                            onClick={() => onResetPassword(agent)}
                            title="Reset Password"
                            className="p-1.5 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Key className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => setAgentToDelete(agent)}
                            title="Delete Account"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/50 text-xs text-slate-500">
              <div>
                Showing <strong>{agentsData.from || 0}</strong> to{' '}
                <strong>{agentsData.to || 0}</strong> of{' '}
                <strong>{agentsData.total}</strong> agents
              </div>

              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>

                <span className="px-2 font-medium text-slate-800">
                  {agentsData.current_page} / {agentsData.last_page}
                </span>

                <button
                  disabled={currentPage >= agentsData.last_page}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={Boolean(agentToDelete)}
        onClose={() => setAgentToDelete(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Permanently Delete Agent?"
        message={`Are you sure you want to permanently delete agent account '${agentToDelete?.name}' (${agentToDelete?.email})? All leads, follow-ups, and notes owned by this agent will also be permanently deleted. This action cannot be undone.`}
        confirmText="Yes, Delete Agent"
        isDestructive={true}
      />
    </div>
  );
};
