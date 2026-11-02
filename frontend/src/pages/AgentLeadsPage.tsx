import React, { useState, useEffect, useCallback } from 'react';
import api from '../lib/api';
import type { Lead, LeadPriority, LeadSource, LeadStatus, PaginatedResponse } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { PriorityBadge } from '../components/common/PriorityBadge';
import { ConfirmationModal } from '../components/common/ConfirmationModal';
import {
  Search,
  Filter,
  Plus,
  Trash2,
  Edit2,
  Eye,
  ChevronLeft,
  ChevronRight,
  Phone,
  MessageSquare,
  Loader2,
  Calendar,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

interface AgentLeadsPageProps {
  onOpenAddLeadModal: () => void;
  onEditLead: (lead: Lead) => void;
  onViewLead: (leadId: number) => void;
  refreshTrigger?: number;
}

const SOURCES: LeadSource[] = [
  'Facebook Ads',
  'Instagram',
  'WhatsApp',
  'Website',
  'Property Portal',
  'Referral',
  'Walk-in',
  'Phone Call',
  'Other',
];

const STATUSES: { value: LeadStatus; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'site_visit_scheduled', label: 'Site Visit' },
  { value: 'negotiation', label: 'Negotiation' },
  { value: 'won', label: 'Won' },
  { value: 'lost', label: 'Lost' },
];

