import React, { useState, useEffect, useCallback } from 'react';
import api from '../lib/api';
import type { Lead, PaginatedResponse, User } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { PriorityBadge } from '../components/common/PriorityBadge';
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  X,
  Building,
} from 'lucide-react';
import { toast } from 'sonner';

interface AdminAllLeadsPageProps {
  onViewLead: (leadId: number) => void;
}

export const AdminAllLeadsPage: React.FC<AdminAllLeadsPageProps> = ({ onViewLead }) => {
  const [leadsData, setLeadsData] = useState<PaginatedResponse<Lead> | null>(null);
  const [agents, setAgents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [agentId, setAgentId] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [source, setSource] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch agents list for filter dropdown
  useEffect(() => {
    api.get('/admin/agents', { params: { per_page: 100 } }).then((res) => {
      setAgents(res.data.data || []);
    });
  }, []);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = {
        page: currentPage,
        per_page: 10,
      };

      if (search.trim()) params.search = search.trim();
      if (agentId) params.agent_id = agentId;
      if (status) params.status = status;
      if (priority) params.priority = priority;
      if (source) params.source = source;

      const res = await api.get('/admin/leads', { params });
      setLeadsData(res.data);
    } catch {
      toast.error('Failed to load platform leads');
    } finally {
      setLoading(false);
    }
  }, [currentPage, search, agentId, status, priority, source]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const clearFilters = () => {
    setSearch('');
    setAgentId('');
    setStatus('');
    setPriority('');
    setSource('');
    setCurrentPage(1);
  };

  const hasActiveFilters =
    Boolean(search) ||
    Boolean(agentId) ||
    Boolean(status) ||
    Boolean(priority) ||
    Boolean(source);

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          All Platform Leads
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Global view of all prospective leads created across all tenant real estate agents
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 border border-slate-200 rounded-2xl shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search leads or agent..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Filter by Agent */}
          <div>
            <select
              value={agentId}
              onChange={(e) => {
                setAgentId(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 text-slate-700"
            >
              <option value="">All Agents</option>
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filter by Status */}
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
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="qualified">Qualified</option>
              <option value="site_visit_scheduled">Site Visit Scheduled</option>
              <option value="negotiation">Negotiation</option>
              <option value="won">Won (Closed)</option>
              <option value="lost">Lost</option>
            </select>
          </div>

          {/* Filter by Priority */}
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
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* Filter by Source */}
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
              <option value="Facebook Ads">Facebook Ads</option>
              <option value="Instagram">Instagram</option>
              <option value="WhatsApp">WhatsApp</option>
              <option value="Website">Website</option>
              <option value="Property Portal">Property Portal</option>
              <option value="Referral">Referral</option>
              <option value="Walk-in">Walk-in</option>
              <option value="Phone Call">Phone Call</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-slate-500">
              Showing filtered results ({leadsData?.total || 0} leads across platform)
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

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          </div>
        ) : !leadsData || leadsData.data.length === 0 ? (
          <div className="text-center py-16 px-4">
            <Building className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-800">No leads found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {hasActiveFilters
                ? 'Try adjusting your search filters.'
                : 'No leads registered in the platform yet.'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/75 border-b border-slate-200 text-slate-500 font-medium">
                  <tr>
                    <th className="py-3 px-4">Lead Name</th>
                    <th className="py-3 px-4">Contact</th>
                    <th className="py-3 px-4">Assigned Agent</th>
                    <th className="py-3 px-4">Source</th>
                    <th className="py-3 px-4">Property & Budget</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Priority</th>
                    <th className="py-3 px-4 text-right">Created Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {leadsData.data.map((lead) => (
                    <tr
                      key={lead.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap">
                        <button
                          onClick={() => onViewLead(lead.id)}
                          className="hover:text-blue-600 hover:underline text-left font-semibold"
                        >
                          {lead.name}
                        </button>
                      </td>

                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                        {lead.phone}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap font-medium text-slate-900">
                        {lead.agent ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                            {lead.agent.name}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Unassigned</span>
                        )}
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
                        <StatusBadge status={lead.status} />
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <PriorityBadge priority={lead.priority} />
                      </td>

                      <td className="py-3 px-4 text-right text-slate-400 whitespace-nowrap">
                        {new Date(lead.created_at).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                    </tr>
                  ))}
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
    </div>
  );
};
