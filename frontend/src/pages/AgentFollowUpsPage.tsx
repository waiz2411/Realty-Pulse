import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import type { FollowUpGrouped, Lead } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { PriorityBadge } from '../components/common/PriorityBadge';
import { FollowUpModal } from '../components/leads/FollowUpModal';
import {
  AlertCircle,
  Calendar,
  Clock,
  CheckCircle2,
  Phone,
  MessageSquare,
  Loader2,
  CalendarPlus,
} from 'lucide-react';
import { toast } from 'sonner';

interface AgentFollowUpsPageProps {
  onViewLead: (leadId: number) => void;
}

export const AgentFollowUpsPage: React.FC<AgentFollowUpsPageProps> = ({ onViewLead }) => {
  const [data, setData] = useState<FollowUpGrouped | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedLeadForFollowUp, setSelectedLeadForFollowUp] = useState<Lead | null>(null);

  const fetchFollowUps = async () => {
    setLoading(true);
    try {
      const res = await api.get('/agent/followups');
      setData(res.data);
    } catch {
      toast.error('Failed to load follow-up list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFollowUps();
  }, []);

  const handleFollowUpCompleted = (updatedLead: Lead) => {
    fetchFollowUps();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const overdueList = data?.overdue || [];
  const todayList = data?.today || [];
  const upcomingList = data?.upcoming || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          Follow-up Management
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Keep prospects warm and close deals by managing overdue, today, and upcoming follow-ups
        </p>

        {/* Quick summary counts */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
          <div className="p-3 rounded-xl border border-rose-200 bg-rose-50/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span className="text-xs font-semibold text-rose-900">Overdue Follow-ups</span>
            </div>
            <span className="text-base font-bold text-rose-700">
              {data?.counts.overdue || 0}
            </span>
          </div>

          <div className="p-3 rounded-xl border border-amber-200 bg-amber-50/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="text-xs font-semibold text-amber-900">Today&apos;s Follow-ups</span>
            </div>
            <span className="text-base font-bold text-amber-700">
              {data?.counts.today || 0}
            </span>
          </div>

          <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
              <span className="text-xs font-semibold text-slate-800">Upcoming Follow-ups</span>
            </div>
            <span className="text-base font-bold text-slate-700">
              {data?.counts.upcoming || 0}
            </span>
          </div>
        </div>
      </div>

      {/* SECTION 1: OVERDUE (RED INDICATOR) */}
      <div className="bg-white border border-rose-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 bg-rose-50/60 border-b border-rose-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-xs">
              <AlertCircle className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-sm font-bold text-rose-900">
              Overdue ({overdueList.length})
            </h3>
          </div>
          <span className="text-[11px] font-medium text-rose-700">
            Requires immediate contact
          </span>
        </div>

        {overdueList.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No overdue follow-ups. You are completely up to date!
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {overdueList.map((lead) => {
              const cleanPhone = lead.phone?.replace(/[^0-9+]/g, '') || '';
              return (
                <div
                  key={lead.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onViewLead(lead.id)}
                        className="font-bold text-xs text-slate-900 hover:text-blue-600 hover:underline text-left"
                      >
                        {lead.name}
                      </button>
                      <StatusBadge status={lead.status} />
                      <PriorityBadge priority={lead.priority} />
                    </div>

                    <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-3">
                      <span>{lead.phone}</span>
                      {lead.interested_property && (
                        <span>• {lead.interested_property}</span>
                      )}
                      <span className="text-rose-600 font-semibold flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Due date was {new Date(lead.follow_up_date!).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={`tel:${lead.phone}`}
                      className="p-1.5 text-slate-600 bg-white hover:text-emerald-700 hover:bg-emerald-50 rounded-lg border border-slate-200 transition-colors"
                      title="Call"
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </a>
                    <a
                      href={`https://wa.me/${cleanPhone.replace('+', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-slate-600 bg-white hover:text-emerald-700 hover:bg-emerald-50 rounded-lg border border-slate-200 transition-colors"
                      title="WhatsApp"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                    </a>
                    <button
                      onClick={() => setSelectedLeadForFollowUp(lead)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-2xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Complete Follow-up</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 2: TODAY (ORANGE INDICATOR) */}
      <div className="bg-white border border-amber-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 bg-amber-50/60 border-b border-amber-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs">
              <Calendar className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-sm font-bold text-amber-900">
              Today ({todayList.length})
            </h3>
          </div>
          <span className="text-[11px] font-medium text-amber-700">
            Due for follow-up today
          </span>
        </div>

        {todayList.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No follow-ups due today.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {todayList.map((lead) => {
              const cleanPhone = lead.phone?.replace(/[^0-9+]/g, '') || '';
              return (
                <div
                  key={lead.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onViewLead(lead.id)}
                        className="font-bold text-xs text-slate-900 hover:text-blue-600 hover:underline text-left"
                      >
                        {lead.name}
                      </button>
                      <StatusBadge status={lead.status} />
                      <PriorityBadge priority={lead.priority} />
                    </div>

                    <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-3">
                      <span>{lead.phone}</span>
                      {lead.interested_property && (
                        <span>• {lead.interested_property}</span>
                      )}
                      <span className="text-amber-700 font-medium">
                        Due today
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={`tel:${lead.phone}`}
                      className="p-1.5 text-slate-600 bg-white hover:text-emerald-700 hover:bg-emerald-50 rounded-lg border border-slate-200 transition-colors"
                      title="Call"
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </a>
                    <a
                      href={`https://wa.me/${cleanPhone.replace('+', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-slate-600 bg-white hover:text-emerald-700 hover:bg-emerald-50 rounded-lg border border-slate-200 transition-colors"
                      title="WhatsApp"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                    </a>
                    <button
                      onClick={() => setSelectedLeadForFollowUp(lead)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-2xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Complete Follow-up</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 3: UPCOMING (NEUTRAL INDICATOR) */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50/75 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs">
              <CalendarPlus className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              Upcoming ({upcomingList.length})
            </h3>
          </div>
          <span className="text-[11px] font-medium text-slate-500">
            Scheduled for later this week or month
          </span>
        </div>

        {upcomingList.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No upcoming follow-ups scheduled.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {upcomingList.map((lead) => {
              const cleanPhone = lead.phone?.replace(/[^0-9+]/g, '') || '';
              return (
                <div
                  key={lead.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onViewLead(lead.id)}
                        className="font-bold text-xs text-slate-900 hover:text-blue-600 hover:underline text-left"
                      >
                        {lead.name}
                      </button>
                      <StatusBadge status={lead.status} />
                      <PriorityBadge priority={lead.priority} />
                    </div>

                    <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-3">
                      <span>{lead.phone}</span>
                      {lead.interested_property && (
                        <span>• {lead.interested_property}</span>
                      )}
                      <span className="text-slate-600 font-medium">
                        Scheduled for{' '}
                        {new Date(lead.follow_up_date!).toLocaleDateString([], {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setSelectedLeadForFollowUp(lead)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors shadow-2xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>Reschedule / Update</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Follow-up outcome modal */}
      <FollowUpModal
        isOpen={Boolean(selectedLeadForFollowUp)}
        onClose={() => setSelectedLeadForFollowUp(null)}
        lead={selectedLeadForFollowUp}
        onSuccess={handleFollowUpCompleted}
      />
    </div>
  );
};