export const AgentLeadsPage: React.FC<AgentLeadsPageProps> = ({
  onOpenAddLeadModal,
  onEditLead,
  onViewLead,
  refreshTrigger,
}) => {
  const [leadsData, setLeadsData] = useState<PaginatedResponse<Lead> | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('');
  const [source, setSource] = useState<string>('');
  const [priority, setPriority] = useState<string>('');
  const [followUpFilter, setFollowUpFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);

  // Deletion modal
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = {
        page: currentPage,
        per_page: 10,
      };

      if (search.trim()) params.search = search.trim();
      if (status) params.status = status;
      if (source) params.source = source;
      if (priority) params.priority = priority;
      if (followUpFilter) params.follow_up = followUpFilter;

      const res = await api.get('/agent/leads', { params });
      setLeadsData(res.data);
    } catch {
      toast.error('Failed to load leads');
    } finally {
      setLoading(false);
    }
  }, [currentPage, search, status, source, priority, followUpFilter]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads, refreshTrigger]);

  const handleDelete = async () => {
    if (!leadToDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/agent/leads/${leadToDelete.id}`);
      toast.success(`Lead '${leadToDelete.name}' deleted successfully`);
      setLeadToDelete(null);
      fetchLeads();
    } catch {
      toast.error('Failed to delete lead');
    } finally {
      setDeleting(false);
    }
  };

  const handleQuickStatusChange = async (leadId: number, newStatus: LeadStatus) => {
    try {
      await api.patch(`/agent/leads/${leadId}/status`, { status: newStatus });
      toast.success('Status updated');
      fetchLeads();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const clearFilters = () => {
    setSearch('');
    setStatus('');
    setSource('');
    setPriority('');
    setFollowUpFilter('');
    setCurrentPage(1);
  };

  const hasActiveFilters =
    Boolean(search) ||
    Boolean(status) ||
    Boolean(source) ||
    Boolean(priority) ||
    Boolean(followUpFilter);

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Header with Title and Add Lead Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white border border-slate-200 rounded-2xl shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Leads Management
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Organize prospective buyers and sellers, update status and track deals
          </p>
        </div>

        <button
          onClick={onOpenAddLeadModal}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-xs shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Lead</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 border border-slate-200 rounded-2xl shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {/* Search */}
          <div className="relative lg:col-span-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search name, phone..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 text-slate-700"
            >
              <option value="">All Statuses</option>
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* Source Filter */}
          <div>
            <select
              value={source}
              onChange={(e) => {
                setSource(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 text-slate-700"
            >
              <option value="">All Sources</option>
              {SOURCES.map((src) => (
                <option key={src} value={src}>
                  {src}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <select
              value={priority}
              onChange={(e) => {
                setPriority(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 text-slate-700"
            >
              <option value="">All Priorities</option>
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>
          </div>

          {/* Follow-up Timing */}
          <div>
            <select
              value={followUpFilter}
              onChange={(e) => {
                setFollowUpFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 text-slate-700"
            >
              <option value="">All Follow-ups</option>
              <option value="today">Follow-up Today</option>
              <option value="overdue">Overdue Follow-up</option>
              <option value="upcoming">Upcoming Follow-up</option>
            </select>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-slate-500">
              Showing filtered results ({leadsData?.total || 0} leads found)
            </span>
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          </div>
        )}
      </div>

      {/* Leads Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : !leadsData || leadsData.data.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Filter className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800">No leads found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {hasActiveFilters
                ? 'Try broadening your search or resetting the active filters.'
                : 'Get started by creating your first prospective lead.'}
            </p>
            {hasActiveFilters ? (
              <button
                onClick={clearFilters}
                className="mt-4 px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Clear Filters
              </button>
            ) : (
              <button
                onClick={onOpenAddLeadModal}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add First Lead</span>
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/75 border-b border-slate-200 text-slate-500 font-medium">
                  <tr>
                    <th className="py-3 px-4">Lead Name</th>
                    <th className="py-3 px-4">Contact</th>
                    <th className="py-3 px-4">Source</th>
                    <th className="py-3 px-4">Property & Budget</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Priority</th>
                    <th className="py-3 px-4">Follow-up</th>
                    <th className="py-3 px-4">Created</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {leadsData.data.map((lead) => {
                    const cleanPhone = lead.phone?.replace(/[^0-9+]/g, '') || '';
                    const isOverdue =
                      lead.follow_up_date &&
                      new Date(lead.follow_up_date) < new Date(new Date().toDateString()) &&
                      lead.status !== 'won' &&
                      lead.status !== 'lost';
                    const isToday =
                      lead.follow_up_date &&
                      lead.follow_up_date.startsWith(new Date().toISOString().split('T')[0]);

                    return (
                      <tr
                        key={lead.id}
                        className="hover:bg-slate-50/80 transition-colors group"
                      >
                        <td className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap">
                          <button
                            onClick={() => onViewLead(lead.id)}
                            className="hover:text-blue-600 hover:underline text-left font-semibold"
                          >
                            {lead.name}
                          </button>
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-800">{lead.phone}</span>
                            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                              <a
                                href={`tel:${lead.phone}`}
                                title="Call"
                                className="p-1 text-slate-400 hover:text-emerald-600"
                              >
                                <Phone className="w-3 h-3" />
                              </a>
                              <a
                                href={`https://wa.me/${cleanPhone.replace('+', '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="WhatsApp"
                                className="p-1 text-slate-400 hover:text-emerald-600"
                              >
                                <MessageSquare className="w-3 h-3" />
                              </a>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                          {lead.source}
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-800">
                            {lead.property_type}
                            {lead.interested_property ? ` • ${lead.interested_property}` : ''}
                          </div>
                          {lead.budget && (
                            <div className="text-[11px] text-emerald-600 font-semibold">
                              {lead.budget}
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          <select
                            value={lead.status}
                            onChange={(e) =>
                              handleQuickStatusChange(lead.id, e.target.value as LeadStatus)
                            }
                            className="text-[11px] font-medium bg-transparent border-0 hover:bg-slate-100 rounded-md px-1.5 py-1 focus:ring-1 focus:ring-blue-500 cursor-pointer"
                          >
                            {STATUSES.map((s) => (
                              <option key={s.value} value={s.value}>
                                {s.label}
                              </option>
                            ))}
                          </select>
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          <PriorityBadge priority={lead.priority} />
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          {lead.follow_up_date ? (
                            <span
                              className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md ${
                                isOverdue
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : isToday
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              <Calendar className="w-3 h-3" />
                              {new Date(lead.follow_up_date).toLocaleDateString([], {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">None</span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                          {new Date(lead.created_at).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </td>

                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => onViewLead(lead.id)}
                              title="View details"
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onEditLead(lead)}
                              title="Edit lead"
                              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setLeadToDelete(lead)}
                              title="Delete lead"
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
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
                Showing <strong>{leadsData.from || 0}</strong> to{' '}
                <strong>{leadsData.to || 0}</strong> of{' '}
                <strong>{leadsData.total}</strong> leads
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-2 font-medium text-slate-700">
                  Page {currentPage} of {leadsData.last_page || 1}
                </span>
                <button
                  disabled={currentPage >= leadsData.last_page}
                  onClick={() =>
                    setCurrentPage((p) => Math.min(p + 1, leadsData.last_page))
                  }
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={Boolean(leadToDelete)}
        onClose={() => setLeadToDelete(null)}
        onConfirm={handleDelete}
        title="Delete Lead"
        message={`Are you sure you want to permanently delete lead '${leadToDelete?.name}'? All attached notes and activity logs will also be permanently removed.`}
        confirmText="Delete Lead"
        isDestructive={true}
        loading={deleting}
      />
    </div>
  );
};
