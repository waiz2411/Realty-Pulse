import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { AccountStatusBadge } from '../common/AccountStatusBadge';
import { SubscriptionBadge } from '../common/SubscriptionBadge';
import { StatusBadge } from '../common/StatusBadge';
import api from '../../lib/api';
import type { Lead, User } from '../../types';
import {
  Mail,
  Phone,
  Calendar,
  Clock,
  Key,
  ShieldAlert,
  ShieldCheck,
  Building,
  Loader2,
  Edit2,
  DollarSign,
} from 'lucide-react';
import { toast } from 'sonner';

interface AgentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  agentId: number | null;
  onEdit: (agent: User) => void;
  onResetPassword: (agent: User) => void;
  onStatusChanged: (agent: User) => void;
}

interface AgentStatsData {
  total_leads: number;
  new_leads: number;
  contacted: number;
  qualified: number;
  won: number;
  lost: number;
  overdue_followups: number;
  today_followups: number;
}

export const AgentDetailModal: React.FC<AgentDetailModalProps> = ({
  isOpen,
  onClose,
  agentId,
  onEdit,
  onResetPassword,
  onStatusChanged,
}) => {
  const [agent, setAgent] = useState<User | null>(null);
  const [stats, setStats] = useState<AgentStatsData | null>(null);
  const [recentLeads, setRecentLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [toggling, setToggling] = useState(false);

  const fetchAgent = async (id: number) => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/agents/${id}`);
      setAgent(res.data.agent);
      setStats(res.data.stats);
      setRecentLeads(res.data.recent_leads || []);
    } catch {
      toast.error('Failed to load agent profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && agentId) {
      fetchAgent(agentId);
    }
  }, [isOpen, agentId]);

  const handleToggleStatus = async () => {
    if (!agent) return;
    const nextStatus = agent.account_status === 'active' ? 'suspended' : 'active';
    setToggling(true);
    try {
      const res = await api.patch(`/admin/agents/${agent.id}/status`, {
        account_status: nextStatus,
      });
      setAgent(res.data.agent);
      onStatusChanged(res.data.agent);
      toast.success(`Agent account marked as ${nextStatus}`);
    } catch {
      toast.error('Failed to update status');
    } finally {
      setToggling(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={agent ? agent.name : 'Agent Profile'}
      description="Agent activity, subscription, and lead metrics"
      maxWidth="xl"
    >
      {loading || !agent ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Header Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
            <div className="flex items-center gap-2">
              <AccountStatusBadge status={agent.account_status} />
              <SubscriptionBadge
                plan={agent.subscription_plan}
                status={agent.subscription_status}
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleStatus}
                disabled={toggling}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl border transition-colors shadow-2xs ${
                  agent.account_status === 'active'
                    ? 'text-rose-700 bg-rose-50 border-rose-200 hover:bg-rose-100'
                    : 'text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                {toggling ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : agent.account_status === 'active' ? (
                  <ShieldAlert className="w-3.5 h-3.5" />
                ) : (
                  <ShieldCheck className="w-3.5 h-3.5" />
                )}
                <span>
                  {agent.account_status === 'active' ? 'Suspend Account' : 'Reactivate Account'}
                </span>
              </button>

              <button
                onClick={() => {
                  onClose();
                  onResetPassword(agent);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-colors shadow-2xs"
              >
                <Key className="w-3.5 h-3.5 text-slate-400" />
                <span>Reset Password</span>
              </button>

              <button
                onClick={() => {
                  onClose();
                  onEdit(agent);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-colors shadow-2xs"
              >
                <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Edit Profile</span>
              </button>
            </div>
          </div>

          {/* Contact & Meta Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-white border border-slate-200 rounded-xl text-xs space-y-1">
              <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                Email Address
              </span>
              <div className="font-medium text-slate-800 flex items-center gap-1.5 truncate">
                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{agent.email}</span>
              </div>
            </div>

            <div className="p-3 bg-white border border-slate-200 rounded-xl text-xs space-y-1">
              <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                Phone
              </span>
              <div className="font-medium text-slate-800 flex items-center gap-1.5 truncate">
                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{agent.phone || 'Not provided'}</span>
              </div>
            </div>

            <div className="p-3 bg-white border border-slate-200 rounded-xl text-xs space-y-1">
              <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                Last Activity
              </span>
              <div className="font-medium text-slate-800 flex items-center gap-1.5 truncate">
                <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>
                  {agent.last_login_at
                    ? new Date(agent.last_login_at).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'Never'}
                </span>
              </div>
            </div>
          </div>

          {/* Lead Performance Stats */}
          {stats && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                Lead Performance Metrics
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="text-[11px] text-slate-500">Total Leads</div>
                  <div className="text-xl font-bold text-slate-900 mt-1">
                    {stats.total_leads}
                  </div>
                </div>
                <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl">
                  <div className="text-[11px] text-blue-700">New Leads</div>
                  <div className="text-xl font-bold text-blue-900 mt-1">
                    {stats.new_leads}
                  </div>
                </div>
                <div className="p-3 bg-amber-50/50 border border-amber-100 rounded-xl">
                  <div className="text-[11px] text-amber-700">Qualified</div>
                  <div className="text-xl font-bold text-amber-900 mt-1">
                    {stats.qualified}
                  </div>
                </div>
                <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl">
                  <div className="text-[11px] text-emerald-700">Won (Closed)</div>
                  <div className="text-xl font-bold text-emerald-900 mt-1">
                    {stats.won}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Recent Leads by this Agent */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
              Recent Leads Under Management
            </h4>
            {recentLeads.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                This agent has not registered any leads yet.
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 text-xs">
                {recentLeads.map((lead) => (
                  <div
                    key={lead.id}
                    className="p-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
                  >
                    <div>
                      <div className="font-semibold text-slate-800">{lead.name}</div>
                      <div className="text-slate-400 text-[11px]">
                        {lead.phone} • {lead.property_type || 'Apartment'} •{' '}
                        {lead.interested_property || 'General Interest'}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={lead.status} />
                      <span className="text-slate-400 text-[11px]">
                        {new Date(lead.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
};
