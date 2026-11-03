import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import type { AdminStats, Lead, User } from '../types';
import { AccountStatusBadge } from '../components/common/AccountStatusBadge';
import { StatusBadge } from '../components/common/StatusBadge';
import {
  Users,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Building,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  Loader2,
  Eye,
  Plus,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { toast } from 'sonner';

interface AdminDashboardProps {
  onNavigateToAgents: () => void;
  onNavigateToAllLeads: () => void;
  onOpenCreateAgentModal: () => void;
  onViewAgent: (agentId: number) => void;
}

const STATUS_COLORS: Record<string, string> = {
  new: '#3b82f6',
  contacted: '#0284c7',
  qualified: '#f59e0b',
  site_visit_scheduled: '#a855f7',
  negotiation: '#10b981',
  won: '#16a34a',
  lost: '#94a3b8',
};

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onNavigateToAgents,
  onNavigateToAllLeads,
  onOpenCreateAgentModal,
  onViewAgent,
}) => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentAgents, setRecentAgents] = useState<User[]>([]);
  const [recentLeads, setRecentLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAdminData = async () => {
    try {
      // 1 single lightning-fast HTTP request for all dashboard data
      const res = await api.get('/admin/dashboard/overview');
      setStats(res.data?.stats || null);
      setRecentAgents(Array.isArray(res.data?.recent_agents) ? res.data.recent_agents : []);
      setRecentLeads(Array.isArray(res.data?.recent_leads) ? res.data.recent_leads : []);
    } catch {
      try {
        const [statsRes, agentsRes, leadsRes] = await Promise.all([
          api.get('/admin/dashboard/stats'),
          api.get('/admin/dashboard/recent-agents'),
          api.get('/admin/dashboard/recent-leads'),
        ]);

        setStats(statsRes.data || null);
        setRecentAgents(Array.isArray(agentsRes.data) ? agentsRes.data : []);
        setRecentLeads(Array.isArray(leadsRes.data) ? leadsRes.data : []);
      } catch {
        toast.error('Failed to load admin dashboard');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  const overview = stats?.overview;

  const overviewCards = [
    {
      title: 'Total Agents',
      value: overview?.total_agents || 0,
      icon: Users,
      bg: 'bg-slate-50',
      text: 'text-slate-900',
      border: 'border-slate-200',
    },
    {
      title: 'Active Agents',
      value: overview?.active_agents || 0,
      icon: ShieldCheck,
      bg: 'bg-emerald-50/70',
      text: 'text-emerald-900',
      border: 'border-emerald-200/80',
    },
    {
      title: 'Expired Accounts',
      value: overview?.expired_agents || 0,
      icon: AlertTriangle,
      bg: 'bg-amber-50/70',
      text: 'text-amber-900',
      border: 'border-amber-200/80',
    },
    {
      title: 'Suspended Agents',
      value: overview?.suspended_agents || 0,
      icon: ShieldAlert,
      bg: 'bg-rose-50/70',
      text: 'text-rose-900',
      border: 'border-rose-200/80',
    },
    {
      title: 'Total Platform Leads',
      value: overview?.total_leads || 0,
      icon: Building,
      bg: 'bg-blue-50/70',
      text: 'text-blue-900',
      border: 'border-blue-200/80',
    },
    {
      title: 'Leads Added Today',
      value: overview?.leads_added_today || 0,
      icon: Calendar,
      bg: 'bg-amber-50/70',
      text: 'text-amber-900',
      border: 'border-amber-200/80',
    },
    {
      title: 'Deals Won (Closed)',
      value: overview?.won_deals || 0,
      icon: CheckCircle2,
      bg: 'bg-emerald-50/70',
      text: 'text-emerald-900',
      border: 'border-emerald-200/80',
    },
    {
      title: 'Follow-ups Today',
      value: overview?.followups_today || 0,
      icon: Clock,
      bg: 'bg-purple-50/70',
      text: 'text-purple-900',
      border: 'border-purple-200/80',
    },
  ];

  // Prepare chart data for Leads by Status
  const statusChartData = stats?.analytics.leads_by_status
    ? Object.entries(stats.analytics.leads_by_status).map(([k, v]) => ({
        status: k.replace(/_/g, ' '),
        rawStatus: k,
        count: v,
      }))
    : [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Platform Owner Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white border border-slate-200 rounded-2xl shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Platform Super Admin
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Global monitoring, tenant account provisioning, subscriptions, and platform-wide leads
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenCreateAgentModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Create Agent</span>
          </button>
          <button
            onClick={onNavigateToAgents}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors"
          >
            <span>Manage Agents</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>
      </div>

      {/* 7 Core Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        {overviewCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className={`p-3.5 rounded-2xl border ${card.bg} ${card.border}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-slate-500 leading-tight">
                  {card.title}
                </span>
                <Icon className={`w-3.5 h-3.5 ${card.text} shrink-0`} />
              </div>
              <div className={`text-xl font-bold ${card.text} mt-2`}>
                {card.value}
              </div>
            </div>
          );
        })}
      </div>

      {/* Visual Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leads By Status Chart */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-1">
            Platform Leads by Status
          </h3>
          <p className="text-[11px] text-slate-400 mb-4">
            Distribution of prospects across sales pipeline stages
          </p>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <XAxis
                  dataKey="status"
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {statusChartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={STATUS_COLORS[entry.rawStatus] || '#3b82f6'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Agents by Lead Activity */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold text-slate-900">
                Top Agents by Lead Volume
              </h3>
              <button
                onClick={onNavigateToAgents}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                <span>View All</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mb-4">
              Real estate agents actively managing the highest client volume
            </p>

            <div className="space-y-3">
              {Array.isArray(stats?.analytics?.top_agents) && stats.analytics.top_agents.length > 0 ? (
                stats.analytics.top_agents.map((agent, i) => (
                  <div
                    key={agent.id}
                    onClick={() => onViewAgent(agent.id)}
                    className="p-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
                        {i + 1}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-xs text-slate-900 truncate">
                          {agent.name}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">
                          {agent.email}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <AccountStatusBadge status={agent.account_status} />
                      <span className="text-xs font-bold text-slate-900 bg-white border border-slate-200 px-2 py-0.5 rounded-lg shadow-2xs">
                        {agent.leads_count} Leads
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-xs text-slate-400">
                  No agents found.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Agents Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Recent Agents</h3>
            <span className="text-[11px] text-slate-400">
              Latest registered real estate agents and their tenant account status
            </span>
          </div>
          <button
            onClick={onNavigateToAgents}
            className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <span>All Agents</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/75 border-b border-slate-200 text-slate-500 font-medium">
              <tr>
                <th className="py-3 px-4">Agent Name</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Total Leads</th>
                <th className="py-3 px-4">Account Status</th>
                <th className="py-3 px-4">Last Login</th>
                <th className="py-3 px-4">Created Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {Array.isArray(recentAgents) && recentAgents.length > 0 ? (
                recentAgents.map((agent) => (
                <tr
                  key={agent.id}
                  className="hover:bg-slate-50/80 transition-colors"
                >
                  <td className="py-3 px-4 font-semibold text-slate-900">
                    <button
                      onClick={() => onViewAgent(agent.id)}
                      className="hover:text-blue-600 hover:underline text-left font-semibold"
                    >
                      {agent.name}
                    </button>
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    <div>{agent.email}</div>
                    <div className="text-[11px] text-slate-400">{agent.phone || '—'}</div>
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-800">
                    {agent.leads_count ?? 0}
                  </td>
                  <td className="py-3 px-4">
                    <AccountStatusBadge status={agent.account_status} />
                  </td>
                  <td className="py-3 px-4 text-slate-500">
                    {agent.last_login_at
                      ? new Date(agent.last_login_at).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'Never'}
                  </td>
                  <td className="py-3 px-4 text-slate-400">
                    {new Date(agent.created_at).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => onViewAgent(agent.id)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Profile</span>
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400">
                  No agents found
                </td>
              </tr>
            )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Platform Leads Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Platform-Wide Recent Leads
            </h3>
            <span className="text-[11px] text-slate-400">
              Live prospective leads created across all tenant agent workspaces
            </span>
          </div>
          <button
            onClick={onNavigateToAllLeads}
            className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <span>All Leads</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/75 border-b border-slate-200 text-slate-500 font-medium">
              <tr>
                <th className="py-3 px-4">Lead Name</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4">Assigned Agent</th>
                <th className="py-3 px-4">Lead Status</th>
                <th className="py-3 px-4">Property Interest</th>
                <th className="py-3 px-4 text-right">Created Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {Array.isArray(recentLeads) && recentLeads.length > 0 ? (
                recentLeads.map((lead) => (
                <tr
                  key={lead.id}
                  className="hover:bg-slate-50/80 transition-colors"
                >
                  <td className="py-3 px-4 font-semibold text-slate-900">
                    {lead.name}
                  </td>
                  <td className="py-3 px-4 text-slate-600">{lead.phone}</td>
                  <td className="py-3 px-4">
                    {lead.agent ? (
                      <span className="font-medium text-slate-800">
                        {lead.agent.name}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">Unassigned</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={lead.status} />
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    {lead.property_type}
                    {lead.interested_property ? ` • ${lead.interested_property}` : ''}
                  </td>
                  <td className="py-3 px-4 text-right text-slate-400">
                    {new Date(lead.created_at).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400">
                  No leads recorded yet
                </td>
              </tr>
            )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
