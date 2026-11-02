import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { StatusBadge } from '../common/StatusBadge';
import { PriorityBadge } from '../common/PriorityBadge';
import api from '../../lib/api';
import type { Lead, LeadActivity, LeadNote, LeadStatus } from '../../types';
import {
  Phone,
  MessageSquare,
  Mail,
  Calendar,
  DollarSign,
  MapPin,
  Building,
  Clock,
  Edit2,
  Send,
  Loader2,
  CheckCircle2,
  Tag,
  Share2,
} from 'lucide-react';
import { toast } from 'sonner';

interface LeadDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadId: number | null;
  onEdit: (lead: Lead) => void;
  onLeadUpdated: (lead: Lead) => void;
}

const STATUS_OPTIONS: { value: LeadStatus; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'site_visit_scheduled', label: 'Site Visit Scheduled' },
  { value: 'negotiation', label: 'Negotiation' },
  { value: 'won', label: 'Won (Deal Closed)' },
  { value: 'lost', label: 'Lost' },
];

export const LeadDetailModal: React.FC<LeadDetailModalProps> = ({
  isOpen,
  onClose,
  leadId,
  onEdit,
  onLeadUpdated,
}) => {
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchLeadDetails = async (id: number) => {
    setLoading(true);
    try {
      const response = await api.get(`/agent/leads/${id}`);
      setLead(response.data.lead);
    } catch {
      toast.error('Failed to load lead details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && leadId) {
      fetchLeadDetails(leadId);
      setNewNote('');
    }
  }, [isOpen, leadId]);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || !lead) return;

    setSubmittingNote(true);
    try {
      const response = await api.post(`/agent/leads/${lead.id}/notes`, {
        note: newNote,
      });
      setLead(response.data.lead);
      onLeadUpdated(response.data.lead);
      setNewNote('');
      toast.success('Note added successfully');
    } catch {
      toast.error('Failed to add note');
    } finally {
      setSubmittingNote(false);
    }
  };

  const handleStatusChange = async (newStatus: LeadStatus) => {
    if (!lead || lead.status === newStatus) return;

    setUpdatingStatus(true);
    try {
      const response = await api.patch(`/agent/leads/${lead.id}/status`, {
        status: newStatus,
      });
      setLead(response.data.lead);
      onLeadUpdated(response.data.lead);
      toast.success(`Status updated to ${newStatus.replace(/_/g, ' ')}`);
    } catch {
      toast.error('Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (!isOpen) return null;

  const cleanPhone = lead?.phone?.replace(/[^0-9+]/g, '') || '';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={lead ? lead.name : 'Lead Details'}
      description="Lead Profile, Contact Actions & Activity History"
      maxWidth="xl"
    >
      {loading || !lead ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top Quick Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
            <div className="flex items-center gap-2">
              <StatusBadge status={lead.status} size="md" />
              <PriorityBadge priority={lead.priority} />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Call Lead */}
              <a
                href={`tel:${lead.phone}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors shadow-2xs"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call</span>
              </a>

              {/* WhatsApp Lead */}
              <a
                href={`https://wa.me/${cleanPhone.replace('+', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors shadow-2xs"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </a>

              {/* Edit Lead */}
              <button
                onClick={() => {
                  onClose();
                  onEdit(lead);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors shadow-2xs"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
            </div>
          </div>

          {/* Quick Status Selector */}
          <div className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl">
            <span className="text-xs font-medium text-slate-500 whitespace-nowrap">
              Update Status:
            </span>
            <select
              value={lead.status}
              disabled={updatingStatus}
              onChange={(e) => handleStatusChange(e.target.value as LeadStatus)}
              className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {updatingStatus && <Loader2 className="w-4 h-4 animate-spin text-blue-600" />}
          </div>

          {/* Lead Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Phone & Email */}
            <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Contact Details
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-800">
                <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="font-medium">{lead.phone}</span>
              </div>
              {lead.email ? (
                <div className="flex items-center gap-2 text-sm text-slate-800">
                  <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>{lead.email}</span>
                </div>
              ) : (
                <div className="text-xs text-slate-400 italic">No email provided</div>
              )}
            </div>

            {/* Property Interest */}
            <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Property Interest
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-800">
                <Building className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="font-medium">
                  {lead.property_type || 'Apartment'}
                  {lead.interested_property ? ` • ${lead.interested_property}` : ''}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-600">
                {lead.budget && (
                  <div className="flex items-center gap-1 font-semibold text-emerald-600">
                    <DollarSign className="w-3.5 h-3.5" />
                    {lead.budget}
                  </div>
                )}
                {lead.preferred_location && (
                  <div className="flex items-center gap-1 text-slate-500">
                    <MapPin className="w-3.5 h-3.5" />
                    {lead.preferred_location}
                  </div>
                )}
              </div>
            </div>

            {/* Source & Follow-up */}
            <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Lead Source & Origin
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-800 font-medium">
                <Tag className="w-4 h-4 text-slate-400" />
                <span>{lead.source}</span>
              </div>
              <div className="text-xs text-slate-500">
                Added on: {new Date(lead.created_at).toLocaleDateString()}
              </div>
            </div>

            {/* Follow-up Timing */}
            <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Scheduled Follow-up
              </div>
              <div className="flex items-center gap-2 text-sm font-medium">
                <Calendar className="w-4 h-4 text-slate-400" />
                {lead.follow_up_date ? (
                  <span className="text-slate-800">
                    {new Date(lead.follow_up_date).toLocaleDateString(undefined, {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                ) : (
                  <span className="text-slate-400 italic">No follow-up set</span>
                )}
              </div>
              <div className="text-xs text-slate-400">
                Last updated: {new Date(lead.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>

          {/* Add Note Section */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Add Note
            </h4>
            <form onSubmit={handleAddNote} className="space-y-2">
              <textarea
                rows={2}
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Log a client conversation, request, or site visit feedback..."
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submittingNote || !newNote.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  {submittingNote ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>Post Note</span>
                </button>
              </div>
            </form>
          </div>

          {/* Notes & Activity Timeline */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
              Activity History & Notes
            </h4>

            <div className="space-y-3">
              {/* If lead has notes, list them */}
              {lead.notes && lead.notes.length > 0 && (
                <div className="space-y-2 mb-4">
                  {lead.notes.map((note: LeadNote) => (
                    <div
                      key={note.id}
                      className="p-3 bg-white border border-slate-200 rounded-xl text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between text-slate-400">
                        <span className="font-semibold text-slate-700">Agent Note</span>
                        <span>{new Date(note.created_at).toLocaleString()}</span>
                      </div>
                      <p className="text-slate-800 text-sm whitespace-pre-wrap">{note.note}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Activity Timeline Items */}
              {lead.activities && lead.activities.length > 0 ? (
                <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {lead.activities.map((act: LeadActivity) => (
                    <div key={act.id} className="relative text-xs">
                      <div className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-white border-2 border-blue-500 flex items-center justify-center" />
                      <div className="flex items-center justify-between text-slate-500">
                        <span className="font-medium text-slate-800">{act.description}</span>
                        <span className="text-[11px] text-slate-400">
                          {new Date(act.created_at).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-xs text-slate-400">
                  No activity recorded yet
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};
