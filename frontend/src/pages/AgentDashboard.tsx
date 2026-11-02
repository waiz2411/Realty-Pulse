import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import type { AgentStats, Lead } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { PriorityBadge } from '../components/common/PriorityBadge';
import {
  Users,
  UserPlus,
  PhoneCall,
  CheckCircle,
  Trophy,
  Calendar,
  Clock,
  ArrowRight,
  Plus,
  Loader2,
  ExternalLink,
  Phone,
  MessageSquare,
} from 'lucide-react';
import { toast } from 'sonner';

interface AgentDashboardProps {
  onNavigateToLeads: () => void;
  onNavigateToFollowUps: () => void;
  onOpenAddLeadModal: () => void;
  onViewLead: (leadId: number) => void;
}

export const AgentDashboard: React.FC<AgentDashboardProps> = ({
  onNavigateToLeads,
  onNavigateToFollowUps,
  onOpenAddLeadModal,
  onViewLead,
}) => {
  const [stats, setStats] = useState<AgentStats | null>(null);
  const [recentLeads, setRecentLeads] = useState<Lead[]>([]);
  const [todayFollowUps, setTodayFollowUps] = useState<Lead[]>([]);
  const [upcomingFollowUps, setUpcomingFollowUps] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      // 1 single lightning-fast HTTP request for all agent dashboard data
      const res = await api.get('/agent/dashboard/overview');
      setStats(res.data?.stats || null);
      setRecentLeads(Array.isArray(res.data?.recent_leads) ? res.data.recent_leads : []);
      setTodayFollowUps(Array.isArray(res.data?.today_followups) ? res.data.today_followups : []);
      setUpcomingFollowUps(Array.isArray(res.data?.upcoming_followups) ? res.data.upcoming_followups : []);
    } catch {
      try {
        const [statsRes, recentRes, todayRes, upcomingRes] = await Promise.all([
          api.get('/agent/dashboard/stats'),
          api.get('/agent/dashboard/recent-leads'),
          api.get('/agent/dashboard/today-followups'),
          api.get('/agent/dashboard/upcoming-followups'),
        ]);

        setStats(statsRes.data || null);
        setRecentLeads(Array.isArray(recentRes.data) ? recentRes.data : []);
        setTodayFollowUps(Array.isArray(todayRes.data) ? todayRes.data : []);
        setUpcomingFollowUps(Array.isArray(upcomingRes.data) ? upcomingRes.data : []);
      } catch {
        toast.error('Failed to load dashboard data');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Leads',
      value: stats?.total_leads || 0,
      icon: Users,
      bg: 'bg-slate-50',
      text: 'text-slate-900',
      border: 'border-slate-200',
    },
    {
      title: 'New Leads',
      value: stats?.new_leads || 0,
      icon: UserPlus,
      bg: 'bg-blue-50/70',
      text: 'text-blue-900',
      border: 'border-blue-200/80',
    },
    {
      title: 'Contacted Leads',
      value: stats?.contacted_leads || 0,
      icon: PhoneCall,
      bg: 'bg-sky-50/70',
      text: 'text-sky-900',
      border: 'border-sky-200/80',
    },
    {
      title: 'Qualified Leads',
      value: stats?.qualified_leads || 0,
      icon: CheckCircle,
      bg: 'bg-amber-50/70',
      text: 'text-amber-900',
      border: 'border-amber-200/80',
    },
    {
      title: 'Closed Deals (Won)',
      value: stats?.closed_deals || 0,
      icon: Trophy,
      bg: 'bg-emerald-50/70',
      text: 'text-emerald-900',
      border: 'border-emerald-200/80',
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner with Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white border border-slate-200 rounded-2xl shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Agent Dashboard
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Overview of your active real estate leads and upcoming follow-ups
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenAddLeadModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Lead</span>
          </button>
          <button
            onClick={onNavigateToLeads}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors"
          >
            <span>View All Leads</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>
      </div>

      {/* 5 Core Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className={`p-4 rounded-2xl border ${card.bg} ${card.border} transition-all`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">
                  {card.title}
                </span>
                <Icon className={`w-4 h-4 ${card.text}`} />
              </div>
              <div className={`text-2xl font-bold ${card.text} mt-2`}>
                {card.value}
              </div>
            </div>
          );
        })}
      </div>

      {/* Follow-ups Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Follow-ups Today */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Follow-ups Today
                </h3>
                <span className="text-[11px] text-slate-400">
                  Clients requiring contact today
                </span>
              </div>
            </div>
            <button
              onClick={onNavigateToFollowUps}
              className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>Manage</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="flex-1">
            {todayFollowUps.length === 0 ? (
              <div className="h-40 flex flex-col items-center justify-center text-center p-4 border border-dashed border-slate-200 rounded-xl">
                <Clock className="w-6 h-6 text-slate-300 mb-1" />
                <p className="text-xs font-medium text-slate-600">
                  No follow-ups due today!
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Great job staying on top of your schedule.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {todayFollowUps.map((lead) => {
                  const cleanPhone = lead.phone?.replace(/[^0-9+]/g, '') || '';
                  return (
                    <div
                      key={lead.id}
                      className="p-3 rounded-xl border border-amber-200/80 bg-amber-50/40 hover:bg-amber-50 flex items-center justify-between gap-3 transition-colors"
                    >
                      <div
                        className="cursor-pointer min-w-0"
                        onClick={() => onViewLead(lead.id)}
                      >
                        <div className="font-semibold text-xs text-slate-900 truncate">
                          {lead.name}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">
                          {lead.interested_property || lead.property_type || 'General Interest'} • {lead.phone}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <a
                          href={`tel:${lead.phone}`}
                          title="Call Lead"
                          className="p-1.5 text-slate-600 bg-white hover:text-emerald-700 hover:bg-emerald-50 rounded-lg border border-slate-200 transition-colors shadow-2xs"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                        <a
                          href={`https://wa.me/${cleanPhone.replace('+', '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="WhatsApp Lead"
                          className="p-1.5 text-slate-600 bg-white hover:text-emerald-700 hover:bg-emerald-50 rounded-lg border border-slate-200 transition-colors shadow-2xs"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </a>
                        <button
                          onClick={() => onViewLead(lead.id)}
                          className="px-2.5 py-1 text-[11px] font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs"
                        >
                          View
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Follow-ups */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Upcoming Follow-ups
                </h3>
                <span className="text-[11px] text-slate-400">
                  Scheduled for upcoming days
                </span>
              </div>
            </div>
            <button
              onClick={onNavigateToFollowUps}
              className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="flex-1">
            {upcomingFollowUps.length === 0 ? (
              <div className="h-40 flex flex-col items-center justify-center text-center p-4 border border-dashed border-slate-200 rounded-xl">
                <Calendar className="w-6 h-6 text-slate-300 mb-1" />
                <p className="text-xs font-medium text-slate-600">
                  No upcoming follow-ups scheduled
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Set follow-up dates on your leads to stay organized.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {upcomingFollowUps.map((lead) => (
                  <div
                    key={lead.id}
                    onClick={() => onViewLead(lead.id)}
                    className="p-3 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50/70 flex items-center justify-between gap-3 cursor-pointer transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="font-semibold text-xs text-slate-900 truncate">
                        {lead.name}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">
                        {lead.interested_property || lead.property_type || 'Property inquiry'}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                        {lead.follow_up_date
                          ? new Date(lead.follow_up_date).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                            })
                          : 'Upcoming'}
                      </span>
                      <PriorityBadge priority={lead.priority} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Leads Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Recent Leads</h3>
            <span className="text-[11px] text-slate-400">
              Latest client inquiries added to your CRM
            </span>
          </div>
          <button
            onClick={onNavigateToLeads}
            className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <span>View All Leads</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {recentLeads.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-700">No leads added yet</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Click the button below to add your first real estate lead.
            </p>
            <button
              onClick={onOpenAddLeadModal}
              className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-xl"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Lead</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/75 border-b border-slate-200 text-slate-500 font-medium">
                <tr>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Property Interest</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Follow-up</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {lead.name}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{lead.phone}</td>
                    <td className="py-3 px-4 text-slate-600">
                      {lead.property_type}
                      {lead.interested_property ? ` • ${lead.interested_property}` : ''}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={lead.status} />
                    </td>
                    <td className="py-3 px-4">
                      <PriorityBadge priority={lead.priority} />
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {lead.follow_up_date
                        ? new Date(lead.follow_up_date).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                          })
                        : '—'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onViewLead(lead.id)}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
